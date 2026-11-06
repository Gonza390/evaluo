import { createHmac, timingSafeEqual } from 'node:crypto';

// Esta integración se mantiene aislada de Mercado Pago durante las pruebas.
// Al pasar a producción se usará una clave y un producto live independientes.
export const CREEM_TEST_PRODUCT_ID = 'prod_1pkc1Tr6BooFlGMCKcXWB0';
const CREEM_TEST_API_URL = 'https://test-api.creem.io';
const REQUEST_TIMEOUT_MS = 12_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CreemCheckoutInput = {
  attemptId: string;
  userId: string;
  email: string;
  successUrl: string;
};

export type CreemCheckoutOutput = {
  checkoutId: string;
  checkoutUrl: string;
};

function requireCreemTestApiKey(): string {
  // Vercel usa NODE_ENV=production también en los deployments Preview.
  // VERCEL_ENV permite impedir que un checkout de prueba se abra en Production.
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error('creem_test_checkout_preview_only');
  }
  const key = process.env.CREEM_API_KEY?.trim();
  if (!key || !key.startsWith('creem_test_')) {
    throw new Error('creem_test_key_not_configured');
  }
  return key;
}

function validateCheckoutUrl(url: unknown): string {
  if (typeof url !== 'string') throw new Error('creem_checkout_url_missing');
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('creem_checkout_url_invalid');
  }
  if (
    parsed.protocol !== 'https:' ||
    (parsed.hostname !== 'creem.io' && !parsed.hostname.endsWith('.creem.io'))
  ) {
    throw new Error('creem_checkout_url_untrusted');
  }
  return parsed.toString();
}

export async function createCreemTestCheckout(
  input: CreemCheckoutInput,
): Promise<CreemCheckoutOutput> {
  if (!UUID_RE.test(input.attemptId) || !UUID_RE.test(input.userId)) {
    throw new Error('creem_checkout_invalid_reference');
  }
  if (!input.email.includes('@') || input.email.length > 254) {
    throw new Error('creem_checkout_invalid_email');
  }
  const successUrl = new URL(input.successUrl);
  if (successUrl.protocol !== 'https:' && successUrl.hostname !== 'localhost') {
    throw new Error('creem_checkout_invalid_success_url');
  }

  const response = await fetch(`${CREEM_TEST_API_URL}/v1/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': requireCreemTestApiKey(),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: 'no-store',
    body: JSON.stringify({
      product_id: CREEM_TEST_PRODUCT_ID,
      request_id: input.attemptId,
      customer: { email: input.email },
      success_url: successUrl.toString(),
      metadata: {
        userId: input.userId,
        attemptId: input.attemptId,
        source: 'evaluo',
      },
    }),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    // No propagar respuestas remotas que puedan revelar datos personales.
    throw new Error(`creem_checkout_http_${response.status}`);
  }
  if (!payload || typeof payload !== 'object') throw new Error('creem_checkout_invalid_response');
  const checkout = payload as Record<string, unknown>;
  const checkoutUrl = validateCheckoutUrl(checkout.checkout_url);
  if (typeof checkout.id !== 'string' || !checkout.id.startsWith('ch_')) {
    throw new Error('creem_checkout_id_missing');
  }
  return { checkoutId: checkout.id, checkoutUrl };
}

/** Comprobar la firma del cuerpo RAW; jamás validar un JSON serializado de nuevo. */
export function verifyCreemWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string | null | undefined,
): boolean {
  if (!secret?.trim() || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}
