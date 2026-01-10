-- Migration pour planning_runs, planning_items, creneau et capacités salle

-- Table creneau
create table if not exists public.creneau (
  id_creneau bigserial primary key,
  date date not null,
  heure_debut time not null,
  heure_fin time not null,
  created_at timestamptz default now()
);

-- Capacités supplémentaires pour salle
alter table public.salle add column if not exists capacite_normale integer;
alter table public.salle add column if not exists capacite_examen integer;
update public.salle
set capacite_normale = coalesce(capacite_normale, capacite),
    capacite_examen = coalesce(capacite_examen, capacite);

-- planning_runs
create table if not exists public.planning_runs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id),
  scope text not null check (scope in ('global','departement','formation')),
  dept_id bigint null,
  formation_id bigint null,
  status text not null default 'pending' check (status in ('pending','running','done','failed')),
  published boolean default false,
  started_at timestamptz,
  ended_at timestamptz,
  metrics jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- planning_items
create table if not exists public.planning_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.planning_runs(id) on delete cascade,
  module_id bigint references public.module(id_module),
  salle_id bigint references public.salle(id_salle),
  creneau_id bigint references public.creneau(id_creneau),
  expected_students integer,
  notes text null
);

create index if not exists planning_items_run_idx on public.planning_items(run_id);
create index if not exists planning_items_room_slot_idx on public.planning_items(salle_id, creneau_id);
create index if not exists planning_items_module_idx on public.planning_items(module_id);
create index if not exists planning_items_creneau_idx on public.planning_items(creneau_id);

