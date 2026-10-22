-- Grupos del mapa pedagógico: recuperar resultados parciales entre ejecuciones.
-- Cada grupo está ligado al hash del PDF, la versión del pipeline y el
-- algoritmo del modelo. Si cambian, no puede reutilizarse por accidente.
create table if not exists public.student_material_pedagogical_map_checkpoints (
  student_material_id uuid not null references public.student_materials(id) on delete cascade,
  group_index integer not null check (group_index >= 0),
  file_sha256 text not null check (length(file_sha256) = 64),
  pipeline_version text not null,
  model_version integer not null check (model_version > 0),
  group_hash text not null check (length(group_hash) = 64),
  node jsonb not null check (jsonb_typeof(node) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (student_material_id, group_index)
);

alter table public.student_material_pedagogical_map_checkpoints enable row level security;
-- Sólo el servidor con service_role accede a la tabla; no es contenido público.
revoke all on public.student_material_pedagogical_map_checkpoints from anon, authenticated;
grant all on public.student_material_pedagogical_map_checkpoints to service_role;

comment on table public.student_material_pedagogical_map_checkpoints is
  'Mapas académicos por lote, versionados por PDF y algoritmo para reintentos seguros.';
