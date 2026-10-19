alter table public.student_materials
  add column if not exists content_fingerprint text,
  add column if not exists pipeline_version text,
  add column if not exists reused_from_material_id uuid;

create index if not exists idx_student_materials_canonical_cache
  on public.student_materials (
    user_id,
    content_fingerprint,
    pipeline_version,
    pedagogical_model_version
  )
  where pedagogical_model is not null
    and processing_status = 'ready';

comment on column public.student_materials.content_fingerprint is
  'SHA-256 fingerprint of the original PDF bytes used to reuse the canonical pedagogical model safely.';

comment on column public.student_materials.pipeline_version is
  'Version key for the extraction/canonical-model pipeline. Cache reuse requires an exact match.';

comment on column public.student_materials.reused_from_material_id is
  'Material id whose canonical pedagogical model was reused for an identical PDF owned by the same user.';
