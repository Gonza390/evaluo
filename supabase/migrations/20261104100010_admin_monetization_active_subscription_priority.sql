CREATE OR REPLACE FUNCTION public.admin_monetization_dashboard_v1(p_days integer DEFAULT 7, p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date, p_university text DEFAULT 'all'::text, p_career text DEFAULT 'all'::text, p_country text DEFAULT 'all'::text, p_provider text DEFAULT 'all'::text, p_state text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_end_day date; v_start_day date; v_days integer; v_start timestamptz;
  v_end timestamptz; v_previous timestamptz; v_result jsonb;
begin
  if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
    (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
  then raise exception 'service_role only' using errcode='42501'; end if;
  if p_days not in (1,7,14,30)
    or (p_from is null)<>(p_to is null)
    or p_state not in ('all','free','active','pending','canceled','expired')
    or length(coalesce(p_provider,''))>60 or length(coalesce(p_country,''))>100
    or length(coalesce(p_university,''))>80 or length(coalesce(p_career,''))>80
  then raise exception 'Invalid finance filters' using errcode='22023'; end if;
  v_end_day:=coalesce(p_to,v_today);
  v_start_day:=coalesce(p_from,v_end_day-p_days+1);
  if v_end_day>v_today or v_start_day>v_end_day or v_start_day<v_today-90
    or v_end_day-v_start_day>29 then
    raise exception 'Invalid finance date range' using errcode='22023';
  end if;
  v_days:=v_end_day-v_start_day+1;
  v_start:=(v_start_day::timestamp at time zone 'America/Argentina/Buenos_Aires');
  v_end:=((v_end_day+1)::timestamp at time zone 'America/Argentina/Buenos_Aires');
  v_previous:=((v_start_day-v_days)::timestamp at time zone 'America/Argentina/Buenos_Aires');

  with
  users_all as materialized (
    select a.id,a.created_at,
      coalesce(nullif(p.universidad_id,''),'unknown') university_id,
      coalesce(nullif(p.carrera_id,''),'unknown') career_id,
      coalesce(nullif(p.pais,''),'unknown') country,
      coalesce(u.nombre,'Sin universidad') university,
      coalesce(c.nombre,'Sin carrera') career
    from auth.users a left join public.profiles p on p.id=a.id
    left join public.universidades u on u.id::text=p.universidad_id
    left join public.carreras c on c.id::text=p.carrera_id
    where coalesce(p.role,'student')<>'admin' and a.created_at<v_end
      and (p_university='all' or p.universidad_id=p_university)
      and (p_career='all' or p.carrera_id=p_career)
      and (p_country='all' or p.pais=p_country)
  ),
  subscription_latest as materialized (
    select u.id user_id,s.status,s.payment_provider,s.started_at,s.created_at,
      s.expires_at,s.canceled_at,s.current_period_end,s.plan_id,
      case when s.status='active' and (s.expires_at is null or s.expires_at>now())
        then 'active'
        when s.status='canceled' then 'canceled'
        when s.status in ('expired','inactive') or (s.status='active' and s.expires_at<=now())
        then 'expired'
        when s.status='pending' then 'pending'
        else 'free' end state
    from users_all u left join lateral (
      select s.* from public.user_subscriptions s where s.user_id=u.id
      order by (s.status='active' and (s.expires_at is null or s.expires_at>now())) desc, coalesce(s.provider_updated_at,s.updated_at,s.created_at) desc,s.created_at desc,s.id desc
      limit 1
    ) s on true
  ),
  users as materialized (
    select u.*,sl.status subscription_status,sl.payment_provider,sl.state premium_state,
      sl.started_at subscription_start,sl.canceled_at,sl.expires_at,sl.current_period_end,sl.plan_id
    from users_all u join subscription_latest sl on sl.user_id=u.id
    where p_state='all' or sl.state=p_state
  ),
  paid as materialized (
    select t.id,t.user_id,t.provider,t.currency,t.paid_at,t.subscription_id,
      case when t.currency='ARS' then t.amount_ars else null::numeric end amount_ars
    from public.payment_transactions t join users u on u.id=t.user_id
    where t.status in ('approved','paid') and t.paid_at is not null
      and t.paid_at>=v_previous and t.paid_at<v_end
      and (p_provider='all' or t.provider=p_provider)
  ),
  checkouts as materialized (
    select c.id,c.user_id,c.provider,c.status,c.created_at,c.updated_at,c.currency
    from public.payment_checkout_attempts c join users u on u.id=c.user_id
    where c.created_at>=v_previous and c.created_at<v_end
      and (p_provider='all' or c.provider=p_provider)
  ),
  user_events as materialized (
    select e.user_id,
      bool_or(e.event_name='premium_gate_viewed' or e.event_name='premium_preview_viewed') premium_seen,
      bool_or(e.event_name='pricing_view') pricing_seen,
      bool_or(e.event_name in('premium_checkout_clicked','premium_checkout_created')) checkout_clicked,
      bool_or(e.event_name='premium_cta_clicked') premium_cta,
      bool_or(e.event_name not in('premium_gate_viewed','premium_preview_viewed','pricing_view',
        'premium_checkout_clicked','premium_checkout_created','premium_cta_clicked')) product_active
    from public.analytics_events e join users u on u.id=e.user_id
    where e.created_at>=v_start and e.created_at<v_end
      and e.event_name in ('premium_gate_viewed','premium_preview_viewed','pricing_view',
        'premium_checkout_clicked','premium_checkout_created','premium_cta_clicked',
        'student_material_study_opened','summary_reading_started',
        'student_material_exam_started','summary_topic_check_completed',
        'student_material_flashcards_started','simulator_started',
        'student_material_practice_entry_opened')
    group by e.user_id
  ),
  per_user as materialized (
    select u.id,u.university,u.career,u.country,u.premium_state,u.payment_provider,
      u.subscription_start,u.canceled_at,u.expires_at,u.current_period_end,u.plan_id,
      coalesce(e.premium_seen,false) premium_seen,coalesce(e.pricing_seen,false) pricing_seen,
      coalesce(e.product_active,false) product_active,
      exists(select 1 from checkouts c where c.user_id=u.id and c.created_at>=v_start) checkout_started,
      exists(select 1 from paid t where t.user_id=u.id and t.paid_at>=v_start) checkout_paid,
      (select coalesce(sum(t.amount_ars),0) from paid t
        where t.user_id=u.id and t.paid_at>=v_start and t.currency='ARS') revenue_ars
    from users u left join user_events e on e.user_id=u.id
  ),
  paid_by_day as materialized (
    select (p.paid_at at time zone 'America/Argentina/Buenos_Aires')::date d,
      p.provider,p.currency,coalesce(sum(p.amount_ars),0)::numeric amount,
      count(*)::bigint payments
    from paid p group by 1,2,3
  ),
  subs_by_day as materialized (
    select (u.subscription_start at time zone 'America/Argentina/Buenos_Aires')::date d,
      count(distinct u.id)::bigint new_subs
    from users u where u.premium_state='active' and u.subscription_start>=v_previous
      and u.subscription_start<v_end
      and (p_provider='all' or u.payment_provider=p_provider)
    group by 1
  ),
  day_series as (
    select (v_start_day+n)::date d from generate_series(0,v_days-1) n
  ),
  daily as (
    select day.d,
     (select coalesce(sum(p.amount),0) from paid_by_day p where p.d=day.d and p.currency='ARS')::numeric revenue_ars,
     (select coalesce(sum(p.payments),0) from paid_by_day p where p.d=day.d)::bigint approved_payments,
     coalesce(s.new_subs,0)::bigint new_subs
    from day_series day left join subs_by_day s using(d)
  ),
  financial as (
    select
      (select count(*) from users)::bigint registered,
      (select count(*) from per_user where premium_state='active'
        and (p_provider='all' or payment_provider=p_provider))::bigint active_premium,
      (select count(*) from per_user where premium_state='free')::bigint free_users,
      (select count(*) from per_user where premium_state='active'
        and subscription_start>=v_start and subscription_start<v_end
        and (p_provider='all' or payment_provider=p_provider))::bigint new_subs,
      (select coalesce(sum(amount_ars),0) from paid where currency='ARS'
        and paid_at>=v_start)::numeric revenue_ars,
      (select coalesce(sum(amount_ars),0) from paid where currency='ARS'
        and paid_at>=v_previous and paid_at<v_start)::numeric previous_ars,
      (select count(distinct user_id) from paid where paid_at>=v_start)::bigint paying_users,
      (select count(*) from paid where paid_at>=v_start)::bigint approved_payments,
      (select count(*) from per_user where premium_seen)::bigint premium_seen,
      (select count(*) from per_user where pricing_seen)::bigint pricing_seen,
      (select count(*) from per_user where product_active and premium_state='free')::bigint free_active,
      (select count(*) from per_user where checkout_started)::bigint checkout_users,
      (select count(*) from per_user where checkout_paid)::bigint paid_users
  ),
  checkout_summary as (
    select count(*) filter(where created_at>=v_start)::bigint attempts,
      count(*) filter(where created_at>=v_start and status='approved')::bigint approved,
      count(*) filter(where created_at>=v_start and status in('failed','rejected'))::bigint failed,
      count(*) filter(where created_at>=v_start and status='pending')::bigint pending,
      count(*) filter(where created_at>=v_previous and created_at<v_start)::bigint previous_attempts,
      count(*) filter(where created_at>=v_previous and created_at<v_start and status='approved')::bigint previous_approved
    from checkouts
  ),
  subscription_status as (
    select
      count(*) filter(where premium_state='active' and (p_provider='all' or payment_provider=p_provider))::bigint active,
      count(*) filter(where premium_state='pending' and (p_provider='all' or payment_provider=p_provider))::bigint pending,
      count(*) filter(where premium_state='canceled' and (p_provider='all' or payment_provider=p_provider))::bigint canceled,
      count(*) filter(where premium_state='expired' and (p_provider='all' or payment_provider=p_provider))::bigint expired,
      count(*) filter(where canceled_at>=v_start and canceled_at<v_end
        and (p_provider='all' or payment_provider=p_provider))::bigint cancellations_in_period,
      count(*) filter(where expires_at>=v_start and expires_at<v_end and premium_state='expired'
        and (p_provider='all' or payment_provider=p_provider))::bigint expirations_in_period
    from users
  ),
  checkout_providers as (
    select c.provider,
      count(*)::bigint attempts,
      count(*) filter(where c.status='approved')::bigint approved,
      count(*) filter(where c.status in('failed','rejected'))::bigint rejected,
      count(*) filter(where c.status='pending')::bigint pending
    from checkouts c where c.created_at>=v_start group by c.provider
  ),
  transaction_providers as (
    select t.provider,count(*)::bigint payments,coalesce(sum(t.amount_ars) filter(where t.currency='ARS'),0) revenue_ars
    from paid t where t.paid_at>=v_start group by t.provider
  ),
  provider_stats as (
    select coalesce(c.provider,t.provider) provider,
      coalesce(c.attempts,0)::bigint attempts,coalesce(c.approved,0)::bigint approved,
      coalesce(c.rejected,0)::bigint rejected,coalesce(c.pending,0)::bigint pending,
      coalesce(t.payments,0)::bigint paid_payments,coalesce(t.revenue_ars,0)::numeric revenue_ars
    from checkout_providers c full join transaction_providers t using(provider)
  ),
  mismatch as (
    select
      (select count(distinct t.user_id) from paid t where t.paid_at>=v_start
        and not exists(select 1 from per_user u where u.id=t.user_id and u.premium_state='active'))::bigint
        paid_without_active,
      (select count(*) from checkouts c where c.created_at>=v_start and c.status='approved'
        and not exists(select 1 from paid t where t.user_id=c.user_id
          and t.provider=c.provider and t.paid_at>=c.created_at))::bigint approved_checkout_without_paid
  ),
  newest_source as materialized (
    select u.id,
      coalesce((
        select case
          when lower(coalesce(e.metadata->>'session_source',e.metadata->>'source','')) like '%google%'
            then 'Google'
          when lower(coalesce(e.metadata->>'session_source',e.metadata->>'source','')) like '%whatsapp%'
            then 'WhatsApp'
          when lower(coalesce(e.metadata->>'session_source',e.metadata->>'source','')) ~ 'instagram|tiktok'
            then 'Instagram / TikTok'
          when lower(coalesce(e.metadata->>'session_source',e.metadata->>'source','')) like '%facebook%'
            then 'Facebook'
          when lower(coalesce(e.metadata->>'session_source',e.metadata->>'source','')) like '%reddit%'
            then 'Reddit'
          when lower(coalesce(e.metadata->>'session_source',e.metadata->>'source','')) ~ 'chatgpt|perplexity'
            then 'Referido IA'
          else 'Sin fuente identificada' end
        from public.analytics_events e
        where e.user_id=u.id and e.event_name='acquisition_touch'
        order by e.created_at asc limit 1
      ),'Sin fuente identificada') source
    from users u
  ),
  user_revenue as materialized (
    select user_id,coalesce(sum(amount_ars) filter(where currency='ARS' and paid_at>=v_start),0)::numeric revenue_ars
    from paid group by 1
  ),
  segment_values as (
    select 'university' dimension,u.university label,u.id,u.premium_state,u.revenue_ars from per_user u
    union all select 'career',u.career,u.id,u.premium_state,u.revenue_ars from per_user u
    union all select 'country',u.country,u.id,u.premium_state,u.revenue_ars from per_user u
    union all select 'source',coalesce(s.source,'Sin fuente identificada'),u.id,u.premium_state,u.revenue_ars
      from per_user u left join newest_source s on s.id=u.id
    union all select 'provider',coalesce(u.payment_provider,'Sin proveedor registrado'),u.id,u.premium_state,u.revenue_ars from per_user u
  ),
  segment_aggregated as (
    select dimension,label,count(*)::bigint users,
      count(*) filter(where premium_state='active')::bigint premium,
      coalesce(sum(revenue_ars),0)::numeric revenue_ars
    from segment_values group by 1,2
  ),
  segment_ranked as (
    select *,row_number() over(partition by dimension order by users desc,label) rank
    from segment_aggregated
  ),
  payment_errors as (
    select e.provider,count(*) filter(where e.status='failed')::bigint failed_webhook_events
    from public.payment_webhook_events e where e.received_at>=v_start and e.received_at<v_end
      and (p_provider='all' or e.provider=p_provider)
    group by 1
  ),
  provider_with_errors as (
    select p.*,coalesce(e.failed_webhook_events,0)::bigint technical_events
    from provider_stats p left join payment_errors e using(provider)
  )
  select jsonb_build_object(
    'from',v_start_day,'through',v_end_day,'days',v_days,
    'financial',(select to_jsonb(s) from financial s),
    'checkout',(select to_jsonb(s) from checkout_summary s),
    'subscriptions',(select to_jsonb(s) from subscription_status s),
    'mismatches',(select to_jsonb(s) from mismatch s),
    'daily',(select coalesce(jsonb_agg(to_jsonb(s) order by s.d),'[]'::jsonb) from daily s),
    'providers',(select coalesce(jsonb_agg(to_jsonb(p) order by p.attempts desc),'[]'::jsonb) from provider_with_errors p),
    'segments',(select coalesce(jsonb_agg(to_jsonb(s) order by s.dimension,s.rank),'[]'::jsonb)
      from segment_ranked s where s.rank<=10),
    'options',jsonb_build_object(
      'countries',(select coalesce(jsonb_agg(x.label order by x.label),'[]'::jsonb) from
         (select distinct country label from users_all where country<>'unknown') x),
      'universities',(select coalesce(jsonb_agg(jsonb_build_object('value',u.university_id,'label',u.university) order by u.university),'[]'::jsonb)
         from (select distinct university_id,university from users_all where university_id<>'unknown') u),
      'careers',(select coalesce(jsonb_agg(jsonb_build_object('value',c.career_id,'label',c.career) order by c.career),'[]'::jsonb)
         from (select distinct career_id,career from users_all where career_id<>'unknown') c),
      'providers',(select coalesce(jsonb_agg(p.provider order by p.provider),'[]'::jsonb)
         from (select distinct provider from public.payment_checkout_attempts union
               select distinct provider from public.payment_transactions) p)
    )
  ) into v_result;
  return v_result;
end
$function$
;
revoke all on function public.admin_monetization_dashboard_v1(integer,date,date,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.admin_monetization_dashboard_v1(integer,date,date,text,text,text,text,text) to service_role;
