CREATE OR REPLACE FUNCTION public.admin_learning_dashboard_v2(p_days integer DEFAULT 7, p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date, p_university uuid DEFAULT NULL::uuid, p_career uuid DEFAULT NULL::uuid, p_subject uuid DEFAULT NULL::uuid, p_plan text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_end timestamptz:=now();
 v_today date:=(now() at time zone 'America/Argentina/Buenos_Aires')::date;
 v_start timestamptz;
 v_result jsonb;
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
      (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
 then raise exception 'service_role only' using errcode='42501'; end if;
 if p_plan not in ('all','free','premium') or (p_from is null)<>(p_to is null)
 then raise exception 'invalid filter' using errcode='22023'; end if;
 if p_from is not null then
   if p_from>p_to or p_to>(now() at time zone 'America/Argentina/Buenos_Aires')::date
      or p_from<((now() at time zone 'America/Argentina/Buenos_Aires')::date-90)
      or p_to-p_from>29
   then raise exception 'date range invalid' using errcode='22023'; end if;
   v_today:=p_to;
   p_days:=p_to-p_from+1;
   v_start:=(p_from::timestamp at time zone 'America/Argentina/Buenos_Aires');
   v_end:=least(now(),((p_to+1)::timestamp at time zone 'America/Argentina/Buenos_Aires'));
 else
   if p_days not in (1,7,14,30) then raise exception 'invalid period' using errcode='22023'; end if;
   v_start:=((v_today-p_days+1)::timestamp at time zone 'America/Argentina/Buenos_Aires');
 end if;
 with
 students as materialized (
  select a.id,
    coalesce(p.universidad_id,'') university,
    coalesce(p.carrera_id,'') career,
    case when exists(select 1 from public.user_subscriptions s
        where s.user_id=a.id and s.status='active'
        and (s.expires_at is null or s.expires_at>v_end))
     then 'premium' else 'free' end as plan
  from auth.users a left join public.profiles p on p.id=a.id
  where coalesce(p.role,'student')<>'admin'
   and (p_university is null or p.universidad_id=p_university::text
     or exists(select 1 from public.student_materials m where m.user_id=a.id and m.universidad_id=p_university))
   and (p_career is null or p.carrera_id=p_career::text
     or exists(select 1 from public.student_materials m where m.user_id=a.id and m.carrera_id=p_career))
 ), selected_students as materialized (
   select * from students where p_plan='all' or plan=p_plan
 ),
 mats as materialized (
  select m.id,m.user_id,m.materia_id,m.universidad_id,m.carrera_id
  from public.student_materials m join selected_students s on s.id=m.user_id
  where p_subject is null or m.materia_id=p_subject
 ),
 answers as materialized (
  select a.id,a.user_id,a.material_id,a.answered_at,a.topic,a.item_key,
    a.source_type,a.evidence_kind,a.was_correct,m.materia_id,s.plan
  from public.student_material_answer_events a
  join mats m on m.id=a.material_id
  join selected_students s on s.id=a.user_id
  where a.answered_at>=v_start and a.answered_at<v_end
 ), assessed as materialized (
  select * from answers where evidence_kind='assessed' and was_correct is not null
 ), sessions as materialized (
  select ps.id,ps.user_id,ps.material_id,ps.mode,ps.completed_at,ps.correct,ps.total
  from public.practice_mode_sessions ps join selected_students s on s.id=ps.user_id
  where ps.completed_at>=v_start and ps.completed_at<v_end
   and (p_subject is null or exists(select 1 from mats m where m.id=ps.material_id))
 ), events as materialized (
  select distinct on(e.user_id,e.event_name,
      coalesce(nullif(e.metadata->>'attempt_id',''),nullif(e.metadata->>'run_id',''),
       nullif(e.session_key,''),e.id::text),
      (e.created_at at time zone 'America/Argentina/Buenos_Aires')::date,
      coalesce(e.metadata->>'material_id',e.metadata->>'materia_id',''))
   e.user_id,e.event_name,e.created_at,e.metadata,e.session_key
  from public.analytics_events e join selected_students s on s.id=e.user_id
  where e.created_at>=v_start and e.created_at<v_end
   and e.event_name in (
    'student_material_exam_started','student_material_exam_completed',
    'simulator_started','simulator_finished','summary_topic_check_started',
    'summary_topic_check_completed','student_material_flashcards_started',
    'student_material_practice_entry_opened','first_pdf_practice_opened',
    'study_error_created','study_error_reviewed','study_error_resolved',
    'study_error_check_answered','study_error_repractice_started'
   )
   and (p_subject is null
      or e.metadata->>'materia_id'=p_subject::text
      or exists (select 1 from mats m where m.id::text=e.metadata->>'material_id'))
  order by e.user_id,e.event_name,
      coalesce(nullif(e.metadata->>'attempt_id',''),nullif(e.metadata->>'run_id',''),
       nullif(e.session_key,''),e.id::text),
      (e.created_at at time zone 'America/Argentina/Buenos_Aires')::date,
      coalesce(e.metadata->>'material_id',e.metadata->>'materia_id',''),
      e.created_at,e.id
 ), errors as materialized (
  select er.id,er.user_id,er.first_failed_at,er.last_reviewed_at,er.resolved_at,
    er.student_material_id,er.materia_id
  from public.study_errors er join selected_students s on s.id=er.user_id
  where er.first_failed_at>=v_start and er.first_failed_at<v_end
    and (p_subject is null or er.materia_id=p_subject
         or exists(select 1 from mats m where m.id=er.student_material_id))
 ), repeated as materialized (
  select a.user_id,a.material_id,a.item_key,count(*) n,
   (array_agg(a.was_correct order by a.answered_at,a.id))[1] before_correct,
   (array_agg(a.was_correct order by a.answered_at desc,a.id desc))[1] after_correct
  from assessed a where a.item_key is not null
  group by a.user_id,a.material_id,a.item_key having count(*)>=2
 ), answered_users as (
  select user_id from assessed
  union select user_id from sessions
  union select user_id from events where event_name in('student_material_exam_completed',
    'simulator_finished','summary_topic_check_completed')
 ), overview as (
  select
    (select count(*) from answered_users)::bigint students,
    (select count(*) from events where event_name in ('student_material_exam_started',
       'simulator_started','summary_topic_check_started'))::bigint started_events,
    (select count(*) from sessions)::bigint completed_mode_sessions,
    (select count(*) from events where event_name in('student_material_exam_completed',
      'simulator_finished','summary_topic_check_completed'))::bigint completed_events,
    (select count(*) from assessed)::bigint questions,
    (select count(*) filter(where was_correct) from assessed)::bigint correct,
    (select count(*) from repeated)::bigint repeated_items,
    (select count(distinct user_id) from repeated)::bigint repeated_users,
    (select count(*) filter(where before_correct) from repeated)::bigint before_correct,
    (select count(*) filter(where after_correct) from repeated)::bigint after_correct
 ), topics as (
  select left(coalesce(nullif(a.topic,''),'Tema sin identificar'),110) topic,
    coalesce(nullif(subj.nombre,''),'Materia no identificada') subject,
    count(distinct a.user_id)::bigint students,
    count(*)::bigint answers,
    count(*) filter(where a.was_correct)::bigint correct
  from assessed a left join public.materias subj on subj.id=a.materia_id
  group by 1,2 order by answers desc limit 10
 ), tool_rows as (
  select 'Flashcards' name,
   (select count(distinct user_id) from events where event_name='student_material_flashcards_started')::bigint students,
   (select count(*) from events where event_name='student_material_flashcards_started')::bigint started,
   (select count(*) from sessions where mode='flashcards')::bigint finished,
   null::bigint correct,null::bigint answers,
   'Inicios registrados; finalizaciones autodeclaradas por el cliente' note
  union all select 'Glosario',null::bigint,null::bigint,null::bigint,null::bigint,null::bigint,
     'Consulta sin telemetría de sesión o evaluación'
  union all select 'Verdadero/falso',
   (select count(distinct user_id) from sessions where mode in ('vf','verdadero_falso','true_false'))::bigint,
   null::bigint,(select count(*) from sessions where mode in ('vf','verdadero_falso','true_false'))::bigint,
   null::bigint,null::bigint,'Solo sesiones finalizadas registradas'
  union all select 'Unir conceptos',
   (select count(distinct user_id) from sessions where mode='unir')::bigint,
   null::bigint,(select count(*) from sessions where mode='unir')::bigint,
   null::bigint,null::bigint,'Solo sesiones finalizadas registradas'
  union all select 'Casos',
   (select count(distinct user_id) from sessions where mode='casos')::bigint,
   null::bigint,(select count(*) from sessions where mode='casos')::bigint,
   null::bigint,null::bigint,'Solo sesiones finalizadas registradas'
  union all select 'Simulacro',
   (select count(distinct user_id) from events where event_name in('simulator_started','student_material_exam_started')
      and (event_name='simulator_started' or metadata->>'practice_scope'='general'))::bigint,
   (select count(*) from events where event_name in('simulator_started','student_material_exam_started')
      and (event_name='simulator_started' or metadata->>'practice_scope'='general'))::bigint,
   (select count(*) from events where event_name in('simulator_finished','student_material_exam_completed')
      and (event_name='simulator_finished' or metadata->>'practice_scope'='general'))::bigint,
   null::bigint,null::bigint,'Intentos deduplicados por sesión o identificador disponible'
 ), sim as (
  select
   (select count(*) from events where event_name='simulator_started' or
      (event_name='student_material_exam_started' and metadata->>'practice_scope'='general'))::bigint started,
   (select count(*) from events where event_name='simulator_finished' or
      (event_name='student_material_exam_completed' and metadata->>'practice_scope'='general'))::bigint finished,
   (select count(distinct user_id) from events where event_name='simulator_finished' or
      (event_name='student_material_exam_completed' and metadata->>'practice_scope'='general'))::bigint users,
   (select count(*) from events where event_name='student_material_exam_completed'
      and metadata->>'practice_scope'='general'
      and metadata->>'score_pct' ~ '^[0-9]{1,3}(\.[0-9]+)?$')::bigint score_sample,
   (select avg((metadata->>'score_pct')::numeric) from events
      where event_name='student_material_exam_completed' and metadata->>'practice_scope'='general'
      and metadata->>'score_pct' ~ '^[0-9]{1,3}(\.[0-9]+)?$'
      and (metadata->>'score_pct')::numeric between 0 and 100)::numeric avg_score
 ), score_buckets as (
  select case when (e.metadata->>'score_pct')::numeric<50 then '0–49%'
     when (e.metadata->>'score_pct')::numeric<70 then '50–69%'
     when (e.metadata->>'score_pct')::numeric<85 then '70–84%'
     else '85–100%' end bucket,count(*)::bigint attempts
  from events e
  where e.event_name='student_material_exam_completed'
    and e.metadata->>'practice_scope'='general'
    and e.metadata->>'score_pct' ~ '^[0-9]{1,3}(\.[0-9]+)?$'
    and (e.metadata->>'score_pct')::numeric between 0 and 100
  group by 1
 ), error_summary as (
  select
   (select count(distinct user_id) from errors)::bigint with_errors,
   (select count(distinct user_id) from errors where last_reviewed_at is not null)::bigint reviewed,
   (select count(distinct user_id) from errors where resolved_at is not null)::bigint resolved,
   (select count(distinct user_id) from events where event_name='study_error_check_answered')::bigint check_answered,
   (select count(*) from errors)::bigint error_items
 ), subject_rows as (
  select coalesce(a.materia_id::text,'unknown') subject_id,
    coalesce(subj.nombre,'Materia sin identificar') subject,
    count(distinct a.user_id)::bigint students,
    count(*)::bigint answers,
    count(*) filter(where a.was_correct)::bigint correct,
    count(*) filter(where a.plan='free')::bigint free_answers,
    count(*) filter(where a.plan='free' and a.was_correct)::bigint free_correct,
    count(distinct a.user_id) filter(where a.plan='free')::bigint free_users,
    count(*) filter(where a.plan='premium')::bigint premium_answers,
    count(*) filter(where a.plan='premium' and a.was_correct)::bigint premium_correct,
    count(distinct a.user_id) filter(where a.plan='premium')::bigint premium_users
   from assessed a left join public.materias subj on subj.id=a.materia_id
   group by a.materia_id,subj.nombre
   order by answers desc limit 12
 ), option_univ as(
   select u.id::text value,u.nombre label from public.universidades u
   where exists(select 1 from public.student_materials m
      where m.universidad_id=u.id)
   order by u.nombre limit 70
 ), option_career as(
   select c.id::text value,c.nombre label from public.carreras c
   where exists(select 1 from public.student_materials m
      where m.carrera_id=c.id)
   order by c.nombre limit 70
 ), option_sub as(
   select m.id::text value,m.nombre label from public.materias m
   where exists(select 1 from public.student_materials sm
      where sm.materia_id=m.id)
   order by m.nombre limit 80
 )
 select jsonb_build_object('as_of',v_today,'period_days',p_days,
  'overall',(select to_jsonb(o) from overview o),
  'topics',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from topics t),
  'tools',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from tool_rows t),
  'sim',(select to_jsonb(s) from sim s),
  'scores',(select coalesce(jsonb_agg(to_jsonb(b)),'[]'::jsonb) from score_buckets b),
  'errors',(select to_jsonb(e) from error_summary e),
  'subjects',(select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) from subject_rows s),
  'options',jsonb_build_object(
    'universities',(select coalesce(jsonb_agg(to_jsonb(u)),'[]'::jsonb) from option_univ u),
    'careers',(select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb) from option_career c),
    'subjects',(select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) from option_sub s))
 ) into v_result;
 return v_result;
end
$function$
;
revoke all on function public.admin_learning_dashboard_v2(integer,date,date,uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_learning_dashboard_v2(integer,date,date,uuid,uuid,uuid,text) to service_role;
