-- Rate limit updates must be atomic: concurrent serverless invocations cannot safely do read/update in application code.
truncate table public.rate_limits;

alter table public.rate_limits
  add constraint rate_limits_key_unique unique (key);

alter table public.rate_limits enable row level security;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
  next_reset_at timestamptz;
begin
  if length(trim(p_key)) = 0 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.rate_limits as limits (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
  set count = case when limits.reset_at <= now() then 1 else limits.count + 1 end,
      reset_at = case when limits.reset_at <= now()
        then now() + make_interval(secs => p_window_seconds)
        else limits.reset_at
      end
  returning limits.count, limits.reset_at into next_count, next_reset_at;

  return query select
    next_count <= p_limit,
    greatest(0, p_limit - next_count),
    next_reset_at;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
