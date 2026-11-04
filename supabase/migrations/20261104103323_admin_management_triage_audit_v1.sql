create table if not exists public.admin_management_feedback_triage(
 source text not null check(source in('product','simulator','material')),
 feedback_id uuid not null,
 status text not null default 'open' check(status in('open','in_progress','resolved')),
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now(),
 primary key(source,feedback_id)
);
alter table public.admin_management_feedback_triage enable row level security;
revoke all on public.admin_management_feedback_triage from public,anon,authenticated;
grant select,insert,update on public.admin_management_feedback_triage to service_role;
create table if not exists public.admin_management_audit(
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,object_type text not null,object_id text not null,
 before_state jsonb,after_state jsonb,
 result text not null default 'success' check(result in('success','denied','error')),
 created_at timestamptz not null default now()
);
create index if not exists admin_management_audit_created_idx on public.admin_management_audit(created_at desc);
alter table public.admin_management_audit enable row level security;
revoke all on public.admin_management_audit from public,anon,authenticated;
grant select,insert on public.admin_management_audit to service_role;
CREATE OR REPLACE FUNCTION public.admin_management_update_feedback_v1(p_actor uuid, p_source text, p_feedback_id uuid, p_expected text, p_next text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare prev text;updated text;
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
  (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
 then raise exception 'service_role required' using errcode='42501';end if;
 if not exists(select 1 from public.profiles p where p.id=p_actor and p.role='admin')
 then raise exception 'Not an administrator' using errcode='42501';end if;
 if p_source not in('product','simulator','material')
   or p_expected not in('open','in_progress') or p_next not in('in_progress','resolved')
   or (p_expected='open' and p_next<>'in_progress') or (p_expected='in_progress' and p_next<>'resolved')
 then raise exception 'Invalid feedback transition' using errcode='22023';end if;
 if not(
   (p_source='product' and exists(select 1 from public.analytics_events e where e.id=p_feedback_id and e.event_name='product_feedback'))
   or (p_source='simulator' and exists(select 1 from public.simulator_feedback e where e.id=p_feedback_id))
   or (p_source='material' and exists(select 1 from public.student_material_feedback e where e.id=p_feedback_id))
 ) then raise exception 'Feedback missing' using errcode='22023';end if;
 select t.status into prev from public.admin_management_feedback_triage t where t.source=p_source and t.feedback_id=p_feedback_id for update;
 if coalesce(prev,'open') <> p_expected then raise exception 'Feedback state changed, refresh before proceeding' using errcode='40001';end if;
 insert into public.admin_management_feedback_triage(source,feedback_id,status,updated_by,updated_at)
 values(p_source,p_feedback_id,p_next,p_actor,now())
 on conflict(source,feedback_id) do update set status=excluded.status,updated_by=excluded.updated_by,updated_at=excluded.updated_at
 where public.admin_management_feedback_triage.status=p_expected
 returning status into updated;
 if updated is distinct from p_next then raise exception 'Concurrent update, refresh before proceeding' using errcode='40001';end if;
 insert into public.admin_management_audit(actor_id,action,object_type,object_id,before_state,after_state,result)
 values(p_actor,'feedback_status_changed','feedback',p_source||':'||p_feedback_id::text,
 jsonb_build_object('status',p_expected),jsonb_build_object('status',p_next),'success');
 return jsonb_build_object('status',updated);
end$function$
;
revoke all on function public.admin_management_update_feedback_v1(uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_management_update_feedback_v1(uuid,text,uuid,text,text) to service_role;
