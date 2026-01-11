-- Ajout du mapping utilisateur -> etudiant pour filtrer précisément les examens
alter table public.users_meta
  add column if not exists id_etudiant integer references public.etudiant(id_etudiant);

create index if not exists idx_users_meta_id_etudiant on public.users_meta(id_etudiant);

