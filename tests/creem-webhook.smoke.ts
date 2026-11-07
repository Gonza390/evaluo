import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifyCreemWebhookSignature, CREEM_TEST_PRODUCT_ID } from '../lib/payments/creem.ts';
import { canReclaimCreemPreviewEvent, parseCreemPreviewEvent } from '../lib/payments/creem-events.ts';

const attemptId = '123e4567-e89b-42d3-a456-426614174000';
const checkout = {
  id: 'evt_4l0N34kxo16AhRKUHFUuXr',
  eventType: 'checkout.completed',
  object: {
    id: 'ch_4l0N34kxo16AhRKUHFUuXr',
    mode: 'test',
    request_id: attemptId,
    status: 'completed',
    product: { id: CREEM_TEST_PRODUCT_ID },
    order: { status: 'paid', amount: 999, currency: 'USD', product: CREEM_TEST_PRODUCT_ID },
    subscription: { id: 'sub_4l0N34kxo16AhRKUHFUuXr' },
  },
};
const raw = JSON.stringify(checkout);
const secret = 'test_secret_for_webhook';
const signature = createHmac('sha256', secret).update(raw).digest('hex');
assert.equal(verifyCreemWebhookSignature(raw, signature, secret), true);
assert.equal(verifyCreemWebhookSignature(raw + ' ', signature, secret), false);
assert.equal(verifyCreemWebhookSignature(raw, 'xyz', secret), false);
assert.equal(verifyCreemWebhookSignature(raw, signature, null), false);

assert.equal(parseCreemPreviewEvent(checkout)?.accepted, true);
assert.equal(parseCreemPreviewEvent({ ...checkout, object: { ...checkout.object, mode: 'live' } })?.reason, 'not_test_mode');
assert.equal(parseCreemPreviewEvent({ ...checkout, object: { ...checkout.object, product: { id: 'prod_other' } } })?.reason, 'wrong_product');
assert.equal(parseCreemPreviewEvent({ ...checkout, object: { ...checkout.object, order: { ...checkout.object.order, status: 'pending' } } })?.reason, 'invalid_payment');
assert.equal(parseCreemPreviewEvent({ ...checkout, object: { ...checkout.object, order: { ...checkout.object.order, amount: 0 } } })?.reason, 'invalid_payment');
assert.equal(parseCreemPreviewEvent({ ...checkout, object: { ...checkout.object, request_id: 'tampered' } })?.reason, 'invalid_payment');
assert.equal(parseCreemPreviewEvent({ ...checkout, object: { ...checkout.object, order: { ...checkout.object.order, currency: 'ARS' } } })?.reason, 'invalid_payment');
assert.equal(parseCreemPreviewEvent({ id: 'bad', eventType: 'checkout.completed', object: checkout.object }), null);

const paid = {
  id: 'evt_21mO1jWmU2QHe7u2oFV7y1',
  eventType: 'subscription.paid',
  object: {
    id: 'sub_6pC2lNB6joCRQIZ1aMrTpi',
    status: 'active',
    product: { id: CREEM_TEST_PRODUCT_ID },
    current_period_end_date: '2099-12-31T00:00:00Z',
  },
};
assert.equal(parseCreemPreviewEvent(paid)?.accepted, true);
assert.equal(parseCreemPreviewEvent({ ...paid, object: { ...paid.object, current_period_end_date: '2020-01-01T00:00:00Z' } })?.reason, 'invalid_payment');
for (const eventType of ['subscription.canceled', 'subscription.paused', 'subscription.expired', 'subscription.update']) {
  assert.equal(parseCreemPreviewEvent({ ...paid, eventType })?.accepted, true);
}
assert.equal(parseCreemPreviewEvent({
  id: 'evt_refund1234', eventType: 'refund.created',
  object: { id: 'ref_test1234', subscription: { id: paid.object.id } },
})?.accepted, true);
assert.equal(parseCreemPreviewEvent({
  id: 'evt_dispute1234', eventType: 'dispute.created',
  object: { id: 'disp_test1234', subscription: { id: paid.object.id } },
})?.accepted, true);
assert.equal(parseCreemPreviewEvent({ ...paid, eventType: 'unknown.action' })?.reason, 'unsupported_event');

const clock = Date.parse('2026-11-06T18:00:00Z');
assert.equal(canReclaimCreemPreviewEvent('processed', '2026-11-06T12:00:00Z', clock), false);
assert.equal(canReclaimCreemPreviewEvent('failed', '2026-11-06T17:59:00Z', clock), true);
assert.equal(canReclaimCreemPreviewEvent('received', '2026-11-06T17:59:00Z', clock), false);
assert.equal(canReclaimCreemPreviewEvent('received', '2026-11-06T17:54:00Z', clock), true);

const route = readFileSync('app/api/webhooks/creem/route.ts', 'utf8');
assert.match(route, /VERCEL_ENV === 'production'/);
assert.match(route, /creem-signature/);
assert.ok(route.indexOf('verifyCreemWebhookSignature(') < route.indexOf('JSON.parse(rawBody)'));
assert.match(route, /provider:\s*PROVIDER/);
assert.match(route, /insertionError\.code === '23505'/);
assert.match(route, /event\.accepted \? 'processed' : 'ignored'/);
assert.doesNotMatch(route, /\.from\('user_subscriptions'\)/);
assert.doesNotMatch(route, /\.from\('payment_transactions'\)/);
console.log('Creem preview webhook: HMAC, validation, isolation and retry contract passed.');
