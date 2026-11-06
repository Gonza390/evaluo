import { createCreemTestCheckout, CREEM_TEST_PRODUCT_ID } from './creem';

export const CREEM_USD_MONTHLY_CENTS = 999;
export type CreemMode = 'test' | 'live';

export function isCreemModeEnabled(mode: CreemMode): boolean {
  if (mode === 'test') {
    return process.env.VERCEL_ENV !== 'production' &&
      Boolean(process.env.CREEM_API_KEY?.trim().startsWith('creem_test_')) &&
      Boolean(process.env.CREEM_WEBHOOK_SECRET?.trim());
  }
  return process.env.VERCEL_ENV === 'production' &&
    Boolean(process.env.CREEM_LIVE_API_KEY?.trim().startsWith('creem_live_')) &&
    Boolean(process.env.CREEM_LIVE_PRODUCT_ID?.trim().startsWith('prod_')) &&
    Boolean(process.env.CREEM_LIVE_WEBHOOK_SECRET?.trim()) &&
    process.env.CREEM_INTERNATIONAL_ENABLED === 'true';
}

/**
 * Checkout is disabled by the launch switch, but existing paid subscriptions
 * MUST keep receiving signed webhook events and allow customer cancellation.
 * Turning off new purchases cannot strand paid customers.
 */
export function canProcessCreemLiveWebhooks(): boolean {
  return process.env.VERCEL_ENV === 'production' &&
    Boolean(process.env.CREEM_LIVE_PRODUCT_ID?.trim().startsWith('prod_')) &&
    Boolean(process.env.CREEM_LIVE_WEBHOOK_SECRET?.trim());
}

export function canManageExistingCreemSubscriptions(): boolean {
  return process.env.VERCEL_ENV === 'production' &&
    Boolean(process.env.CREEM_LIVE_API_KEY?.trim().startsWith('creem_live_'));
}

export function creemProductId(mode: CreemMode): string {
  return mode === 'test' ? CREEM_TEST_PRODUCT_ID : process.env.CREEM_LIVE_PRODUCT_ID?.trim() || '';
}

export function isCreemCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'creem.io' || url.hostname.endsWith('.creem.io')) &&
      !url.username && !url.password;
  } catch { return false; }
}

export async function validateCreemProduct(mode: CreemMode): Promise<void> {
  if (!isCreemModeEnabled(mode)) throw new Error('creem_not_enabled');
  const key = mode === 'test' ? process.env.CREEM_API_KEY!.trim() : process.env.CREEM_LIVE_API_KEY!.trim();
  const productId = creemProductId(mode);
  const api = mode === 'test' ? 'https://test-api.creem.io' : 'https://api.creem.io';
  const response = await fetch(api + '/v1/products?product_id=' + encodeURIComponent(productId), {
    headers: { 'x-api-key': key }, cache:'no-store', signal:AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('creem_product_http_' + response.status);
  const value: unknown = await response.json().catch(() => null);
  if (!value || typeof value !== 'object') throw new Error('creem_product_invalid');
  const p = value as Record<string, unknown>;
  // Don't create a checkout with a different price, currency or billing period.
  // The buyer must never be charged for a misconfigured product without Premium.
  if (p.id !== productId || p.price !== CREEM_USD_MONTHLY_CENTS ||
      p.currency !== 'USD' || p.billing_type !== 'recurring' ||
      p.billing_period !== 'every-month' || p.status !== 'active') {
    throw new Error('creem_product_price_or_period_mismatch');
  }
}

export async function createCreemCheckout(mode: CreemMode, input: {
  attemptId: string;
  userId: string;
  email: string;
  successUrl: string;
}): Promise<{ checkoutId: string; checkoutUrl: string }> {
  if (!isCreemModeEnabled(mode)) throw new Error('creem_not_enabled');
  await validateCreemProduct(mode);
  if (mode === 'test') return createCreemTestCheckout(input);
  const key = process.env.CREEM_LIVE_API_KEY!.trim();
  const product = creemProductId('live');
  const response = await fetch('https://api.creem.io/v1/checkouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify({
      product_id: product,
      request_id: input.attemptId,
      customer: { email: input.email },
      success_url: input.successUrl,
      metadata: { userId: input.userId, attemptId: input.attemptId, source: 'evaluo' },
    }),
    signal: AbortSignal.timeout(12000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('creem_live_http_' + response.status);
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== 'object') throw new Error('creem_invalid_response');
  const row = data as Record<string, unknown>;
  if (typeof row.id !== 'string' || !/^ch_[a-zA-Z0-9_-]+$/.test(row.id) || !isCreemCheckoutUrl(row.checkout_url)) {
    throw new Error('creem_untrusted_checkout');
  }
  return { checkoutId: row.id, checkoutUrl: row.checkout_url };
}

export async function cancelCreemSubscription(subscriptionId: string) {
  if (!canManageExistingCreemSubscriptions() || !/^sub_[a-zA-Z0-9_-]{4,100}$/.test(subscriptionId)) {
    throw new Error('creem_cancel_not_configured');
  }
  const response = await fetch(
    'https://api.creem.io/v1/subscriptions/' + encodeURIComponent(subscriptionId) + '/cancel', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CREEM_LIVE_API_KEY!.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'scheduled', onExecute: 'cancel' }),
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    },
  );
  if (!response.ok) throw new Error('creem_cancel_http_' + response.status);
  const json: unknown = await response.json().catch(() => null);
  if (!json || typeof json !== 'object') throw new Error('creem_cancel_invalid_response');
  const result = json as Record<string, unknown>;
  if (result.id !== subscriptionId || !['scheduled_cancel', 'canceled'].includes(String(result.status))) {
    throw new Error('creem_cancel_unconfirmed');
  }
  return result;
}
