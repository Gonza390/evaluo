import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  createCreemTestCheckout,
  CREEM_TEST_PRODUCT_ID,
  verifyCreemWebhookSignature,
} from '../lib/payments/creem.ts';

const body = JSON.stringify({ id: 'evt_test', eventType: 'checkout.completed' });
const signature = createHmac('sha256', 'test_webhook_secret').update(body).digest('hex');
assert.equal(verifyCreemWebhookSignature(body, signature, 'test_webhook_secret'), true);
assert.equal(verifyCreemWebhookSignature(body + ' ', signature, 'test_webhook_secret'), false);
assert.equal(verifyCreemWebhookSignature(body, 'invalid', 'test_webhook_secret'), false);
assert.equal(verifyCreemWebhookSignature(body, signature, null), false);

const prev = {
  fetch: globalThis.fetch,
  key: process.env.CREEM_API_KEY,
  vercel: process.env.VERCEL_ENV,
};
const attempts: Array<{ url: string; init?: RequestInit }> = [];
try {
  process.env.CREEM_API_KEY = 'creem_test_mocked_only';
  process.env.VERCEL_ENV = 'preview';
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    attempts.push({ url: String(url), init });
    return new Response(JSON.stringify({
      id: 'ch_mock',
      checkout_url: 'https://checkout.creem.io/ch_mock',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const checkout = await createCreemTestCheckout({
    attemptId: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'test@example.com',
    successUrl: 'https://evaluoapp.com/pricing/resultado?attemptId=11111111-1111-4111-8111-111111111111',
  });
  assert.equal(checkout.checkoutId, 'ch_mock');
  assert.equal(checkout.checkoutUrl, 'https://checkout.creem.io/ch_mock');
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].url, 'https://test-api.creem.io/v1/checkouts');
  const sent = JSON.parse(String(attempts[0].init?.body));
  assert.equal(sent.product_id, CREEM_TEST_PRODUCT_ID);
  assert.equal(sent.request_id, '11111111-1111-4111-8111-111111111111');
  assert.equal(sent.metadata.userId, '22222222-2222-4222-8222-222222222222');
  assert.equal(attempts[0].init?.method, 'POST');

  process.env.VERCEL_ENV = 'production';
  await assert.rejects(createCreemTestCheckout({
    attemptId: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'test@example.com',
    successUrl: 'https://evaluoapp.com/pricing/resultado',
  }), /preview_only/);
  assert.equal(attempts.length, 1, 'En Production nunca debe abrirse un checkout de prueba.');

  process.env.VERCEL_ENV = 'preview';
  process.env.CREEM_API_KEY = 'creem_live_not_accepted';
  await assert.rejects(createCreemTestCheckout({
    attemptId: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'test@example.com',
    successUrl: 'https://evaluoapp.com/pricing/resultado',
  }), /test_key_not_configured/);
  assert.equal(attempts.length, 1);

  process.env.CREEM_API_KEY = 'creem_test_mocked_only';
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ id: 'ch_mock', checkout_url: 'https://evil.example/redirect' }), { status: 200 });
  await assert.rejects(createCreemTestCheckout({
    attemptId: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'test@example.com',
    successUrl: 'https://evaluoapp.com/pricing/resultado',
  }), /url_untrusted/);
} finally {
  globalThis.fetch = prev.fetch;
  if (prev.key === undefined) delete process.env.CREEM_API_KEY;
  else process.env.CREEM_API_KEY = prev.key;
  if (prev.vercel === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = prev.vercel;
}
console.log('Creem test checkout and HMAC signature contract passed.');
