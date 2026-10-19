create index if not exists idx_materias_carrera_id
on public.materias (carrera_id);

create index if not exists idx_resumenes_materia_modulo_created
on public.resumenes (materia_id, module_id, created_at desc);

create index if not exists idx_recursos_materia_tipo_creado
on public.recursos (materia_id, tipo, creado_at desc);

create index if not exists idx_resource_votes_resource_user
on public.resource_votes (resource_id, user_id);

create index if not exists idx_resource_views_resource
on public.resource_views (resource_id);

create index if not exists idx_historial_usuario_materia_pregunta
on public.historial_respuestas (usuario_id, materia_id, pregunta_id);

create index if not exists idx_preguntas_banco_materia_parcial
on public.preguntas_banco (materia_id, parcial);
