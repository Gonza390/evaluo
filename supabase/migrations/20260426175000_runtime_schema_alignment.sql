-- Alineacion no destructiva entre el schema remoto actual y el codigo activo.
-- Esta migracion no elimina tablas legacy ni borra datos.

alter table if exists public.profiles
  add column if not exists role text,
  add column if not exists last_subject_id uuid,
  add column if not exists last_subject_name text,
  add column if not exists active_subjects jsonb default '[]'::jsonb,
  add column if not exists finished_subjects jsonb default '[]'::jsonb,
  add column if not exists dashboard_analytics jsonb default '{"subjectsCompleted":0,"lastUpdatedAt":null}'::jsonb;

alter table if exists public.historial_respuestas
  add column if not exists peso integer default 1,
  add column if not exists fecha_respuesta timestamptz default now();

alter table if exists public.recursos
  add column if not exists etiqueta text;

alter table if exists public.preguntas_banco
  add column if not exists es_ia_generada boolean default false;

comment on column public.profiles.role is 'Compatibilidad con el sistema actual de roles del panel admin.';
comment on column public.profiles.active_subjects is 'Estado persistido del dashboard del estudiante.';
comment on column public.profiles.finished_subjects is 'Materias finalizadas persistidas en perfil.';
comment on column public.profiles.dashboard_analytics is 'Analitica basica del dashboard del estudiante.';
comment on column public.historial_respuestas.peso is 'Peso de refuerzo para priorizar preguntas mal respondidas.';
comment on column public.recursos.etiqueta is 'Etiqueta auxiliar para clasificar recursos mostrados en la app.';
