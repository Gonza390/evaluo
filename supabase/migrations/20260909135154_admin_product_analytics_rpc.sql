create or replace function public.admin_product_user_journeys(
  p_period_days integer default 7,
  p_excluded_user_ids uuid[] default '{}'::uuid[]
)
returns table (
  user_id uuid,
  email text,
  registered_at timestamptz,
  source text,
  materia_id uuid,
  materia_name text,
  reached_materia boolean,
  content_available boolean,
  content_opened boolean,
  meaningful_study boolean,
  returned_48h boolean,
  active_days bigint,
  simulator_attempts bigint,
  pdf_selected bigint,
  pdf_uploads bigint,
  excluded_admin_sessions bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
with settings as (
  select
    now() as now_at,
    case when p_period_days in (1, 7, 30) then p_period_days else 7 end as period_days,
    coalesce(p_excluded_user_ids, '{}'::uuid[]) as excluded_ids
),
params as (
  select
    s.*,
    (
      date_trunc('day', timezone('America/Argentina/Buenos_Aires', s.now_at))
      - (s.period_days - 1) * interval '1 day'
    ) at time zone 'America/Argentina/Buenos_Aires' as start_at
  from settings s
),
new_users as (
  select u.id, u.email::text as email, u.created_at
  from auth.users u
  cross join params p
  where u.created_at >= p.start_at
    and u.email is not null
    and not (u.id = any(p.excluded_ids))
),
raw_events as (
  select e.user_id, e.session_key, e.event_name, e.path, e.metadata, e.created_at
  from public.analytics_events e
  cross join params p
  where e.created_at >= p.start_at - interval '7 days'
    and e.created_at <= p.now_at
),
admin_sessions as (
  select distinct e.session_key
  from raw_events e
  cross join params p
  where e.session_key is not null
    and e.user_id = any(p.excluded_ids)
),
clean_events as (
  select e.*
  from raw_events e
  cross join params p
  where (e.user_id is null or not (e.user_id = any(p.excluded_ids)))
    and (
      e.session_key is null
      or not exists (
        select 1 from admin_sessions a where a.session_key = e.session_key
      )
    )
),
session_owner as (
  select session_key, (array_agg(distinct user_id))[1] as user_id
  from clean_events
  where session_key is not null and user_id is not null
  group by session_key
  having count(distinct user_id) = 1
),
derived_events as (
  select coalesce(e.user_id, so.user_id) as derived_user_id, e.*
  from clean_events e
  left join session_owner so on so.session_key = e.session_key
),
user_events_base as (
  select
    nu.id as user_id,
    nu.created_at as registered_at,
    e.event_name,
    e.path,
    e.metadata,
    e.created_at,
    case
      when nullif(e.metadata->>'materia_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (e.metadata->>'materia_id')::uuid
      when substring(
        coalesce(e.path, '')
        from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}'
      ) is not null
        then substring(
          e.path
          from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}'
        )::uuid
      else null
    end as materia_id,
    nullif(e.metadata->'attribution'->>'utm_source', '') as attribution_source,
    nullif(e.metadata->>'referrer', '') as referrer
  from new_users nu
  join derived_events e
    on e.derived_user_id = nu.id
   and e.created_at >= nu.created_at - interval '1 day'
),
user_events as (
  select
    b.*,
    case
      when b.attribution_source is not null then
        case
          when lower(b.attribution_source) like '%whatsapp%' then 'WhatsApp'
          when lower(b.attribution_source) like '%instagram%' then 'Instagram'
          when lower(b.attribution_source) like '%facebook%' or lower(b.attribution_source) = 'fb' then 'Facebook'
          when lower(b.attribution_source) like '%linkedin%' then 'LinkedIn'
          when lower(b.attribution_source) like '%google%' then 'Google'
          when lower(b.attribution_source) like '%share%' then 'Compartido'
          when lower(b.attribution_source) like '%email%' or lower(b.attribution_source) like '%sender%' then 'Email'
          when length(b.attribution_source) > 28 then left(b.attribution_source, 25) || '…'
          else b.attribution_source
        end
      when b.event_name = 'acquisition_touch' and b.referrer is not null then
        case
          when lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%evaluo.com.ar%' then null
          when lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%whatsapp%' then 'WhatsApp'
          when lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%instagram%' then 'Instagram'
          when lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%facebook%'
            or lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) = 'fb' then 'Facebook'
          when lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%linkedin%' then 'LinkedIn'
          when lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%google%' then 'Google'
          when lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%share%' then 'Compartido'
          when lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%email%'
            or lower(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) like '%sender%' then 'Email'
          when length(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer)) > 28
            then left(coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer), 25) || '…'
          else regexp_replace(
            coalesce(substring(b.referrer from '(?i)^https?://([^/:?#]+)'), b.referrer),
            '^www\.',
            '',
            'i'
          )
        end
      else null
    end as source_candidate
  from user_events_base b
),
first_materia as (
  select distinct on (user_id) user_id, materia_id
  from user_events
  where materia_id is not null or path like '/explorar/materia/%'
  order by user_id, created_at asc
),
first_source as (
  select distinct on (user_id) user_id, source_candidate as source
  from user_events
  where source_candidate is not null
  order by user_id, created_at asc
),
activity_agg as (
  select
    nu.id as user_id,
    coalesce(
      bool_or(
        ue.created_at >= nu.created_at
        and (ue.materia_id is not null or ue.path like '/explorar/materia/%')
      ),
      false
    ) as reached_after_signup,
    coalesce(
      bool_or(ue.created_at >= nu.created_at and ue.event_name = 'content_available'),
      false
    ) as explicit_available,
    coalesce(
      bool_or(ue.created_at >= nu.created_at and ue.event_name = 'content_empty'),
      false
    ) as explicit_empty,
    coalesce(
      bool_or(
        ue.created_at >= nu.created_at
        and (
          ue.event_name in (
            'study_content_opened',
            'materia_resumen_opened',
            'materia_resource_opened',
            'student_material_study_opened'
          )
          or (
            ue.event_name = 'page_view'
            and (
              ue.path like '/materiales/%'
              or ue.path like '/recursos/%'
              or ue.path like '/resumenes/%'
              or ue.path like '/estudiar/%'
            )
          )
        )
      ),
      false
    ) as content_opened,
    coalesce(
      bool_or(
        ue.created_at >= nu.created_at
        and (
          ue.event_name = 'meaningful_study_completed'
          or (
            ue.event_name = 'session_ping'
            and (
              ue.path like '/materiales/%'
              or ue.path like '/recursos/%'
              or ue.path like '/resumenes/%'
              or ue.path like '/estudiar/%'
            )
            and jsonb_typeof(ue.metadata->'engagement_ms') = 'number'
            and (ue.metadata->>'engagement_ms')::numeric >= 90000
          )
        )
      ),
      false
    ) as meaningful_study,
    coalesce(
      bool_or(
        ue.created_at > nu.created_at
        and ue.created_at <= nu.created_at + interval '48 hours'
        and (ue.created_at at time zone 'America/Argentina/Buenos_Aires')::date
          <> (nu.created_at at time zone 'America/Argentina/Buenos_Aires')::date
      ),
      false
    ) as returned_48h,
    count(distinct (ue.created_at at time zone 'America/Argentina/Buenos_Aires')::date)
      filter (where ue.created_at >= nu.created_at) as active_days,
    count(*) filter (
      where ue.created_at >= nu.created_at and ue.event_name = 'pdf_file_selected'
    ) as pdf_selected_events,
    count(*) filter (
      where ue.created_at >= nu.created_at and ue.event_name = 'pdf_upload_completed'
    ) as pdf_upload_events
  from new_users nu
  left join user_events ue on ue.user_id = nu.id
  group by nu.id
),
simulator_counts as (
  select sa.user_id, count(*)::bigint as total
  from public.simulator_attempts sa
  join new_users nu on nu.id = sa.user_id
  cross join params p
  where sa.created_at >= p.start_at
  group by sa.user_id
),
material_counts as (
  select sm.user_id, count(*)::bigint as total
  from public.student_materials sm
  join new_users nu on nu.id = sm.user_id
  cross join params p
  where sm.created_at >= p.start_at
  group by sm.user_id
),
available_materias as (
  select distinct fm.materia_id
  from first_materia fm
  join public.resumenes r on r.materia_id = fm.materia_id
  where r.file_url is not null
  union
  select distinct fm.materia_id
  from first_materia fm
  join public.recursos r on r.materia_id = fm.materia_id::text
  where r.url_archivo is not null
  union
  select distinct fm.materia_id
  from first_materia fm
  join public.student_materials sm on sm.materia_id = fm.materia_id
  where sm.visibility = 'shared' and sm.processing_status = 'ready'
),
journeys as (
  select
    nu.id as user_id,
    nu.email,
    nu.created_at as registered_at,
    coalesce(fs.source, 'Directo') as source,
    fm.materia_id,
    m.nombre as materia_name,
    (aa.reached_after_signup or fm.materia_id is not null) as reached_materia,
    case
      when aa.explicit_available then true
      when aa.explicit_empty then false
      else am.materia_id is not null
    end as content_available,
    aa.content_opened,
    aa.meaningful_study,
    aa.returned_48h,
    coalesce(aa.active_days, 0)::bigint as active_days,
    coalesce(sc.total, 0)::bigint as simulator_attempts,
    coalesce(aa.pdf_selected_events, 0)::bigint as pdf_selected,
    greatest(coalesce(mc.total, 0), coalesce(aa.pdf_upload_events, 0))::bigint as pdf_uploads
  from new_users nu
  left join first_materia fm on fm.user_id = nu.id
  left join first_source fs on fs.user_id = nu.id
  left join activity_agg aa on aa.user_id = nu.id
  left join simulator_counts sc on sc.user_id = nu.id
  left join material_counts mc on mc.user_id = nu.id
  left join public.materias m on m.id = fm.materia_id
  left join available_materias am on am.materia_id = fm.materia_id
)
select
  j.user_id,
  j.email,
  j.registered_at,
  j.source,
  j.materia_id,
  j.materia_name,
  j.reached_materia,
  j.content_available,
  j.content_opened,
  j.meaningful_study,
  j.returned_48h,
  j.active_days,
  j.simulator_attempts,
  j.pdf_selected,
  j.pdf_uploads,
  (select count(*)::bigint from admin_sessions) as excluded_admin_sessions
from journeys j
order by j.registered_at asc;
$$;

revoke all on function public.admin_product_user_journeys(integer, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_product_user_journeys(integer, uuid[]) to service_role;
