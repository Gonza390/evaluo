CREATE OR REPLACE FUNCTION public.admin_users_retention_v2(p_days integer DEFAULT 7, p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_today date := coalesce(p_to,(now() at time zone 'America/Argentina/Buenos_Aires')::date);
  v_start date;
  v_result jsonb;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'service_role only' using errcode='42501';
  end if;
  if (p_from is null and p_days not in (1,7,14,30)) then raise exception 'invalid period' using errcode='22023'; end if;
  v_start := coalesce(p_from, v_today - p_days + 1);
  if v_today > (now() at time zone 'America/Argentina/Buenos_Aires')::date or v_start > v_today or v_start < v_today-29 then raise exception 'date range invalid' using errcode='22023'; end if;
  p_days := (v_today-v_start+1);
  with
  users as (
    select a.id,a.created_at,(a.created_at at time zone 'America/Argentina/Buenos_Aires')::date registered,
      coalesce(p.pais,'Sin país') country,p.universidad_id, p.carrera_id,
      coalesce(p.role,'student') role
    from auth.users a left join public.profiles p on p.id=a.id
    where coalesce(p.role,'student')<>'admin' and a.created_at < ((v_today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
  ),
  events as (
    select e.user_id,e.event_name,
      (e.created_at at time zone 'America/Argentina/Buenos_Aires')::date d
    from public.analytics_events e join users u on u.id=e.user_id
    where e.created_at >= ((v_today-92)::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and e.created_at < ((v_today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
  ),
  study as (
    select e.user_id,e.d from events e
    where e.event_name in (
      'summary_topic_check_completed','summary_completed','student_material_exam_completed',
      'simulator_finished','study_error_reviewed','study_error_resolved',
      'study_error_check_answered','study_error_repractice_started'
    )
    union
    select a.user_id,(a.answered_at at time zone 'America/Argentina/Buenos_Aires')::date
      from public.student_material_answer_events a join users u on u.id=a.user_id
      where a.answered_at >= ((v_today-92)::timestamp at time zone 'America/Argentina/Buenos_Aires')
        and a.answered_at < ((v_today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
    union
    select s.user_id,(s.completed_at at time zone 'America/Argentina/Buenos_Aires')::date
      from public.practice_mode_sessions s join users u on u.id=s.user_id
      where s.completed_at >= ((v_today-92)::timestamp at time zone 'America/Argentina/Buenos_Aires')
        and s.completed_at < ((v_today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
  ),
  last_activity as (
    select e.user_id,max(e.d) last_day from events e group by 1
  ),
  last_study as (
    select s.user_id,max(s.d) last_day,min(s.d) first_day from study s group by 1
  ),
  dates as (select (v_today-g.n)::date d from generate_series(0,59) g(n)),
  daily as (
    select d.d,
       (select count(*) from users u where u.registered=d.d)::bigint new_users,
       (select count(distinct e.user_id) from events e where e.d=d.d)::bigint active_users,
       (select count(distinct s.user_id) from study s where s.d=d.d)::bigint studied_users
    from dates d
  ),
  totals as (
    select
      count(*)::bigint registered,
      count(*) filter(where u.registered>=v_start)::bigint new_users,
      count(*) filter(where exists(select 1 from events e where e.user_id=u.id and e.d>=v_start))::bigint active_users,
      count(*) filter(where exists(select 1 from study s where s.user_id=u.id and s.d>=v_start))::bigint studied_users,
      count(*) filter(where exists(select 1 from events e where e.user_id=u.id and e.d=v_today))::bigint dau,
      count(*) filter(where exists(select 1 from events e where e.user_id=u.id and e.d>=v_today-6))::bigint wau,
      count(*) filter(where exists(select 1 from events e where e.user_id=u.id and e.d>=v_today-29))::bigint mau
    from users u
  ),
  period_comparison as (
    select count(*)::bigint prev_new from users u
    where u.registered>=v_start-p_days and u.registered<v_start
  ),
  subscriptions as (
    select distinct on (s.user_id) s.user_id,s.status
    from public.user_subscriptions s
    where s.created_at<now()
    order by s.user_id,s.created_at desc
  ),
  plans as (
    select count(*) filter(where coalesce(s.status,'')='active')::bigint premium_users,
      count(*) filter(where coalesce(s.status,'')<>'active')::bigint free_users
    from users u left join subscriptions s on s.user_id=u.id
  ),
  retention_cohort as (
    select u.id,u.registered from users u
    where u.registered>=v_start-30 and u.registered<=v_today
  ),
  retention_counts as (
    select n.n,
      count(*) filter(where c.registered<=v_today-n.n and c.registered>=v_start-n.n)::bigint eligible,
      count(*) filter(where c.registered<=v_today-n.n and c.registered>=v_start-n.n
        and exists(select 1 from study s where s.user_id=c.id and s.d=c.registered+n.n))::bigint returned
    from (values (1),(7),(30)) n(n) cross join retention_cohort c
    group by 1
  ),
  weekly_cohorts as (
    select date_trunc('week',u.registered::timestamp)::date week,u.id,u.registered
    from users u where u.registered>=v_today-62
  ),
  weekly as (
    select w.week, count(*)::bigint users,
      count(*) filter(where w.registered+1<=v_today)::bigint d1_eligible,
      count(*) filter(where w.registered+1<=v_today and exists(select 1 from study s where s.user_id=w.id and s.d=w.registered+1))::bigint d1_returned,
      count(*) filter(where w.registered+7<=v_today)::bigint d7_eligible,
      count(*) filter(where w.registered+7<=v_today and exists(select 1 from study s where s.user_id=w.id and s.d=w.registered+7))::bigint d7_returned,
      count(*) filter(where w.registered+30<=v_today)::bigint d30_eligible,
      count(*) filter(where w.registered+30<=v_today and exists(select 1 from study s where s.user_id=w.id and s.d=w.registered+30))::bigint d30_returned
    from weekly_cohorts w group by w.week order by w.week desc
  ),
  frequency as (
    select u.id,count(distinct s.d)::int days
    from users u left join study s on s.user_id=u.id and s.d>=v_today-6
    group by 1
  ),
  freq_summary as (
    select count(*) filter(where f.days=1)::bigint once,
      count(*) filter(where f.days between 2 and 3)::bigint two_three,
      count(*) filter(where f.days>=4)::bigint four_plus,
      coalesce(sum(f.days)::numeric / nullif(count(*) filter(where f.days>0),0),0)::numeric avg_study_days
    from frequency f
  ),
  abandonment as (
    select
      count(*) filter(where u.registered>=v_start and ls.user_id is null)::bigint new_no_study,
      count(*) filter(where ls.user_id is not null and ls.first_day=ls.last_day and ls.last_day<v_today-6)::bigint once_then_left,
      count(*) filter(where la.last_day<v_today-6 or la.last_day is null)::bigint inactive_7,
      count(*) filter(where la.last_day<v_today-13 or la.last_day is null)::bigint inactive_14,
      count(*) filter(where la.last_day<v_today-29 or la.last_day is null)::bigint inactive_30,
      count(*) filter(where la.last_day>=v_start
        and exists(select 1 from events old_e where old_e.user_id=u.id and old_e.d<v_start-7)
        and not exists(select 1 from events gap_e where gap_e.user_id=u.id and gap_e.d>=v_start-7 and gap_e.d<v_start))::bigint reactivated
    from users u
    left join last_study ls on ls.user_id=u.id
    left join last_activity la on la.user_id=u.id
  ),
  segment_by_plan as (
    select coalesce(case when s.status='active' then 'Premium' end,'Free') name,
      count(*)::bigint users,
      count(*) filter(where u.registered>=v_start)::bigint nuevos,
      count(*) filter(where exists(select 1 from events e where e.user_id=u.id and e.d>=v_start))::bigint activos,
      count(*) filter(where exists(select 1 from study x where x.user_id=u.id and x.d>=v_start))::bigint estudiaron
    from users u left join subscriptions s on s.user_id=u.id
    group by 1
  )
  select jsonb_build_object(
    'period',p_days,
    'today',v_today,
    'totals',(select to_jsonb(t) from totals t),
    'previous',(select to_jsonb(p) from period_comparison p),
    'plan_distribution',(select to_jsonb(p) from plans p),
    'daily',(select jsonb_agg(to_jsonb(d) order by d.d) from daily d),
    'retention',(select jsonb_object_agg('d'||r.n,jsonb_build_object('eligible',r.eligible,'returned',r.returned)) from retention_counts r),
    'cohorts',(select coalesce(jsonb_agg(to_jsonb(w) order by w.week desc),'[]'::jsonb) from weekly w),
    'frequency',(select to_jsonb(f) from freq_summary f),
    'abandonment',(select to_jsonb(a) from abandonment a),
    'segments',(select jsonb_agg(to_jsonb(p)) from segment_by_plan p)
  ) into v_result;
  return v_result;
end
$function$
;
revoke all on function public.admin_users_retention_v2(integer,date,date) from public,anon,authenticated;
grant execute on function public.admin_users_retention_v2(integer,date,date) to service_role;