-- Etend planning_runs pour gérer le workflow de validation/publishing

alter table public.planning_runs
  add column if not exists status_admin text default 'draft' check (status_admin in ('draft','submitted'));

alter table public.planning_runs
  add column if not exists status_doyen text default 'pending' check (status_doyen in ('pending','approved','rejected'));

alter table public.planning_runs
  add column if not exists submitted_at timestamptz;

alter table public.planning_runs
  add column if not exists approved_at timestamptz;

alter table public.planning_runs
  add column if not exists approved_by uuid references auth.users(id);

alter table public.planning_runs
  add column if not exists rejected_at timestamptz;

alter table public.planning_runs
  add column if not exists rejected_by uuid references auth.users(id);

alter table public.planning_runs
  add column if not exists rejection_reason text;

alter table public.planning_runs
  add column if not exists published_at timestamptz;

-- Contrainte : pas de publication sans validation doyen
alter table public.planning_runs
  add constraint if not exists planning_runs_publish_requires_approval
  check (published = false or status_doyen = 'approved');

-- Harmoniser les lignes existantes
update public.planning_runs
set
  status_admin = coalesce(status_admin, case when published then 'submitted' else 'draft' end),
  status_doyen = coalesce(status_doyen, case when published then 'approved' else 'pending' end),
  approved_at = case when published and approved_at is null then now() else approved_at end,
  submitted_at = case when status_admin = 'submitted' and submitted_at is null then created_at end
where true;

create index if not exists planning_runs_status_admin_idx on public.planning_runs(status_admin);
create index if not exists planning_runs_status_doyen_idx on public.planning_runs(status_doyen);
create index if not exists planning_runs_published_idx on public.planning_runs(published);

