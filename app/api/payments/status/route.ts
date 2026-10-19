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

  const checkoutAttemptQuery = paymentsDb
    .from('payment_checkout_attempts')
    .select('id, status, offer_code, amount_ars, created_at, updated_at')
    .eq('user_id', user.id);

  const [{ data }, { data: latestCheckoutAttempt }] = await Promise.all([
    paymentsDb
      .from('user_subscriptions')
      .select(
        'id, status, amount_ars, next_payment_date, promotion_code, payment_provider, provider_subscription_id, canceled_at, expires_at, created_at, subscription_plans(code, name)'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    attemptId
      ? checkoutAttemptQuery.eq('id', attemptId).maybeSingle()
      : checkoutAttemptQuery.order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

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

  const { data: transaction } = premium
    ? await paymentsDb
        .from('payment_transactions')
        .select('status, amount_ars, currency, paid_at, created_at')
        .eq('subscription_id', premium.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return NextResponse.json({
    plan: premiumIsActive ? 'premium' : 'free',
    planName: premiumIsActive && premium ? (planFor(premium)?.name ?? 'Plan Premium') : 'Plan Free',
    status: premium?.status ?? 'free',
    amountArs: premium?.amount_ars ?? null,
    nextPaymentDate: premium?.next_payment_date ?? null,
    promotion: premium?.promotion_code ?? null,
    provider:
      billingMode === 'fixed_term' && premium?.payment_provider === 'mercadopago'
        ? 'mercadopago_fixed_term'
        : (premium?.payment_provider ?? null),
    billingMode,
    canCancel: billingMode === 'recurring' && premiumIsActive,
    canceledAt: premium?.canceled_at ?? null,
    accessUntil: premium?.expires_at ?? null,
    checkoutAttemptId: latestCheckoutAttempt?.id ?? null,
    checkoutStatus: latestCheckoutAttempt?.status ?? null,
    checkoutOfferCode: latestCheckoutAttempt?.offer_code ?? null,
    checkoutAmountArs: latestCheckoutAttempt?.amount_ars ?? null,
    checkoutUpdatedAt:
      latestCheckoutAttempt?.updated_at ?? latestCheckoutAttempt?.created_at ?? null,
    lastPayment: transaction
      ? {
          status: transaction.status,
          amountArs: transaction.amount_ars,
          currency: transaction.currency,
          paidAt: transaction.paid_at ?? transaction.created_at,
        }
      : null,
  });
}
