-- RPC de resumen de votos de recursos en DB.
-- Reemplaza la agregacion en JS (que traia todas las filas de resource_votes)
-- por un GROUP BY en la base, devolviendo likes/dislikes/score y el voto del
-- usuario actual (si se pasa p_user_id).

create or replace function public.get_resource_vote_summaries(
  p_resource_ids uuid[],
  p_user_id uuid default null
)
returns table (
  resource_id uuid,
  likes bigint,
  dislikes bigint,
  score bigint,
  user_vote smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.resource_id,
    count(*) filter (where v.vote_type = 1) as likes,
    count(*) filter (where v.vote_type = -1) as dislikes,
    count(*) filter (where v.vote_type = 1) - count(*) filter (where v.vote_type = -1) as score,
    coalesce(
      max(case when v.user_id = p_user_id then v.vote_type end),
      0
    )::smallint as user_vote
  from public.resource_votes v
  where v.resource_id = any(p_resource_ids)
  group by v.resource_id;
$$;

revoke all on function public.get_resource_vote_summaries(uuid[], uuid) from public;
grant execute on function public.get_resource_vote_summaries(uuid[], uuid) to anon;
grant execute on function public.get_resource_vote_summaries(uuid[], uuid) to authenticated;
grant execute on function public.get_resource_vote_summaries(uuid[], uuid) to service_role;
