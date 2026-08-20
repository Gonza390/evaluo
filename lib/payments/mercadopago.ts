import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const API_URL = 'https://api.mercadopago.com';
const REQUEST_TIMEOUT_MS = 12_000;

export type MercadoPagoPreapproval = {
  id: string;
  status: string;
  external_reference?: string | null;
  init_point?: string | null;
  payer_email?: string | null;
  date_created?: string | null;
  last_modified?: string | null;
  next_payment_date?: string | null;
  auto_recurring?: {
    transaction_amount?: number | null;
    currency_id?: string | null;
    frequency?: number | null;
    frequency_type?: string | null;
  } | null;
};

export type MercadoPagoAuthorizedPayment = {
  id: number;
  preapproval_id: string;
  currency_id?: string | null;
  transaction_amount?: number | string | null;
  debit_date?: string | null;
  retry_attempt?: number | null;
  status?: string | null;
  summarized?: string | null;
  payment?: {
    id?: number | null;
    status?: string | null;
    status_detail?: string | null;
  } | null;
};

type MercadoPagoAuthorizedPaymentSearch = {
  results?: MercadoPagoAuthorizedPayment[];
};

function accessToken() {
  const value = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!value) throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado.');
  return value;
}

export function mercadoPagoPayerEmail(userEmail: string) {
  const isTestMode =
    process.env.MERCADOPAGO_TEST_MODE === 'true' || accessToken().startsWith('TEST-');
  if (!isTestMode) return userEmail;

  const testPayerEmail = process.env.MERCADOPAGO_TEST_PAYER_EMAIL?.trim();
  if (!testPayerEmail) throw new Error('MERCADOPAGO_TEST_PAYER_EMAIL no configurado.');
  return testPayerEmail;
}

async function mercadoPagoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload ? payload.message : null;
    throw new Error(`Mercado Pago (${response.status}): ${message || 'respuesta invalida'}`);
  }
  return payload as T;
}

export function createMercadoPagoSubscription(input: {
  attemptId: string;
  email: string;
  amount: number;
  backUrl: string;
}) {
  return mercadoPagoRequest<MercadoPagoPreapproval>('/preapproval', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.attemptId },
    body: JSON.stringify({
      reason: 'Evaluo Premium',
      external_reference: input.attemptId,
      payer_email: input.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: input.amount,
        currency_id: 'ARS',
      },
      back_url: input.backUrl,
      status: 'pending',
    }),
  });
}

export function getMercadoPagoSubscription(id: string) {
  return mercadoPagoRequest<MercadoPagoPreapproval>(`/preapproval/${encodeURIComponent(id)}`);
}

export function cancelMercadoPagoSubscription(id: string) {
  return mercadoPagoRequest<MercadoPagoPreapproval>(`/preapproval/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'canceled' }),
  });
}

export function getMercadoPagoAuthorizedPayment(id: string) {
  return mercadoPagoRequest<MercadoPagoAuthorizedPayment>(
    `/authorized_payments/${encodeURIComponent(id)}`
  );
}

export async function findMercadoPagoAuthorizedPaymentByPaymentId(id: string) {
  const payload = await mercadoPagoRequest<MercadoPagoAuthorizedPaymentSearch>(
    `/authorized_payments/search?payment_id=${encodeURIComponent(id)}`
  );
  return payload.results?.[0] ?? null;
}

function parseSignature(header: string) {
  return Object.fromEntries(
    header.split(',').map((part) => {
      const [key, ...value] = part.trim().split('=');
      return [key, value.join('=')];
    })
  );
}

export function verifyMercadoPagoWebhook(input: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret || !input.signature || !input.requestId || !input.dataId) return false;
  const parsed = parseSignature(input.signature);
  if (!parsed.ts || !parsed.v1) return false;

  const normalizedDataId = /^[a-zA-Z0-9]+$/.test(input.dataId)
    ? input.dataId.toLowerCase()
    : input.dataId;
  const manifest = `id:${normalizedDataId};request-id:${input.requestId};ts:${parsed.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  const received = parsed.v1.toLowerCase();
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
