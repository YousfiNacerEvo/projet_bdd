-- Ajout d'une colonne pour stocker les surveillants affectés à chaque item de planning
alter table public.planning_items
  add column if not exists surveillants jsonb default '[]'::jsonb;

