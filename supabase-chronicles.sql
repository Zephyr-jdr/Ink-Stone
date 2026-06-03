-- =====================================================================
-- Chroniques (frise chronologique / roue du temps)
-- Une seule frise par grimoire (space), stockée en un bloc JSON.
-- À exécuter dans Supabase → SQL Editor.
-- =====================================================================

create table if not exists public.timelines (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null unique references public.spaces(id) on delete cascade,
  start_year  integer not null default 0,
  year_count  integer not null default 11,
  entries     jsonb   not null default '{}'::jsonb,  -- { "0": { "spring": "...", ... }, ... }
  updated_at  timestamptz not null default now()
);

-- Recherche par grimoire
create index if not exists timelines_space_id_idx on public.timelines (space_id);

-- RLS : même politique ouverte que characters/relations/locations
alter table public.timelines enable row level security;

create policy "Allow all on timelines"
  on public.timelines
  for all
  using (true)
  with check (true);

-- Realtime : diffuser les changements aux clients connectés
alter publication supabase_realtime add table public.timelines;
