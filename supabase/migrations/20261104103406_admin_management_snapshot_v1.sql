CREATE OR REPLACE FUNCTION public.admin_management_snapshot_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
  if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
    (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
  then raise exception 'service_role only' using errcode='42501'; end if;
  with
  admin_members as materialized (
    select p.id,p.nombre,a.last_sign_in_at,
      exists(select 1 from auth.mfa_factors f where f.user_id=p.id and f.status='verified') mfa_enabled
    from public.profiles p join auth.users a on a.id=p.id
    where p.role='admin' order by p.nombre nulls last limit 25
  ),
  requests_raw as materialized (
    select 'university'::text kind, r.id,r.university_name title,
      concat_ws(' · ',r.country,r.city) origin,
      r.created_at,r.status::text status,
      true parent_approved
    from public.university_requests r
    union all
    select 'career',c.id,c.nombre,coalesce(u.nombre,'Sin universidad'),c.created_at,c.approval_status,
      true
    from public.carreras c left join public.universidades u on u.id=c.universidad_id
    where c.approval_status<>'approved'
    union all
    select 'subject',s.id,s.nombre,concat_ws(' · ',c.nombre,u.nombre),null::timestamptz,s.approval_status,
      coalesce(c.approval_status='approved',false)
    from public.materias s left join public.carreras c on c.id=s.carrera_id
      left join public.universidades u on u.id=c.universidad_id
    where s.approval_status<>'approved'
  ),
  requests as (
    select * from requests_raw
      order by (status in('pending','reviewing','planned')) desc,
        created_at desc nulls last,title
      limit 45
  ),
  feedback_base as materialized (
    select 'product'::text source,e.id,
     left(coalesce(nullif(e.metadata->>'message',''),nullif(e.metadata->>'category',''),'Comentario sin texto'),200) description,
     coalesce(nullif(e.metadata->>'category',''),'Comentario') category,
     e.created_at,'Usuario'::text submitted_by
    from public.analytics_events e where e.event_name='product_feedback'
    union all
    select 'simulator',s.id,
     left(coalesce(nullif(s.comment,''),nullif(s.reason,''),'Comentario de simulador'),200),
     'Simulador',s.created_at,'Usuario'
    from public.simulator_feedback s
    union all
    select 'material',m.id,
      left(coalesce(nullif(m.report_note,''),nullif(m.report_reason,''),'Valoración negativa de material'),200),
      coalesce(nullif(m.report_reason,''),'Material'),m.created_at,'Usuario'
    from public.student_material_feedback m
    where m.rating='down' or m.report_reason is not null
  ),
  feedback_rows as materialized (
    select f.*,coalesce(t.status,'open') status,t.updated_at
    from feedback_base f left join public.admin_management_feedback_triage t
      on t.source=f.source and t.feedback_id=f.id
  ),
  feedback_page as (
    select * from feedback_rows
      order by (status<>'resolved') desc,created_at desc,id limit 35
  ),
  audit_page as (
    select a.id,a.created_at,a.action,a.object_type,a.object_id,
       a.before_state,a.after_state,a.result,coalesce(nullif(p.nombre,''),'Administrador') actor
    from public.admin_management_audit a left join public.profiles p on p.id=a.actor_id
    order by a.created_at desc limit 40
  ),
  request_summary as (
    select count(*) filter(where status in('pending','reviewing','planned'))::bigint pending,
      count(*) filter(where kind='university' and status in('pending','reviewing','planned'))::bigint universities_pending
    from requests_raw
  ),
  feedback_summary as (
    select count(*) filter(where status<>'resolved')::bigint open_feedback,
      count(*) filter(where status<>'resolved' and (lower(category) like '%problema%'
        or lower(category) like '%error%'
        or lower(category) like '%bug%'
        or source='simulator'))::bigint errors
    from feedback_rows
  ),
  academic_summary as (
    select
      (select count(*) from public.universidades where approval_status='approved')::bigint universities,
      (select count(*) from public.carreras where approval_status='approved')::bigint careers,
      (select count(*) from public.materias where approval_status='approved')::bigint subjects
  )
  select jsonb_build_object(
    'admins',(select coalesce(jsonb_agg(to_jsonb(a) order by a.nombre),'[]'::jsonb) from admin_members a),
    'requests',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from requests r),
    'feedback',(select coalesce(jsonb_agg(to_jsonb(f)),'[]'::jsonb) from feedback_page f),
    'audit',(select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) from audit_page a),
    'request_summary',(select to_jsonb(s) from request_summary s),
    'feedback_summary',(select to_jsonb(s) from feedback_summary s),
    'academic_summary',(select to_jsonb(s) from academic_summary s),
    'policy',jsonb_build_object(
      'real_roles','admin/student',
      'hierarchical_roles_enabled',false,
      'settings_editable',false,
      'configuration_source','código de aplicación'
    )
  ) into result;
  return result;
end $function$
;
revoke all on function public.admin_management_snapshot_v1() from public,anon,authenticated;
grant execute on function public.admin_management_snapshot_v1() to service_role;
