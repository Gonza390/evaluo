import assert from 'node:assert/strict';
import {
  createMercadoPagoSubscription,
  createMercadoPagoOneTimePreference,
} from '../lib/payments/mercadopago.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PREMIUM_MONTHLY_PRICE_ARS,
  PREMIUM_MONTHLY_REFERENCE_PRICE_ARS,
  PREMIUM_RECOVERY_PRICE_ARS,
  PREMIUM_SEMESTER_PRICE_ARS,
  semesterEquivalentMonthlyPrice,
  semesterSavingsPercent,
} from '../lib/payments/offers.ts';

const source = (path: string) => readFileSync(resolve(path), 'utf8');
const checkout = source('app/api/payments/checkout/route.ts');
const offer = source('app/api/payments/offer/route.ts');
const checkoutCard = source('components/pricing/PaymentCheckoutCard.tsx');
const mercadopago = source('lib/payments/mercadopago.ts');
const webhook = source('app/api/webhooks/mercadopago/route.ts');
const planSync = source('ops/pricing/launch-premium-price-9990.sql');

// Contrato de precios público (no depende de la fila antigua en Supabase).
assert.equal(PREMIUM_MONTHLY_PRICE_ARS, 9_990);
assert.equal(PREMIUM_MONTHLY_REFERENCE_PRICE_ARS, 14_990);
assert.equal(PREMIUM_RECOVERY_PRICE_ARS, 9_990);
assert.equal(PREMIUM_SEMESTER_PRICE_ARS, 45_000);
assert.equal(semesterEquivalentMonthlyPrice(), 7_500);
assert.equal(semesterSavingsPercent(), 25);

// API de ofertas y tarjeta muestran el mismo precio canónico.
assert.match(offer, /monthlyPriceArs:\s*PREMIUM_MONTHLY_PRICE_ARS/);
assert.match(offer, /monthlyReferencePriceArs:\s*PREMIUM_MONTHLY_REFERENCE_PRICE_ARS/);
assert.match(offer, /semesterPriceArs:\s*PREMIUM_SEMESTER_PRICE_ARS/);
assert.match(checkoutCard, /return offer\.monthlyPriceArs/);
assert.match(checkoutCard, /return offer\.semesterPriceArs/);
assert.match(checkoutCard, /expectedBaseAmountArs:\s*displayedPrice/);

// El servidor calcula el importe, NO confía en un precio enviado por el cliente.
// Rechaza versiones desactualizadas antes de crear una suscripción o preferencia.
assert.match(checkout, /const monthlyPrice = PREMIUM_MONTHLY_PRICE_ARS/);
assert.match(checkout, /offerCode === 'semester'[\s\S]*?PREMIUM_SEMESTER_PRICE_ARS[\s\S]*?offerCode === 'recovery'[\s\S]*?PREMIUM_RECOVERY_PRICE_ARS/);
assert.match(checkout, /const amount = promotion\?\.amountArs \?\? baseAmount/);
assert.match(checkout, /expected !== baseAmount[\s\S]*?price_changed/);
assert.ok(checkout.indexOf('expected !== baseAmount') < checkout.indexOf('const attemptId = randomUUID()'));
assert.match(checkout, /base_amount_ars:\s*baseAmount/);
assert.match(checkout, /amount_ars:\s*amount/);
assert.match(checkout, /createMercadoPagoSubscription\(\{[\s\S]*?\bamount\s*,/);
assert.match(checkout, /createMercadoPagoOneTimePreference\(\{[\s\S]*?\bamount\s*,/);
assert.doesNotMatch(checkout, /plan\.price_ars/);

// Mercado Pago recibe exactamente el importe que quedó guardado en el intento.
assert.match(mercadopago, /'\/preapproval'[\s\S]*?transaction_amount:\s*input\.amount/);
assert.match(mercadopago, /'\/checkout\/preferences'[\s\S]*?unit_price:\s*input\.amount/);
assert.match(mercadopago, /frequency:\s*1,[\s\S]*?frequency_type:\s*'months'/);
assert.match(mercadopago, /currency_id:\s*'ARS'/);

// El webhook concilia contra el precio de cada operación y suscripción existente,
// no contra el nuevo precio público.
assert.match(webhook, /Number\(subscription\.amount_ars\) !== amount/);
assert.match(webhook, /providerAmount !== Number\(attempt\.amount_ars\)/);
assert.match(webhook, /amount_ars:\s*providerAmount/);

// La actualización del catálogo queda pendiente del lanzamiento, con condición de precio.
assert.match(planSync, /EJECUTAR MANUALMENTE SOLO DESPUÉS/);
assert.match(planSync, /previous_price <> 12990/);
assert.match(planSync, /SET price_ars = 9990/);
assert.match(planSync, /WHERE code = 'premium' AND is_active = true/);
assert.doesNotMatch(planSync, /^UPDATE public\.user_subscriptions/gm);

// Simulamos la solicitud HTTP a Mercado Pago con fetch falso.
// No se usa la red, ninguna credencial real ni se crean pagos o suscripciones.
const priorFetch = globalThis.fetch;
const priorToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const intercepted: Array<{ url: string; init?: RequestInit }> = [];
process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-mocked-price-contract';
globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
  intercepted.push({ url: String(input), init });
  return new Response(
    JSON.stringify({ id: 'mocked-provider-id', init_point: 'https://www.mercadopago.com.ar/mock' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

try {
  await createMercadoPagoSubscription({
    attemptId: 'monthly-amount-smoke',
    email: 'test_buyer@example.com',
    amount: PREMIUM_MONTHLY_PRICE_ARS,
    backUrl: 'https://evaluoapp.com/pricing/resultado',
  });
  await createMercadoPagoOneTimePreference({
    attemptId: 'semester-amount-smoke',
    email: 'test_buyer@example.com',
    amount: PREMIUM_SEMESTER_PRICE_ARS,
    backUrl: 'https://evaluoapp.com/pricing/resultado',
    notificationUrl: 'https://evaluoapp.com/api/webhooks/mercadopago',
  });

  assert.equal(intercepted.length, 2);
  const [monthlyCall, semesterCall] = intercepted;
  assert.equal(monthlyCall.url, 'https://api.mercadopago.com/preapproval');
  assert.equal(semesterCall.url, 'https://api.mercadopago.com/checkout/preferences');
  assert.equal(monthlyCall.init?.method, 'POST');
  assert.equal(semesterCall.init?.method, 'POST');

  const recurring = JSON.parse(String(monthlyCall.init?.body));
  const semester = JSON.parse(String(semesterCall.init?.body));
  assert.equal(recurring.auto_recurring.transaction_amount, 9_990);
  assert.equal(recurring.auto_recurring.currency_id, 'ARS');
  assert.equal(recurring.auto_recurring.frequency, 1);
  assert.equal(recurring.auto_recurring.frequency_type, 'months');
  assert.equal(recurring.external_reference, 'monthly-amount-smoke');
  assert.equal(semester.items.length, 1);
  assert.equal(semester.items[0].unit_price, 45_000);
  assert.equal(semester.items[0].quantity, 1);
  assert.equal(semester.items[0].currency_id, 'ARS');
  assert.equal(semester.external_reference, 'semester-amount-smoke');
} finally {
  globalThis.fetch = priorFetch;
  if (priorToken === undefined) delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  else process.env.MERCADOPAGO_ACCESS_TOKEN = priorToken;
}

console.log('Pricing: precios, payload Mercado Pago simulado y suscripciones existentes OK.');
