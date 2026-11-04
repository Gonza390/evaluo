CREATE OR REPLACE FUNCTION public.admin_acquisition_dashboard_packed_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role' then raise exception 'service role only' using errcode='42501';end if;
 v:=public.admin_acquisition_dashboard_v1();
 return jsonb_build_object('version',1,'from',v->'from','through',v->'through','coverage',v->'coverage','rows',
 (select coalesce(jsonb_agg(jsonb_build_array(r.value->'d',r.value->'channel',r.value->'page_type',r.value->'landing',r.value->'campaign',r.value->'utm_source',r.value->'utm_medium',r.value->'utm_content',r.value->'device',r.value->'sessions',r.value->'clicks',r.value->'signup_started',r.value->'registered',r.value->'uploaded',r.value->'studied_sessions',r.value->'activated',r.value->'step_signup_started',r.value->'step_registered',r.value->'step_uploaded',r.value->'step_studied') order by r.ordinality),'[]'::jsonb)
 from jsonb_array_elements(v->'rows') with ordinality r(value,ordinality)));
end $function$
;
revoke all on function public.admin_acquisition_dashboard_packed_v1() from public,anon,authenticated;
grant execute on function public.admin_acquisition_dashboard_packed_v1() to service_role;

CREATE OR REPLACE FUNCTION public.admin_activation_cohort_packed_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
 if coalesce(nullif(current_setting('request.jwt.claim.role',true),''),(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')) is distinct from 'service_role' then raise exception 'service role only' using errcode='42501';end if;
 v:=public.admin_activation_cohort_v1();
 return jsonb_build_object('version',1,'from',v->'from','through',v->'through','coverage',v->'coverage','rows',
 (select coalesce(jsonb_agg(jsonb_build_array(r.value->'d',r.value->'device',r.value->'source',r.value->'file_type',r.value->'first_path',r.value->'premium',r.value->'registered',r.value->'uploaded',r.value->'ready',r.value->'failed',r.value->'opened_material',r.value->'summary',r.value->'studied',r.value->'practice_started',r.value->'practice_finished',r.value->'funnel_summary',r.value->'funnel_practice',r.value->'funnel_finished',r.value->'flashcards',r.value->'guide_started',r.value->'guide_completed',r.value->'academic_profile',r.value->'university',r.value->'career',r.value->'profile_completed',r.value->'read_finished',r.value->'direct_finished',r.value->'study_minutes_sum',r.value->'study_minutes_count',r.value->'practice_minutes_sum',r.value->'practice_minutes_count') order by r.ordinality),'[]'::jsonb)
 from jsonb_array_elements(v->'rows') with ordinality r(value,ordinality)));
end $function$
;
revoke all on function public.admin_activation_cohort_packed_v1() from public,anon,authenticated;
grant execute on function public.admin_activation_cohort_packed_v1() to service_role;