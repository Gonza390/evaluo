-- RPC de reset de usuario de prueba.
-- Cuando loguea gonza3900@gmail.com, borra todo su historial de uso y deja el
-- perfil como si fuera un usuario recien registrado (sin universidad/carrera,
-- por lo que el callback lo manda a /completar-perfil).
--
-- Solo actua sobre el usuario autenticado y solo si su email es el de prueba,
-- para que nadie pueda borrar datos ajenos.

create or replace function public.reset_test_user_data()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = auth.uid();

  if v_email is distinct from 'gonza3900@gmail.com' then
    return false;
  end if;

  delete from public.student_material_chunks
  where student_material_id in (
    select id from public.student_materials where user_id = auth.uid()
  );

  delete from public.student_material_summaries
  where student_material_id in (
    select id from public.student_materials where user_id = auth.uid()
  );

  delete from public.student_material_glossaries
  where student_material_id in (
    select id from public.student_materials where user_id = auth.uid()
  );

  delete from public.student_material_jobs
  where student_material_id in (
    select id from public.student_materials where user_id = auth.uid()
  );

  delete from public.student_material_feedback
  where user_id = auth.uid();

  delete from public.student_materials where user_id = auth.uid();

  delete from public.simulator_attempts where user_id = auth.uid();
  delete from public.student_topic_performance where user_id = auth.uid();
  delete from public.historial_respuestas where usuario_id = auth.uid();
  delete from public.study_calendar_events where user_id = auth.uid();
  delete from public.user_favorites where user_id = auth.uid();
  delete from public.user_notifications where user_id = auth.uid();
  delete from public.explanations_history where user_id = auth.uid();
  delete from public.user_subscriptions where user_id = auth.uid();
  delete from public.resource_votes where user_id = auth.uid();
  delete from public.resource_views where user_id = auth.uid();
  delete from public.analytics_events where user_id = auth.uid();

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
  where id = auth.uid();

  return true;
end;
$$;
revoke all on function public.reset_test_user_data() from public;
grant execute on function public.reset_test_user_data() to authenticated;
grant execute on function public.reset_test_user_data() to service_role;
