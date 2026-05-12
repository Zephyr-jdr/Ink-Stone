
-- Spaces : a shared "grimoire" identified by an invite code + password.
create table if not exists public.spaces (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  invite_code   text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Locations : map locations specific to a space (with a colour).
create table if not exists public.locations (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.spaces(id) on delete cascade,
  name       text not null,
  color      text not null,
  created_at timestamptz not null default now()
);

-- Characters : PC / NPC.
create table if not exists public.characters (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.spaces(id) on delete cascade,
  name       text not null,
  role       text default '',
  type       text not null check (type in ('PJ','PNJ')),
  location   uuid references public.locations(id) on delete set null,
  notes      text default '',
  traits     jsonb not null default '[]'::jsonb,
  tags       jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Relations : edge between two characters (typed + free-text detail).
create table if not exists public.relations (
  id                 uuid primary key default gen_random_uuid(),
  space_id           uuid not null references public.spaces(id) on delete cascade,
  from_character_id  uuid not null references public.characters(id) on delete cascade,
  to_character_id    uuid not null references public.characters(id) on delete cascade,
  relation_type      text not null,
  relation_detail    text,
  created_at         timestamptz not null default now()
);


create index if not exists idx_locations_space   on public.locations(space_id);
create index if not exists idx_characters_space  on public.characters(space_id);
create index if not exists idx_relations_space   on public.relations(space_id);
create index if not exists idx_relations_from    on public.relations(from_character_id);
create index if not exists idx_relations_to      on public.relations(to_character_id);


alter table public.spaces     enable row level security;
alter table public.locations  enable row level security;
alter table public.characters enable row level security;
alter table public.relations  enable row level security;

drop policy if exists "anon_all_spaces"     on public.spaces;
drop policy if exists "anon_all_locations"  on public.locations;
drop policy if exists "anon_all_characters" on public.characters;
drop policy if exists "anon_all_relations"  on public.relations;

create policy "anon_all_spaces"     on public.spaces     for all using (true) with check (true);
create policy "anon_all_locations"  on public.locations  for all using (true) with check (true);
create policy "anon_all_characters" on public.characters for all using (true) with check (true);
create policy "anon_all_relations"  on public.relations  for all using (true) with check (true);


do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'characters'
  ) then
    alter publication supabase_realtime add table public.characters;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'relations'
  ) then
    alter publication supabase_realtime add table public.relations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'locations'
  ) then
    alter publication supabase_realtime add table public.locations;
  end if;
end$$;
