-- Make Mercado Pago webhook retries recoverable and concurrency-safe.
create or replace function public.claim_payment_webhook_event(
  p_provider_event_id text,
  p_event_type text,
  p_resource_id text
)
returns table (
  event_row_id uuid,
  should_process boolean,
  event_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_status text;
begin
  insert into public.payment_webhook_events (
    provider,
    provider_event_id,
    event_type,
    resource_id,
    status
  )
  values (
    'mercadopago',
    p_provider_event_id,
    p_event_type,
    p_resource_id,
    'received'
  )
  on conflict (provider, provider_event_id) do nothing
  returning id into v_id;

  if v_id is not null then
    return query select v_id, true, 'received'::text;
    return;
  end if;

  -- A failed delivery is immediately retryable. A delivery left in "received"
  -- can be reclaimed after five minutes, covering hard crashes/timeouts without
  -- allowing concurrent duplicate deliveries to process the same payment.
  update public.payment_webhook_events
  set
    status = 'received',
    error_message = null,
    processed_at = null,
    received_at = now()
  where provider = 'mercadopago'
    and provider_event_id = p_provider_event_id
    and event_type = p_event_type
    and resource_id = p_resource_id
    and (
      status = 'failed'
      or (status = 'received' and received_at < now() - interval '5 minutes')
    )
  returning id into v_id;

  if v_id is not null then
    return query select v_id, true, 'received'::text;
    return;
  end if;

  select id, status
    into v_id, v_status
  from public.payment_webhook_events
  where provider = 'mercadopago'
    and provider_event_id = p_provider_event_id
  limit 1;

  return query select v_id, false, coalesce(v_status, 'unknown')::text;
end;
$$;

revoke all on function public.claim_payment_webhook_event(text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_payment_webhook_event(text, text, text)
  to service_role;
