import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase-server';
import { hasPremiumSubscriptionAccess } from '@/lib/payments/status';

export async function GET(request: Request) {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const paymentsDb = supabase as unknown as SupabaseClient;
  const requestUrl = new URL(request.url);
  const rawAttemptId = requestUrl.searchParams.get('attemptId')?.trim() ?? '';
  const attemptId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawAttemptId)
    ? rawAttemptId
    : null;

  if (rawAttemptId && !attemptId) {
    return NextResponse.json({error:'invalid_checkout_attempt'}, {status:400,
      headers:{'Cache-Control':'private, no-store'}});
  }

  // Los intentos USD de Creem se guardan separados de los campos ARS de Mercado Pago.
  const creemAttemptQuery = paymentsDb
    .from('creem_checkout_sessions')
    .select('id,status,expected_amount_cents,currency,mode,created_at,updated_at,subscription_id')
    .eq('user_id',user.id);
  const {data: creemAttempt, error: creemError} = attemptId
    ? await creemAttemptQuery.eq('id',attemptId).maybeSingle()
    : await creemAttemptQuery.order('created_at',{ascending:false}).limit(1).maybeSingle();

  const checkoutAttemptQuery = paymentsDb
    .from('payment_checkout_attempts')
    .select('id, status, offer_code, amount_ars, created_at, updated_at')
    .eq('user_id', user.id);

  const [{ data, error: subscriptionsError }, { data: latestCheckoutAttempt, error: checkoutError }] = await Promise.all([
    paymentsDb
      .from('user_subscriptions')
      .select(
        'id, status, amount_ars, next_payment_date, promotion_code, payment_provider, provider_subscription_id, canceled_at, expires_at, created_at, subscription_plans(code, name)'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    attemptId
      ? checkoutAttemptQuery.eq('id', attemptId).maybeSingle()
      : checkoutAttemptQuery.order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (subscriptionsError || checkoutError || creemError) {
    return NextResponse.json({error:'subscription_status_unavailable'}, {status:503,
      headers:{'Cache-Control':'private, no-store'}});
  }
  if (attemptId && !latestCheckoutAttempt && !creemAttempt) {
    return NextResponse.json({error:'checkout_attempt_not_found'}, {status:404,
      headers:{'Cache-Control':'private, no-store'}});
  }

  const subscriptions = (data ?? []) as unknown as Array<{
    id: string;
    status: string;
    amount_ars: number | null;
    next_payment_date: string | null;
    promotion_code: string | null;
    payment_provider: string | null;
    provider_subscription_id: string | null;
    canceled_at: string | null;
    expires_at: string | null;
    created_at: string;
    subscription_plans:
      | { code: string; name: string }
      | Array<{ code: string; name: string }>
      | null;
  }>;
  const planFor = (item: (typeof subscriptions)[number]) =>
    Array.isArray(item.subscription_plans)
      ? (item.subscription_plans[0] ?? null)
      : item.subscription_plans;
  const premiumSubscriptions = subscriptions.filter((item) => planFor(item)?.code === 'premium');
  const premium =
    premiumSubscriptions.find((item) => hasPremiumSubscriptionAccess(item.status, item.expires_at)) ??
    premiumSubscriptions[0] ??
    null;
  const premiumIsActive = hasPremiumSubscriptionAccess(premium?.status, premium?.expires_at);
  const billingMode = premium?.provider_subscription_id
    ? 'recurring'
    : premium?.expires_at
      ? 'fixed_term'
      : null;

  const { data: transaction, error: transactionError } = premium
    ? await paymentsDb
        .from('payment_transactions')
        .select('status, amount_ars, currency, paid_at, created_at')
        .eq('subscription_id', premium.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };

  // El historial de transacciones es auxiliar; si falla, nunca esconder una
  // suscripción vigente confirmada por el proveedor.
  const safeTransaction = transactionError ? null : transaction;

  const usesCreemAttempt = Boolean(creemAttempt && (
    attemptId || !latestCheckoutAttempt ||
    Date.parse(creemAttempt.created_at) > Date.parse(latestCheckoutAttempt.created_at)
  ));
  const checkout = usesCreemAttempt ? creemAttempt : latestCheckoutAttempt;

  return NextResponse.json({
    plan: premiumIsActive ? 'premium' : 'free',
    planName: premiumIsActive && premium ? (planFor(premium)?.name ?? 'Plan Premium') : 'Plan Free',
    status: premium?.status ?? 'free',
    amountArs: premium?.amount_ars ?? null,
    amountUsdCents: premium?.payment_provider === 'creem' ? 999 : null,
    nextPaymentDate: premium?.next_payment_date ?? null,
    promotion: premium?.promotion_code ?? null,
    provider:
      billingMode === 'fixed_term' && premium?.payment_provider === 'mercadopago'
        ? 'mercadopago_fixed_term'
        : (premium?.payment_provider ?? null),
    billingMode,
    canCancel: billingMode === 'recurring' && premiumIsActive && premium?.status !== 'canceled',
    canceledAt: premium?.canceled_at ?? null,
    accessUntil: premium?.expires_at ?? null,
    checkoutAttemptId: checkout?.id ?? null,
    checkoutStatus: checkout?.status ?? null,
    checkoutProvider: usesCreemAttempt ? 'creem' : 'mercadopago',
    checkoutMode: usesCreemAttempt ? creemAttempt?.mode ?? null : null,
    checkoutOfferCode: usesCreemAttempt ? 'monthly' : latestCheckoutAttempt?.offer_code ?? null,
    checkoutAmountArs: usesCreemAttempt ? null : latestCheckoutAttempt?.amount_ars ?? null,
    checkoutAmountUsdCents: usesCreemAttempt ? creemAttempt?.expected_amount_cents ?? null : null,
    checkoutUpdatedAt: checkout?.updated_at ?? checkout?.created_at ?? null,
    paymentHistoryUnavailable: Boolean(transactionError),
    lastPayment: safeTransaction
      ? {
          status: safeTransaction.status,
          amountArs: safeTransaction.amount_ars,
          currency: safeTransaction.currency,
          paidAt: safeTransaction.paid_at ?? safeTransaction.created_at,
        }
      : null,
  });
}
