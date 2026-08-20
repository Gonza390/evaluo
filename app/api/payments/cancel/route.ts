import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { cancelMercadoPagoSubscription } from '@/lib/payments/mercadopago';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  const requestOrigin = request.headers.get('origin');
  const allowedOrigins = new Set(
    configuredSiteUrl ? [configuredSiteUrl, configuredSiteUrl.replace('://', '://www.')] : []
  );
  if (
    process.env.NODE_ENV === 'production' &&
    (!requestOrigin || !allowedOrigins.has(requestOrigin))
  ) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
  }

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rateLimit = await enforceRateLimit({
    key: `payment-cancel:${user.id}:${getRequestClientKey(request)}`,
    limit: 3,
    windowMs: 60 * 60_000,
    failClosed: true,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: subscription, error } = await admin
    .from('user_subscriptions')
    .select('id, provider_subscription_id, current_period_end, next_payment_date')
    .eq('user_id', user.id)
    .eq('payment_provider', 'mercadopago')
    .in('status', ['active', 'approved', 'authorized', 'trialing', 'past_due', 'paused'])
    .not('provider_subscription_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'subscription_unavailable' }, { status: 500 });
  if (!subscription?.provider_subscription_id) {
    return NextResponse.json({ error: 'subscription_not_found' }, { status: 404 });
  }

  try {
    const canceled = await cancelMercadoPagoSubscription(subscription.provider_subscription_id);
    if (canceled.status.toLowerCase() !== 'canceled') {
      return NextResponse.json({ error: 'provider_did_not_cancel' }, { status: 502 });
    }

    const now = new Date().toISOString();
    const accessUntil = subscription.current_period_end ?? subscription.next_payment_date ?? now;
    const { error: updateError } = await admin
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: now,
        expires_at: accessUntil,
        current_period_end: accessUntil,
        updated_at: now,
      })
      .eq('id', subscription.id)
      .eq('user_id', user.id);
    if (updateError)
      return NextResponse.json({ error: 'subscription_not_updated' }, { status: 500 });

    return NextResponse.json({ status: 'canceled', accessUntil });
  } catch {
    return NextResponse.json({ error: 'provider_error' }, { status: 502 });
  }
}
