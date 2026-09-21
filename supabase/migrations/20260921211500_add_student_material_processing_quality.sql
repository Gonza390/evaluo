alter table public.student_materials
  add column if not exists pedagogical_model_version integer,
  add column if not exists pedagogical_quality_report jsonb;

comment on column public.student_materials.pedagogical_model_version is
  'Version of the canonical pedagogical representation used to derive summaries, flashcards and exam questions.';

comment on column public.student_materials.pedagogical_quality_report is
  'Deterministic quality report for page coverage, structure cleanliness and derived-artifact traceability.';
