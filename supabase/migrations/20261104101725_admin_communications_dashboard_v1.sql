CREATE OR REPLACE FUNCTION public.admin_communications_dashboard_v1(p_days integer DEFAULT 7, p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date, p_type text DEFAULT 'all'::text, p_template text DEFAULT 'all'::text, p_status text DEFAULT 'all'::text, p_campaign text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d date:=(now() at time zone 'America/Argentina/Buenos_Aires')::date;f date;t date;st timestamptz;en timestamptz;pr timestamptz;v jsonb;
begin
if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role' then raise exception 'service role only' using errcode='42501';end if;
if p_days not in(1,7,14,30) or (p_from is null)<>(p_to is null) or p_type not in('all','exam','ready','recovery','review','campaign','welcome') or p_template not in('all','exam_7','exam_3','exam_1','ready','return_48h','return_d1','return_30d','flashcards','welcome','other') or p_status not in('all','sent','failed','pending','sending','cancelled') or p_campaign not in('all','automatic','exam','recovery','manual') then raise exception 'invalid filter';end if;
t:=coalesce(p_to,d);f:=coalesce(p_from,t-p_days+1);
if t>d or f>t or f<d-90 or t-f>29 then raise exception 'invalid period';end if;
st:=(f::timestamp at time zone 'America/Argentina/Buenos_Aires');
en:=((t+1)::timestamp at time zone 'America/Argentina/Buenos_Aires');
pr:=((f-(t-f+1))::timestamp at time zone 'America/Argentina/Buenos_Aires');
with source as materialized(
select e.id,e.user_id,'exam'::text kind,case e.reminder_days when 7 then 'exam_7' when 3 then 'exam_3' when 1 then 'exam_1' else 'other' end template,'exam'::text campaign,e.status,e.created_at,e.sent_at,e.reminder_days::int reminder_days,null::text error from public.email_reminder_deliveries e
union all select e.id,e.user_id,'ready','ready','automatic',e.status,e.created_at,e.sent_at,null::int,null::text from public.student_material_ready_emails e
union all select e.id,e.user_id,'review','flashcards','automatic',e.status,e.created_at,e.sent_at,null::int,e.last_error from public.flashcard_review_reminders e
union all select e.id,e.user_id,'recovery','return_48h','recovery',e.status,e.created_at,e.sent_at,null::int,null::text from public.study_return_reminders e
union all select e.id,e.user_id,case when e.campaign_key like 'study_return_%' or e.campaign_key like 'reactivation_%' then 'recovery' else 'campaign' end,
case when e.campaign_key like 'study_return_d1_%' then 'return_d1' when e.campaign_key like 'reactivation_next_subject_30d_%' then 'return_30d' else 'other' end,
case when e.campaign_key like 'study_return_%' or e.campaign_key like 'reactivation_%' then 'recovery' else 'manual' end,
e.status,e.created_at,e.sent_at,null::int,null::text from public.email_campaign_deliveries e
),
base as materialized(select s.*,coalesce(s.sent_at,s.created_at) observed_at from source s left join public.profiles p on p.id=s.user_id
where coalesce(p.role,'student')<>'admin' and coalesce(s.sent_at,s.created_at)>=pr and coalesce(s.sent_at,s.created_at)<en
and (p_type='all' or s.kind=p_type) and (p_template='all' or s.template=p_template) and (p_status='all' or s.status=p_status) and (p_campaign='all' or s.campaign=p_campaign)),
cur as materialized(select * from base where observed_at>=st),
outcomes as materialized(
select x.id,x.user_id,x.kind,x.template,x.status,x.sent_at,
(x.status='sent' and x.sent_at is not null and x.sent_at<=now()-interval '48 hours') eligible,
(x.status='sent' and x.sent_at is not null and x.sent_at<=now()-interval '48 hours' and exists(select 1 from public.analytics_events e where e.user_id=x.user_id and e.created_at>x.sent_at and e.created_at<=x.sent_at+interval '48 hours' and e.event_name in('session_ping','student_material_study_opened','summary_reading_started','first_pdf_study_session_opened','student_material_practice_entry_opened','student_material_exam_started','first_pdf_practice_opened','study_error_reviewed','summary_topic_check_completed'))) returned,
(x.status='sent' and x.sent_at is not null and x.sent_at<=now()-interval '48 hours' and exists(select 1 from public.analytics_events e where e.user_id=x.user_id and e.created_at>x.sent_at and e.created_at<=x.sent_at+interval '48 hours' and e.event_name in('student_material_study_opened','summary_reading_started','first_pdf_study_session_opened','student_material_practice_entry_opened','student_material_exam_started','first_pdf_practice_opened','study_error_reviewed','summary_topic_check_completed'))) studied
from cur x),
summary as(select count(*)filter(where status='sent')::bigint sent,count(*)filter(where status='failed')::bigint failed,count(*)filter(where status='pending')::bigint pending,count(*)filter(where status='sending')::bigint sending,count(*)filter(where status='cancelled')::bigint cancelled,count(distinct user_id)filter(where status='sent')::bigint recipients,max(sent_at) last_sent from cur),
impact as(select count(*)filter(where eligible)::bigint eligible,count(*)filter(where returned)::bigint returned_mails,count(*)filter(where studied)::bigint studied_mails,count(distinct user_id)filter(where returned)::bigint unique_returned,count(distinct user_id)filter(where studied)::bigint unique_studied from outcomes),
templates as(select x.kind,x.template,x.campaign,count(*)::bigint records,count(*)filter(where x.status='sent')::bigint sent,count(*)filter(where x.status='failed')::bigint failed,count(*)filter(where x.status='pending')::bigint pending,max(x.sent_at) last_sent,
(select count(*) from outcomes o where o.template=x.template and o.eligible)::bigint eligible,
(select count(*) from outcomes o where o.template=x.template and o.returned)::bigint returned_mails,
(select count(*) from outcomes o where o.template=x.template and o.studied)::bigint studied_mails,
(select count(distinct o.user_id) from outcomes o where o.template=x.template and o.studied)::bigint study_users
from cur x group by x.kind,x.template,x.campaign),
flows as(select kind,count(*)::bigint records,count(*)filter(where status='sent')::bigint sent,count(*)filter(where status='failed')::bigint failed,max(sent_at) last_sent from cur group by 1),
reminders as(select a.days,count(c.id)::bigint records,count(c.id)filter(where c.status='sent')::bigint sent,count(c.id)filter(where c.status='pending')::bigint pending,count(c.id)filter(where c.status='failed')::bigint failed from (values(7),(3),(1)) a(days) left join cur c on c.kind='exam' and c.reminder_days=a.days group by a.days),
reasons as(select case when error is null or btrim(error)='' then 'Sin motivo registrado' when lower(error) like '%timeout%' then 'Tiempo de espera' else 'Otro error registrado' end label,count(*)::bigint n from cur where status='failed' group by 1),
future_exams as materialized(
select m.user_id,m.exam_date,coalesce(nullif(sub.nombre,''),nullif(m.title,''),nullif(m.file_name,''),'Examen registrado') subject,coalesce(m.materia_id::text,m.id::text) subject_key from public.student_materials m left join public.materias sub on sub.id=m.materia_id where m.exam_date in (d+1,d+3,d+7)
union all select c.user_id,c.event_date,coalesce(nullif(c.materia_nombre,''),nullif(c.title,''),'Examen registrado'),coalesce(c.materia_id::text,c.id::text) from public.study_calendar_events c where c.event_type='exam' and c.event_date in(d+1,d+3,d+7)),
upcoming_source as materialized(
select distinct on(x.user_id,x.exam_date,x.subject_key) x.user_id,x.exam_date,x.subject,(x.exam_date-d)::int reminder_days from future_exams x left join public.profiles p on p.id=x.user_id where coalesce(p.role,'student')<>'admin'
and not exists(select 1 from public.email_reminder_deliveries e where e.user_id=x.user_id and e.exam_date=x.exam_date and e.reminder_days=x.exam_date-d and e.status in('sent','sending','pending'))
order by x.user_id,x.exam_date,x.subject_key,x.subject),
upcoming as(select exam_date,reminder_days,left(subject,100) subject from upcoming_source order by exam_date,subject limit 12),
daily_sent as(select (sent_at at time zone 'America/Argentina/Buenos_Aires')::date dt,count(*)::bigint n from cur where status='sent' and sent_at is not null group by 1),
daily as(select g::date as day,coalesce(s.n,0)::bigint sent from generate_series(f,t,'1 day'::interval) g left join daily_sent s on s.dt=g::date)
select jsonb_build_object('from',f,'through',t,
'summary',(select to_jsonb(s) from summary s),
'previous',(select count(*) from base where observed_at<st and status='sent'),
'impact',(select to_jsonb(i) from impact i),
'flows',(select coalesce(jsonb_agg(to_jsonb(x) order by x.sent desc),'[]'::jsonb) from flows x),
'templates',(select coalesce(jsonb_agg(to_jsonb(x) order by x.sent desc),'[]'::jsonb) from templates x),
'reminders',(select coalesce(jsonb_agg(to_jsonb(x) order by x.days desc),'[]'::jsonb) from reminders x),
'upcoming',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from upcoming x),
'upcoming_total',(select count(*) from upcoming_source),
'reasons',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from reasons x),
'daily',(select coalesce(jsonb_agg(to_jsonb(x) order by x.day),'[]'::jsonb) from daily x)
) into v;return v;
end $function$
;
revoke all on function public.admin_communications_dashboard_v1(integer,date,date,text,text,text,text) from public,anon,authenticated;
grant execute on function public.admin_communications_dashboard_v1(integer,date,date,text,text,text,text) to service_role;
