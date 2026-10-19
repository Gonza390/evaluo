create table if not exists public.student_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  universidad_id uuid not null references public.universidades(id) on delete cascade,
  carrera_id uuid not null references public.carreras(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  title text not null,
  file_name text not null,
  file_path text not null unique,
  mime_type text,
  file_size_bytes bigint,
  page_count integer,
  visibility text not null default 'shared' check (visibility in ('private', 'shared')),
  processing_status text not null default 'ready' check (processing_status in ('uploaded', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_materials_user_created_idx
  on public.student_materials(user_id, created_at desc);

create index if not exists student_materials_materia_visibility_idx
  on public.student_materials(materia_id, visibility, created_at desc);

create index if not exists student_materials_carrera_visibility_idx
  on public.student_materials(carrera_id, visibility, created_at desc);

create or replace function public.set_student_materials_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_materials_set_updated_at on public.student_materials;

create trigger student_materials_set_updated_at
before update on public.student_materials
for each row
execute function public.set_student_materials_updated_at();

alter table public.student_materials enable row level security;

drop policy if exists student_materials_select_visible_or_own on public.student_materials;
create policy student_materials_select_visible_or_own
on public.student_materials
for select
using (
  visibility = 'shared'
  or auth.uid() = user_id
  or public.current_user_is_admin()
);

drop policy if exists student_materials_insert_own_or_admin on public.student_materials;
create policy student_materials_insert_own_or_admin
on public.student_materials
for insert
with check (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

drop policy if exists student_materials_update_own_or_admin on public.student_materials;
create policy student_materials_update_own_or_admin
on public.student_materials
for update
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
)
with check (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

drop policy if exists student_materials_delete_own_or_admin on public.student_materials;
create policy student_materials_delete_own_or_admin
on public.student_materials
for delete
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
);
