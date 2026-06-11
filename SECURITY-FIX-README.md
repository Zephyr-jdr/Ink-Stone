# Ink & Stone — Security fix (full hardening)

## What was wrong

The Supabase **anon key is public by design** (it ships in the JS bundle). All
security therefore depended on Row Level Security — but every table used
`FOR ALL USING (true)`, so anyone with the key could read, update, or **delete
every row in every space**. On top of that:

- The `spaces` table was readable, exposing `password_hash` for every grimoire.
- The "password" was verified **in the browser only**, so it protected nothing
  server-side.
- `hashPassword` was a 32-bit non-cryptographic hash with a hard-coded salt —
  trivially reversible. (Despite the spec/README saying "bcrypt".)

## What the fix does

- **RLS denies all** direct table access to the `anon`/`authenticated` roles.
- Every read/write now goes through a **`SECURITY DEFINER` RPC** that requires a
  per-space **session token**, issued only after the password is verified
  **server-side**.
- Passwords are stored with **bcrypt** (`pgcrypto`). Existing (legacy) hashes are
  verified once and **transparently upgraded to bcrypt** on the next successful
  login — **no password is invalidated**.
- Realtime keeps working via a **public broadcast ping** per space (the payload
  carries no row data); clients refetch on each ping.

## Rollout (order matters)

1. **Back up first.** Supabase dashboard → Database → Backups. The migration
   drops the old permissive policies.
2. **Run the SQL.** Open `supabase-security-migration.sql` in
   Supabase → SQL Editor → Run. It is idempotent (safe to re-run).
3. **Deploy the client.** The updated `app/src` (db.ts, useSpace.ts,
   CreateSpaceModal.tsx, types) must go live **together with** the migration.
   Build: `cd app && npm run build`.
4. **Everyone re-logs in once.** Existing browser sessions have no server token,
   so the first action after deploy will fail until the user re-enters their
   space (create/join). Their password still works (legacy hash is accepted and
   upgraded). This is expected and is the only user-visible effect.

> Run the migration and ship the client close together. Between the two, the old
> client (still hitting tables directly) will get permission errors because RLS
> is now closed.

## Files changed

- `supabase-security-migration.sql` — **new**, the whole DB change.
- `app/src/lib/db.ts` — Supabase branches now call RPCs with the session token;
  localStorage fallback unchanged.
- `app/src/hooks/useSpace.ts` — uses the **server-issued** token instead of a
  browser-minted one.
- `app/src/components/modals/CreateSpaceModal.tsx` — adapted to the new
  `{ space, token, isAdmin }` return shape.
- `app/src/types/index.ts` — `Space.password_hash` is now optional (the server
  never returns it).

## Known limitations / future hardening

- **Admin vs member isn't a real security boundary.** A space has a single
  password; "admin" (the MJ) is decided only by whether you used *Create* vs
  *Join*. The token records `is_admin`, but writes are allowed for any valid
  space token, exactly as before — otherwise an MJ who re-logs in via *Join*
  would lose edit rights. To make it real, add a separate admin password (or a
  Supabase Auth user) and gate the write RPCs on `is_admin`.
- **Token storage.** The token sits in `localStorage` (same as the old session).
  That's fine for this threat model; anyone with the device already has the
  space. Tokens never expire automatically — an optional cleanup query is at the
  bottom of the migration.
- **Realtime channel is public.** Safe because the broadcast payload is just a
  "something changed in space X" ping with no content. If you later enable
  Realtime Authorization (private channels), you'd add an RLS policy on
  `realtime.messages` keyed to the token.
- **Astral-plane characters in passwords** (e.g. emoji) hash slightly
  differently between the old browser code and the SQL verifier. Practically
  irrelevant; affected users just re-enter the password once.

## A note on the person who reported this

Their diagnosis was accurate and responsibly disclosed. This fix was written
against the *actual* schema rather than running their proposed migration blind —
don't run unreviewed SQL that's "destructive to policies and auth" against your
production database.
