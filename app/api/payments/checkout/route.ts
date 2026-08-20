import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createMercadoPagoSubscription, mercadoPagoPayerEmail } from '@/lib/payments/mercadopago';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

function checkoutContext(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().slice(0, 80);
  return /^[a-zA-Z0-9_:-]+$/.test(normalized) ? normalized : fallback;
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

  let requestBody: { source?: unknown; materiaId?: unknown; planContext?: unknown } = {};
  try {
    requestBody = (await request.json()) as typeof requestBody;
  } catch {
    // El contexto es opcional; la creación del checkout no depende de analytics.
  }
  const source = checkoutContext(requestBody.source, 'pricing_direct');
  const materiaId = checkoutContext(requestBody.materiaId, '');
  const planContext = checkoutContext(requestBody.planContext, 'premium');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (!siteUrl?.startsWith('https://') && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'site_url_not_configured' }, { status: 503 });
  }

  // Estas tablas se incorporan en la migracion de pagos. El tipo generado se
  // actualiza despues de aplicarla al proyecto remoto.
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

  const { data: claimId, error: claimError } = await admin.rpc('claim_founders_promotion', {
    p_user_id: user.id,
  });
  if (claimError) {
    return NextResponse.json({ error: 'promotion_unavailable' }, { status: 503 });
  }
  const amount = claimId ? 9990 : Number(plan.price_ars);
  const attemptId = randomUUID();
  const { error: attemptError } = await admin.from('payment_checkout_attempts').insert({
    id: attemptId,
    user_id: user.id,
    plan_id: plan.id,
    promotion_claim_id: claimId,
    amount_ars: amount,
  });
  if (attemptError) return NextResponse.json({ error: 'checkout_not_created' }, { status: 500 });

  try {
    const subscription = await createMercadoPagoSubscription({
      attemptId,
      email: mercadoPagoPayerEmail(user.email),
      amount,
      backUrl: `${siteUrl || 'http://localhost:3000'}/pricing/resultado`,
    });
    if (!subscription.id || !subscription.init_point)
      throw new Error('Suscripcion sin URL de checkout.');

    await admin
      .from('payment_checkout_attempts')
      .update({
        provider_subscription_id: subscription.id,
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
        amount_ars: amount,
      },
    });

    return NextResponse.json({ checkoutUrl: subscription.init_point });
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
        reason: error instanceof Error ? error.message.slice(0, 120) : 'provider_error',
      },
    });
    return NextResponse.json(
      { error: 'provider_error', message: error instanceof Error ? error.message : undefined },
      { status: 502 }
    );
  }
}
