-- Hardening e índices de soporte para study_errors.

create or replace function public.set_study_errors_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists study_errors_materia_idx
  on public.study_errors(materia_id)
  where materia_id is not null;

create index if not exists study_errors_student_material_idx
  on public.study_errors(student_material_id)
  where student_material_id is not null;
