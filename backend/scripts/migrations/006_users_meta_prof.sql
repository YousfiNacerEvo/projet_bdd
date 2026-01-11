-- Ajout du mapping utilisateur -> professeur pour filtrer précisément les surveillances
alter table public.users_meta
  add column if not exists id_prof integer references public.professeur(id_prof);

create index if not exists idx_users_meta_id_prof on public.users_meta(id_prof);

