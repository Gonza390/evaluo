create or replace function public.get_referral_code_metrics_v2()
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
  approved_payments bigint,
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
    coalesce(tx.approved_payments, 0)::bigint,
    coalesce(claims.activated_claims, 0)::bigint,
    coalesce(tx.revenue_ars, 0)::numeric,
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
      coalesce(sum(pca.discount_amount_ars) filter (where pca.status = 'approved'), 0) as discounts_ars
    from public.payment_checkout_attempts pca
    where pca.referral_code_id = rc.id
  ) chk on true
  left join lateral (
    select
      count(*) filter (where pt.status = 'approved') as approved_payments,
      coalesce(sum(pt.amount_ars) filter (where pt.status = 'approved'), 0) as revenue_ars
    from public.payment_transactions pt
    where exists (
      select 1
      from public.payment_checkout_attempts pca
      where pca.referral_code_id = rc.id
        and (
          (pca.provider_subscription_id is not null and pt.provider_subscription_id = pca.provider_subscription_id)
          or pt.subscription_id = pca.id
        )
    )
  ) tx on true
  left join lateral (
    select count(*) filter (where pc.status = 'activated') as activated_claims
    from public.payment_promotion_claims pc
    where pc.referral_code_id = rc.id
  ) claims on true
  order by rb.name asc, upper(rc.code) asc;
$$;

revoke all on function public.get_referral_code_metrics_v2() from public, anon, authenticated;
grant execute on function public.get_referral_code_metrics_v2() to service_role;