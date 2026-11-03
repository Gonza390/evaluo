CREATE OR REPLACE FUNCTION public.admin_activation_cohort_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_from timestamptz := (((now() at time zone 'America/Argentina/Buenos_Aires')::date - 60)::timestamp at time zone 'America/Argentina/Buenos_Aires');
 v_to timestamptz := now();
 v_out jsonb;
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
   (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
 then raise exception 'service_role only' using errcode='42501'; end if;
 with
 cohort as materialized (
   select a.id,a.created_at registered_at,
      (a.created_at at time zone 'America/Argentina/Buenos_Aires')::date signup_day,
      coalesce(nullif(p.pais,''),'unknown') country,
      (nullif(p.universidad_id,'') is not null) has_university,
      (nullif(p.carrera_id,'') is not null) has_career,
      exists(select 1 from public.user_subscriptions s where s.user_id=a.id
        and s.status='active' and (s.expires_at is null or s.expires_at>v_to)) premium
   from auth.users a left join public.profiles p on p.id=a.id
   where a.created_at>=v_from and a.created_at<v_to
     and coalesce(p.role,'student')<>'admin'
 ),
 event_agg as materialized (
   select e.user_id,
    min(e.created_at) filter(where e.event_name='student_material_study_opened') material_open_at,
    min(e.created_at) filter(where e.event_name in('summary_reading_started','materia_resumen_opened')) summary_at,
    min(e.created_at) filter(where e.event_name in('student_material_practice_entry_opened','first_pdf_practice_opened',
      'student_material_exam_started','summary_topic_check_started')) practice_at,
    min(e.created_at) filter(where e.event_name in('student_material_exam_completed','summary_topic_check_completed','simulator_finished')) practice_complete_at,
    min(e.created_at) filter(where e.event_name='student_material_flashcards_started') flashcard_at,
    min(e.created_at) filter(where e.event_name='first_pdf_guide_started') guide_started_at,
    min(e.created_at) filter(where e.event_name='first_pdf_guide_completed') guide_completed_at,
    min(e.created_at) filter(where e.event_name='profile_completed') profile_completed_at,
    min(e.created_at) filter(where e.event_name='first_pdf_study_path_selected') path_selected_at
   from public.analytics_events e join cohort c on c.id=e.user_id and e.created_at>=c.registered_at
   where e.created_at>=v_from and e.created_at<v_to
     and e.event_name in('student_material_study_opened','summary_reading_started','materia_resumen_opened',
       'student_material_practice_entry_opened','first_pdf_practice_opened','student_material_exam_started',
       'summary_topic_check_started','student_material_exam_completed','summary_topic_check_completed','simulator_finished',
       'student_material_flashcards_started','first_pdf_guide_started','first_pdf_guide_completed',
       'profile_completed','first_pdf_study_path_selected')
   group by e.user_id
 ),
 first_material as materialized (
   select distinct on (m.user_id) m.user_id,m.id,m.created_at uploaded_at,m.processing_status,m.mime_type
   from public.student_materials m join cohort c on c.id=m.user_id and m.created_at>=c.registered_at
   where m.created_at>=v_from and m.created_at<v_to
   order by m.user_id,m.created_at,m.id
 ),
 answer_agg as materialized (
   select a.user_id,min(a.answered_at) first_answer
   from public.student_material_answer_events a join cohort c on c.id=a.user_id and a.answered_at>=c.registered_at
   where a.answered_at>=v_from and a.answered_at<v_to group by a.user_id
 ),
 practice_agg as materialized (
   select p.user_id,min(p.completed_at) first_completed
   from public.practice_mode_sessions p join cohort c on c.id=p.user_id and p.completed_at>=c.registered_at
   where p.completed_at>=v_from and p.completed_at<v_to group by p.user_id
 ),
 signup_session as materialized (
   select distinct on (e.user_id) e.user_id,e.session_key,e.device_type,e.created_at
   from public.analytics_events e join cohort c on c.id=e.user_id
   where e.event_name='signup_completed' and e.created_at>=v_from and e.created_at<v_to
   order by e.user_id,e.created_at,e.id
 ),
 touch as materialized (
   select distinct on (s.user_id) s.user_id,s.device_type,s.session_key,
     lower(coalesce(e.metadata->>'session_source',e.metadata->>'source','')) source,
     lower(coalesce(e.metadata->>'referrer','')) referrer,
     lower(coalesce(e.metadata->>'landing_path','')) landing
   from signup_session s left join lateral (
     select t.metadata from public.analytics_events t
     where t.event_name='acquisition_touch' and t.session_key=s.session_key
       and t.created_at>=v_from and t.created_at<v_to
     order by t.created_at asc limit 1
   ) e on true
 ),
 base as materialized (
   select c.id,c.signup_day,c.registered_at,c.premium,c.has_university,c.has_career,
     case when lower(coalesce(t.device_type,'')) in('mobile','tablet') then 'mobile'
       when lower(coalesce(t.device_type,''))='desktop' then 'desktop' else 'unknown' end device,
     case
       when t.source like '%google%' or t.referrer ~ 'google\.[a-z.]+' or t.landing like '%utm_source=google%' then 'google'
       when t.source like '%whatsapp%' or t.source='wa' or t.referrer like '%whatsapp%' or t.landing like '%utm_source=whatsapp%' then 'whatsapp'
       when t.source like '%instagram%' or t.source like '%tiktok%' or t.referrer ~ '(instagram|tiktok)' then 'social'
       when t.source like '%facebook%' or t.referrer like '%facebook%' or t.landing like '%fbclid=%' then 'facebook'
       when t.source like '%reddit%' or t.referrer like '%reddit%' then 'reddit'
       when t.source like '%chatgpt%' or t.referrer like '%chatgpt%' then 'ai_referral'
       when coalesce(t.source,'')='' and coalesce(t.referrer,'')='' then 'unknown'
       else 'other' end source,
     case when m.mime_type='application/pdf' then 'pdf'
       when m.mime_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document' then 'docx'
       when m.id is null then 'none' else 'other' end file_type,
     m.id first_material_id,m.uploaded_at,m.processing_status,
     e.material_open_at,e.summary_at,e.practice_at,e.practice_complete_at,
     e.flashcard_at,e.guide_started_at,e.guide_completed_at,e.profile_completed_at,
     a.first_answer,p.first_completed,
     case when e.summary_at is not null and
                (e.practice_at is null or e.summary_at<=e.practice_at) then 'read'
          when e.practice_at is not null and
                (e.summary_at is null or e.practice_at<e.summary_at) then 'practice'
          else 'unknown' end first_path
   from cohort c left join event_agg e on e.user_id=c.id
    left join first_material m on m.user_id=c.id
    left join answer_agg a on a.user_id=c.id
    left join practice_agg p on p.user_id=c.id
    left join touch t on t.user_id=c.id
 ),
 observed as materialized (
   select b.*,
    (b.uploaded_at is not null) has_upload,
    (b.uploaded_at is not null and b.processing_status='ready') ready_first,
    (b.uploaded_at is not null and b.processing_status='failed') failed_first,
    (b.material_open_at is not null) opened_material,
    (b.summary_at is not null) opened_summary,
    (b.practice_at is not null or b.first_answer is not null) began_practice,
    (b.practice_complete_at is not null or b.first_completed is not null or b.first_answer is not null) finished_practice,
    (b.material_open_at is not null or b.summary_at is not null or b.practice_at is not null or b.first_answer is not null or b.first_completed is not null) began_study,
    (b.guide_started_at is not null) began_guide,
    (b.guide_completed_at is not null) completed_guide,
    (b.has_university and b.has_career) academic_profile,
    (b.uploaded_at is not null and b.processing_status='ready'
      and b.summary_at is not null and b.summary_at>=b.uploaded_at) step_summary,
    (b.uploaded_at is not null and b.processing_status='ready'
      and b.summary_at is not null and b.summary_at>=b.uploaded_at
      and b.practice_at is not null and b.practice_at>=b.summary_at) step_practice,
    (b.uploaded_at is not null and b.processing_status='ready'
      and b.summary_at is not null and b.summary_at>=b.uploaded_at
      and b.practice_at is not null and b.practice_at>=b.summary_at
      and (b.practice_complete_at>=b.practice_at or b.first_completed>=b.practice_at or b.first_answer>=b.practice_at)) step_finished,
    case when b.material_open_at is not null or b.summary_at is not null or b.practice_at is not null
      then extract(epoch from (least(
        coalesce(b.material_open_at,'infinity'::timestamptz),
        coalesce(b.summary_at,'infinity'::timestamptz),
        coalesce(b.practice_at,'infinity'::timestamptz))-b.registered_at)) / 60 end minutes_to_study,
    case when b.practice_complete_at is not null or b.first_completed is not null or b.first_answer is not null
      then extract(epoch from (least(
        coalesce(b.practice_complete_at,'infinity'::timestamptz),
        coalesce(b.first_completed,'infinity'::timestamptz),
        coalesce(b.first_answer,'infinity'::timestamptz))-b.registered_at)) / 60 end minutes_to_practice
   from base b
 ),
 groups as (
   select signup_day d,device,source,file_type,first_path,premium,
    count(*)::bigint registered,
    count(*) filter(where has_upload)::bigint uploaded,
    count(*) filter(where ready_first)::bigint ready,
    count(*) filter(where failed_first)::bigint failed,
    count(*) filter(where opened_material)::bigint opened_material,
    count(*) filter(where opened_summary)::bigint summary,
    count(*) filter(where began_study)::bigint studied,
    count(*) filter(where began_practice)::bigint practice_started,
    count(*) filter(where finished_practice)::bigint practice_finished,
    count(*) filter(where step_summary)::bigint funnel_summary,
    count(*) filter(where step_practice)::bigint funnel_practice,
    count(*) filter(where step_finished)::bigint funnel_finished,
    count(*) filter(where flashcard_at is not null)::bigint flashcards,
    count(*) filter(where began_guide)::bigint guide_started,
    count(*) filter(where completed_guide)::bigint guide_completed,
    count(*) filter(where academic_profile)::bigint academic_profile,
    count(*) filter(where has_university)::bigint university,
    count(*) filter(where has_career)::bigint career,
    count(*) filter(where profile_completed_at is not null)::bigint profile_completed,
    count(*) filter(where first_path='read' and finished_practice)::bigint read_finished,
    count(*) filter(where first_path='practice' and finished_practice)::bigint direct_finished,
    sum(minutes_to_study) filter(where minutes_to_study>=0 and minutes_to_study<=43200)::numeric study_minutes_sum,
    count(minutes_to_study) filter(where minutes_to_study>=0 and minutes_to_study<=43200)::bigint study_minutes_count,
    sum(minutes_to_practice) filter(where minutes_to_practice>=0 and minutes_to_practice<=43200)::numeric practice_minutes_sum,
    count(minutes_to_practice) filter(where minutes_to_practice>=0 and minutes_to_practice<=43200)::bigint practice_minutes_count
   from observed
   group by signup_day,device,source,file_type,first_path,premium
 )
 select jsonb_build_object(
  'from',(v_from at time zone 'America/Argentina/Buenos_Aires')::date,
  'through',(v_to at time zone 'America/Argentina/Buenos_Aires')::date,
  'coverage','cohort by auth.users.created_at; activity attributable only to identified user after signup',
  'rows',coalesce(jsonb_agg(to_jsonb(g) order by g.d desc),'[]'::jsonb)
 ) into v_out from groups g;
 return v_out;
end
$function$
;
revoke all on function public.admin_activation_cohort_v1() from public,anon,authenticated;
grant execute on function public.admin_activation_cohort_v1() to service_role;
