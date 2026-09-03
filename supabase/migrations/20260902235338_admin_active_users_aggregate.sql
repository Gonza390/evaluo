create or replace function public.admin_active_user_count_since(
  since_at timestamptz,
  excluded_user_ids uuid[] default '{}'::uuid[]
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct ae.user_id)::bigint
  from public.analytics_events ae
  where ae.created_at >= since_at
    and ae.user_id is not null
    and not (ae.user_id = any(excluded_user_ids));
$$;

revoke all on function public.admin_active_user_count_since(timestamptz, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_active_user_count_since(timestamptz, uuid[]) to service_role;
