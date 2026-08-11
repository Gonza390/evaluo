create table if not exists public.study_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('exam', 'assignment')),
  title text not null,
  notes text null,
  event_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_calendar_events_user_date_idx
  on public.study_calendar_events(user_id, event_date asc, created_at desc);

create or replace function public.set_study_calendar_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists study_calendar_events_set_updated_at on public.study_calendar_events;

create trigger study_calendar_events_set_updated_at
before update on public.study_calendar_events
for each row
execute function public.set_study_calendar_events_updated_at();

alter table public.study_calendar_events enable row level security;

drop policy if exists study_calendar_events_select_own_or_admin on public.study_calendar_events;
create policy study_calendar_events_select_own_or_admin
on public.study_calendar_events
for select
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

drop policy if exists study_calendar_events_insert_own_or_admin on public.study_calendar_events;
create policy study_calendar_events_insert_own_or_admin
on public.study_calendar_events
for insert
with check (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

drop policy if exists study_calendar_events_update_own_or_admin on public.study_calendar_events;
create policy study_calendar_events_update_own_or_admin
on public.study_calendar_events
for update
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
)
with check (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

drop policy if exists study_calendar_events_delete_own_or_admin on public.study_calendar_events;
create policy study_calendar_events_delete_own_or_admin
on public.study_calendar_events
for delete
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
);
