-- Reemplaza reset_test_user_data() por una version que recibe el user id
-- explícitamente. El callback de auth no puede depender de auth.uid() porque
-- la sesión recién intercambiada todavía no está en las cookies cuando se
-- invoca el RPC en el mismo request.

drop function if exists public.reset_test_user_data();
create or replace function public.reset_test_user_data(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if p_user_id is null then
    return false;
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = p_user_id;

  if v_email is distinct from 'gonza3900@gmail.com' then
    return false;
  end if;

  delete from public.student_material_chunks
  where student_material_id in (
    select id from public.student_materials where user_id = p_user_id
  );

  delete from public.student_material_summaries
  where student_material_id in (
    select id from public.student_materials where user_id = p_user_id
  );

  delete from public.student_material_glossaries
  where student_material_id in (
    select id from public.student_materials where user_id = p_user_id
  );

  delete from public.student_material_jobs
  where student_material_id in (
    select id from public.student_materials where user_id = p_user_id
  );

  delete from public.student_material_feedback
  where user_id = p_user_id;

  delete from public.student_materials where user_id = p_user_id;

  delete from public.simulator_attempts where user_id = p_user_id;
  delete from public.student_topic_performance where user_id = p_user_id;
  delete from public.historial_respuestas where usuario_id = p_user_id;
  delete from public.study_calendar_events where user_id = p_user_id;
  delete from public.user_favorites where user_id = p_user_id;
  delete from public.user_notifications where user_id = p_user_id;
  delete from public.explanations_history where user_id = p_user_id;
  delete from public.user_subscriptions where user_id = p_user_id;
  delete from public.resource_votes where user_id = p_user_id;
  delete from public.resource_views where user_id = p_user_id;
  delete from public.analytics_events where user_id = p_user_id;

  update public.profiles
  set nombre = null,
      universidad_id = null,
      whatsapp = null,
      carrera_id = null,
      last_subject_id = null,
      last_subject_name = null,
      active_subjects = null,
      finished_subjects = null,
      dashboard_analytics = null,
      updated_at = now()
  where id = p_user_id;

  return true;
end;
$$;
revoke all on function public.reset_test_user_data(uuid) from public;
grant execute on function public.reset_test_user_data(uuid) to authenticated;
grant execute on function public.reset_test_user_data(uuid) to service_role;
