CREATE OR REPLACE FUNCTION public.admin_acquisition_dashboard_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_start timestamptz := ((current_date-61)::timestamp at time zone 'America/Argentina/Buenos_Aires');
 v_end timestamptz := now();
 v_rows jsonb;
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
   (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
 then raise exception 'service_role only' using errcode='42501'; end if;
 with
 touches as materialized (
  select distinct on (e.session_key) e.session_key, e.created_at, e.user_id,
   e.path, e.device_type, e.metadata
  from public.analytics_events e
  where e.event_name='acquisition_touch' and e.session_key is not null
   and e.created_at>=v_start and e.created_at<v_end
  order by e.session_key,e.created_at,e.id
 ),
 sessions as materialized (
  select t.session_key,t.created_at,
   (t.created_at at time zone 'America/Argentina/Buenos_Aires')::date d,
   left(split_part(coalesce(nullif(t.metadata->>'landing_path',''),t.path,'/'), '?', 1),220) as landing,
   lower(coalesce(t.metadata->>'session_source',t.metadata->>'source','')) src,
   lower(coalesce(t.metadata->>'referrer','')) ref,
   lower(coalesce(t.metadata->>'landing_path','')) landing_raw,
   lower(coalesce(t.device_type,'unknown')) device,
   t.user_id initial_user,
   lower(coalesce(t.metadata->>'entry_page_type','')) entry_type
  from touches t
 ),
 classified as materialized (
  select s.*,
   case
    when src like '%google%' or ref ~ '^https?://([^/]+\.)?google\.[a-z.]+' or landing_raw ~ '[?&]utm_source=google' then 'google'
    when src in('whatsapp','wa') or src like '%whatsapp%' or ref ~ 'whatsapp\.com|wa\.me' or landing_raw ~ '[?&]utm_source=(whatsapp|wa)' then 'whatsapp'
    when src like '%instagram%' or src='ig' or src like '%tiktok%' or ref ~ 'instagram\.com|tiktok\.com' or landing_raw ~ '[?&]utm_source=(instagram|tiktok|ig)' then 'social'
    when src like '%facebook%' or ref ~ 'facebook\.com|fb\.com|fb\.me' or landing_raw ~ '[?&](utm_source=facebook|fbclid=)' then 'facebook'
    when src like '%reddit%' or ref ~ 'reddit\.com' or landing_raw ~ '[?&]utm_source=reddit' then 'reddit'
    when src like '%linkedin%' or ref ~ 'linkedin\.com' or landing_raw ~ '[?&]utm_source=linkedin' then 'linkedin'
    when src like '%chatgpt%' or src like '%perplexity%' or src like '%claude%' or ref ~ 'chatgpt\.com|perplexity\.ai|claude\.ai' then 'ai_referral'
    when src in('','direct','none') and (ref='' or ref ~ '^https?://(www\.)?(evaluoapp\.com|evaluo\.com\.ar)') then 'unknown_direct'
    else 'other'
   end as channel,
   case
     when landing ~ '^/(blog|en/blog)(/|$)' then 'blog'
     when landing ~ '^/(funciones|en/features)(/|$)' then 'funciones'
     when landing ~ '^/(guias|en/guides|universidad)(/|$)' then 'guias'
     when landing ~ '^/(pregunteros|explorar/materia)(/|$)' then 'pregunteros'
     when landing ~ '^/(estudiar-pdf-con-ia|resumir-pdf-con-ia|ia-para-estudiantes|en/|paises|es/|herramientas|planes-de-estudio|landings)(/|$)' then 'landing'
     else 'other'
   end page_type,
   left(coalesce(substring(landing_raw from '[?&]utm_campaign=([^&#]+)'),''),80) campaign,
   left(coalesce(substring(landing_raw from '[?&]utm_source=([^&#]+)'),src),60) utm_source,
   left(coalesce(substring(landing_raw from '[?&]utm_medium=([^&#]+)'),''),60) utm_medium,
   left(coalesce(substring(landing_raw from '[?&]utm_content=([^&#]+)'),''),90) utm_content
  from sessions s
 ),
 event_flags as materialized (
  select e.session_key,
    max(e.user_id::text)::uuid user_id,
    bool_or(e.event_name in ('cta_click','create_material_clicked','first_pdf_cta_clicked',
      'pdf_picker_opened','pdf_selected','signup_cta_clicked','preguntero_landing_cta_clicked')) clicked,
    bool_or(e.event_name='signup_started') started_signup,
    bool_or(e.event_name='signup_completed') registered,
    bool_or(e.event_name in('pdf_uploaded','material_ready','student_material_processing_ready')) uploaded,
    bool_or(e.event_name in('student_material_study_opened','summary_reading_started',
      'summary_completed','student_material_exam_started','simulator_started')) opened_study,
    bool_or(e.event_name=any(public.admin_study_event_names_v1())) did_study
  from public.analytics_events e join touches t on t.session_key=e.session_key
  where e.created_at>=v_start and e.created_at<v_end
   and e.event_name in('cta_click','create_material_clicked','first_pdf_cta_clicked',
      'pdf_picker_opened','pdf_selected','signup_cta_clicked','preguntero_landing_cta_clicked',
      'signup_started','signup_completed','pdf_uploaded','material_ready',
      'student_material_processing_ready','student_material_study_opened','summary_reading_started',
      'summary_completed','student_material_exam_started','simulator_started',
      'summary_topic_check_completed','student_material_exam_completed','simulator_finished',
      'study_error_reviewed','study_error_resolved','study_error_check_answered',
      'study_error_repractice_started')
  group by e.session_key
 ),
 student_days as materialized (
  select x.user_id,min(x.d) first_study
  from public.admin_study_days_v1(v_start,v_end) x group by x.user_id
 ),
 joined as materialized (
  select c.*,coalesce(f.user_id,c.initial_user) related_user,
   coalesce(f.clicked,false) clicked,coalesce(f.started_signup,false) started_signup,
   coalesce(f.registered,false) registered,coalesce(f.uploaded,false) uploaded,
   coalesce(f.opened_study,false) opened_study,coalesce(f.did_study,false) did_study,
   (coalesce(f.registered,false) and sd.first_study>=c.d) registered_and_studied
  from classified c left join event_flags f using(session_key)
   left join student_days sd on sd.user_id=coalesce(f.user_id,c.initial_user)
  where not exists (
   select 1 from public.profiles p
   where p.id=coalesce(f.user_id,c.initial_user) and p.role='admin'
  )
 ),
 aggregated as (
  select d,channel,page_type,landing,campaign,utm_source,utm_medium,utm_content,device,
   count(*)::bigint sessions,
   count(*) filter(where clicked)::bigint clicks,
   count(*) filter(where started_signup)::bigint signup_started,
   count(*) filter(where registered)::bigint registered,
   count(*) filter(where uploaded)::bigint uploaded,
   count(*) filter(where opened_study or did_study)::bigint studied_sessions,
   count(*) filter(where registered_and_studied)::bigint activated,
   count(*) filter(where clicked and started_signup)::bigint step_signup_started,
   count(*) filter(where clicked and started_signup and registered)::bigint step_registered,
   count(*) filter(where clicked and started_signup and registered and uploaded)::bigint step_uploaded,
   count(*) filter(where clicked and started_signup and registered and uploaded
     and (opened_study or did_study or registered_and_studied))::bigint step_studied
  from joined group by d,channel,page_type,landing,campaign,utm_source,utm_medium,utm_content,device
 )
 select coalesce(jsonb_agg(to_jsonb(a) order by a.d desc,a.sessions desc),'[]'::jsonb)
 into v_rows from aggregated a;
 return jsonb_build_object(
   'from',(v_start at time zone 'America/Argentina/Buenos_Aires')::date,
   'through',(v_end at time zone 'America/Argentina/Buenos_Aires')::date,
   'coverage','acquisition_touch: session_key; session-scoped signup; study attributed when user link exists',
   'rows',v_rows
 );
end
$function$
;
revoke all on function public.admin_acquisition_dashboard_v1() from public,anon,authenticated;
grant execute on function public.admin_acquisition_dashboard_v1() to service_role;
