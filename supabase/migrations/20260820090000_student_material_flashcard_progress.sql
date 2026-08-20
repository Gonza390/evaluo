-- Progreso de estudio de flashcards por usuario y material.
-- Guarda el resultado de recuperación (recall) y la valoración de calidad (vote)
-- de cada tarjeta, identificada por su índice dentro del mazo (card_index).
create table if not exists public.student_material_flashcard_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_material_id uuid not null references public.student_materials(id) on delete cascade,
  card_index integer not null check (card_index >= 0),
  recall text check (recall in ('known', 'unknown')),
  vote text check (vote in ('up', 'down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, student_material_id, card_index)
);

create index if not exists student_material_flashcard_progress_material_user_idx
  on public.student_material_flashcard_progress(student_material_id, user_id);

create or replace function public.set_student_material_flashcard_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_material_flashcard_progress_set_updated_at
  on public.student_material_flashcard_progress;

create trigger student_material_flashcard_progress_set_updated_at
before update on public.student_material_flashcard_progress
for each row
execute function public.set_student_material_flashcard_progress_updated_at();

alter table public.student_material_flashcard_progress enable row level security;

drop policy if exists student_material_flashcard_progress_select_own
  on public.student_material_flashcard_progress;
create policy student_material_flashcard_progress_select_own
on public.student_material_flashcard_progress
for select
using (auth.uid() = user_id);

drop policy if exists student_material_flashcard_progress_insert_own
  on public.student_material_flashcard_progress;
create policy student_material_flashcard_progress_insert_own
on public.student_material_flashcard_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists student_material_flashcard_progress_update_own
  on public.student_material_flashcard_progress;
create policy student_material_flashcard_progress_update_own
on public.student_material_flashcard_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists student_material_flashcard_progress_delete_own
  on public.student_material_flashcard_progress;
create policy student_material_flashcard_progress_delete_own
on public.student_material_flashcard_progress
for delete
using (auth.uid() = user_id);