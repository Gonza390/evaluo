-- Suscripciones de Mercado Pago: checkout, conciliacion e idempotencia.
alter table public.user_subscriptions
  add column if not exists provider_subscription_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists next_payment_date timestamptz,
  add column if not exists promotion_code text,
  add column if not exists promotional_cycles_used integer not null default 0,
  add column if not exists provider_updated_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists user_subscriptions_provider_subscription_uidx
  on public.user_subscriptions (payment_provider, provider_subscription_id);

create table if not exists public.payment_promotion_claims (
  id uuid primary key default gen_random_uuid(),
  promotion_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'activated', 'released')),
  reserved_at timestamptz not null default now(),
  activated_at timestamptz,
  released_at timestamptz,
  unique (promotion_code, user_id)
);

create unique index if not exists payment_promotion_founders_active_user_uidx
  on public.payment_promotion_claims (user_id)
  where promotion_code = 'founders_2026' and status in ('pending', 'activated');

create table if not exists public.payment_checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  promotion_claim_id uuid references public.payment_promotion_claims(id) on delete set null,
  provider text not null default 'mercadopago',
  provider_subscription_id text,
  amount_ars numeric(10,2) not null check (amount_ars > 0),
  currency text not null default 'ARS',
  status text not null default 'created' check (status in ('created', 'pending', 'approved', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_checkout_attempts_provider_subscription_uidx
  on public.payment_checkout_attempts (provider, provider_subscription_id)
  where provider_subscription_id is not null;
create index if not exists payment_checkout_attempts_user_created_idx
  on public.payment_checkout_attempts (user_id, created_at desc);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.user_subscriptions(id) on delete set null,
  provider text not null default 'mercadopago',
  provider_payment_id text not null,
  provider_subscription_id text,
  status text not null,
  amount_ars numeric(10,2),
  currency text,
  paid_at timestamptz,
  raw_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create index if not exists payment_transactions_user_created_idx
  on public.payment_transactions (user_id, created_at desc);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercadopago',
  provider_event_id text not null,
  event_type text not null,
  resource_id text not null,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

alter table public.payment_promotion_claims enable row level security;
alter table public.payment_checkout_attempts enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy payment_checkout_attempts_read_own
on public.payment_checkout_attempts for select to authenticated
using (auth.uid() = user_id);

create policy payment_transactions_read_own
on public.payment_transactions for select to authenticated
using (auth.uid() = user_id);

-- Las escrituras quedan reservadas al service role. No se crean policies de insert/update/delete.

create or replace function public.claim_founders_promotion(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_claim_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtext('evaluo:founders_2026'));

  update public.payment_promotion_claims
  set status = 'released', released_at = now()
  where promotion_code = 'founders_2026'
    and status = 'pending'
    and reserved_at < now() - interval '60 minutes';

  select id into v_claim_id
  from public.payment_promotion_claims
  where promotion_code = 'founders_2026'
    and user_id = p_user_id
    and status in ('pending', 'activated')
  limit 1;

  if v_claim_id is not null then
    return v_claim_id;
  end if;

  if (
    select count(*) from public.payment_promotion_claims
    where promotion_code = 'founders_2026' and status in ('pending', 'activated')
  ) >= 100 then
    return null;
  end if;

  insert into public.payment_promotion_claims (promotion_code, user_id)
  values ('founders_2026', p_user_id)
  returning id into v_claim_id;

  return v_claim_id;
end;
$$;

revoke all on function public.claim_founders_promotion(uuid) from public, anon, authenticated;
grant execute on function public.claim_founders_promotion(uuid) to service_role;

update public.subscription_plans
set price_ars = 12990, interval = 'monthly', is_active = true
where code = 'premium';
