CREATE OR REPLACE FUNCTION public.admin_study_plans_dashboard_v1(p_days integer DEFAULT 7, p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date, p_university uuid DEFAULT NULL::uuid, p_career uuid DEFAULT NULL::uuid, p_subject uuid DEFAULT NULL::uuid, p_duration text DEFAULT 'all'::text, p_state text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_from date;
  v_to date;
  v_result jsonb;
begin
  if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
    (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
  then raise exception 'service_role only' using errcode='42501'; end if;
  if p_days not in (1,7,14,30)
    or p_duration not in ('all','upto7','8to14','15to30','over30')
    or p_state not in ('all','active','not_started','interrupted')
    or (p_from is null) <> (p_to is null)
  then raise exception 'invalid filter' using errcode='22023'; end if;
  v_to:=coalesce(p_to,v_today);
  v_from:=coalesce(p_from,v_to-p_days+1);
  if v_to>v_today or v_from>v_to or v_from<v_today-90 or v_to-v_from>29
  then raise exception 'invalid date range' using errcode='22023'; end if;
  with
  raw_plans as materialized (
    select p.user_id,p.created_at,p.exam_date,p.daily_minutes,
      p.material_ids,p.schedule,
      (p.created_at at time zone 'America/Argentina/Buenos_Aires')::date created_day,
      (p.exam_date-(p.created_at at time zone 'America/Argentina/Buenos_Aires')::date) initial_days
    from public.student_personal_study_plans p
    left join public.profiles u on u.id=p.user_id
    where coalesce(u.role,'student')<>'admin'
      and p.created_at>=((v_from::timestamp) at time zone 'America/Argentina/Buenos_Aires')
      and p.created_at<(((v_to+1)::timestamp) at time zone 'America/Argentina/Buenos_Aires')
      and (p_university is null or u.universidad_id=p_university::text
        or exists(select 1 from public.student_materials m
          where m.id=any(p.material_ids) and m.user_id=p.user_id and m.universidad_id=p_university))
      and (p_career is null or u.carrera_id=p_career::text
        or exists(select 1 from public.student_materials m
          where m.id=any(p.material_ids) and m.user_id=p.user_id and m.carrera_id=p_career))
      and (p_subject is null or exists(select 1 from public.student_materials m
          where m.id=any(p.material_ids) and m.user_id=p.user_id and m.materia_id=p_subject))
      and (p_duration='all'
        or (p_duration='upto7' and p.exam_date-(p.created_at at time zone 'America/Argentina/Buenos_Aires')::date<=7)
        or (p_duration='8to14' and p.exam_date-(p.created_at at time zone 'America/Argentina/Buenos_Aires')::date between 8 and 14)
        or (p_duration='15to30' and p.exam_date-(p.created_at at time zone 'America/Argentina/Buenos_Aires')::date between 15 and 30)
        or (p_duration='over30' and p.exam_date-(p.created_at at time zone 'America/Argentina/Buenos_Aires')::date>30))
  ),
  planned_days as materialized (
    select r.user_id,day_data.day,
      case when day_data.day->>'date'~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        then (day_data.day->>'date')::date else null end scheduled_date,
      case when (day_data.day->>'estimatedMinutes')~'^[0-9]{1,4}$'
        then (day_data.day->>'estimatedMinutes')::int else 0 end estimated_minutes
    from raw_plans r
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(r.schedule)='array' then r.schedule else '[]'::jsonb end
    ) day_data(day)
  ),
  planned_topics as materialized (
    select distinct r.user_id,
      coalesce((d.day->>'date')::date,r.created_day) scheduled_date,
      case when t.topic->>'materialId'~'^[0-9a-fA-F-]{36}$'
        then (t.topic->>'materialId')::uuid else null end material_id,
      case when t.topic->>'topicIndex'~'^[0-9]{1,4}$'
        then (t.topic->>'topicIndex')::int else null end topic_index
    from raw_plans r
    join planned_days d on d.user_id=r.user_id
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(d.day->'topics')='array' then d.day->'topics' else '[]'::jsonb end
    ) t(topic)
  ),
  topic_progress as materialized (
    select t.user_id,t.scheduled_date,t.material_id,t.topic_index,
      exists(select 1 from public.student_material_topic_activity_progress a
        join raw_plans r on r.user_id=a.user_id
        where a.user_id=t.user_id and a.material_id=t.material_id
          and a.topic_index=t.topic_index and a.activity='reading'
          and a.completed_at>=r.created_at) as read_done,
      (select count(*) from public.student_personal_study_plan_practice_progress a
         join raw_plans r on r.user_id=a.user_id
         where a.user_id=t.user_id and a.material_id=t.material_id
           and a.topic_index=t.topic_index and a.completed_at>=r.created_at)::int practice_count,
      (select max(a.completed_at) from public.student_material_topic_activity_progress a
         join raw_plans r on r.user_id=a.user_id
         where a.user_id=t.user_id and a.material_id=t.material_id
           and a.topic_index=t.topic_index and a.activity='reading'
           and a.completed_at>=r.created_at) latest_read,
      (select max(a.completed_at) from public.student_personal_study_plan_practice_progress a
         join raw_plans r on r.user_id=a.user_id
         where a.user_id=t.user_id and a.material_id=t.material_id
           and a.topic_index=t.topic_index and a.completed_at>=r.created_at) latest_practice
    from planned_topics t
    where t.material_id is not null and t.topic_index is not null
  ),
  per_plan as materialized (
    select r.user_id,r.created_day,r.created_at,r.exam_date,r.daily_minutes,r.initial_days,
      coalesce((select count(*) from topic_progress t where t.user_id=r.user_id),0)::int planned_topics,
      coalesce((select count(*) from topic_progress t where t.user_id=r.user_id and t.read_done),0)::int readings_done,
      coalesce((select sum(t.practice_count) from topic_progress t where t.user_id=r.user_id),0)::int practices_done,
      coalesce((select count(*) from topic_progress t where t.user_id=r.user_id and t.scheduled_date<=v_today),0)::int due_topics,
      coalesce((select count(*) from topic_progress t where t.user_id=r.user_id and t.scheduled_date<=v_today and t.read_done),0)::int due_readings,
      greatest((select max(greatest(t.latest_read,t.latest_practice)) from topic_progress t
        where t.user_id=r.user_id),(select max(t.latest_read) from topic_progress t where t.user_id=r.user_id),
        (select max(t.latest_practice) from topic_progress t where t.user_id=r.user_id)) last_progress,
      coalesce((select bool_or(d.estimated_minutes>r.daily_minutes) from planned_days d
        where d.user_id=r.user_id),false) over_budget
    from raw_plans r
  ),
  status_plans as materialized (
    select p.*,
      case when p.readings_done+p.practices_done=0 then 'not_started'
        when p.last_progress<(now()-interval '7 days') then 'interrupted'
        else 'active' end status
    from per_plan p
  ),
  selected as materialized (
    select * from status_plans p where p_state='all' or p.status=p_state
  ),
  visible as materialized (
    select t.* from topic_progress t join selected s on s.user_id=t.user_id
  ),
  weekly as (
    select greatest(1,least(4,1+floor(((t.scheduled_date-s.created_day)::numeric)/7)::int)) week,
      count(*)::bigint scheduled,count(*) filter(where t.read_done)::bigint read
    from visible t join selected s on s.user_id=t.user_id
    where t.scheduled_date is not null group by 1
  ),
  summary as (
    select count(*)::bigint plans,count(distinct user_id)::bigint students,
      count(*) filter(where status='active')::bigint active,
      count(*) filter(where status='not_started')::bigint not_started,
      count(*) filter(where status='interrupted')::bigint interrupted,
      count(*) filter(where readings_done>0 or practices_done>0)::bigint began,
      count(*) filter(where planned_topics>0 and planned_topics=readings_done)::bigint all_read,
      coalesce(sum(planned_topics),0)::bigint scheduled_topics,
      coalesce(sum(readings_done),0)::bigint read_topics,
      coalesce(sum(practices_done),0)::bigint practices_done,
      coalesce(sum(due_topics),0)::bigint due_topics,
      coalesce(sum(due_readings),0)::bigint due_readings,
      count(*) filter(where over_budget)::bigint over_budget,
      count(*) filter(where exam_date<v_today)::bigint expired_exams,
      round(avg(initial_days)::numeric,1) avg_days_to_exam,
      round(avg(daily_minutes)::numeric,1) avg_daily_minutes
    from selected
  ),
  duration_rows as (
    select case when initial_days<=7 then 'upto7' when initial_days<=14 then '8to14'
      when initial_days<=30 then '15to30' else 'over30' end bucket,count(*)::bigint n
    from selected group by 1
  ),
  minutes_rows as (
    select daily_minutes minutes,count(*)::bigint n from selected group by 1
  ),
  distribution as (
    select case
      when planned_topics=0 or readings_done=0 then 'zero'
      when 100*readings_done/planned_topics<=25 then '1to25'
      when 100*readings_done/planned_topics<=50 then '26to50'
      when 100*readings_done/planned_topics<=75 then '51to75'
      when readings_done<planned_topics then '76to99' else 'all_read' end bucket,
      count(*)::bigint n from selected group by 1
  ),
  activity as (
    select a.user_id,count(*)::bigint answers,
      count(*) filter(where a.was_correct)::bigint correct,
      count(distinct (a.answered_at at time zone 'America/Argentina/Buenos_Aires')::date)::bigint study_days
    from public.student_material_answer_events a
    left join public.profiles p on p.id=a.user_id
    where a.answered_at>=((v_from::timestamp) at time zone 'America/Argentina/Buenos_Aires')
      and a.answered_at<(((v_to+1)::timestamp) at time zone 'America/Argentina/Buenos_Aires')
      and a.evidence_kind='assessed' and a.was_correct is not null
      and coalesce(p.role,'student')<>'admin'
      and (p_university is null or p.universidad_id=p_university::text)
      and (p_career is null or p.carrera_id=p_career::text)
      and (p_subject is null or exists(select 1 from public.student_materials m
        where m.id=a.material_id and m.materia_id=p_subject))
    group by a.user_id
  ),
  group_stats as (
    select case when exists(select 1 from public.student_personal_study_plans sp
      where sp.user_id=a.user_id) then 'with_plan' else 'no_plan' end group_key,
      count(*)::bigint users,
      coalesce(sum(a.answers),0)::bigint answers,
      coalesce(sum(a.correct),0)::bigint correct,
      coalesce(sum(a.study_days),0)::bigint study_days
    from activity a group by 1
  ),
  option_universities as (
    select distinct u.id::text value,u.nombre label
    from public.universidades u join public.student_materials m on m.universidad_id=u.id
    join public.student_personal_study_plans p on m.id=any(p.material_ids)
    order by label limit 50
  ),
  option_careers as (
    select distinct c.id::text value,c.nombre label
    from public.carreras c join public.student_materials m on m.carrera_id=c.id
    join public.student_personal_study_plans p on m.id=any(p.material_ids)
    order by label limit 50
  ),
  option_subjects as (
    select distinct s.id::text value,s.nombre label
    from public.materias s join public.student_materials m on m.materia_id=s.id
    join public.student_personal_study_plans p on m.id=any(p.material_ids)
    order by label limit 50
  ),
  prev_created as (
    select count(*)::bigint n from public.student_personal_study_plans p
    left join public.profiles u on u.id=p.user_id
    where coalesce(u.role,'student')<>'admin'
      and p.created_at>=(((v_from-(v_to-v_from+1))::timestamp) at time zone 'America/Argentina/Buenos_Aires')
      and p.created_at<((v_from::timestamp) at time zone 'America/Argentina/Buenos_Aires')
  )
  select jsonb_build_object(
    'from',v_from,'through',v_to,
    'summary',(select to_jsonb(s) from summary s),
    'previous_created',(select n from prev_created),
    'weeks',(select coalesce(jsonb_agg(to_jsonb(w) order by w.week),'[]'::jsonb) from weekly w),
    'duration',(select coalesce(jsonb_agg(to_jsonb(d)),'[]'::jsonb) from duration_rows d),
    'minutes',(select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) from minutes_rows m),
    'distribution',(select coalesce(jsonb_agg(to_jsonb(d)),'[]'::jsonb) from distribution d),
    'comparison',(select coalesce(jsonb_agg(to_jsonb(g)),'[]'::jsonb) from group_stats g),
    'options',jsonb_build_object(
      'universities',(select coalesce(jsonb_agg(to_jsonb(o)),'[]'::jsonb) from option_universities o),
      'careers',(select coalesce(jsonb_agg(to_jsonb(o)),'[]'::jsonb) from option_careers o),
      'subjects',(select coalesce(jsonb_agg(to_jsonb(o)),'[]'::jsonb) from option_subjects o)
    )
  ) into v_result;
  return v_result;
end
$function$
;
revoke all on function public.admin_study_plans_dashboard_v1(integer,date,date,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_study_plans_dashboard_v1(integer,date,date,uuid,uuid,uuid,text,text) to service_role;
