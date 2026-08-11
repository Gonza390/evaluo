create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid null references auth.users(id) on delete set null,
  session_key text not null,
  path text,
  device_type text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_name_idx
on public.analytics_events (event_name);

create index if not exists analytics_events_user_id_idx
on public.analytics_events (user_id);

create index if not exists analytics_events_session_key_idx
on public.analytics_events (session_key);

alter table public.analytics_events enable row level security;

drop policy if exists analytics_events_admin_read on public.analytics_events;
drop policy if exists analytics_events_no_client_write on public.analytics_events;

create policy analytics_events_admin_read
on public.analytics_events
for select
using (public.current_user_is_admin());

create policy analytics_events_no_client_write
on public.analytics_events
for insert
with check (false);

