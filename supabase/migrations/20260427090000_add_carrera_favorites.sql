alter table public.user_favorites
  add column if not exists carrera_id uuid;

create index if not exists idx_user_favorites_carrera_id
  on public.user_favorites (carrera_id);
