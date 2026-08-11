create table if not exists public.rate_limits (
  id bigint primary key generated always as identity,
  key text not null,
  count integer not null default 1,
  reset_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limits_key_reset on public.rate_limits (key, reset_at);

comment on table public.rate_limits is 'Rate limiting store for API protection in serverless environments';
comment on column public.rate_limits.key is 'Client identifier (e.g. IP address or user ID)';
comment on column public.rate_limits.reset_at is 'Timestamp when the rate limit window resets';
