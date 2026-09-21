alter table public.student_materials
  add column if not exists pedagogical_model_version integer,
  add column if not exists pedagogical_quality_report jsonb,
  add column if not exists pedagogical_quality_version integer;

comment on column public.student_materials.pedagogical_model_version is
  'Version of the canonical academic representation used to derive summaries, flashcards and exam questions.';

comment on column public.student_materials.pedagogical_quality_report is
  'Deterministic quality report for canonical coverage, structure cleanliness and study artifact traceability.';

comment on column public.student_materials.pedagogical_quality_version is
  'Version of the pedagogical quality report contract.';
