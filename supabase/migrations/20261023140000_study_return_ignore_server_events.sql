-- Exclude server-generated email and cron events when calculating last student activity.
-- Otherwise an automated reminder may postpone or trigger a later reminder.
CREATE OR REPLACE FUNCTION public.get_study_return_48h_candidates(p_cutoff timestamp with time zone, p_min_cutoff timestamp with time zone, p_study_min timestamp with time zone, p_limit integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, email text, display_name text, material_id uuid, material_title text, last_study_at timestamp with time zone, last_activity_at timestamp with time zone, pending_count integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  with study_signals as (
    select
      ae.user_id,
      (substring(ae.path from '^/materiales/([0-9a-fA-F-]{36})'))::uuid as material_id,
      ae.created_at as studied_at
    from public.analytics_events ae
    where ae.user_id is not null
      and ae.event_name = 'meaningful_study_completed'
      and coalesce(ae.metadata ->> 'content_type', '') = 'student_material'
      and ae.path ~ '^/materiales/[0-9a-fA-F-]{36}'
    union all
    select
      ae.user_id,
      (ae.metadata ->> 'material_id')::uuid as material_id,
      ae.created_at as studied_at
    from public.analytics_events ae
    where ae.user_id is not null
      and ae.event_name = 'study_tab_engagement'
      and coalesce(ae.metadata ->> 'material_id', '') ~ '^[0-9a-fA-F-]{36}$'
      and coalesce((ae.metadata ->> 'active_ms')::bigint, 0) >= 30000
    union all
    select
      fp.user_id,
      fp.student_material_id as material_id,
      fp.updated_at as studied_at
    from public.student_material_flashcard_progress fp
    union all
    select
      se.user_id,
      se.student_material_id as material_id,
      coalesce(se.last_reviewed_at, se.last_failed_at, se.updated_at) as studied_at
    from public.study_errors se
    where se.student_material_id is not null
  ),
  latest_study as (
    select distinct on (ss.user_id)
      ss.user_id,
      ss.material_id,
      ss.studied_at
    from study_signals ss
    join public.student_materials sm
      on sm.id = ss.material_id
     and sm.user_id = ss.user_id
     and sm.processing_status = 'ready'
    where ss.studied_at >= p_study_min
    order by ss.user_id, ss.studied_at desc
  ),
  analytics_last as (
    select ae.user_id, max(ae.created_at) as last_analytics_at
    from public.analytics_events ae
    where ae.user_id is not null
      and coalesce(ae.session_key, '') not like 'server:%'
      and ae.event_name not like '%_dispatch'
      and ae.event_name not like '%_sent'
    group by ae.user_id
  ),
  candidate_base as (
    select
      ls.user_id,
      ls.material_id,
      ls.studied_at as last_study_at,
      greatest(
        ls.studied_at,
        coalesce(al.last_analytics_at, ls.studied_at)
      ) as last_activity_at
    from latest_study ls
    left join analytics_last al on al.user_id = ls.user_id
  )
  select
    cb.user_id,
    u.email::text,
    coalesce(
      nullif(trim(p.nombre), ''),
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      split_part(u.email, '@', 1)
    )::text as display_name,
    cb.material_id,
    sm.title::text as material_title,
    cb.last_study_at,
    cb.last_activity_at,
    (
      select count(*)::integer
      from public.study_errors se
      where se.user_id = cb.user_id
        and se.student_material_id = cb.material_id
        and se.status = 'pending'
    ) as pending_count
  from candidate_base cb
  join auth.users u on u.id = cb.user_id
  join public.student_materials sm
    on sm.id = cb.material_id
   and sm.user_id = cb.user_id
   and sm.processing_status = 'ready'
  left join public.profiles p on p.id = cb.user_id
  where u.email is not null
    and u.email_confirmed_at is not null
    and cb.last_activity_at <= p_cutoff
    and cb.last_activity_at > p_min_cutoff
    and not exists (
      select 1
      from public.study_return_reminders srr
      where srr.user_id = cb.user_id
    )
    and not exists (
      select 1
      from public.email_reminder_deliveries erd
      where erd.user_id = cb.user_id
        and erd.status = 'sent'
        and erd.sent_at >= now() - interval '24 hours'
    )
    and not exists (
      select 1
      from public.flashcard_review_reminders frr
      where frr.user_id = cb.user_id
        and (
          (frr.status = 'sent' and frr.sent_at >= now() - interval '24 hours')
          or
          (frr.status = 'pending' and frr.scheduled_for <= now() + interval '24 hours')
        )
    )
    and not exists (
      select 1
      from public.email_campaign_deliveries ecd
      where ecd.user_id = cb.user_id
        and coalesce(ecd.sent_at, ecd.triggered_at) >= now() - interval '24 hours'
    )
    and not exists (
      select 1
      from public.student_materials esm
      where esm.user_id = cb.user_id
        and esm.exam_date is not null
        and (
          esm.exam_date - (now() at time zone 'America/Argentina/Buenos_Aires')::date
        ) in (1, 3, 7)
    )
    and not exists (
      select 1
      from public.study_calendar_events sce
      where sce.user_id = cb.user_id
        and sce.event_type = 'exam'
        and (
          sce.event_date - (now() at time zone 'America/Argentina/Buenos_Aires')::date
        ) in (1, 3, 7)
    )
  order by cb.last_activity_at asc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$function$
;
