create index concurrently if not exists idx_analytics_events_user_event_created
on public.analytics_events (user_id, event_name, created_at desc);
