create table if not exists public.seo_funnel_daily (
  snapshot_date date not null,
  source text not null default 'google',
  sessions integer not null default 0,
  anonymous_sessions integer not null default 0,
  authenticated_sessions integer not null default 0,
  signup_started_sessions integer not null default 0,
  signup_completed_sessions integer not null default 0,
  useful_action_sessions integer not null default 0,
  simulator_started_sessions integer not null default 0,
  meaningful_study_sessions integer not null default 0,
  pdf_uploaded_sessions integer not null default 0,
  returned_sessions integer not null default 0,
  generated_at timestamptz not null default now(),
  primary key (snapshot_date, source),
  constraint seo_funnel_daily_source_check check (source in ('google'))
);

create index if not exists seo_funnel_daily_source_date_idx
  on public.seo_funnel_daily (source, snapshot_date desc);

alter table public.seo_funnel_daily enable row level security;

drop policy if exists seo_funnel_daily_admin_read on public.seo_funnel_daily;
create policy seo_funnel_daily_admin_read
  on public.seo_funnel_daily
  for select
  using (public.current_user_is_admin());

create or replace function public.refresh_seo_funnel_daily(
  p_days_back integer default 30
)
returns table (
  refreshed_days integer,
  first_day date,
  last_day date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('America/Argentina/Buenos_Aires', now()))::date;
  v_days integer := greatest(1, least(coalesce(p_days_back, 30), 180));
  v_start date := greatest(date '2026-09-20', v_today - v_days);
  v_end date := v_today - 1;
  v_count integer := 0;
begin
  if v_end < v_start then
    return query select 0, v_start, v_end;
    return;
  end if;

  with acquisition_ranked as (
    select
      e.id,
      e.session_key,
      e.user_id,
      e.path,
      e.metadata,
      e.created_at,
      (timezone('America/Argentina/Buenos_Aires', e.created_at))::date as acquisition_date,
      row_number() over (
        partition by e.session_key
        order by e.created_at asc, e.id asc
      ) as session_touch_rank
    from public.analytics_events e
    where e.event_name = 'acquisition_touch'
  ),
  admin_sessions as (
    select distinct e.session_key
    from public.analytics_events e
    join public.profiles p on p.id = e.user_id
    where e.session_key is not null
      and lower(coalesce(p.role, '')) = 'admin'
  ),
  cohorts as (
    select a.*
    from acquisition_ranked a
    where a.session_touch_rank = 1
      and a.acquisition_date between v_start and v_end
      and not exists (
        select 1 from admin_sessions s where s.session_key = a.session_key
      )
      and (
        lower(coalesce(a.metadata->>'source', '')) = 'google'
        or lower(coalesce(a.metadata->'attribution'->>'source', '')) = 'google'
        or lower(coalesce(a.metadata->'attribution'->>'latest_source', '')) = 'google'
        or lower(coalesce(a.metadata->'attribution'->>'utm_source', '')) = 'google'
        or lower(coalesce(a.metadata->'attribution'->>'latest_utm_source', '')) = 'google'
        or lower(coalesce(a.metadata->>'referrer', '')) ~ '^https?://(www\.)?google\.[^/]+'
        or lower(coalesce(a.metadata->'attribution'->>'referrer', '')) ~ '^https?://(www\.)?google\.[^/]+'
        or lower(coalesce(a.metadata->'attribution'->>'latest_referrer', '')) ~ '^https?://(www\.)?google\.[^/]+'
      )
  ),
  session_owner as (
    select
      c.session_key,
      (array_agg(distinct e.user_id))[1] as user_id
    from cohorts c
    join public.analytics_events e
      on e.session_key = c.session_key
     and e.created_at >= c.created_at
    where e.user_id is not null
    group by c.session_key
    having count(distinct e.user_id) = 1
  ),
  session_rollup as (
    select
      c.acquisition_date,
      c.session_key,
      (c.user_id is null) as entered_anonymous,
      bool_or(e.user_id is not null) as authenticated,
      bool_or(e.event_name = 'signup_started') as signup_started,
      bool_or(e.event_name = 'signup_completed') as signup_completed,
      bool_or(e.event_name in (
        'materia_resumen_opened',
        'materia_resource_opened',
        'materia_simulator_cta_clicked',
        'student_material_study_opened',
        'study_content_opened',
        'meaningful_study_completed',
        'simulator_started',
        'simulator_progress_checkpoint',
        'simulator_finished',
        'pdf_file_selected',
        'pdf_upload_completed'
      )) as useful_action,
      bool_or(e.event_name = 'simulator_started') as simulator_started,
      bool_or(e.event_name = 'meaningful_study_completed') as meaningful_study,
      bool_or(e.event_name = 'pdf_upload_completed') as pdf_uploaded,
      case
        when so.user_id is null then false
        else exists (
          select 1
          from public.analytics_events r
          where r.user_id = so.user_id
            and r.event_name = 'page_view'
            and r.created_at > c.created_at
            and (timezone('America/Argentina/Buenos_Aires', r.created_at))::date > c.acquisition_date
        )
      end as returned
    from cohorts c
    left join public.analytics_events e
      on e.session_key = c.session_key
     and e.created_at >= c.created_at
    left join session_owner so on so.session_key = c.session_key
    group by c.acquisition_date, c.session_key, c.user_id, c.created_at, so.user_id
  ),
  daily as (
    select
      acquisition_date as snapshot_date,
      count(*)::integer as sessions,
      count(*) filter (where entered_anonymous)::integer as anonymous_sessions,
      count(*) filter (where authenticated)::integer as authenticated_sessions,
      count(*) filter (where signup_started)::integer as signup_started_sessions,
      count(*) filter (where signup_completed)::integer as signup_completed_sessions,
      count(*) filter (where useful_action)::integer as useful_action_sessions,
      count(*) filter (where simulator_started)::integer as simulator_started_sessions,
      count(*) filter (where meaningful_study)::integer as meaningful_study_sessions,
      count(*) filter (where pdf_uploaded)::integer as pdf_uploaded_sessions,
      count(*) filter (where returned)::integer as returned_sessions
    from session_rollup
    group by acquisition_date
  ),
  calendar as (
    select generate_series(v_start, v_end, interval '1 day')::date as snapshot_date
  )
  insert into public.seo_funnel_daily (
    snapshot_date,
    source,
    sessions,
    anonymous_sessions,
    authenticated_sessions,
    signup_started_sessions,
    signup_completed_sessions,
    useful_action_sessions,
    simulator_started_sessions,
    meaningful_study_sessions,
    pdf_uploaded_sessions,
    returned_sessions,
    generated_at
  )
  select
    c.snapshot_date,
    'google',
    coalesce(d.sessions, 0),
    coalesce(d.anonymous_sessions, 0),
    coalesce(d.authenticated_sessions, 0),
    coalesce(d.signup_started_sessions, 0),
    coalesce(d.signup_completed_sessions, 0),
    coalesce(d.useful_action_sessions, 0),
    coalesce(d.simulator_started_sessions, 0),
    coalesce(d.meaningful_study_sessions, 0),
    coalesce(d.pdf_uploaded_sessions, 0),
    coalesce(d.returned_sessions, 0),
    now()
  from calendar c
  left join daily d using (snapshot_date)
  on conflict (snapshot_date, source) do update
  set
    sessions = excluded.sessions,
    anonymous_sessions = excluded.anonymous_sessions,
    authenticated_sessions = excluded.authenticated_sessions,
    signup_started_sessions = excluded.signup_started_sessions,
    signup_completed_sessions = excluded.signup_completed_sessions,
    useful_action_sessions = excluded.useful_action_sessions,
    simulator_started_sessions = excluded.simulator_started_sessions,
    meaningful_study_sessions = excluded.meaningful_study_sessions,
    pdf_uploaded_sessions = excluded.pdf_uploaded_sessions,
    returned_sessions = excluded.returned_sessions,
    generated_at = excluded.generated_at;

  get diagnostics v_count = row_count;
  return query select v_count, v_start, v_end;
end;
$$;

create or replace function public.admin_seo_funnel_history(
  p_days integer default 30
)
returns table (
  snapshot_date date,
  source text,
  sessions integer,
  anonymous_sessions integer,
  authenticated_sessions integer,
  signup_started_sessions integer,
  signup_completed_sessions integer,
  useful_action_sessions integer,
  simulator_started_sessions integer,
  meaningful_study_sessions integer,
  pdf_uploaded_sessions integer,
  returned_sessions integer,
  generated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.snapshot_date,
    d.source,
    d.sessions,
    d.anonymous_sessions,
    d.authenticated_sessions,
    d.signup_started_sessions,
    d.signup_completed_sessions,
    d.useful_action_sessions,
    d.simulator_started_sessions,
    d.meaningful_study_sessions,
    d.pdf_uploaded_sessions,
    d.returned_sessions,
    d.generated_at
  from public.seo_funnel_daily d
  where d.source = 'google'
    and d.snapshot_date >= greatest(
      date '2026-09-20',
      (timezone('America/Argentina/Buenos_Aires', now()))::date - greatest(1, least(coalesce(p_days, 30), 180))
    )
  order by d.snapshot_date asc;
$$;

revoke all on table public.seo_funnel_daily from public, anon, authenticated;
grant select on table public.seo_funnel_daily to service_role;

revoke all on function public.refresh_seo_funnel_daily(integer) from public, anon, authenticated;
grant execute on function public.refresh_seo_funnel_daily(integer) to service_role;

revoke all on function public.admin_seo_funnel_history(integer) from public, anon, authenticated;
grant execute on function public.admin_seo_funnel_history(integer) to service_role;
