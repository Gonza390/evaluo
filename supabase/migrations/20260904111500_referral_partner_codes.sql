create table if not exists public.referral_partners (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  brand_name text,
  contact_email text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.referral_partners(id) on delete restrict,
  code text not null check (code ~ '^[A-Za-z0-9_-]{3,32}$'),
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  applies_to text not null default 'all' check (applies_to in ('all', 'monthly', 'semester')),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create unique index if not exists referral_codes_upper_code_uidx
  on public.referral_codes (upper(code));
create index if not exists referral_codes_partner_idx
  on public.referral_codes (partner_id, created_at desc);

create table if not exists public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referral_code_id uuid not null references public.referral_codes(id) on delete restrict,
  source text not null default 'link' check (source in ('link', 'manual', 'admin')),
  user_created_at timestamptz,
  attributed_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists referral_attributions_code_idx
  on public.referral_attributions (referral_code_id, attributed_at desc);

alter table public.payment_promotion_claims
  add column if not exists referral_code_id uuid references public.referral_codes(id) on delete restrict,
  add column if not exists discount_percent numeric(5,2),
  add column if not exists base_amount_ars numeric(10,2),
  add column if not exists discount_amount_ars numeric(10,2);

create unique index if not exists payment_promotion_claims_referral_user_uidx
  on public.payment_promotion_claims (user_id, referral_code_id)
  where referral_code_id is not null;
create index if not exists payment_promotion_claims_referral_status_idx
  on public.payment_promotion_claims (referral_code_id, status, reserved_at desc)
  where referral_code_id is not null;

alter table public.payment_checkout_attempts
  add column if not exists offer_code text,
  add column if not exists base_amount_ars numeric(10,2),
  add column if not exists discount_amount_ars numeric(10,2),
  add column if not exists referral_code_id uuid references public.referral_codes(id) on delete restrict;

update public.payment_checkout_attempts
set offer_code = case when amount_ars = 45000 then 'semester' else 'monthly' end
where offer_code is null;

update public.payment_checkout_attempts
set base_amount_ars = amount_ars
where base_amount_ars is null;

update public.payment_checkout_attempts
set discount_amount_ars = 0
where discount_amount_ars is null;

alter table public.payment_checkout_attempts
  alter column offer_code set default 'monthly',
  alter column offer_code set not null,
  alter column base_amount_ars set not null,
  alter column discount_amount_ars set default 0,
  alter column discount_amount_ars set not null;

alter table public.payment_checkout_attempts
  drop constraint if exists payment_checkout_attempts_offer_code_check;
alter table public.payment_checkout_attempts
  add constraint payment_checkout_attempts_offer_code_check
  check (offer_code in ('monthly', 'semester', 'recovery'));

alter table public.payment_checkout_attempts
  drop constraint if exists payment_checkout_attempts_base_amount_ars_check;
alter table public.payment_checkout_attempts
  add constraint payment_checkout_attempts_base_amount_ars_check
  check (base_amount_ars > 0);

alter table public.payment_checkout_attempts
  drop constraint if exists payment_checkout_attempts_discount_amount_ars_check;
alter table public.payment_checkout_attempts
  add constraint payment_checkout_attempts_discount_amount_ars_check
  check (discount_amount_ars >= 0 and discount_amount_ars < base_amount_ars);

create index if not exists payment_checkout_attempts_offer_status_idx
  on public.payment_checkout_attempts (offer_code, status, updated_at desc);
create index if not exists payment_checkout_attempts_referral_idx
  on public.payment_checkout_attempts (referral_code_id, status, created_at desc)
  where referral_code_id is not null;

alter table public.referral_partners enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_attributions enable row level security;

create or replace function public.claim_referral_attribution(
  p_user_id uuid,
  p_code text,
  p_source text default 'link'
)
returns table (
  referral_code_id uuid,
  code text,
  discount_percent numeric,
  applies_to text,
  partner_id uuid,
  partner_name text,
  brand_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_existing_code_id uuid;
  v_user_created_at timestamptz;
begin
  if p_user_id is null or v_code !~ '^[A-Z0-9_-]{3,32}$' then
    return;
  end if;

  if p_source not in ('link', 'manual', 'admin') then
    p_source := 'link';
  end if;

  select ra.referral_code_id
    into v_existing_code_id
  from public.referral_attributions ra
  where ra.user_id = p_user_id
  limit 1;

  if v_existing_code_id is null then
    select rc.id
      into v_existing_code_id
    from public.referral_codes rc
    join public.referral_partners rp on rp.id = rc.partner_id
    where upper(rc.code) = v_code
      and rc.is_active = true
      and rp.status = 'active'
      and (rc.starts_at is null or rc.starts_at <= now())
      and (rc.ends_at is null or rc.ends_at > now())
    limit 1;

    if v_existing_code_id is null then
      return;
    end if;

    select au.created_at into v_user_created_at
    from auth.users au
    where au.id = p_user_id;

    insert into public.referral_attributions (
      user_id,
      referral_code_id,
      source,
      user_created_at
    ) values (
      p_user_id,
      v_existing_code_id,
      p_source,
      v_user_created_at
    )
    on conflict (user_id) do nothing;

    select ra.referral_code_id
      into v_existing_code_id
    from public.referral_attributions ra
    where ra.user_id = p_user_id
    limit 1;
  end if;

  return query
  select
    rc.id,
    upper(rc.code),
    rc.discount_percent,
    rc.applies_to,
    rp.id,
    rp.display_name,
    rp.brand_name
  from public.referral_codes rc
  join public.referral_partners rp on rp.id = rc.partner_id
  where rc.id = v_existing_code_id;
end;
$$;

revoke all on function public.claim_referral_attribution(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_referral_attribution(uuid, text, text) to service_role;

create or replace function public.reserve_referral_promotion(
  p_user_id uuid,
  p_referral_code_id uuid,
  p_base_amount_ars numeric,
  p_offer_code text
)
returns table (
  claim_id uuid,
  promotion_code text,
  discount_percent numeric,
  discount_amount_ars numeric,
  amount_ars numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code public.referral_codes%rowtype;
  v_claim public.payment_promotion_claims%rowtype;
  v_discount numeric(10,2);
  v_amount numeric(10,2);
  v_reserved_count integer;
begin
  if p_user_id is null or p_referral_code_id is null or p_base_amount_ars is null or p_base_amount_ars <= 0 then
    return;
  end if;

  if p_offer_code not in ('monthly', 'semester') then
    return;
  end if;

  select rc.* into v_code
  from public.referral_codes rc
  join public.referral_partners rp on rp.id = rc.partner_id
  where rc.id = p_referral_code_id
    and rc.is_active = true
    and rp.status = 'active'
    and (rc.starts_at is null or rc.starts_at <= now())
    and (rc.ends_at is null or rc.ends_at > now())
    and (rc.applies_to = 'all' or rc.applies_to = p_offer_code)
  for update of rc;

  if not found then
    return;
  end if;

  if not exists (
    select 1 from public.referral_attributions ra
    where ra.user_id = p_user_id
      and ra.referral_code_id = p_referral_code_id
  ) then
    return;
  end if;

  update public.payment_promotion_claims
  set status = 'released', released_at = now()
  where referral_code_id = p_referral_code_id
    and status = 'pending'
    and reserved_at < now() - interval '60 minutes';

  select pc.* into v_claim
  from public.payment_promotion_claims pc
  where pc.user_id = p_user_id
    and pc.referral_code_id = p_referral_code_id
    and pc.status in ('pending', 'activated')
  limit 1;

  if found then
    return query
    select
      v_claim.id,
      v_claim.promotion_code,
      coalesce(v_claim.discount_percent, v_code.discount_percent),
      coalesce(v_claim.discount_amount_ars, round(p_base_amount_ars * v_code.discount_percent / 100, 2)),
      greatest(1::numeric, round(p_base_amount_ars - coalesce(v_claim.discount_amount_ars, round(p_base_amount_ars * v_code.discount_percent / 100, 2)), 2));
    return;
  end if;

  if v_code.max_redemptions is not null then
    select count(*) into v_reserved_count
    from public.payment_promotion_claims pc
    where pc.referral_code_id = p_referral_code_id
      and pc.status in ('pending', 'activated');

    if v_reserved_count >= v_code.max_redemptions then
      return;
    end if;
  end if;

  v_discount := least(
    p_base_amount_ars - 1,
    round(p_base_amount_ars * v_code.discount_percent / 100, 2)
  );
  v_amount := greatest(1::numeric, round(p_base_amount_ars - v_discount, 2));

  insert into public.payment_promotion_claims (
    promotion_code,
    user_id,
    referral_code_id,
    discount_percent,
    base_amount_ars,
    discount_amount_ars
  ) values (
    upper(v_code.code),
    p_user_id,
    p_referral_code_id,
    v_code.discount_percent,
    p_base_amount_ars,
    v_discount
  )
  on conflict (promotion_code, user_id) do update
  set
    referral_code_id = excluded.referral_code_id,
    discount_percent = excluded.discount_percent,
    base_amount_ars = excluded.base_amount_ars,
    discount_amount_ars = excluded.discount_amount_ars,
    status = 'pending',
    reserved_at = now(),
    activated_at = null,
    released_at = null
  returning * into v_claim;

  return query
  select v_claim.id, v_claim.promotion_code, v_claim.discount_percent, v_claim.discount_amount_ars, v_amount;
end;
$$;

revoke all on function public.reserve_referral_promotion(uuid, uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.reserve_referral_promotion(uuid, uuid, numeric, text) to service_role;
