create or replace function public.get_reactivation_next_subject_candidates(
  p_cutoff timestamptz,
  p_limit integer default 20
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  materia_id uuid,
  materia_nombre text,
  last_parcial integer,
  last_simulator_at timestamptz,
  last_active_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  with latest_attempt as (
    select distinct on (sa.user_id)
      sa.user_id,
      sa.materia_id,
      sa.parcial,
      sa.created_at as last_simulator_at
    from public.simulator_attempts sa
    where sa.user_id is not null
    order by sa.user_id, sa.created_at desc
  ),
  analytics_last as (
    select ae.user_id, max(ae.created_at) as last_analytics_at
    from public.analytics_events ae
    where ae.user_id is not null
    group by ae.user_id
  ),
  calendar_last as (
    select sce.user_id, max(sce.created_at) as last_calendar_at
    from public.study_calendar_events sce
    group by sce.user_id
  ),
  activity as (
    select
      la.user_id,
      greatest(
        la.last_simulator_at,
        coalesce(al.last_analytics_at, '-infinity'::timestamptz),
        coalesce(cl.last_calendar_at, '-infinity'::timestamptz),
        coalesce(u.last_sign_in_at, '-infinity'::timestamptz),
        coalesce(u.created_at, '-infinity'::timestamptz)
      ) as last_active_at
    from latest_attempt la
    join auth.users u on u.id = la.user_id
    left join analytics_last al on al.user_id = la.user_id
    left join calendar_last cl on cl.user_id = la.user_id
  )
  select
    la.user_id,
    u.email::text,
    coalesce(
      nullif(trim(p.nombre), ''),
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      split_part(u.email, '@', 1)
    )::text as display_name,
    la.materia_id,
    m.nombre::text as materia_nombre,
    la.parcial as last_parcial,
    la.last_simulator_at,
    a.last_active_at
  from latest_attempt la
  join activity a on a.user_id = la.user_id
  join auth.users u on u.id = la.user_id
  join public.materias m on m.id = la.materia_id
  left join public.profiles p on p.id = la.user_id
  where u.email is not null
    and u.email_confirmed_at is not null
    and a.last_active_at <= p_cutoff
    and not exists (
      select 1
      from public.student_materials sm
      where sm.user_id = la.user_id
    )
    and not exists (
      select 1
      from public.email_campaign_deliveries ecd
      where ecd.campaign_key = 'reactivation_next_subject_30d_v1'
        and ecd.user_id = la.user_id
    )
  order by a.last_active_at asc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

revoke all on function public.get_reactivation_next_subject_candidates(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.get_reactivation_next_subject_candidates(timestamptz, integer) to service_role;
