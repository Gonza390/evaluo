import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { resolvePaymentProvider } from '../lib/payments/provider-selection.ts';
import { verifyPaddleWebhookSignature } from '../lib/payments/paddle-signature.ts';

assert.deepEqual(resolvePaymentProvider({ buyerCountry: 'ar' }), {
  provider: 'mercadopago',
  reason: 'argentina_local',
});
assert.deepEqual(resolvePaymentProvider({
  buyerCountry: ' AR ',
  paddleAccountApproved: true,
  internationalCheckoutEnabled: true,
}), { provider: 'mercadopago', reason: 'argentina_local' });

for (const buyerCountry of ['', 'ARG', 'A1', null, undefined]) {
  assert.equal(resolvePaymentProvider({ buyerCountry }).provider, null);
}

for (const options of [
  { paddleAccountApproved: false, internationalCheckoutEnabled: false },
  { paddleAccountApproved: true, internationalCheckoutEnabled: false },
  { paddleAccountApproved: false, internationalCheckoutEnabled: true },
]) {
  assert.deepEqual(resolvePaymentProvider({ buyerCountry: 'ES', ...options }), {
    provider: null,
    reason: 'international_disabled',
  });
}
assert.deepEqual(resolvePaymentProvider({
  buyerCountry: 'ES',
  paddleAccountApproved: true,
  internationalCheckoutEnabled: true,
}), { provider: 'paddle', reason: 'paddle_ready' });

const endpointSecret = 'sandbox-test-not-a-real-secret';
const timestamp = 1_700_000_000;
const nowMs = timestamp * 1000 + 1000;
const rawBody = '{"event_id":"evt_123","event_type":"subscription.updated"}';
const validH1 = createHmac('sha256', endpointSecret)
  .update(`${timestamp}:${rawBody}`)
  .digest('hex');
const valid = {
  signatureHeader: `ts=${timestamp};h1=${validH1}`,
  rawBody,
  endpointSecret,
  nowMs,
};

assert.equal(verifyPaddleWebhookSignature(valid), true);
assert.equal(verifyPaddleWebhookSignature({ ...valid, rawBody: rawBody + ' ' }), false);
assert.equal(verifyPaddleWebhookSignature({ ...valid, endpointSecret: 'wrong-secret' }), false);
assert.equal(verifyPaddleWebhookSignature({ ...valid, signatureHeader: null }), false);
assert.equal(verifyPaddleWebhookSignature({ ...valid, endpointSecret: null }), false);
assert.equal(verifyPaddleWebhookSignature({ ...valid, nowMs: nowMs + 6000 }), false);
assert.equal(verifyPaddleWebhookSignature({ ...valid, nowMs: nowMs - 7000 }), false);
assert.equal(verifyPaddleWebhookSignature({ ...valid, signatureHeader: 'ts=not-a-number;h1=' + validH1 }), false);
assert.equal(verifyPaddleWebhookSignature({ ...valid, signatureHeader: 'ts=' + timestamp + ';h1=not-hex' }), false);
assert.equal(verifyPaddleWebhookSignature({ ...valid, signatureHeader: 'ts=' + timestamp + ';h1=' + '0'.repeat(64) + ';h1=' + validH1 }), true);
assert.equal(verifyPaddleWebhookSignature({ ...valid, signatureHeader: 'ts=' + timestamp + ';ts=' + timestamp + ';h1=' + validH1 }), false);

console.log('Paddle readiness smoke tests passed.');
