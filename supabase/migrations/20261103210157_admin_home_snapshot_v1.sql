CREATE OR REPLACE FUNCTION public.admin_home_snapshot_v1(p_day date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_day date := coalesce(p_day, (now() at time zone 'America/Argentina/Buenos_Aires')::date);
  v_end timestamptz;
  v_start timestamptz;
  v_result jsonb;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'service_role only' using errcode = '42501';
  end if;
  if v_day > (now() at time zone 'America/Argentina/Buenos_Aires')::date
     or v_day < (now() at time zone 'America/Argentina/Buenos_Aires')::date - 90 then
    raise exception 'p_day outside allowed range' using errcode = '22023';
  end if;
  v_end := ((v_day + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires');
  v_start := ((v_day - 59)::timestamp at time zone 'America/Argentina/Buenos_Aires');

  with
  users as (
    select u.id, u.created_at from auth.users u
    left join public.profiles p on p.id=u.id
    where coalesce(p.role,'student') <> 'admin' and u.created_at < v_end
  ),
  recent_events as (
    select e.event_name,e.user_id,e.session_key,e.created_at,
      (e.created_at at time zone 'America/Argentina/Buenos_Aires')::date d
    from public.analytics_events e
    where e.created_at >= v_start and e.created_at < v_end
      and (e.user_id is null or exists (select 1 from users u where u.id=e.user_id))
  ),
  studied as (
    select e.user_id,e.created_at, e.d
    from recent_events e where e.user_id is not null and e.event_name in
      ('summary_topic_check_completed','summary_completed','student_material_exam_completed',
       'simulator_finished','study_error_reviewed','study_error_resolved',
       'study_error_check_answered','study_error_repractice_started')
    union all
    select a.user_id,a.answered_at,(a.answered_at at time zone 'America/Argentina/Buenos_Aires')::date
      from public.student_material_answer_events a join users u on u.id=a.user_id
      where a.answered_at >= v_start and a.answered_at < v_end
    union all
    select s.user_id,s.completed_at,(s.completed_at at time zone 'America/Argentina/Buenos_Aires')::date
      from public.practice_mode_sessions s join users u on u.id=s.user_id
      where s.completed_at >= v_start and s.completed_at < v_end
  ),
  dates as (
    select (v_day - n)::date as d from generate_series(0,59) n
  ),
  daily_users as (
    select (u.created_at at time zone 'America/Argentina/Buenos_Aires')::date d,
           count(*)::bigint n from users u where u.created_at >= v_start group by 1
  ),
  daily_events as (
    select e.d,count(distinct e.user_id)::bigint active,
           count(distinct e.session_key)::bigint sessions
    from recent_events e group by 1
  ),
  daily_studied as (
    select s.d,count(distinct s.user_id)::bigint n from studied s group by 1
  ),
  daily as (
    select d.d,coalesce(du.n,0) registrations,
      coalesce(de.active,0) active_users,coalesce(de.sessions,0) sessions,
      coalesce(ds.n,0) studied_users
    from dates d
    left join daily_users du using(d)
    left join daily_events de using(d)
    left join daily_studied ds using(d)
    order by d.d
  ),
  period_users as (
    select
      count(*)::bigint total,
      count(*) filter(where u.created_at >= v_end - interval '7 days')::bigint new_7d
    from users u
  ),
  activity_users as (
    select
      count(distinct e.user_id) filter(where e.created_at >= v_end - interval '7 days')::bigint active_7d
    from recent_events e where e.user_id is not null
  ),
  study_users as (
    select
      count(distinct studied.user_id) filter(where studied.created_at >= v_end - interval '7 days')::bigint studying_7d,
      count(distinct studied.user_id) filter(where studied.created_at >= v_end - interval '7 days'
        and exists (select 1 from studied prev where prev.user_id=studied.user_id
          and prev.created_at < v_end - interval '7 days' and prev.created_at >= v_end - interval '14 days'))::bigint returning_7d
    from studied studied
  ),
  cohort as (
    select u.id, u.created_at,
      (u.created_at at time zone 'America/Argentina/Buenos_Aires')::date signup_day
    from users u
    where u.created_at >= v_end - interval '15 days'
      and u.created_at < v_end - interval '7 days'
  ),
  cohort_result as (
    select count(*)::bigint cohort_users,
       count(*) filter(where exists
         (select 1 from studied s where s.user_id=c.id
          and s.d=c.signup_day + 7))::bigint retained
    from cohort c
  ),
  materials as (
    select
      count(*) filter(where m.created_at >= v_end - interval '7 days')::bigint uploaded_7d,
      count(*) filter(where m.created_at >= v_end - interval '7 days' and processing_status='ready')::bigint ready_7d,
      count(*) filter(where m.created_at >= v_end - interval '7 days' and processing_status='failed')::bigint failed_7d,
      count(*) filter(where m.created_at < v_end - interval '15 minutes'
        and m.created_at >= v_end - interval '7 days' and processing_status not in('ready','failed'))::bigint stuck_7d
    from public.student_materials m join users u on u.id=m.user_id
    where m.created_at < v_end
  ),
  practice as (
    select (
      (select count(*) from public.practice_mode_sessions s join users u on u.id=s.user_id
        where s.completed_at >= v_end - interval '7 days' and s.completed_at < v_end)
      +
      (select count(*) from recent_events e where e.event_name in('student_material_exam_completed','simulator_finished','summary_topic_check_completed')
        and e.created_at >= v_end - interval '7 days')
    )::bigint completed_7d
  ),
  plans as (
    select count(*)::bigint created_7d from public.student_personal_study_plans p
    join users u on u.id=p.user_id
    where p.created_at >= v_end - interval '7 days' and p.created_at < v_end
  ),
  activation as (
    select count(*)::bigint activated from users u
    where u.created_at >= v_end - interval '7 days' and
    exists(select 1 from public.student_materials m where m.user_id=u.id
      and m.created_at >= u.created_at and m.created_at < v_end)
  ),
  premium as (
    select count(*)::bigint active
    from public.user_subscriptions s join users u on u.id=s.user_id
    where s.status='active' and s.started_at < v_end
      and (s.expires_at is null or s.expires_at >= v_end)
  ),
  revenue as (
    select coalesce(sum(t.amount_ars) filter(where t.currency='ARS'),0)::numeric ars,
      coalesce(sum(t.amount_ars) filter(where t.currency='USD'),0)::numeric usd
    from public.payment_transactions t join users u on u.id=t.user_id
    where t.status in('approved','accredited','paid')
      and t.paid_at >= v_end - interval '7 days' and t.paid_at < v_end
  ),
  payments as (
    select count(*)::bigint failed from public.payment_checkout_attempts a
    where a.status='failed' and a.created_at >= v_end - interval '7 days'
      and a.created_at < v_end
  )
  select jsonb_build_object(
    'day',v_day,
    'daily',(select jsonb_agg(to_jsonb(daily) order by daily.d) from daily),
    'users',(select to_jsonb(period_users) from period_users),
    'activity',(select to_jsonb(activity_users) from activity_users),
    'study',(select to_jsonb(study_users) from study_users),
    'cohort',(select to_jsonb(cohort_result) from cohort_result),
    'materials',(select to_jsonb(materials) from materials),
    'practice',(select to_jsonb(practice) from practice),
    'plans',(select to_jsonb(plans) from plans),
    'activation',(select to_jsonb(activation) from activation),
    'premium',(select to_jsonb(premium) from premium),
    'revenue',(select to_jsonb(revenue) from revenue),
    'payments',(select to_jsonb(payments) from payments)
  ) into v_result;
  return v_result;
end
$function$
;
revoke all on function public.admin_home_snapshot_v1(date) from public, anon, authenticated;
grant execute on function public.admin_home_snapshot_v1(date) to service_role;
