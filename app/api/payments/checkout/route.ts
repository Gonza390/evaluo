import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  createMercadoPagoOneTimePreference,
  createMercadoPagoSubscription,
  mercadoPagoPayerEmail,
} from '@/lib/payments/mercadopago';
import {
  PREMIUM_MONTHLY_PRICE_ARS,
  PREMIUM_RECOVERY_PRICE_ARS,
  PREMIUM_SEMESTER_LIMIT,
  PREMIUM_SEMESTER_PRICE_ARS,
  isPremiumOfferCode,
  type PremiumOfferCode,
} from '@/lib/payments/offers';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

function checkoutContext(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().slice(0, 80);
  return /^[a-zA-Z0-9_:-]+$/.test(normalized) ? normalized : fallback;
}

async function semesterHasCapacity(admin: SupabaseClient) {
  const pendingCutoff = new Date(Date.now() - 30 * 60_000).toISOString();
  const [soldResult, reservedResult] = await Promise.all([
    admin
      .from('payment_checkout_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('amount_ars', PREMIUM_SEMESTER_PRICE_ARS)
      .eq('status', 'approved'),
    admin
      .from('payment_checkout_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('amount_ars', PREMIUM_SEMESTER_PRICE_ARS)
      .in('status', ['created', 'pending'])
      .gte('updated_at', pendingCutoff),
  ]);

  if (soldResult.error || reservedResult.error) throw soldResult.error ?? reservedResult.error;
  return (soldResult.count ?? 0) + (reservedResult.count ?? 0) < PREMIUM_SEMESTER_LIMIT;
}

async function recoveryIsEligible(admin: SupabaseClient, userId: string) {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString();
  const abandonedBefore = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data, error } = await admin
    .from('payment_checkout_attempts')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'failed'])
    .gte('amount_ars', PREMIUM_MONTHLY_PRICE_ARS)
    .gte('created_at', fourteenDaysAgo)
    .lte('updated_at', abandonedBefore)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

export async function POST(request: Request) {
  if (!process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json({ error: 'payments_not_ready' }, { status: 503 });
  }

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rateLimit = await enforceRateLimit({
    key: `payment-checkout:${user.id}:${getRequestClientKey(request)}`,
    limit: 5,
    windowMs: 15 * 60_000,
    failClosed: true,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  let requestBody: {
    source?: unknown;
    materiaId?: unknown;
    planContext?: unknown;
    offerCode?: unknown;
  } = {};
  try {
    requestBody = (await request.json()) as typeof requestBody;
  } catch {
    // El contexto es opcional; la creación del checkout no depende de analytics.
  }
  const source = checkoutContext(requestBody.source, 'pricing_direct');
  const materiaId = checkoutContext(requestBody.materiaId, '');
  const planContext = checkoutContext(requestBody.planContext, 'premium');
  const offerCode: PremiumOfferCode = isPremiumOfferCode(requestBody.offerCode)
    ? requestBody.offerCode
    : 'monthly';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (!siteUrl?.startsWith('https://') && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'site_url_not_configured' }, { status: 503 });
  }
  const resolvedSiteUrl = siteUrl || 'http://localhost:3000';

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: plan, error: planError } = await admin
    .from('subscription_plans')
    .select('id, price_ars')
    .eq('code', 'premium')
    .eq('is_active', true)
    .single();
  if (planError || !plan) return NextResponse.json({ error: 'plan_unavailable' }, { status: 503 });

  const { data: active } = await admin
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('plan_id', plan.id)
    .in('status', ['active', 'approved', 'authorized', 'trialing', 'past_due', 'paused'])
    .limit(1);
  if (active?.length) return NextResponse.json({ error: 'already_subscribed' }, { status: 409 });

  const checkoutWindowStart = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data: recentAttempt } = await admin
    .from('payment_checkout_attempts')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['created', 'pending'])
    .gte('updated_at', checkoutWindowStart)
    .limit(1);
  if (recentAttempt?.length) {
    return NextResponse.json({ error: 'checkout_in_progress' }, { status: 409 });
  }

  try {
    if (offerCode === 'semester' && !(await semesterHasCapacity(admin))) {
      return NextResponse.json({ error: 'semester_sold_out' }, { status: 409 });
    }
    if (offerCode === 'recovery' && !(await recoveryIsEligible(admin, user.id))) {
      return NextResponse.json({ error: 'recovery_not_eligible' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'offer_unavailable' }, { status: 503 });
  }

  const configuredMonthlyPrice = Number(plan.price_ars);
  const monthlyPrice =
    Number.isFinite(configuredMonthlyPrice) && configuredMonthlyPrice > 0
      ? configuredMonthlyPrice
      : PREMIUM_MONTHLY_PRICE_ARS;
  const amount =
    offerCode === 'semester'
      ? PREMIUM_SEMESTER_PRICE_ARS
      : offerCode === 'recovery'
        ? PREMIUM_RECOVERY_PRICE_ARS
        : monthlyPrice;
  const billingMode = offerCode === 'semester' ? 'fixed_term' : 'recurring';

  const attemptId = randomUUID();
  const { error: attemptError } = await admin.from('payment_checkout_attempts').insert({
    id: attemptId,
    user_id: user.id,
    plan_id: plan.id,
    promotion_claim_id: null,
    amount_ars: amount,
  });
  if (attemptError) return NextResponse.json({ error: 'checkout_not_created' }, { status: 500 });

  try {
    let checkoutUrl: string | null | undefined;
    let providerSubscriptionId: string | null = null;

    if (offerCode === 'semester') {
      const preference = await createMercadoPagoOneTimePreference({
        attemptId,
        email: mercadoPagoPayerEmail(user.email),
        amount,
        backUrl: `${resolvedSiteUrl}/pricing/resultado`,
        notificationUrl: `${resolvedSiteUrl}/api/webhooks/mercadopago`,
      });
      checkoutUrl = preference.init_point || preference.sandbox_init_point;
    } else {
      const subscription = await createMercadoPagoSubscription({
        attemptId,
        email: mercadoPagoPayerEmail(user.email),
        amount,
        backUrl: `${resolvedSiteUrl}/pricing/resultado`,
      });
      providerSubscriptionId = subscription.id || null;
      checkoutUrl = subscription.init_point;
    }

    if (!checkoutUrl) throw new Error('Checkout sin URL.');

    await admin
      .from('payment_checkout_attempts')
      .update({
        provider_subscription_id: providerSubscriptionId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId);

    await trackServerAnalyticsEvent({
      eventName: 'premium_checkout_created',
      userId: user.id,
      path: '/api/payments/checkout',
      metadata: {
        source,
        materia_id: materiaId || undefined,
        plan_context: planContext,
        offer_code: offerCode,
        billing_mode: billingMode,
        amount_ars: amount,
      },
    });

    return NextResponse.json({ checkoutUrl, offerCode });
  } catch (error) {
    await admin
      .from('payment_checkout_attempts')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId);
    await trackServerAnalyticsEvent({
      eventName: 'premium_checkout_failed',
      userId: user.id,
      path: '/api/payments/checkout',
      metadata: {
        source,
        materia_id: materiaId || undefined,
        plan_context: planContext,
        offer_code: offerCode,
        billing_mode: billingMode,
        reason: error instanceof Error ? error.message.slice(0, 120) : 'provider_error',
      },
    });
    return NextResponse.json(
      { error: 'provider_error', message: error instanceof Error ? error.message : undefined },
      { status: 502 }
    );
  }
}
