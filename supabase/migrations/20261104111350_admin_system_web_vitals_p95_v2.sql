CREATE OR REPLACE FUNCTION public.admin_system_ai_dashboard_v2(p_days integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare snapshot jsonb;enhanced jsonb;start_at timestamptz;
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
  (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role'
 then raise exception 'service role only' using errcode='42501';end if;
 snapshot:=public.admin_system_ai_dashboard_v1(p_days);
 start_at:=now()-make_interval(days=>p_days);
 with vitals as materialized(
  select e.path,e.metadata->>'metric' metric,(e.metadata->>'value_ms')::numeric ms
  from public.analytics_events e
  where e.event_name='product_web_vital'
    and e.user_id is not null
    and e.created_at>=start_at
    and e.metadata->>'measurement_version'='1'
    and (e.metadata->>'metric') in('LCP','TTFB')
    and (e.metadata->>'value_ms') ~ '^[0-9]{1,6}$'
    and (e.metadata->>'value_ms')::numeric<=120000
    and e.path in('/dashboard','/dashboard/materiales/subir','/dashboard/materiales',
      '/materiales/[id]','/dashboard/practicar','/dashboard/plan-de-estudio')
 ),
 grouped as(
  select path,
  count(*)filter(where metric='LCP')::bigint lcp_samples,
  count(*)filter(where metric='TTFB')::bigint ttfb_samples,
  round((percentile_cont(0.95) within group(order by ms)
    filter(where metric='LCP'))::numeric,0) lcp_p95_ms,
  round((percentile_cont(0.95) within group(order by ms)
    filter(where metric='TTFB'))::numeric,0) ttfb_p95_ms
  from vitals group by path
 ),
 rows as(
  select item.value row,item.ordinality,
   case item.value->>'ord'
    when '1' then '/dashboard'
    when '2' then '/dashboard/materiales/subir'
    when '3' then '/materiales/[id]'
    when '4' then '/dashboard/practicar'
    when '5' then '/dashboard/plan-de-estudio'
   end screen_path
  from jsonb_array_elements(snapshot->'performance') with ordinality item(value,ordinality)
 )
 select coalesce(jsonb_agg(
  r.row||jsonb_build_object(
   'lcp_samples',coalesce(g.lcp_samples,0),
   'ttfb_samples',coalesce(g.ttfb_samples,0),
   'lcp_p95_ms',case when coalesce(g.lcp_samples,0)>=20 then g.lcp_p95_ms end,
   'ttfb_p95_ms',case when coalesce(g.ttfb_samples,0)>=20 then g.ttfb_p95_ms end)
  order by r.ordinality),'[]'::jsonb)
 into enhanced from rows r left join grouped g on g.path=r.screen_path;
 return jsonb_set(snapshot,'{performance}',enhanced,false);
end $function$
;
revoke all on function public.admin_system_ai_dashboard_v2(integer) from public,anon,authenticated;
grant execute on function public.admin_system_ai_dashboard_v2(integer) to service_role;
