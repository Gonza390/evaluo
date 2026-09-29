drop function if exists public.admin_product_user_journeys(integer, uuid[]);

delete from public.analytics_events
where event_name in (
  'content_available',
  'content_empty',
  'study_content_opened',
  'meaningful_study_completed',
  'pdf_file_selected',
  'pdf_upload_completed',
  'pdf_nudge_viewed',
  'pdf_nudge_clicked',
  'pdf_limit_reached',
  'pdf_limit_upgrade_clicked',
  'reminder_clicked',
  'study_tab_opened',
  'study_tab_engagement',
  'flashcard_session_started',
  'flashcard_session_completed'
);

delete from public.analytics_events_archive
where event_name in (
  'content_available',
  'content_empty',
  'study_content_opened',
  'meaningful_study_completed',
  'pdf_file_selected',
  'pdf_upload_completed',
  'pdf_nudge_viewed',
  'pdf_nudge_clicked',
  'pdf_limit_reached',
  'pdf_limit_upgrade_clicked',
  'reminder_clicked',
  'study_tab_opened',
  'study_tab_engagement',
  'flashcard_session_started',
  'flashcard_session_completed'
);
