-- La tarea de Vercel que procesa PDFs se ejecuta una vez al día en Hobby.
-- Este watchdog de Postgres evita dejar un PDF en "processing" tras un timeout.
-- NO inicia nuevas llamadas de IA y no altera trabajos listos para estudiar.
create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists internal_tasks;
revoke all on schema internal_tasks from public, anon, authenticated;

create or replace function internal_tasks.fail_expired_material_jobs()
returns integer
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  recovered_count integer := 0;
begin
  with stale_jobs as (
    update public.student_material_jobs as j
       set status = 'failed',
           completed_at = clock_timestamp(),
           last_error = 'El procesamiento superó el tiempo máximo. Podés reintentarlo sin volver a subir el PDF.'
     where j.status = 'processing'
       and j.started_at < clock_timestamp() - interval '7 minutes'
     returning j.student_material_id
  ), failed_materials as (
    update public.student_materials as m
       set processing_status = 'failed',
           processing_stage = 'failed',
           processing_message = 'El procesamiento se interrumpió por tiempo límite.',
           processing_error = 'El procesamiento superó el tiempo máximo. Podés reintentarlo sin volver a subir el PDF.'
     where m.id in (select student_material_id from stale_jobs)
       and m.processing_status = 'processing'
     returning m.id
  )
  select count(*) into recovered_count from stale_jobs;
  return recovered_count;
end;
$function$;

revoke all on function internal_tasks.fail_expired_material_jobs() from public, anon, authenticated;

select cron.schedule(
  'recover-stale-pdf-jobs-every-5-min',
  '*/5 * * * *',
  'select internal_tasks.fail_expired_material_jobs()'
);
