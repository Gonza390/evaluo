import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CREEM_USD_MONTHLY_CENTS, creemProductId, type CreemMode,
} from './creem-international';

type Json = Record<string, unknown>;
type BillingSession = {
  id: string; user_id: string; plan_id: string; product_id: string;
  mode: string; currency: string; expected_amount_cents: number;
  checkout_id: string | null; subscription_id: string | null;
  status: string; current_period_end: string | null;
  last_event_at: string | null;
};
const idPattern = /^(?:ch|sub|tran|cust|ref|disp)_[A-Za-z0-9_-]{4,120}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function asObject(value: unknown): Json | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Json : null;
}
export function providerId(value: unknown): string | null {
  const s = typeof value === 'string' ? value : asObject(value)?.id;
  return typeof s === 'string' && idPattern.test(s) ? s : null;
}
function date(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
function eventDate(payload: Json): string {
  const stamp = payload.created_at;
  const ts = typeof stamp === 'number' && Number.isFinite(stamp)
    ? new Date(stamp > 10_000_000_000 ? stamp : stamp * 1000).getTime()
    : Date.now();
  return Number.isFinite(ts) && Math.abs(ts - Date.now()) < 90 * 24 * 60 * 60_000
    ? new Date(ts).toISOString()
    : new Date().toISOString();
}
async function assertNoDbError(promise: PromiseLike<{ error: { message?: string } | null }>, hint: string) {
  const { error } = await promise;
  if (error) throw new Error(hint);
}
async function getSession(
  admin: SupabaseClient, mode: CreemMode, key: 'id' | 'subscription_id', value: string,
): Promise<BillingSession | null> {
  const { data, error } = await admin.from('creem_checkout_sessions')
    .select('id,user_id,plan_id,product_id,mode,currency,expected_amount_cents,checkout_id,subscription_id,status,current_period_end,last_event_at')
    .eq('mode', mode).eq(key, value).maybeSingle();
  if (error) throw new Error('creem_session_lookup_error');
  return data as BillingSession | null;
}
function validProduct(object: Json, product: string): boolean {
  return providerId(object.product) === product;
}
function eventModeMatches(object: Json, mode: CreemMode): boolean {
  return object.mode == null || object.mode === mode;
}
async function updateSession(
  admin: SupabaseClient, session: BillingSession, values: Json,
) {
  await assertNoDbError(
    admin.from('creem_checkout_sessions').update({
      ...values, updated_at: new Date().toISOString(),
    }).eq('id', session.id),
    'creem_session_update_failed',
  );
}
async function upsertLiveEntitlement(
  admin: SupabaseClient,
  session: BillingSession,
  subscriptionId: string,
  state: 'active' | 'canceled' | 'past_due' | 'paused' | 'refunded' | 'charged_back',
  accessUntil: string,
  changedAt: string,
  transactionId: string | null,
) {
  const { data: old, error } = await admin.from('user_subscriptions')
    .select('id,expires_at,provider_updated_at')
    .eq('payment_provider','creem').eq('provider_subscription_id',subscriptionId).maybeSingle();
  if (error) throw new Error('creem_entitlement_lookup_failed');
  if (old?.provider_updated_at && Date.parse(old.provider_updated_at) > Date.parse(changedAt)) return;

  // Cancellations must never extend the paid end; signed status messages alone
  // cannot create or renew access, only a verified paid transaction can.
  const effectiveEnd = state === 'active' || !old?.expires_at
    ? accessUntil
    : new Date(Math.min(Date.parse(old.expires_at), Date.parse(accessUntil))).toISOString();
  const update = {
    status: state,
    expires_at: effectiveEnd,
    current_period_end: effectiveEnd,
    next_payment_date: state === 'active' ? effectiveEnd : null,
    canceled_at: state === 'canceled' ? changedAt : null,
    provider_updated_at: changedAt,
    payment_reference: transactionId,
    updated_at: new Date().toISOString(),
  };
  if (old) {
    await assertNoDbError(
      admin.from('user_subscriptions').update(update)
        .eq('id',old.id).eq('payment_provider','creem').eq('provider_subscription_id',subscriptionId),
      'creem_entitlement_update_failed',
    );
  } else if (state === 'active') {
    await assertNoDbError(
      admin.from('user_subscriptions').insert({
        ...update,
        user_id: session.user_id,
        plan_id: session.plan_id,
        payment_provider: 'creem',
        provider_subscription_id: subscriptionId,
        amount_ars: null,
        started_at: new Date().toISOString(),
      }),
      'creem_entitlement_insert_failed',
    );
  }
}
async function recordPayment(
  admin: SupabaseClient,
  session: BillingSession,
  subscriptionId: string,
  transactionId: string,
  paidAt: string | null,
) {
  const { data: subscription, error: lookupError } = await admin.from('user_subscriptions')
    .select('id').eq('payment_provider','creem').eq('provider_subscription_id',subscriptionId).maybeSingle();
  if (lookupError || !subscription) throw new Error('creem_transaction_subscription_missing');
  await assertNoDbError(
    admin.from('payment_transactions').upsert({
      user_id: session.user_id,
      subscription_id: subscription.id,
      provider: 'creem',
      provider_payment_id: transactionId,
      provider_subscription_id: subscriptionId,
      status: 'approved',
      currency: 'USD',
      amount_ars: null,
      paid_at: paidAt,
      raw_summary: { amount_cents: CREEM_USD_MONTHLY_CENTS, currency: 'USD', mode: 'live' },
    }, { onConflict: 'provider,provider_payment_id' }),
    'creem_transaction_insert_failed',
  );
}

/**
 * All inputs MUST come from a previously verified Creem signature.
 * Test records remain confined to creem_checkout_sessions.
 */
export async function reconcileCreemBillingEvent(
  admin: SupabaseClient,
  mode: CreemMode,
  eventPayload: unknown,
): Promise<'processed' | 'ignored'> {
  const envelope = asObject(eventPayload);
  const object = asObject(envelope?.object);
  const type = envelope?.eventType;
  if (!envelope || !object || typeof type !== 'string' || !eventModeMatches(object, mode)) return 'ignored';
  const expectedProduct = creemProductId(mode);
  const changedAt = eventDate(envelope);
  if (!expectedProduct) return 'ignored';

  if (type === 'checkout.completed') {
    const requestId = object.request_id;
    const checkoutId = providerId(object.id);
    const order = asObject(object.order);
    const subscription = asObject(object.subscription);
    const subscriptionId = providerId(subscription?.id);
    const customerId = providerId(asObject(object.customer)?.id);
    if (typeof requestId !== 'string' || !uuidPattern.test(requestId) ||
      !checkoutId?.startsWith('ch_') || !subscriptionId?.startsWith('sub_') ||
      !validProduct(object, expectedProduct) ||
      providerId(order?.product) !== expectedProduct ||
      object.mode !== mode ||
      object.status !== 'completed' || order?.status !== 'paid' ||
      order?.currency !== 'USD' || order?.amount !== CREEM_USD_MONTHLY_CENTS
    ) return 'ignored';
    const session = await getSession(admin,mode,'id',requestId);
    if (!session) {
      if (mode === 'live') throw new Error('creem_checkout_session_missing');
      return 'ignored';
    }
    if (session.product_id !== expectedProduct || session.currency !== 'USD' ||
      session.expected_amount_cents !== CREEM_USD_MONTHLY_CENTS ||
      (session.checkout_id && session.checkout_id !== checkoutId) ||
      (session.subscription_id && session.subscription_id !== subscriptionId)) return 'ignored';
    const metadata = asObject(object.metadata);
    if ((metadata?.userId && metadata.userId !== session.user_id) ||
        (metadata?.attemptId && metadata.attemptId !== session.id)) return 'ignored';
    if (session.last_event_at && Date.parse(session.last_event_at) > Date.parse(changedAt)) return 'ignored';
    await updateSession(admin,session,{
      status: 'paid', checkout_id: checkoutId, subscription_id: subscriptionId,
      customer_id: customerId, last_event_at: changedAt,
    });
    // Even checkout.completed does not grant access. Wait for subscription.paid
    // containing a paid period end and stable transaction ID.
    return 'processed';
  }

  const subscriptionId = type.startsWith('subscription.')
    ? providerId(object.id)
    : providerId(asObject(object.subscription)?.id);
  if (!subscriptionId?.startsWith('sub_')) return 'ignored';
  const session = await getSession(admin,mode,'subscription_id',subscriptionId);
  if (!session) {
    if (mode === 'live' && type === 'subscription.paid') throw new Error('creem_unmatched_paid_subscription');
    return 'ignored';
  }
  if (session.product_id !== expectedProduct || session.currency !== 'USD' ||
      session.expected_amount_cents !== CREEM_USD_MONTHLY_CENTS) return 'ignored';
  if (session.last_event_at && Date.parse(session.last_event_at) > Date.parse(changedAt)) return 'ignored';

  if (type === 'subscription.paid') {
    const product = asObject(object.product);
    const end = date(object.current_period_end_date);
    const transactionId = providerId(object.last_transaction_id);
    if (!validProduct(object,expectedProduct) || object.status !== 'active' ||
      product?.currency !== 'USD' || product?.price !== CREEM_USD_MONTHLY_CENTS ||
      !end || Date.parse(end) <= Date.now() ||
      Date.parse(end) > Date.now()+45*24*60*60_000 ||
      !transactionId?.startsWith('tran_')) return 'ignored';
    // Persist money and granted access only on *live* signed payment events.
    // Repeat deliveries are idempotent through the provider transaction index.
    if (mode === 'live') {
      await upsertLiveEntitlement(admin,session,subscriptionId,'active',end,changedAt,transactionId);
      await recordPayment(admin,session,subscriptionId,transactionId,date(object.last_transaction_date));
    }
    await updateSession(admin,session,{
      status:'paid',current_period_end:end,last_event_at:changedAt,last_transaction_id:transactionId,
    });
    return 'processed';
  }

  if (['subscription.canceled','subscription.expired','subscription.paused','subscription.update'].includes(type)) {
    if (!validProduct(object,expectedProduct)) return 'ignored';
    const currentEnd = session.current_period_end;
    const eventEnd = date(object.current_period_end_date);
    const end = currentEnd && eventEnd
      ? new Date(Math.min(Date.parse(currentEnd),Date.parse(eventEnd))).toISOString()
      : currentEnd;
    if (!end) return 'ignored';
    const state = type === 'subscription.canceled' || (type === 'subscription.update' && object.status === 'scheduled_cancel')
      ? 'canceled'
      : type === 'subscription.expired' ? 'expired'
      : type === 'subscription.paused' ? 'canceled' : null;
    if (!state) return 'ignored';
    const cutoff = type === 'subscription.expired' ? new Date(Math.min(Date.parse(end),Date.now())).toISOString() : end;
    if (mode === 'live') {
      const canonicalState = state === 'canceled' ? 'canceled' : 'past_due';
      await upsertLiveEntitlement(admin,session,subscriptionId,canonicalState,cutoff,changedAt,null);
    }
    await updateSession(admin,session,{status:state==='expired'?'expired':'canceled',current_period_end:cutoff,last_event_at:changedAt});
    return 'processed';
  }

  if (type === 'refund.created' || type === 'dispute.created') {
    if (type === 'refund.created' && object.status !== 'succeeded') return 'ignored';
    if (mode === 'live') await upsertLiveEntitlement(
      admin, session, subscriptionId, type === 'refund.created' ? 'refunded' : 'charged_back',
      new Date().toISOString(), changedAt, null,
    );
    await updateSession(admin,session,{
      status:type==='refund.created'?'refunded':'disputed',
      current_period_end:new Date().toISOString(),last_event_at:changedAt,
    });
    return 'processed';
  }
  return 'ignored';
}
