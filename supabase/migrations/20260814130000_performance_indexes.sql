-- Índices de rendimiento: queries reales sin índice + drops de índices duplicados.
-- Los drops son seguros: cada uno está cubierto por un índice compuesto o unique existente.

-- 1) Drops de índices redundantes
drop index if exists resource_views_resource_id_idx;
drop index if exists student_material_chunks_material_idx;
drop index if exists student_material_summaries_material_idx;
drop index if exists student_material_glossaries_material_idx;
drop index if exists analytics_events_user_id_idx;
drop index if exists idx_preguntas_banco_materia_id;
drop index if exists idx_resumenes_materia_id;

-- 2) analytics_events (la tabla más grande): lecturas por event_name + path
create index concurrently if not exists idx_analytics_events_event_path_created
  on public.analytics_events (event_name, path, created_at);

-- prefijos de path (like '/simulador/{materia_id}/%'): btree con text_pattern_ops
create index concurrently if not exists idx_analytics_events_event_path_pattern
  on public.analytics_events (event_name, path text_pattern_ops);

-- ratings por materia (metadata ->> 'materia_id') para get_simulator_ratings_summary
create index concurrently if not exists idx_analytics_events_rating_event_materia
  on public.analytics_events (event_name, (metadata ->> 'materia_id'));

-- 3) historial_respuestas: analytics del admin por materia + fecha
create index concurrently if not exists idx_historial_respuestas_materia_fecha
  on public.historial_respuestas (materia_id, fecha_respuesta);

-- 4) simulator_attempts: warmup de explicaciones por created_at (sin user_id)
create index if not exists idx_simulator_attempts_created_at
  on public.simulator_attempts (created_at);

-- 5) preguntas_banco: filtros por carrera/universidad en el simulador
create index if not exists idx_preguntas_banco_carrera_id
  on public.preguntas_banco (carrera_id);
create index if not exists idx_preguntas_banco_universidad_id
  on public.preguntas_banco (universidad_id);

-- 6) user_favorites: el dashboard lee por user_id
create index if not exists idx_user_favorites_user_id
  on public.user_favorites (user_id);

-- 7) profiles: lectura de admins (current_user_is_admin / listAdminUserIds)
create index if not exists idx_profiles_role
  on public.profiles (role);

-- 8) RAG (admin): ranking por veces fallada y cache reciente
create index if not exists idx_rag_question_stats_veces_fallada
  on public.rag_question_stats (veces_fallada desc);
create index if not exists idx_rag_explanations_cache_updated
  on public.rag_explanations_cache (updated_at desc);
