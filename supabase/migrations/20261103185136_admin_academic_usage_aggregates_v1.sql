CREATE OR REPLACE FUNCTION public.admin_academic_usage_aggregates_v1()
 RETURNS TABLE(university_id text, university_name text, users bigint, active_users_7d bigint, engagement_users_7d bigint, engagement_ms_7d numeric, pdfs bigint, flashcard_sessions_started bigint, pdf_simulators_started bigint, last_activity_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Admin-only aggregate' using errcode = '42501';
  end if;
  return query
  with valid_universities as (
    select u.id::text as id, u.nombre::text as name from public.universidades u
  ),
  profiles_clean as (
    select p.id as user_id,
           case when pu.id is not null then pu.id else null end as university_id
    from public.profiles p
    left join valid_universities pu on pu.id=p.universidad_id
    where coalesce(p.role, 'student') <> 'admin'
  ),
  inferred_university as (
    select distinct on (m.user_id) m.user_id, m.universidad_id::text as university_id
    from public.student_materials m
    join valid_universities u on u.id=m.universidad_id::text
    order by m.user_id,m.created_at asc,m.id
  ),
  user_university as (
    select p.user_id,coalesce(p.university_id,iu.university_id,'unknown') as university_id
    from profiles_clean p
    left join inferred_university iu on iu.user_id=p.user_id
  ),
  materials_labeled as (
    select m.id,m.user_id,
           coalesce(u.id,uu.university_id,'unknown') as university_id,m.created_at
    from public.student_materials m
    join user_university uu on uu.user_id=m.user_id
    left join valid_universities u on u.id=m.universidad_id::text
  ),
  users_group as (
    select uu.university_id,count(*)::bigint as n
    from user_university uu group by 1
  ),
  materials_group as (
    select ml.university_id,count(*)::bigint as n,max(ml.created_at) as last_activity
    from materials_labeled ml group by 1
  ),
  recent_events_group as (
    select uu.university_id,
           count(distinct e.user_id) filter(where e.created_at>=now()-interval '7 days')::bigint as active_n,
           max(e.created_at) as last_activity
    from public.analytics_events e
    join user_university uu on uu.user_id=e.user_id
    where e.created_at>=now()-interval '30 days'
    group by 1
  ),
  engagement_by_user as (
    select uu.university_id,e.user_id,
           sum(least(1800000::numeric,
              greatest(0::numeric,
                case when (e.metadata->>'engagement_ms') ~ '^[0-9]+(\.[0-9]+)?$'
                     then (e.metadata->>'engagement_ms')::numeric
                     else 0::numeric end
              ))) as engaged_ms
    from public.analytics_events e
    join user_university uu on uu.user_id=e.user_id
    where e.created_at >= now()-interval '7 days'
      and e.event_name = 'session_ping'
      and (e.metadata->>'engagement_version') ~ '^[2-9][0-9]*$'
    group by 1,2
  ),
  engagement_group as (
    select eu.university_id,count(*) filter(where eu.engaged_ms>0)::bigint as n,
           coalesce(sum(eu.engaged_ms),0)::numeric as total_ms
    from engagement_by_user eu group by 1
  ),
  practice_group as (
    select coalesce(ml.university_id,uu.university_id) as university_id,
           count(*) filter(where e.event_name='student_material_flashcards_started')::bigint as flash_n,
           count(*) filter(where e.event_name='student_material_exam_started')::bigint as exam_n,
           max(e.created_at) as last_activity
    from public.analytics_events e
    join user_university uu on uu.user_id=e.user_id
    left join materials_labeled ml on ml.id::text=e.metadata->>'material_id'
    where e.event_name in ('student_material_flashcards_started','student_material_exam_started')
    group by 1
  )
  select d.id::text,
         coalesce(d.name,'Sin universidad')::text,
         coalesce(ug.n,0)::bigint,
         coalesce(re.active_n,0)::bigint,
         coalesce(eg.n,0)::bigint,
         coalesce(eg.total_ms,0)::numeric,
         coalesce(mg.n,0)::bigint,
         coalesce(pg.flash_n,0)::bigint,
         coalesce(pg.exam_n,0)::bigint,
         greatest(mg.last_activity,re.last_activity,pg.last_activity)
  from (
    select id,name from valid_universities
    union all
    select 'unknown'::text,'Sin universidad'::text
  ) d
  left join users_group ug on ug.university_id=d.id
  left join materials_group mg on mg.university_id=d.id
  left join recent_events_group re on re.university_id=d.id
  left join engagement_group eg on eg.university_id=d.id
  left join practice_group pg on pg.university_id=d.id
  where coalesce(ug.n,0)+coalesce(mg.n,0)+coalesce(pg.flash_n,0)+coalesce(pg.exam_n,0)>0
  order by case when d.id='unknown' then 1 else 0 end,
           coalesce(ug.n,0) desc,coalesce(mg.n,0) desc,d.name;
end
$function$
;
revoke all on function public.admin_academic_usage_aggregates_v1() from public, anon, authenticated;
grant execute on function public.admin_academic_usage_aggregates_v1() to service_role;
