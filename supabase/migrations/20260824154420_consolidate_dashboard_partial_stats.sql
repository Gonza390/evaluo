-- Consolida el total del parcial y las métricas del usuario en un solo viaje.
-- Solo service_role puede invocarla: recibe un user_id explícito y se usa
-- exclusivamente desde el servidor.
drop function if exists public.get_user_partial_stats(uuid, text, bigint);

create function public.get_user_partial_stats(
  p_user_id uuid,
  p_materia_id text,
  p_parcial bigint
)
returns table (
  total_preguntas bigint,
  total_respuestas bigint,
  correctas bigint,
  distintas_preguntas bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with question_total as (
    select count(*)::bigint as total_preguntas
    from public.preguntas_banco pb
    where pb.materia_id = p_materia_id::uuid
      and pb.parcial = p_parcial
  ), answer_stats as (
    select
      count(*)::bigint as total_respuestas,
      count(*) filter (where hr.es_correcta)::bigint as correctas,
      count(distinct hr.pregunta_id)::bigint as distintas_preguntas
    from public.historial_respuestas hr
    join public.preguntas_banco pb on pb.id = hr.pregunta_id
    where hr.usuario_id = p_user_id
      and hr.materia_id = p_materia_id
      and pb.parcial = p_parcial
      and hr.pregunta_id is not null
  )
  select
    qt.total_preguntas,
    stats.total_respuestas,
    stats.correctas,
    stats.distintas_preguntas
  from question_total qt
  cross join answer_stats stats;
$$;

revoke all on function public.get_user_partial_stats(uuid, text, bigint)
from public, anon, authenticated;

grant execute on function public.get_user_partial_stats(uuid, text, bigint)
to service_role;
