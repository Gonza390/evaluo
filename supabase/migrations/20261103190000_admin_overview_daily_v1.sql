-- Consolidated admin time series. Only the server-side service role may invoke it.
create or replace function public.admin_overview_daily_v1(p_days integer default 30)
returns table (
  day date,
  registrations bigint,
  active_users bigint,
  sessions bigint,
  pdfs_uploaded bigint,
  practices_completed bigint
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'admin_overview_daily_v1 is service role only' using errcode = '42501';
  end if;
  if p_days < 1 or p_days > 31 or p_days is null then
    raise exception 'p_days must be between 1 and 31' using errcode = '22023';
  end if;
  return query
  with bounds as (
    select (now() at time zone 'America/Argentina/Buenos_Aires')::date as today
  ), dates as (
    select (b.today - g.n)::date as d
    from bounds b cross join generate_series(0, p_days-1) as g(n)
  ), registrations_by_day as (
    select (u.created_at at time zone 'America/Argentina/Buenos_Aires')::date as d,
           count(*)::bigint as n
    from auth.users u
    left join public.profiles p on p.id = u.id
    cross join bounds b
    where u.created_at >= ((b.today - (p_days-1))::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and coalesce(p.role, 'student') <> 'admin'
    group by 1
  ), events_by_day as (
    select (e.created_at at time zone 'America/Argentina/Buenos_Aires')::date as d,
           count(distinct e.user_id) filter (where e.user_id is not null and coalesce(p.role, 'student') <> 'admin') ::bigint as active_count,
           count(distinct e.session_key) filter (where e.session_key is not null
              and e.device_type is distinct from 'server'
              and e.session_key not like 'server:%'
              and (e.user_id is null or coalesce(p.role, 'student') <> 'admin')) ::bigint as session_count
    from public.analytics_events e
    left join public.profiles p on p.id = e.user_id
    cross join bounds b
    where e.created_at >= ((b.today - (p_days-1))::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and e.created_at < ((b.today + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
    group by 1
  ), materials_by_day as (
    select (m.created_at at time zone 'America/Argentina/Buenos_Aires')::date as d,
           count(*)::bigint as n
    from public.student_materials m
    left join public.profiles p on p.id = m.user_id
    cross join bounds b
    where m.created_at >= ((b.today - (p_days-1))::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and m.created_at < ((b.today + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and coalesce(p.role, 'student') <> 'admin'
    group by 1
  ), practices_by_day as (
    select (s.completed_at at time zone 'America/Argentina/Buenos_Aires')::date as d,
           count(*)::bigint as n
    from public.practice_mode_sessions s
    left join public.profiles p on p.id = s.user_id
    cross join bounds b
    where s.completed_at >= ((b.today - (p_days-1))::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and s.completed_at < ((b.today + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and coalesce(p.role, 'student') <> 'admin'
    group by 1
  )
  select d.d, coalesce(r.n,0),coalesce(e.active_count,0),coalesce(e.session_count,0),
         coalesce(m.n,0),coalesce(s.n,0)
  from dates d
  left join registrations_by_day r on r.d=d.d
  left join events_by_day e on e.d=d.d
  left join materials_by_day m on m.d=d.d
  left join practices_by_day s on s.d=d.d
  order by d.d asc;
end
$function$;
revoke all on function public.admin_overview_daily_v1(integer) from public, anon, authenticated;
grant execute on function public.admin_overview_daily_v1(integer) to service_role;