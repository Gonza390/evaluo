-- Aggregate partial-study insights for the dashboard in a single round trip.
-- The app (lib/data/dashboard-bootstrap.ts) calls this function and keeps a
-- client-side fallback for when it is not deployed yet.
create or replace function public.get_user_partial_stats(
  p_user_id uuid,
  p_materia_id text,
  p_parcial bigint
)
returns table (
  total_respuestas bigint,
  correctas bigint,
  distintas_preguntas bigint
)
language sql
security invoker
set search_path = public
as $$
  select
    count(*) as total_respuestas,
    count(*) filter (where hr.es_correcta) as correctas,
    count(distinct hr.pregunta_id) as distintas_preguntas
  from public.historial_respuestas hr
  join public.preguntas_banco pb on pb.id = hr.pregunta_id
  where hr.usuario_id = p_user_id
    and hr.materia_id = p_materia_id
    and pb.parcial = p_parcial
    and hr.pregunta_id is not null;
$$;

revoke all on function public.get_user_partial_stats(uuid, text, bigint) from public;

grant execute on function public.get_user_partial_stats(uuid, text, bigint) to authenticated;
grant execute on function public.get_user_partial_stats(uuid, text, bigint) to service_role;
