alter table public.student_materials
  add column if not exists visual_analysis_enabled boolean not null default false;

comment on column public.student_materials.visual_analysis_enabled is
  'Opt-in flag. When true, PDF processing may use selective AI vision on candidate pages; false keeps native text processing only.';
