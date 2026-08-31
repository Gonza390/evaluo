alter table public.student_materials
  add column if not exists content_fingerprint text,
  add column if not exists pipeline_version text,
  add column if not exists reused_from_material_id uuid references public.student_materials(id) on delete set null;

create index if not exists student_materials_canonical_cache_lookup_idx
  on public.student_materials (
    materia_id,
    pipeline_version,
    content_fingerprint,
    updated_at desc
  )
  where processing_status = 'ready'
    and content_fingerprint is not null
    and pipeline_version is not null;

comment on column public.student_materials.content_fingerprint is
  'SHA-256 del texto normalizado, materia y version del pipeline para reutilizar artefactos pedagogicos exactos.';

comment on column public.student_materials.pipeline_version is
  'Version del pipeline que genero o reutilizo los artefactos pedagogicos del material.';

comment on column public.student_materials.reused_from_material_id is
  'Material listo cuyo procesamiento canonico fue reutilizado para evitar llamadas de IA duplicadas.';
