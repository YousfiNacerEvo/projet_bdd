-- Empêche les collisions de salle sur un run.
create unique index if not exists ux_planning_room_slot
  on public.planning_items (run_id, salle_id, creneau_id);

