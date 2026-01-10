-- Crée un index d'unicité sur les créneaux (date + début + fin)
-- et prépare des slots horaires atomiques (pas de journée entière).

alter table public.creneau
  add column if not exists label text;

create unique index if not exists creneau_unique_slot_idx
  on public.creneau (date, heure_debut, heure_fin);

-- Exemple de slots (commenté, à ajuster/activer si besoin) :
-- insert into public.creneau (date, heure_debut, heure_fin, label)
-- values
--   ('2026-01-01', '08:00', '10:00', 'Matin 1'),
--   ('2026-01-01', '10:30', '12:30', 'Matin 2'),
--   ('2026-01-01', '14:00', '16:00', 'Après-midi');
-- La seed dédiées (scripts/seed_slots.js) permet d'en générer sur N jours.

