create table if not exists public.student_material_glossaries (
  id uuid primary key default gen_random_uuid(),
  student_material_id uuid not null unique references public.student_materials(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'ready', 'error')),
  glossary_items jsonb not null default '[]'::jsonb,
  provider text,
  error_message text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_material_glossaries_material_idx
  on public.student_material_glossaries(student_material_id);

create or replace function public.set_student_material_glossaries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_material_glossaries_set_updated_at on public.student_material_glossaries;

create trigger student_material_glossaries_set_updated_at
before update on public.student_material_glossaries
for each row
execute function public.set_student_material_glossaries_updated_at();

alter table public.student_material_glossaries enable row level security;

drop policy if exists student_material_glossaries_select_visible_or_own on public.student_material_glossaries;
create policy student_material_glossaries_select_visible_or_own
on public.student_material_glossaries
for select
using (
  exists (
    select 1
    from public.student_materials sm
    where sm.id = student_material_id
      and (
        sm.visibility = 'shared'
        or sm.user_id = auth.uid()
        or public.current_user_is_admin()
      )
  )
);

drop policy if exists student_material_glossaries_write_admin_only on public.student_material_glossaries;
create policy student_material_glossaries_write_admin_only
on public.student_material_glossaries
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
