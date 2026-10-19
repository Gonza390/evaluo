-- RPC de candidatos para el warmup de explicaciones RAG.
-- Reemplaza el escaneo completo de 5 tablas desde la aplicacion por una sola
-- consulta SQL que devuelve preguntas priorizadas por uso/error, excluyendo
-- las que ya tienen explicacion cacheada.
-- Conserva las prioridades que usa runSimulatorExplanationWarmup:
-- materia_usage, parcial_usage, error_frequency, recommendation_score.

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
    where created_at >= now() - make_interval(days => p_lookback_days)
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
      and created_at >= now() - make_interval(days => p_lookback_days)
    group by 1
  )
  select
    q.id as pregunta_id,
    q.materia_id,
    coalesce(q.parcial, 1) as parcial,
    q.enunciado,
    coalesce(q.opciones, '[]'::jsonb) as opciones,
    q.respuesta_correcta,
    q.creado_at,
    q.tasa_acierto,
    coalesce(mu.total, 0) as materia_usage,
    coalesce(a.cnt, 0) as parcial_usage,
    coalesce(s.veces_fallada, 0) as error_frequency,
    (
      coalesce(pv.cnt, 0)
      + greatest(0, 100 - round(coalesce(q.tasa_acierto, 0.5) * 100))
      + case when q.creado_at is not null then 10 else 0 end
    ) as recommendation_score
  from public.preguntas_banco q
  left join materia_usage mu on mu.materia_id = q.materia_id
  left join attempts a on a.materia_id = q.materia_id and a.parcial = coalesce(q.parcial, 1)
  left join public.rag_question_stats s on s.pregunta_id = q.id
  left join page_views pv on pv.materia_key = q.materia_id::text
  where q.materia_id is not null
    and not exists (
      select 1 from public.rag_explanations_cache c
      where c.pregunta_id = q.id
    )
  order by
    coalesce(mu.total, 0) desc,
    coalesce(a.cnt, 0) desc,
    coalesce(s.veces_fallada, 0) desc,
    coalesce(pv.cnt, 0) desc,
    q.creado_at desc
  limit p_pool_size;
$$;

revoke all on function public.get_warmup_candidates(integer, integer) from public;
grant execute on function public.get_warmup_candidates(integer, integer) to service_role;
