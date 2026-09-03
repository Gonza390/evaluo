create or replace function public.admin_premium_question_counts()
returns table (
  set_id uuid,
  total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select pq.set_id, count(*)::bigint as total
  from public.premium_questions pq
  where pq.set_id is not null
  group by pq.set_id;
$$;

revoke all on function public.admin_premium_question_counts() from public, anon, authenticated;
grant execute on function public.admin_premium_question_counts() to service_role;
