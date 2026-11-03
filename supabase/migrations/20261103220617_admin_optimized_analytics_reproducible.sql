-- Evaluo admin dashboards: shared study definitions, preaggregated retention and late-enriched pagination.
create or replace function public.admin_study_event_names_v1()
returns text[] language sql immutable set search_path='' as $e$
 select array['summary_topic_check_completed','summary_completed','student_material_exam_completed',
 'simulator_finished','study_error_reviewed','study_error_resolved',
 'study_error_check_answered','study_error_repractice_started']::text[];
$e$;
create or replace function public.admin_study_days_v1(p_from timestamptz,p_until timestamptz)
returns table(user_id uuid,d date) language plpgsql security definer set search_path=''
as $f$
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
 then raise exception 'service_role only' using errcode='42501'; end if;
 if p_from is null or p_until is null or p_from>=p_until
  or p_from<now()-interval '365 days' or p_until>now()+interval '2 days'
 then raise exception 'study window invalid' using errcode='22023'; end if;
 return query
 with studied as (
  select e.user_id,(e.created_at at time zone 'America/Argentina/Buenos_Aires')::date d
  from public.analytics_events e
  where e.created_at>=p_from and e.created_at<p_until
    and e.user_id is not null and e.event_name=any(public.admin_study_event_names_v1())
  union
  select a.user_id,(a.answered_at at time zone 'America/Argentina/Buenos_Aires')::date
  from public.student_material_answer_events a where a.answered_at>=p_from and a.answered_at<p_until
  union
  select s.user_id,(s.completed_at at time zone 'America/Argentina/Buenos_Aires')::date
  from public.practice_mode_sessions s where s.completed_at>=p_from and s.completed_at<p_until
 )
 select t.user_id,t.d from studied t join auth.users a on a.id=t.user_id
 left join public.profiles p on p.id=a.id where coalesce(p.role,'student')<>'admin';
end
$f$;
CREATE OR REPLACE FUNCTION public.admin_home_snapshot_v2(p_day date DEFAULT NULL::date)
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
  if coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ) is distinct from 'service_role' then
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
 select x.user_id,(x.d::timestamp at time zone 'America/Argentina/Buenos_Aires') created_at,x.d
 from public.admin_study_days_v1(v_start,v_end) x
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
    where u.created_at >= ((v_day - 13)::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and u.created_at < ((v_day - 6)::timestamp at time zone 'America/Argentina/Buenos_Aires')
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
$function$;
CREATE OR REPLACE FUNCTION public.admin_users_retention_v4(p_days integer DEFAULT 7, p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date)
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
  if coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ) is distinct from 'service_role' then
    raise exception 'service_role only' using errcode='42501';
  end if;
  if (p_from is null and p_days not in (1,7,14,30)) then raise exception 'invalid period' using errcode='22023'; end if;
  v_start := coalesce(p_from, v_today - p_days + 1);
  if v_today > (now() at time zone 'America/Argentina/Buenos_Aires')::date or v_start > v_today or v_start < v_today-29 then raise exception 'date range invalid' using errcode='22023'; end if;
  p_days := (v_today-v_start+1);
  with
 users as materialized (
  select a.id,a.created_at,(a.created_at at time zone 'America/Argentina/Buenos_Aires')::date registered
  from auth.users a left join public.profiles p on p.id=a.id
  where coalesce(p.role,'student')<>'admin'
    and a.created_at<((v_today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
 ),
 events as materialized (
  select distinct e.user_id,(e.created_at at time zone 'America/Argentina/Buenos_Aires')::date d
  from public.analytics_events e join users u on u.id=e.user_id
  where e.created_at>=((v_today-92)::timestamp at time zone 'America/Argentina/Buenos_Aires')
    and e.created_at<((v_today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
 ),
 study as materialized (
  select s.user_id,s.d from public.admin_study_days_v1(
    ((v_today-92)::timestamp at time zone 'America/Argentina/Buenos_Aires'),
    ((v_today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')) s
 ),
 event_rollup as materialized (
  select user_id,max(d) last_day,
   bool_or(d>=v_start) period_active,bool_or(d=v_today) dau,
   bool_or(d>=v_today-6) wau,bool_or(d>=v_today-29) mau,
   bool_or(d<v_start-7) prior_activity,
   bool_or(d>=v_start-7 and d<v_start) gap_activity
  from events group by user_id
 ),
 study_rollup as materialized (
  select user_id,min(d) first_day,max(d) last_day,
   bool_or(d>=v_start) period_studied,
   count(*) filter(where d>=v_today-6)::integer week_days
  from study group by user_id
 ),
 cohort_study as materialized (
  select s.user_id,
   bool_or(s.d=u.registered+1) d1,
   bool_or(s.d=u.registered+7) d7,
   bool_or(s.d=u.registered+30) d30
  from study s join users u on u.id=s.user_id group by s.user_id
 ),
 all_users as materialized (
  select u.*,e.last_day last_active_day,e.period_active,e.dau,e.wau,e.mau,
   e.prior_activity,e.gap_activity,
   s.first_day first_study_day,s.last_day last_study_day,s.period_studied,s.week_days,
   coalesce(c.d1,false) d1,coalesce(c.d7,false) d7,coalesce(c.d30,false) d30
  from users u left join event_rollup e on e.user_id=u.id
   left join study_rollup s on s.user_id=u.id
   left join cohort_study c on c.user_id=u.id
 ),
 dates as (select (v_today-n)::date d from generate_series(0,59) n),
 register_day as (select registered d,count(*)::bigint n from users group by 1),
 event_day as (select d,count(*)::bigint n from events group by 1),
 study_day as (select d,count(*)::bigint n from study group by 1),
 daily as (
  select d.d,coalesce(r.n,0) new_users,coalesce(e.n,0) active_users,coalesce(s.n,0) studied_users
  from dates d left join register_day r using(d)
   left join event_day e using(d) left join study_day s using(d)
 ),
 totals as (
  select count(*)::bigint registered,
   count(*) filter(where registered>=v_start)::bigint new_users,
   count(*) filter(where period_active)::bigint active_users,
   count(*) filter(where period_studied)::bigint studied_users,
   count(*) filter(where dau)::bigint dau,
   count(*) filter(where wau)::bigint wau,
   count(*) filter(where mau)::bigint mau
  from all_users
 ),
 period_comparison as (
  select count(*) filter(where registered>=v_start-p_days and registered<v_start)::bigint prev_new
  from users
 ),
 plans as (
  select
   count(*) filter(where exists(
    select 1 from public.user_subscriptions s where s.user_id=u.id and s.status='active'
     and s.created_at<now() and (s.expires_at is null or s.expires_at>now())
   ))::bigint premium_users,
   count(*) filter(where not exists(
    select 1 from public.user_subscriptions s where s.user_id=u.id and s.status='active'
     and s.created_at<now() and (s.expires_at is null or s.expires_at>now())
   ))::bigint free_users
  from users u
 ),
 retention_counts as (
  select n.n,
   count(*) filter(where u.registered<=v_today-n.n and u.registered>=v_start-n.n)::bigint eligible,
   count(*) filter(where u.registered<=v_today-n.n and u.registered>=v_start-n.n
    and case n.n when 1 then u.d1 when 7 then u.d7 else u.d30 end)::bigint returned
  from (values(1),(7),(30)) n(n) cross join all_users u
  where u.registered>=v_start-30 group by n.n
 ),
 weekly as (
  select date_trunc('week',registered::timestamp)::date week,count(*)::bigint users,
   count(*) filter(where registered+1<=v_today)::bigint d1_eligible,
   count(*) filter(where registered+1<=v_today and d1)::bigint d1_returned,
   count(*) filter(where registered+7<=v_today)::bigint d7_eligible,
   count(*) filter(where registered+7<=v_today and d7)::bigint d7_returned,
   count(*) filter(where registered+30<=v_today)::bigint d30_eligible,
   count(*) filter(where registered+30<=v_today and d30)::bigint d30_returned
  from all_users where registered>=v_today-62 group by 1
 ),
 frequency as (
  select count(*) filter(where week_days=1)::bigint once,
   count(*) filter(where week_days between 2 and 3)::bigint two_three,
   count(*) filter(where week_days>=4)::bigint four_plus,
   coalesce(sum(week_days)::numeric/nullif(count(*) filter(where week_days>0),0),0)::numeric avg_study_days
  from all_users
 ),
 abandonment as (
  select
   count(*) filter(where registered>=v_start and first_study_day is null)::bigint new_no_study,
   count(*) filter(where first_study_day is not null and first_study_day=last_study_day
     and last_study_day<v_today-6)::bigint once_then_left,
   count(*) filter(where registered<=v_today-7 and
     (last_active_day<v_today-6 or last_active_day is null))::bigint inactive_7,
   count(*) filter(where registered<=v_today-14 and
     (last_active_day<v_today-13 or last_active_day is null))::bigint inactive_14,
   count(*) filter(where registered<=v_today-30 and
     (last_active_day<v_today-29 or last_active_day is null))::bigint inactive_30,
   count(*) filter(where last_active_day>=v_start and prior_activity
     and not coalesce(gap_activity,false))::bigint reactivated
  from all_users
 ),
 segment_by_plan as (
  select case when exists(select 1 from public.user_subscriptions s where s.user_id=u.id
   and s.status='active' and (s.expires_at is null or s.expires_at>now()))
   then 'Premium' else 'Free' end name,
   count(*)::bigint users,
   count(*) filter(where u.registered>=v_start)::bigint nuevos,
   count(*) filter(where u.period_active)::bigint activos,
   count(*) filter(where u.period_studied)::bigint estudiaron
  from all_users u group by 1
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
$function$;
CREATE OR REPLACE FUNCTION public.admin_users_segments_v2(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_start timestamptz; v_result jsonb;
begin
 if coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ) is distinct from 'service_role'
  then raise exception 'service_role only' using errcode='42501'; end if;
 if p_days not between 1 and 30 then raise exception 'invalid range' using errcode='22023'; end if;
 v_start := now()-(p_days||' days')::interval;
 with students as(
   select a.id,a.created_at,
    coalesce(u.nombre,'Sin universidad') university,
    coalesce(nullif(p.pais,''),'Sin país') country,
    case when exists(select 1 from public.user_subscriptions s where s.user_id=a.id
       and s.status='active' and (s.expires_at is null or s.expires_at>now())) then 'Premium' else 'Free' end plan,
    case when exists(select 1 from public.student_materials m where m.user_id=a.id) then 'Con materiales' else 'Sin materiales' end materials
   from auth.users a left join public.profiles p on p.id=a.id
   left join public.universidades u on u.id::text=p.universidad_id
   where coalesce(p.role,'student')<>'admin'
 ), active as (
   select distinct e.user_id from public.analytics_events e where e.created_at>=v_start
 ), studied as ( select distinct x.user_id from public.admin_study_days_v1(v_start,now()) x ),
 vals as (
   select v.dimension,v.name,
      count(*)::bigint users,count(*) filter(where st.created_at>=v_start)::bigint nuevos,
      count(*) filter(where ac.user_id is not null)::bigint activos,
      count(*) filter(where se.user_id is not null)::bigint estudiaron
   from students st
   left join active ac on ac.user_id=st.id
   left join studied se on se.user_id=st.id
   cross join lateral (values ('university',st.university),('country',st.country),
       ('plan',st.plan),('materials',st.materials)) v(dimension,name)
   group by v.dimension,v.name
 )
 select coalesce(jsonb_agg(to_jsonb(x) order by x.dimension,x.users desc,x.name),'[]'::jsonb)
 into v_result from vals x;
 return v_result;
end
$function$;
CREATE OR REPLACE FUNCTION public.admin_users_list_v3(p_page integer DEFAULT 1, p_search text DEFAULT ''::text, p_plan text DEFAULT 'all'::text, p_material text DEFAULT 'all'::text, p_country text DEFAULT 'all'::text, p_university text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_total bigint; v_rows jsonb;
begin
 if coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ) is distinct from 'service_role' then
   raise exception 'service_role only' using errcode='42501';
 end if;
 if p_page is null or p_page<1 or p_page>100000 or length(coalesce(p_search,''))>120
    or p_plan not in('all','free','premium') or p_material not in('all','yes','no')
    or length(coalesce(p_country,''))>100 or length(coalesce(p_university,''))>100
 then raise exception 'invalid filters' using errcode='22023'; end if;
 with scoped as materialized (
 select a.id,a.email,coalesce(nullif(p.nombre,''),split_part(coalesce(a.email,''),'@',1)) name,
  a.created_at,a.last_sign_in_at,coalesce(u.nombre,'Sin universidad') university,
  coalesce(p.pais,'Sin país') country,p.carrera_id,
  case when exists(select 1 from public.user_subscriptions s where s.user_id=a.id
    and s.status='active' and (s.expires_at is null or s.expires_at>now())) then 'Premium' else 'Free' end plan
 from auth.users a left join public.profiles p on p.id=a.id
 left join public.universidades u on u.id::text=p.universidad_id
 where coalesce(p.role,'student')<>'admin'
), filtered as materialized (
 select s.* from scoped s where
 (coalesce(p_search,'')='' or s.email ilike '%'||p_search||'%' or s.name ilike '%'||p_search||'%')
 and (p_plan='all' or lower(s.plan)=p_plan)
 and (p_country='all' or s.country=p_country)
 and (p_university='all' or s.university=p_university)
 and (p_material='all'
   or (p_material='yes' and exists(select 1 from public.student_materials m where m.user_id=s.id))
   or (p_material='no' and not exists(select 1 from public.student_materials m where m.user_id=s.id)))
), page as (
 select * from filtered order by created_at desc,id limit 20 offset (p_page-1)*20
), enriched as (
 select p.id,p.email,p.name,p.created_at,p.last_sign_in_at,p.university,p.country,p.plan,
  coalesce(c.nombre,'Sin carrera') career,
  (select count(*) from public.student_materials m where m.user_id=p.id)::bigint materials,
  (select max(e.created_at) from public.analytics_events e where e.user_id=p.id) last_activity,
  (exists(select 1 from public.student_material_answer_events x where x.user_id=p.id)
    or exists(select 1 from public.practice_mode_sessions x where x.user_id=p.id)
    or exists(select 1 from public.analytics_events e where e.user_id=p.id
      and e.event_name=any(public.admin_study_event_names_v1()))) studied
 from page p left join public.carreras c on c.id::text=p.carrera_id
)
select (select count(*) from filtered),
  (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from enriched x)
into v_total,v_rows;
 return jsonb_build_object('total',v_total,'page',p_page,'page_size',20,'rows',v_rows);
end
$function$;
revoke all on function public.admin_study_event_names_v1() from public,anon,authenticated;
grant execute on function public.admin_study_event_names_v1() to service_role;
revoke all on function public.admin_study_days_v1(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_study_days_v1(timestamptz,timestamptz) to service_role;
revoke all on function public.admin_home_snapshot_v2(date) from public,anon,authenticated;
grant execute on function public.admin_home_snapshot_v2(date) to service_role;
revoke all on function public.admin_users_retention_v4(integer,date,date) from public,anon,authenticated;
grant execute on function public.admin_users_retention_v4(integer,date,date) to service_role;
revoke all on function public.admin_users_segments_v2(integer) from public,anon,authenticated;
grant execute on function public.admin_users_segments_v2(integer) to service_role;
revoke all on function public.admin_users_list_v3(integer,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.admin_users_list_v3(integer,text,text,text,text,text) to service_role;
