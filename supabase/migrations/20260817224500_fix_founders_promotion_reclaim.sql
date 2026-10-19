-- Permite que un usuario reutilice su reserva fundadores luego de un checkout
-- vencido. La restriccion unique historica se conserva para evitar duplicados.
create or replace function public.claim_founders_promotion(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_claim_id uuid;
  v_claim_status text;
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

  select id, status
  into v_claim_id, v_claim_status
  from public.payment_promotion_claims
  where promotion_code = 'founders_2026'
    and user_id = p_user_id
  limit 1;

  if v_claim_status in ('pending', 'activated') then
    return v_claim_id;
  end if;

  if (
    select count(*) from public.payment_promotion_claims
    where promotion_code = 'founders_2026' and status in ('pending', 'activated')
  ) >= 100 then
    return null;
  end if;

  if v_claim_status = 'released' then
    update public.payment_promotion_claims
    set status = 'pending',
        reserved_at = now(),
        activated_at = null,
        released_at = null
    where id = v_claim_id;
    return v_claim_id;
  end if;

  insert into public.payment_promotion_claims (promotion_code, user_id)
  values ('founders_2026', p_user_id)
  returning id into v_claim_id;

  return v_claim_id;
end;
$$;

revoke all on function public.claim_founders_promotion(uuid) from public, anon, authenticated;
grant execute on function public.claim_founders_promotion(uuid) to service_role;
