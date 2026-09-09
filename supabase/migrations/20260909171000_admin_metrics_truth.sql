-- Keep admin metrics aligned with the actual operational state in production.

create or replace function public.get_referral_code_metrics_v2()
returns table(
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
set search_path to 'public', 'pg_temp'
as $function$
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
    (
      rc.is_active = true
      and rp.status = 'active'
      and rb.status = 'active'
      and (rc.starts_at is null or rc.starts_at <= now())
      and (rc.ends_at is null or rc.ends_at > now())
      and (
        rc.max_redemptions is null
        or coalesce(claims.reserved_claims, 0) < rc.max_redemptions
      )
    ) as is_active,
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
    select
      count(*) filter (where pc.status = 'activated') as activated_claims,
      count(*) filter (where pc.status in ('pending', 'activated')) as reserved_claims
    from public.payment_promotion_claims pc
    where pc.referral_code_id = rc.id
  ) claims on true
  order by rb.name asc, upper(rc.code) asc;
$function$;

-- rag_question_stats is a derived aggregate. Rebuild it from the simulator's
-- canonical wrong-answer history and keep it synchronized from now on.
delete from public.rag_question_stats;

insert into public.rag_question_stats (
  pregunta_id,
  materia_id,
  veces_fallada,
  updated_at
)
select
  w.pregunta_id,
  max(w.materia_id) as materia_id,
  count(*)::integer as veces_fallada,
  max(w.created_at) as updated_at
from public.simulator_attempt_wrong_questions w
join public.preguntas_banco q on q.id = w.pregunta_id
where w.pregunta_id is not null
group by w.pregunta_id;

create or replace function public.refresh_rag_question_stat(p_pregunta_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if p_pregunta_id is null then
    return;
  end if;

  insert into public.rag_question_stats (
    pregunta_id,
    materia_id,
    veces_fallada,
    updated_at
  )
  select
    q.id,
    q.materia_id,
    count(w.id)::integer,
    coalesce(max(w.created_at), now())
  from public.preguntas_banco q
  left join public.simulator_attempt_wrong_questions w on w.pregunta_id = q.id
  where q.id = p_pregunta_id
  group by q.id, q.materia_id
  on conflict (pregunta_id) do update
  set
    materia_id = excluded.materia_id,
    veces_fallada = excluded.veces_fallada,
    updated_at = excluded.updated_at;
end;
$function$;

create or replace function public.sync_rag_question_stats_from_wrong_answers()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_rag_question_stat(old.pregunta_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.pregunta_id is distinct from new.pregunta_id then
    perform public.refresh_rag_question_stat(old.pregunta_id);
  end if;

  perform public.refresh_rag_question_stat(new.pregunta_id);
  return new;
end;
$function$;

drop trigger if exists sync_rag_question_stats_from_wrong_answers
  on public.simulator_attempt_wrong_questions;

create trigger sync_rag_question_stats_from_wrong_answers
after insert or update or delete on public.simulator_attempt_wrong_questions
for each row execute function public.sync_rag_question_stats_from_wrong_answers();

revoke all on function public.refresh_rag_question_stat(uuid) from public, anon, authenticated;
revoke all on function public.sync_rag_question_stats_from_wrong_answers() from public, anon, authenticated;
grant execute on function public.refresh_rag_question_stat(uuid) to service_role;
