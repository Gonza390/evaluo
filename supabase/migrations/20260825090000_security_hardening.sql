-- Evaluo - hardening de seguridad
-- Fecha: 2026-08-25
--
-- Objetivos:
-- 1) Cerrar RPCs internas que quedaron ejecutables por anon/authenticated.
-- 2) Acotar get_warmup_candidates.
-- 3) Eliminar las vistas SECURITY DEFINER públicas sin perder su comportamiento.
-- 4) Fijar search_path en funciones reportadas por el Security Advisor.
--
-- IMPORTANTE: esta migración es incremental. No reemplaza ni modifica migraciones antiguas.

begin;

-- ---------------------------------------------------------------------------
-- 1. Esquema privado para helpers que necesitan leer tablas protegidas por RLS.
--    No debe agregarse a "Exposed schemas" de la API de Supabase.
-- ---------------------------------------------------------------------------

create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to anon;
grant usage on schema app_private to authenticated;
grant usage on schema app_private to service_role;

-- ---------------------------------------------------------------------------
-- 2. Helpers privados que devuelven únicamente datos sanitizados.
--    Las vistas públicas serán SECURITY INVOKER y llamarán estos helpers.
-- ---------------------------------------------------------------------------

create or replace function app_private.list_demo_questions()
returns table (
  id uuid,
  materia_id uuid,
  parcial bigint,
  enunciado text,
  opciones jsonb,
  correct_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pb.id,
    pb.materia_id,
    pb.parcial,
    pb.enunciado,
    pb.opciones,
    coalesce(
      array_length(
        array_remove(
          regexp_split_to_array(pb.respuesta_correcta, '\s*(\||;)\s*'),
          ''
        ),
        1
      ),
      0
    )::integer as correct_count
  from public.preguntas_banco pb
  where pb.es_demo = true;
$$;

revoke all on function app_private.list_demo_questions() from public;
revoke all on function app_private.list_demo_questions() from anon;
revoke all on function app_private.list_demo_questions() from authenticated;
grant execute on function app_private.list_demo_questions() to anon;
grant execute on function app_private.list_demo_questions() to authenticated;
grant execute on function app_private.list_demo_questions() to service_role;


create or replace function app_private.list_public_questions()
returns table (
  id uuid,
  materia_id uuid,
  parcial bigint,
  enunciado text,
  opciones jsonb,
  creado_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pb.id,
    pb.materia_id,
    pb.parcial,
    pb.enunciado,
    pb.opciones,
    pb.creado_at
  from public.preguntas_banco pb
  where pb.es_demo = false;
$$;

revoke all on function app_private.list_public_questions() from public;
revoke all on function app_private.list_public_questions() from anon;
revoke all on function app_private.list_public_questions() from authenticated;
grant execute on function app_private.list_public_questions() to anon;
grant execute on function app_private.list_public_questions() to authenticated;
grant execute on function app_private.list_public_questions() to service_role;


create or replace function app_private.list_resource_view_counts()
returns table (
  resource_id uuid,
  views bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    rv.resource_id,
    count(*)::bigint as views
  from public.resource_views rv
  group by rv.resource_id;
$$;

revoke all on function app_private.list_resource_view_counts() from public;
revoke all on function app_private.list_resource_view_counts() from anon;
revoke all on function app_private.list_resource_view_counts() from authenticated;
grant execute on function app_private.list_resource_view_counts() to anon;
grant execute on function app_private.list_resource_view_counts() to authenticated;
grant execute on function app_private.list_resource_view_counts() to service_role;

-- ---------------------------------------------------------------------------
-- 3. Rehacer las vistas públicas como SECURITY INVOKER.
--    Conservan exactamente la proyección pública anterior:
--    - nunca exponen respuesta_correcta
--    - demo_questions sólo expone correct_count derivado
-- ---------------------------------------------------------------------------

create or replace view public.demo_questions
with (security_invoker = true)
as
select *
from app_private.list_demo_questions();

revoke all on public.demo_questions from public;
revoke all on public.demo_questions from anon;
revoke all on public.demo_questions from authenticated;
grant select on public.demo_questions to anon;
grant select on public.demo_questions to authenticated;
grant select on public.demo_questions to service_role;


create or replace view public.preguntas_banco_public
with (security_invoker = true)
as
select *
from app_private.list_public_questions();

revoke all on public.preguntas_banco_public from public;
revoke all on public.preguntas_banco_public from anon;
revoke all on public.preguntas_banco_public from authenticated;
grant select on public.preguntas_banco_public to anon;
grant select on public.preguntas_banco_public to authenticated;
grant select on public.preguntas_banco_public to service_role;


create or replace view public.resource_view_counts
with (security_invoker = true)
as
select *
from app_private.list_resource_view_counts();

revoke all on public.resource_view_counts from public;
revoke all on public.resource_view_counts from anon;
revoke all on public.resource_view_counts from authenticated;
grant select on public.resource_view_counts to anon;
grant select on public.resource_view_counts to authenticated;
grant select on public.resource_view_counts to service_role;

-- ---------------------------------------------------------------------------
-- 4. Reemplazar get_warmup_candidates:
--    - sigue siendo interna y útil para service_role
--    - mantiene respuesta_correcta porque el warmup servidor la necesita
--    - acota parámetros para impedir consultas arbitrariamente grandes
-- ---------------------------------------------------------------------------

create or replace function public.get_warmup_candidates(
  p_lookback_days integer default 120,
  p_pool_size integer default 4000
)
returns table (
  pregunta_id uuid,
  materia_id uuid,
  parcial integer,
  enunciado text,
  opciones jsonb,
  respuesta_correcta text,
  creado_at timestamptz,
  tasa_acierto numeric,
  materia_usage bigint,
  parcial_usage bigint,
  error_frequency integer,
  recommendation_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with attempts as (
    select materia_id, parcial, count(*) as cnt
    from public.simulator_attempts
    where created_at >= now() - make_interval(
      days => least(greatest(coalesce(p_lookback_days, 120), 1), 3650)
    )
    group by materia_id, parcial
  ),
  materia_usage as (
    select materia_id, sum(cnt) as total
    from attempts
    group by materia_id
  ),
  page_views as (
    select
      regexp_replace(path, '^/explorar/materia/([^/?#]+).*$', '\1') as materia_key,
      count(*) as cnt
    from public.analytics_events
    where event_name = 'page_view'
      and path like '/explorar/materia/%'
      and created_at >= now() - make_interval(
        days => least(greatest(coalesce(p_lookback_days, 120), 1), 3650)
      )
    group by 1
  )
  select
    q.id as pregunta_id,
    q.materia_id,
    coalesce(q.parcial, 1)::integer as parcial,
    q.enunciado,
    coalesce(q.opciones, '[]'::jsonb) as opciones,
    q.respuesta_correcta,
    q.creado_at,
    q.tasa_acierto,
    coalesce(mu.total, 0)::bigint as materia_usage,
    coalesce(a.cnt, 0)::bigint as parcial_usage,
    coalesce(s.veces_fallada, 0)::integer as error_frequency,
    (
      coalesce(pv.cnt, 0)
      + greatest(0, 100 - round(coalesce(q.tasa_acierto, 0.5) * 100))
      + case when q.creado_at is not null then 10 else 0 end
    )::numeric as recommendation_score
  from public.preguntas_banco q
  left join materia_usage mu
    on mu.materia_id = q.materia_id
  left join attempts a
    on a.materia_id = q.materia_id
   and a.parcial = coalesce(q.parcial, 1)
  left join public.rag_question_stats s
    on s.pregunta_id = q.id
  left join page_views pv
    on pv.materia_key = q.materia_id::text
  where q.materia_id is not null
    and not exists (
      select 1
      from public.rag_explanations_cache c
      where c.pregunta_id = q.id
    )
  order by
    coalesce(mu.total, 0) desc,
    coalesce(a.cnt, 0) desc,
    coalesce(s.veces_fallada, 0) desc,
    coalesce(pv.cnt, 0) desc,
    q.creado_at desc
  limit least(greatest(coalesce(p_pool_size, 4000), 1), 5000);
$$;

-- REVOKE FROM PUBLIC no elimina grants explícitos preexistentes a anon/authenticated.
-- Por eso se revocan los tres roles de forma explícita.
revoke all on function public.get_warmup_candidates(integer, integer) from public;
revoke all on function public.get_warmup_candidates(integer, integer) from anon;
revoke all on function public.get_warmup_candidates(integer, integer) from authenticated;
grant execute on function public.get_warmup_candidates(integer, integer) to service_role;

-- consume_rate_limit también es exclusivamente server-side.
revoke all on function public.consume_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, integer, integer) from anon;
revoke all on function public.consume_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Fijar search_path en funciones reportadas como mutable.
--    Usamos public (en lugar de vacío) para no romper funciones legacy que
--    puedan referenciar tablas sin calificar.
-- ---------------------------------------------------------------------------

alter function public.set_student_materials_updated_at()
  set search_path = public;

alter function public.set_student_material_feedback_updated_at()
  set search_path = public;

alter function public.set_study_calendar_events_updated_at()
  set search_path = public;

alter function public.set_student_material_summaries_updated_at()
  set search_path = public;

alter function public.set_student_material_glossaries_updated_at()
  set search_path = public;

alter function public.asignar_materias_globales()
  set search_path = public;

alter function public.set_student_material_flashcard_progress_updated_at()
  set search_path = public;

alter function public.set_student_material_ai_usage_updated_at()
  set search_path = public;

commit;
