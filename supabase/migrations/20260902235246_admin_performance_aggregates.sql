create or replace function public.admin_biblioteca_question_counts()
returns table (
  materia_id uuid,
  parcial integer,
  total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select pb.materia_id, pb.parcial, count(*)::bigint as total
  from public.preguntas_banco pb
  where pb.materia_id is not null
  group by pb.materia_id, pb.parcial
  order by pb.materia_id, pb.parcial;
$$;

revoke all on function public.admin_biblioteca_question_counts() from public, anon, authenticated;
grant execute on function public.admin_biblioteca_question_counts() to service_role;

create or replace function public.admin_user_simulator_aggregates(target_user_ids uuid[] default null)
returns table (
  user_id uuid,
  intentos bigint,
  preguntas bigint,
  correctas bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sa.user_id,
    count(*)::bigint as intentos,
    coalesce(sum(sa.answered_questions), 0)::bigint as preguntas,
    coalesce(sum(sa.correct_answers), 0)::bigint as correctas
  from public.simulator_attempts sa
  where target_user_ids is null or sa.user_id = any(target_user_ids)
  group by sa.user_id;
$$;

revoke all on function public.admin_user_simulator_aggregates(uuid[]) from public, anon, authenticated;
grant execute on function public.admin_user_simulator_aggregates(uuid[]) to service_role;
