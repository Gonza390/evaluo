alter table public.student_materials
  add column if not exists pedagogical_artifacts_version integer;
