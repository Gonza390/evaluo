-- A single, read-only volume check for PDF lifecycle emails, using existing delivery logs.
-- Accessible only to the server-side service role; client accounts must not query it.
create or replace function public.get_pdf_lifecycle_email_volume(p_user_id uuid)
returns table(sent_24h integer, sent_7d integer)
language sql stable security invoker
set search_path = public
as $$
  with sent as (
    select sent_at from public.student_material_ready_emails
      where user_id=p_user_id and status='sent' and sent_at>=now()-interval '7 days'
    union all
    select sent_at from public.email_reminder_deliveries
      where user_id=p_user_id and status='sent' and sent_at>=now()-interval '7 days'
    union all
    select sent_at from public.flashcard_review_reminders
      where user_id=p_user_id and status='sent' and sent_at>=now()-interval '7 days'
    union all
    select sent_at from public.study_return_reminders
      where user_id=p_user_id and status='sent' and sent_at>=now()-interval '7 days'
    union all
    select sent_at from public.email_campaign_deliveries
      where user_id=p_user_id and status='sent' and campaign_key like 'study_return_d1_v1:%'
        and sent_at>=now()-interval '7 days'
  )
  select count(*) filter(where sent_at>=now()-interval '24 hours')::integer,
         count(*)::integer
  from sent;
$$;
revoke all on function public.get_pdf_lifecycle_email_volume(uuid) from public, anon, authenticated;
grant execute on function public.get_pdf_lifecycle_email_volume(uuid) to service_role;
