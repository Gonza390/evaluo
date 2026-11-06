-- Creem USD (sandbox y live): intentos aislados de Mercado Pago.
create table if not exists public.creem_checkout_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 plan_id uuid not null references public.subscription_plans(id) on delete restrict,
 mode text not null check (mode in ('test','live')),
 product_id text not null,
 expected_amount_cents integer not null check (expected_amount_cents > 0),
 currency text not null default 'USD' check (currency = 'USD'),
 status text not null default 'created' check (status in ('created','pending','paid','canceled','expired','refunded','disputed','failed')),
 checkout_id text,
 subscription_id text,
 customer_id text,
 last_transaction_id text,
 current_period_end timestamptz,
 last_event_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint creem_checkout_unique unique (mode,checkout_id),
 constraint creem_subscription_unique unique (mode,subscription_id)
);
create index if not exists creem_checkout_user_created on public.creem_checkout_sessions(user_id,created_at desc);
alter table public.creem_checkout_sessions enable row level security;
revoke all on public.creem_checkout_sessions from anon,authenticated;
grant select on public.creem_checkout_sessions to authenticated;
grant all on public.creem_checkout_sessions to service_role;
drop policy if exists creem_checkout_read_own on public.creem_checkout_sessions;
create policy creem_checkout_read_own on public.creem_checkout_sessions
 for select to authenticated using ((select auth.uid()) = user_id);
comment on table public.creem_checkout_sessions is
 'Creem USD payment ledger; test records must never grant user_subscriptions Premium.';
