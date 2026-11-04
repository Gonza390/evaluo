CREATE OR REPLACE FUNCTION public.admin_system_ai_dashboard_v1(p_days integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare st timestamptz; result jsonb;
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
   (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
 then raise exception 'service_role only' using errcode='42501'; end if;
 if p_days not in(1,7,14,30) then raise exception 'Invalid window';end if;
 st:=now()-make_interval(days=>p_days);
 with
 materials as materialized(
 select m.id,m.created_at,m.processing_status,m.processing_error,
 case when m.mime_type='application/pdf' then 'PDF'
 when m.mime_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document' then 'DOCX'
 else 'Otro' end file_type
 from public.student_materials m where m.created_at>=st),
 jobs as materialized(
 select j.id,j.status,j.attempts,j.created_at,
 case when j.started_at is not null and j.completed_at is not null and j.completed_at>=j.started_at then
 extract(epoch from (j.completed_at-j.started_at)) end seconds,
 case when lower(coalesce(j.last_error,'')) ~ 'timeout|timed out' then 'Timeout'
 when lower(coalesce(j.last_error,'')) ~ 'extract|empty|text' then 'Extracción de texto'
 when lower(coalesce(j.last_error,'')) ~ 'gemini|groq|provider|model' then 'Error de IA'
 when lower(coalesce(j.last_error,'')) ~ 'invalid|formato|type|size' then 'Archivo inválido'
 else 'Sin categoría específica' end error_group
 from public.student_material_jobs j where j.created_at>=st),
 ai as materialized(
 select a.operation,a.provider,a.model,a.student_material_id,a.prompt_tokens,
 a.completion_tokens,a.total_tokens,a.created_at from public.student_material_ai_usage a where a.created_at>=st),
 client_errors as materialized(
 select e.id,e.created_at,
 case when e.path like '/dashboard/plan-de-estudio%' then '/dashboard/plan-de-estudio'
 when e.path like '/dashboard%' then '/dashboard'
 when e.path like '/materiales/%' then '/materiales/[id]'
 when e.path like '/practicar%' then '/practicar'
 when e.path like '/simulador%' then '/simulador'
 else left(regexp_replace(coalesce(e.path,'Sin ruta'),'[0-9a-f]{8}-[0-9a-f-]{27,}','[id]','gi'),75)
 end path,
 case when lower(coalesce(e.metadata->>'message','')) ~ 'failed to fetch|load failed|network' then 'Fallo de conexión'
 when lower(coalesce(e.metadata->>'message','')) like '%script error%' then 'Error de script'
 when lower(coalesce(e.metadata->>'message','')) like '%timeout%' then 'Tiempo de espera'
 else 'Otro error del navegador' end category
 from public.analytics_events e where e.event_name='client_error' and e.created_at>=st),
 mat_by_type as(
 select file_type,count(*)::bigint uploaded,
 count(*) filter(where processing_status='ready')::bigint ready,
 count(*) filter(where processing_status='failed')::bigint failed,
 count(*) filter(where processing_status not in('ready','failed'))::bigint pending,
 count(*) filter(where processing_status not in('ready','failed') and created_at<now()-interval '15 minutes')::bigint stuck
 from materials group by file_type),
 mat_total as(
 select coalesce(sum(uploaded),0)::bigint uploaded,coalesce(sum(ready),0)::bigint ready,
 coalesce(sum(failed),0)::bigint failed,coalesce(sum(pending),0)::bigint pending,
 coalesce(sum(stuck),0)::bigint stuck from mat_by_type),
 job_total as(
 select count(*)::bigint jobs,count(*)filter(where attempts>1)::bigint retries,
 round(avg(seconds)filter(where status='completed'),1) avg_seconds,
 round((percentile_cont(0.95) within group(order by seconds)
 filter(where status='completed'))::numeric,1) p95_seconds from jobs),
 fail_reasons as(
 select error_group label,count(*)::bigint n from jobs where status='failed' group by 1 order by n desc limit 8),
 ai_total as(
 select count(*)::bigint requests,coalesce(sum(total_tokens),0)::bigint tokens,
 coalesce(sum(prompt_tokens),0)::bigint prompt_tokens,
 coalesce(sum(completion_tokens),0)::bigint completion_tokens,
 count(distinct student_material_id)::bigint materials from ai),
 ai_functions as(
 select case when operation like 'summary%' then 'Resúmenes'
 when operation like 'glossary%' then 'Glosario'
 when operation='source_vision' then 'Análisis visual'
 when operation='chunk_evaluation' then 'Evaluación de fragmentos'
 else 'Otra operación' end name,
 count(*)::bigint requests,coalesce(sum(total_tokens),0)::bigint tokens,
 coalesce(sum(prompt_tokens),0)::bigint prompt_tokens,
 coalesce(sum(completion_tokens),0)::bigint completion_tokens
 from ai group by 1 order by requests desc),
 ai_days as(
 select (created_at at time zone 'America/Argentina/Buenos_Aires')::date d,
 count(*)::bigint requests,coalesce(sum(total_tokens),0)::bigint tokens from ai group by 1),
 daily as(
 select g::date d,coalesce(a.requests,0)::bigint requests,coalesce(a.tokens,0)::bigint tokens
 from generate_series((st at time zone 'America/Argentina/Buenos_Aires')::date,
 (now() at time zone 'America/Argentina/Buenos_Aires')::date,'1 day'::interval) g
 left join ai_days a on a.d=g::date),
 incident_groups as(
 select 'Aplicación'::text area,category||' · '||path title,
 min(created_at) first_seen,max(created_at) last_seen,count(*)::bigint occurrences,
 'No se registra estado de resolución'::text state,'Sin clasificar'::text severity
 from client_errors group by category,path
 union all
 select 'Procesamiento',error_group||' · trabajo de material',
 min(created_at),max(created_at),count(*)::bigint,
 'Trabajo fallido, no necesariamente incidencia activa','Sin clasificar'
 from jobs where status='failed' group by error_group),
 incidents as(select * from incident_groups order by occurrences desc,last_seen desc limit 20),
 error_counts as(select path,count(*)::bigint n from client_errors group by path),
 performance as(
 select x.ord,x.name,x.note,
 coalesce((select sum(e.n) from error_counts e where e.path like x.pattern),0)::bigint errors
 from (values
 (1,'Dashboard del estudiante','Errores de navegador','/dashboard'),
 (2,'Carga y procesamiento','Trabajos de procesamiento','/materiales/[id]'),
 (3,'Resumen del material','Errores por material','/materiales/[id]'),
 (4,'Prácticas','Errores de prácticas','/practicar'),
 (5,'Planes de estudio','Errores del plan','/dashboard/plan-de-estudio')
 ) x(ord,name,note,pattern)
 ),
 storage_stats as(
 select count(*)::bigint objects,
 coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end),0)::bigint bytes from storage.objects)
 select jsonb_build_object(
 'period_days',p_days,
 'summary',jsonb_build_object('materials',(select to_jsonb(m) from mat_total m),
 'jobs',(select to_jsonb(j) from job_total j),'ai',(select to_jsonb(a) from ai_total a),
 'client_errors',(select count(*) from client_errors),
 'observed_groups',(select count(*) from incident_groups)),
 'types',(select coalesce(jsonb_agg(to_jsonb(x) order by x.file_type),'[]'::jsonb) from mat_by_type x),
 'reasons',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from fail_reasons x),
 'ai_functions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from ai_functions x),
 'daily',(select coalesce(jsonb_agg(to_jsonb(x) order by x.d),'[]'::jsonb) from daily x),
 'incidents',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from incidents x),
 'performance',(select coalesce(jsonb_agg(to_jsonb(x) order by x.ord),'[]'::jsonb) from performance x),
 'infra',jsonb_build_object('database_bytes',pg_database_size(current_database()),
 'storage',(select to_jsonb(x) from storage_stats x))
 ) into result;
 return result;
end $function$
;
revoke all on function public.admin_system_ai_dashboard_v1(integer) from public,anon,authenticated;
grant execute on function public.admin_system_ai_dashboard_v1(integer) to service_role;
