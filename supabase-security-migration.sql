-- =====================================================================
-- Ink & Stone — Security hardening migration
-- =====================================================================
-- WHAT THIS FIXES
--   Before: the anon (public) key + open RLS ("FOR ALL USING (true)")
--           let anyone read/update/DELETE every row in every space, and
--           the `spaces` table (password hashes included) was readable.
--           The "password" was verified only in the browser, with a
--           trivially reversible 32-bit hash.
--
--   After:  - RLS denies all direct table access to anon/authenticated.
--           - All reads/writes go through SECURITY DEFINER RPCs that
--             require a per-space session TOKEN issued only after the
--             space password is verified SERVER-SIDE.
--           - Passwords are stored with bcrypt (pgcrypto). Existing
--             legacy hashes are verified once and transparently
--             re-hashed to bcrypt on the user's next successful login,
--             so NO password is invalidated.
--           - Realtime keeps working via public broadcast pings.
--
-- HOW TO RUN
--   Paste the whole file into Supabase → SQL Editor → Run.
--   It is idempotent: safe to run more than once.
--   Run it AFTER taking a backup (Database → Backups), because it drops
--   the old permissive RLS policies.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Extensions (pgcrypto lives in the `extensions` schema on Supabase)
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Session tokens
--    A token is an opaque random secret bound to a space. It is the
--    proof "I know this space's password" and is required by every RPC.
-- ---------------------------------------------------------------------
create table if not exists public.space_sessions (
  token      text primary key,
  space_id   uuid not null references public.spaces(id) on delete cascade,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);
create index if not exists space_sessions_space_idx on public.space_sessions(space_id);
alter table public.space_sessions enable row level security;  -- no policy => deny all to anon

-- ---------------------------------------------------------------------
-- 2. Private helpers (revoked from anon; only reachable inside the
--    SECURITY DEFINER RPCs below).
-- ---------------------------------------------------------------------

-- base36 encoder, used to reproduce the old client hash exactly.
create or replace function public.app_to_base36(n bigint)
returns text language plpgsql immutable as $$
declare digits text := '0123456789abcdefghijklmnopqrstuvwxyz';
        r text := ''; v bigint := n;
begin
  if v = 0 then return '0'; end if;
  while v > 0 loop
    r := substr(digits, (v % 36)::int + 1, 1) || r;
    v := v / 36;
  end loop;
  return r;
end $$;

-- Faithful re-implementation of the old browser hashPassword():
--   h = ((h << 5) - h + charCode) | 0   (32-bit signed wrap), salt appended,
--   then Math.abs(h).toString(36).padStart(16, '0').
-- Used ONLY to verify pre-migration passwords once, before re-hashing.
create or replace function public.app_legacy_hash(p text)
returns text language plpgsql immutable as $$
declare h bigint := 0; salt text := 'inkstone-salt-2024';
        v_str text; i int;
begin
  v_str := coalesce(p,'') || salt;
  for i in 1..length(v_str) loop
    h := (h << 5) - h + ascii(substr(v_str, i, 1));
    h := h & 4294967295;                         -- keep low 32 bits (unsigned)
    if h >= 2147483648 then h := h - 4294967296; end if;  -- -> signed int32
  end loop;
  if h < 0 then h := -h; end if;                 -- Math.abs
  return lpad(public.app_to_base36(h), 16, '0');
end $$;

-- Verify a space password. Accepts both bcrypt and legacy hashes.
-- On a successful legacy match, upgrades the stored hash to bcrypt.
create or replace function public.app_verify_password(p_space_id uuid, p_password text)
returns boolean language plpgsql security definer
set search_path = public, extensions as $$
declare v_hash text; v_ok boolean := false;
begin
  select password_hash into v_hash from public.spaces where id = p_space_id;
  if v_hash is null then return false; end if;

  if left(v_hash, 1) = '$' then            -- already bcrypt
    v_ok := (v_hash = crypt(p_password, v_hash));
  else                                     -- legacy 32-bit hash
    v_ok := (v_hash = public.app_legacy_hash(p_password));
    if v_ok then
      update public.spaces
         set password_hash = crypt(p_password, gen_salt('bf'))
       where id = p_space_id;
    end if;
  end if;
  return v_ok;
end $$;

create or replace function public.app_new_token()
returns text language sql volatile
set search_path = public, extensions as $$
  select encode(gen_random_bytes(24), 'hex');
$$;

-- Mirrors the client invite-code format: "aa-aaa" (lowercase letters).
create or replace function public.app_gen_invite_code()
returns text language plpgsql volatile as $$
declare c text := 'abcdefghijklmnopqrstuvwxyz'; f text := '';
begin
  for i in 1..5 loop
    f := f || substr(c, 1 + floor(random()*26)::int, 1);
  end loop;
  return substr(f,1,2) || '-' || substr(f,3,3);
end $$;

-- Resolve a token to its space, refreshing last_seen. Raises on bad token.
create or replace function public.app_space_from_token(p_token text)
returns uuid language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  update public.space_sessions
     set last_seen = now()
   where token = p_token
  returning space_id into v_space;
  if v_space is null then
    raise exception 'INVALID_TOKEN' using errcode = '28000';
  end if;
  return v_space;
end $$;

-- ---------------------------------------------------------------------
-- 3. Public auth RPCs
-- ---------------------------------------------------------------------

create or replace function public.create_space(p_name text, p_password text)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare v_space public.spaces; v_token text; v_code text; v_try int := 0;
begin
  if coalesce(trim(p_name),'') = '' or coalesce(p_password,'') = '' then
    raise exception 'INVALID_INPUT';
  end if;

  loop
    v_code := public.app_gen_invite_code();
    exit when not exists (select 1 from public.spaces where invite_code = v_code);
    v_try := v_try + 1;
    if v_try > 20 then raise exception 'CODE_GEN_FAILED'; end if;
  end loop;

  insert into public.spaces (name, invite_code, password_hash)
  values (trim(p_name), v_code, crypt(p_password, gen_salt('bf')))
  returning * into v_space;

  v_token := public.app_new_token();
  insert into public.space_sessions (token, space_id, is_admin)
  values (v_token, v_space.id, true);

  return jsonb_build_object(
    'space',    to_jsonb(v_space) - 'password_hash',
    'token',    v_token,
    'is_admin', true
  );
end $$;

create or replace function public.join_space(p_invite_code text, p_password text)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare v_space public.spaces; v_token text;
begin
  select * into v_space from public.spaces where invite_code = p_invite_code;
  if not found then raise exception 'SPACE_NOT_FOUND'; end if;

  if not public.app_verify_password(v_space.id, p_password) then
    raise exception 'WRONG_PASSWORD';
  end if;

  v_token := public.app_new_token();
  insert into public.space_sessions (token, space_id, is_admin)
  values (v_token, v_space.id, false);

  select * into v_space from public.spaces where id = v_space.id;  -- hash may have upgraded
  return jsonb_build_object(
    'space',    to_jsonb(v_space) - 'password_hash',
    'token',    v_token,
    'is_admin', false
  );
end $$;

create or replace function public.delete_space(p_token text, p_password text)
returns void language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := public.app_space_from_token(p_token);
  if not public.app_verify_password(v_space, p_password) then
    raise exception 'WRONG_PASSWORD';
  end if;
  delete from public.relations      where space_id = v_space;
  delete from public.characters     where space_id = v_space;
  delete from public.locations      where space_id = v_space;
  delete from public.timelines      where space_id = v_space;
  delete from public.space_sessions where space_id = v_space;
  delete from public.spaces         where id = v_space;
end $$;

-- ---------------------------------------------------------------------
-- 4. Read RPCs (token-scoped)
-- ---------------------------------------------------------------------
create or replace function public.get_characters(p_token text)
returns setof public.characters language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := public.app_space_from_token(p_token);
  return query select * from public.characters where space_id = v_space order by created_at;
end $$;

create or replace function public.get_relations(p_token text)
returns setof public.relations language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := public.app_space_from_token(p_token);
  return query select * from public.relations where space_id = v_space order by created_at;
end $$;

create or replace function public.get_locations(p_token text)
returns setof public.locations language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := public.app_space_from_token(p_token);
  return query select * from public.locations where space_id = v_space order by created_at;
end $$;

create or replace function public.get_timeline(p_token text)
returns setof public.timelines language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := public.app_space_from_token(p_token);
  return query select * from public.timelines where space_id = v_space;
end $$;

-- ---------------------------------------------------------------------
-- 5. Write RPCs (token-scoped; client-supplied space_id is ignored)
-- ---------------------------------------------------------------------
create or replace function public.create_character(p_token text, p_data jsonb)
returns public.characters language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid; v_row public.characters;
begin
  v_space := public.app_space_from_token(p_token);
  insert into public.characters (space_id, name, role, type, location, notes, traits, tags)
  values (
    v_space,
    p_data->>'name',
    p_data->>'role',
    p_data->>'type',
    (nullif(p_data->>'location',''))::uuid,
    coalesce(p_data->>'notes', ''),
    coalesce(p_data->'traits', '[]'::jsonb),
    coalesce(p_data->'tags',   '[]'::jsonb)
  ) returning * into v_row;
  return v_row;
end $$;

create or replace function public.update_character(p_token text, p_id uuid, p_data jsonb)
returns public.characters language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid; v_row public.characters;
begin
  v_space := public.app_space_from_token(p_token);
  update public.characters set
    name     = coalesce(p_data->>'name', name),
    role     = coalesce(p_data->>'role', role),
    type     = coalesce(p_data->>'type', type),
    location = case when p_data ? 'location'
                    then (nullif(p_data->>'location',''))::uuid else location end,
    notes    = coalesce(p_data->>'notes', notes),
    traits   = coalesce(p_data->'traits', traits),
    tags     = coalesce(p_data->'tags',   tags),
    updated_at = now()
  where id = p_id and space_id = v_space
  returning * into v_row;
  if not found then raise exception 'NOT_FOUND'; end if;
  return v_row;
end $$;

create or replace function public.delete_character(p_token text, p_id uuid)
returns void language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := public.app_space_from_token(p_token);
  delete from public.characters where id = p_id and space_id = v_space;
end $$;

create or replace function public.create_relation(p_token text, p_data jsonb)
returns public.relations language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid; v_row public.relations;
begin
  v_space := public.app_space_from_token(p_token);
  insert into public.relations (space_id, from_character_id, to_character_id, relation_type, relation_detail)
  values (
    v_space,
    (p_data->>'from_character_id')::uuid,
    (p_data->>'to_character_id')::uuid,
    p_data->>'relation_type',
    p_data->>'relation_detail'
  ) returning * into v_row;
  return v_row;
end $$;

create or replace function public.update_relation(p_token text, p_id uuid, p_data jsonb)
returns public.relations language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid; v_row public.relations;
begin
  v_space := public.app_space_from_token(p_token);
  update public.relations set
    relation_type   = coalesce(p_data->>'relation_type', relation_type),
    relation_detail = case when p_data ? 'relation_detail'
                           then p_data->>'relation_detail' else relation_detail end
  where id = p_id and space_id = v_space
  returning * into v_row;
  if not found then raise exception 'NOT_FOUND'; end if;
  return v_row;
end $$;

create or replace function public.delete_relation(p_token text, p_id uuid)
returns void language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := public.app_space_from_token(p_token);
  delete from public.relations where id = p_id and space_id = v_space;
end $$;

create or replace function public.create_location(p_token text, p_data jsonb)
returns public.locations language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid; v_row public.locations;
begin
  v_space := public.app_space_from_token(p_token);
  insert into public.locations (space_id, name, color)
  values (v_space, p_data->>'name', p_data->>'color')
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.update_location(p_token text, p_id uuid, p_data jsonb)
returns public.locations language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid; v_row public.locations;
begin
  v_space := public.app_space_from_token(p_token);
  update public.locations set
    name  = coalesce(p_data->>'name', name),
    color = coalesce(p_data->>'color', color)
  where id = p_id and space_id = v_space
  returning * into v_row;
  if not found then raise exception 'NOT_FOUND'; end if;
  return v_row;
end $$;

create or replace function public.delete_location(p_token text, p_id uuid)
returns void language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := public.app_space_from_token(p_token);
  delete from public.locations where id = p_id and space_id = v_space;
end $$;

create or replace function public.save_timeline(p_token text, p_data jsonb)
returns public.timelines language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid; v_row public.timelines;
begin
  v_space := public.app_space_from_token(p_token);
  insert into public.timelines (space_id, start_year, year_count, entries, updated_at)
  values (
    v_space,
    coalesce((p_data->>'start_year')::int, 0),
    coalesce((p_data->>'year_count')::int, 11),
    coalesce(p_data->'entries', '{}'::jsonb),
    now()
  )
  on conflict (space_id) do update set
    start_year = excluded.start_year,
    year_count = excluded.year_count,
    entries    = excluded.entries,
    updated_at = now()
  returning * into v_row;
  return v_row;
end $$;

-- ---------------------------------------------------------------------
-- 6. Lock down the tables: drop the old permissive policies, enable RLS
--    (no policy => anon/authenticated get nothing), revoke direct grants.
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('spaces','characters','relations','locations','timelines','space_sessions')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.spaces      enable row level security;
alter table public.characters  enable row level security;
alter table public.relations   enable row level security;
alter table public.locations   enable row level security;
alter table public.timelines   enable row level security;

revoke all on table
  public.spaces, public.characters, public.relations,
  public.locations, public.timelines, public.space_sessions
from anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. Privileges: anon may call ONLY the public RPCs, never the helpers.
-- ---------------------------------------------------------------------
revoke all on function
  public.app_to_base36(bigint),
  public.app_legacy_hash(text),
  public.app_verify_password(uuid, text),
  public.app_new_token(),
  public.app_gen_invite_code(),
  public.app_space_from_token(text)
from public;

grant execute on function
  public.create_space(text, text),
  public.join_space(text, text),
  public.delete_space(text, text),
  public.get_characters(text),
  public.get_relations(text),
  public.get_locations(text),
  public.get_timeline(text),
  public.create_character(text, jsonb),
  public.update_character(text, uuid, jsonb),
  public.delete_character(text, uuid),
  public.create_relation(text, jsonb),
  public.update_relation(text, uuid, jsonb),
  public.delete_relation(text, uuid),
  public.create_location(text, jsonb),
  public.update_location(text, uuid, jsonb),
  public.delete_location(text, uuid),
  public.save_timeline(text, jsonb)
to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Realtime via public broadcast.
--    postgres_changes needs SELECT through RLS, which is now denied, so
--    we broadcast a content-free "change" ping per space instead; the
--    client refetches through the RPCs on each ping. The payload carries
--    no row data, so a public (non-private) channel is safe.
-- ---------------------------------------------------------------------
create or replace function public.app_broadcast_change()
returns trigger language plpgsql security definer
set search_path = public, extensions as $$
declare v_space uuid;
begin
  v_space := coalesce(new.space_id, old.space_id);
  perform realtime.send(
    jsonb_build_object('space_id', v_space, 'table', tg_table_name, 'op', tg_op),
    'change',
    'space-' || v_space::text,
    false   -- public channel; payload has no sensitive data
  );
  return null;
end $$;

drop trigger if exists trg_broadcast_characters on public.characters;
create trigger trg_broadcast_characters
  after insert or update or delete on public.characters
  for each row execute function public.app_broadcast_change();

drop trigger if exists trg_broadcast_relations on public.relations;
create trigger trg_broadcast_relations
  after insert or update or delete on public.relations
  for each row execute function public.app_broadcast_change();

drop trigger if exists trg_broadcast_locations on public.locations;
create trigger trg_broadcast_locations
  after insert or update or delete on public.locations
  for each row execute function public.app_broadcast_change();

drop trigger if exists trg_broadcast_timelines on public.timelines;
create trigger trg_broadcast_timelines
  after insert or update or delete on public.timelines
  for each row execute function public.app_broadcast_change();

commit;

-- =====================================================================
-- Optional cleanup of expired sessions (run occasionally or via cron):
--   delete from public.space_sessions where last_seen < now() - interval '90 days';
-- =====================================================================
