create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price_ars numeric(10,2) not null default 0,
  interval text not null default 'monthly',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  payment_provider text,
  payment_reference text,
  amount_ars numeric(10,2),
  created_at timestamptz not null default now()
);

create index if not exists user_subscriptions_user_id_idx on public.user_subscriptions(user_id);
create index if not exists user_subscriptions_status_idx on public.user_subscriptions(status);

alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists subscription_plans_read_admin on public.subscription_plans;
drop policy if exists subscription_plans_write_admin on public.subscription_plans;
drop policy if exists user_subscriptions_read_admin_or_own on public.user_subscriptions;
drop policy if exists user_subscriptions_write_admin on public.user_subscriptions;

create policy subscription_plans_read_admin
on public.subscription_plans
for select
using (public.current_user_is_admin());

create policy subscription_plans_write_admin
on public.subscription_plans
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy user_subscriptions_read_admin_or_own
on public.user_subscriptions
for select
using (public.current_user_is_admin() or auth.uid() = user_id);

create policy user_subscriptions_write_admin
on public.user_subscriptions
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

insert into public.subscription_plans (code, name, price_ars, interval, is_active)
values
  ('free', 'Plan Free', 0, 'monthly', true),
  ('premium', 'Plan Premium', 12990, 'monthly', true)
on conflict (code) do nothing;

