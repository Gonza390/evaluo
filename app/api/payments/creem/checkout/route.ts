import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumSubscriptionAccess } from '@/lib/payments/status';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import {
  createCreemCheckout, creemProductId, CREEM_USD_MONTHLY_CENTS,
  isCreemModeEnabled, type CreemMode,
} from '@/lib/payments/creem-international';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const mode: CreemMode = process.env.VERCEL_ENV === 'production' ? 'live' : 'test';
  if (!isCreemModeEnabled(mode)) {
    return NextResponse.json({ error: 'creem_checkout_not_available' }, { status: 503 });
  }
  const origin = request.headers.get('origin');
  const site = process.env.VERCEL_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
    : process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : null;
  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set(site ? [new URL(site).origin] : []);
  if (process.env.VERCEL_ENV !== 'production' &&
      new URL(requestOrigin).hostname.endsWith('.vercel.app')) {
    allowed.add(requestOrigin);
  }
  if (process.env.VERCEL_ENV === 'production' && site) {
    allowed.add(new URL(site).origin.replace('://', '://www.'));
  }
  if (!site || !origin || !allowed.has(origin)) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
  }
  if (mode === 'live') {
    const country = request.headers.get('x-vercel-ip-country')?.trim().toUpperCase();
    if (!country || country === 'AR' || !/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json({ error: 'international_checkout_only' }, { status: 403 });
    }
  }

  const userClient = await createClientServer();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rate = await enforceRateLimit({
    key: 'creem-checkout:' + user.id + ':' + getRequestClientKey(request),
    limit: 5, windowMs: 15 * 60_000, failClosed: true,
  });
  if (!rate.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: rateLimitHeaders(rate) });
  }

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: plan, error: planError } = await admin.from('subscription_plans')
    .select('id').eq('code', 'premium').eq('is_active', true).single();
  if (planError || !plan) return NextResponse.json({ error: 'plan_unavailable' }, { status: 503 });

  const [existing, creemPending, mercadoPending] = await Promise.all([
    admin.from('user_subscriptions').select('status,expires_at')
      .eq('user_id', user.id).eq('plan_id', plan.id).limit(100),
    admin.from('creem_checkout_sessions').select('id')
      .eq('user_id', user.id).in('status', ['created', 'pending'])
      .gte('created_at', new Date(Date.now() - 30 * 60_000).toISOString()).limit(1),
    admin.from('payment_checkout_attempts').select('id')
      .eq('user_id', user.id).in('status', ['created', 'pending'])
      .gte('updated_at', new Date(Date.now() - 30 * 60_000).toISOString()).limit(1),
  ]);
  if (existing.error || creemPending.error || mercadoPending.error) {
    return NextResponse.json({ error: 'checkout_unavailable' }, { status: 503 });
  }
  if ((existing.data ?? []).some(s => hasPremiumSubscriptionAccess(s.status, s.expires_at))) {
    return NextResponse.json({ error: 'already_subscribed' }, { status: 409 });
  }
  if (creemPending.data?.length || mercadoPending.data?.length) {
    return NextResponse.json({ error: 'checkout_in_progress' }, { status: 409 });
  }

  const attemptId = randomUUID();
  const { error: insertError } = await admin.from('creem_checkout_sessions').insert({
    id: attemptId, user_id: user.id, plan_id: plan.id, mode,
    product_id: creemProductId(mode), expected_amount_cents: CREEM_USD_MONTHLY_CENTS,
    currency: 'USD', status: 'created',
  });
  if (insertError) return NextResponse.json({ error: 'creem_attempt_not_created' }, { status: 503 });

  const successUrl = new URL(mode === 'test' ? '/pricing/creem-prueba' : '/pricing/resultado', site);
  successUrl.searchParams.set('attemptId', attemptId);
  try {
    const checkout = await createCreemCheckout(mode, {
      attemptId, userId: user.id, email: user.email, successUrl: successUrl.toString(),
    });
    const { error: updateError } = await admin.from('creem_checkout_sessions')
      .update({ checkout_id: checkout.checkoutId, status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', attemptId).eq('mode', mode);
    if (updateError) throw new Error('creem_attempt_not_updated');
    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl, attemptId, currency: 'USD',
      amountCents: CREEM_USD_MONTHLY_CENTS, mode,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    await admin.from('creem_checkout_sessions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', attemptId).eq('status', 'created');
    return NextResponse.json({ error: 'creem_provider_unavailable' }, { status: 502 });
  }
}
