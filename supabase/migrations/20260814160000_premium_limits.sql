alter table public.simulator_attempts
  add column if not exists mode text not null default 'regular';

create index if not exists simulator_attempts_user_mode_created_idx
  on public.simulator_attempts(user_id, mode, created_at desc);
