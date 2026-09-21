alter table public.student_materials
  add column if not exists pedagogical_quality_version integer;

comment on column public.student_materials.pedagogical_quality_version is
  'Version of the deterministic pedagogical quality report contract.';
