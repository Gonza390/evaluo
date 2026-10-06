create table if not exists public.study_error_onboarding_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pending_error_id uuid references public.study_errors(id) on delete set null,
  seen_at timestamptz,
  outcome text check (outcome in ('completed', 'skipped', 'legacy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_error_onboarding_state enable row level security;

revoke all on table public.study_error_onboarding_state from anon, authenticated;
grant select, insert, update, delete on table public.study_error_onboarding_state to service_role;

create index if not exists idx_study_error_onboarding_pending
  on public.study_error_onboarding_state (pending_error_id)
  where pending_error_id is not null;

insert into public.study_error_onboarding_state (user_id, seen_at, outcome)
select distinct user_id, now(), 'legacy'
from (
  select user_id
  from public.study_errors
  where user_id is not null

  union

  select user_id
  from public.analytics_events
  where user_id is not null
    and event_name = 'demo_checkpoint_reached'
    and metadata->>'source' = 'first-pdf-demo'
    and metadata->>'stage' = 'errors_viewed'
) existing_users
on conflict (user_id) do nothing;
