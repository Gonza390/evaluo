create table if not exists public.referral_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists referral_brands_upper_name_uidx
  on public.referral_brands (upper(name));

alter table public.referral_partners
  add column if not exists brand_id uuid references public.referral_brands(id) on delete restrict;

create index if not exists referral_partners_brand_idx
  on public.referral_partners (brand_id, created_at desc);

create unique index if not exists referral_partners_brand_display_uidx
  on public.referral_partners (brand_id, lower(display_name));

-- No hay referentes creados aún; desde este punto cada referente debe pertenecer a una marca.
alter table public.referral_partners
  alter column brand_id set not null;

alter table public.referral_brands enable row level security;

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
    join public.referral_brands rb on rb.id = rp.brand_id
    where upper(rc.code) = v_code
      and rc.is_active = true
      and rp.status = 'active'
      and rb.status = 'active'
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
    rb.name
  from public.referral_codes rc
  join public.referral_partners rp on rp.id = rc.partner_id
  join public.referral_brands rb on rb.id = rp.brand_id
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
  join public.referral_brands rb on rb.id = rp.brand_id
  where rc.id = p_referral_code_id
    and rc.is_active = true
    and rp.status = 'active'
    and rb.status = 'active'
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
  on conflict on constraint payment_promotion_claims_promotion_code_user_id_key do update
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

create or replace function public.get_referral_code_metrics()
returns table (
  code_id uuid,
  code text,
  partner_id uuid,
  partner_name text,
  brand_id uuid,
  brand_name text,
  discount_percent numeric,
  applies_to text,
  max_redemptions integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean,
  attributed_users bigint,
  checkout_attempts bigint,
  approved_checkouts bigint,
  pending_checkouts bigint,
  failed_checkouts bigint,
  activated_claims bigint,
  revenue_ars numeric,
  discounts_ars numeric
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    rc.id as code_id,
    upper(rc.code) as code,
    rp.id as partner_id,
    rp.display_name as partner_name,
    rb.id as brand_id,
    rb.name as brand_name,
    rc.discount_percent,
    rc.applies_to,
    rc.max_redemptions,
    rc.starts_at,
    rc.ends_at,
    rc.is_active,
    coalesce(attr.attributed_users, 0)::bigint,
    coalesce(chk.checkout_attempts, 0)::bigint,
    coalesce(chk.approved_checkouts, 0)::bigint,
    coalesce(chk.pending_checkouts, 0)::bigint,
    coalesce(chk.failed_checkouts, 0)::bigint,
    coalesce(claims.activated_claims, 0)::bigint,
    coalesce(chk.revenue_ars, 0)::numeric,
    coalesce(chk.discounts_ars, 0)::numeric
  from public.referral_codes rc
  join public.referral_partners rp on rp.id = rc.partner_id
  join public.referral_brands rb on rb.id = rp.brand_id
  left join lateral (
    select count(*) as attributed_users
    from public.referral_attributions ra
    where ra.referral_code_id = rc.id
  ) attr on true
  left join lateral (
    select
      count(*) as checkout_attempts,
      count(*) filter (where pca.status = 'approved') as approved_checkouts,
      count(*) filter (where pca.status in ('created', 'pending')) as pending_checkouts,
      count(*) filter (where pca.status in ('failed', 'expired')) as failed_checkouts,
      coalesce(sum(pca.amount_ars) filter (where pca.status = 'approved'), 0) as revenue_ars,
      coalesce(sum(pca.discount_amount_ars) filter (where pca.status = 'approved'), 0) as discounts_ars
    from public.payment_checkout_attempts pca
    where pca.referral_code_id = rc.id
  ) chk on true
  left join lateral (
    select count(*) filter (where pc.status = 'activated') as activated_claims
    from public.payment_promotion_claims pc
    where pc.referral_code_id = rc.id
  ) claims on true
  order by rb.name asc, upper(rc.code) asc;
$$;

revoke all on function public.get_referral_code_metrics() from public, anon, authenticated;
grant execute on function public.get_referral_code_metrics() to service_role;