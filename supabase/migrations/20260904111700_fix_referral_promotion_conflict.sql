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

  update public.payment_promotion_claims pc
  set status = 'released', released_at = now()
  where pc.referral_code_id = p_referral_code_id
    and pc.status = 'pending'
    and pc.reserved_at < now() - interval '60 minutes';

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
