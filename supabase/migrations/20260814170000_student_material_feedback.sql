create table if not exists public.student_material_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_material_id uuid not null references public.student_materials(id) on delete cascade,
  rating text not null check (rating in ('up', 'down')),
  report_reason text check (report_reason in ('resumen incorrecto', 'informacion inventada', 'falta contenido', 'glosario erroneo', 'error de extraccion', 'otro')),
  report_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, student_material_id)
);

create index if not exists student_material_feedback_material_created_idx
  on public.student_material_feedback(student_material_id, created_at desc);

create or replace function public.set_student_material_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_material_feedback_set_updated_at on public.student_material_feedback;

create trigger student_material_feedback_set_updated_at
before update on public.student_material_feedback
for each row
execute function public.set_student_material_feedback_updated_at();

alter table public.student_material_feedback enable row level security;

drop policy if exists student_material_feedback_select_own on public.student_material_feedback;
create policy student_material_feedback_select_own
on public.student_material_feedback
for select
using (auth.uid() = user_id);

drop policy if exists student_material_feedback_select_owner_material on public.student_material_feedback;
create policy student_material_feedback_select_owner_material
on public.student_material_feedback
for select
using (
  exists (
    select 1 from public.student_materials sm
    where sm.id = student_material_id
    and sm.user_id = auth.uid()
  )
);

drop policy if exists student_material_feedback_insert_own on public.student_material_feedback;
create policy student_material_feedback_insert_own
on public.student_material_feedback
for insert
with check (auth.uid() = user_id);

drop policy if exists student_material_feedback_update_own on public.student_material_feedback;
create policy student_material_feedback_update_own
on public.student_material_feedback
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists student_material_feedback_delete_own on public.student_material_feedback;
create policy student_material_feedback_delete_own
on public.student_material_feedback
for delete
using (auth.uid() = user_id);
