import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { subscriptionStatusForPayment } from '../lib/payments/status.ts';
import { canceledSubscriptionAccessUntil, preapprovalCheckoutStatus } from '../lib/payments/subscription-lifecycle.ts';

const routeSource = readFileSync(resolve('app/api/webhooks/mercadopago/route.ts'), 'utf8');
const migrationSource = readFileSync(
  resolve('supabase/migrations/20260919223000_retry_failed_payment_webhook_events.sql'),
  'utf8'
);
const postSource = routeSource.slice(routeSource.indexOf('export async function POST'));

assert.equal(subscriptionStatusForPayment('approved'), 'active');
for (const status of ['rejected', 'cancelled', 'canceled', 'refunded', 'charged_back']) {
  assert.equal(subscriptionStatusForPayment(status), 'past_due');
}

assert.match(postSource, /admin\.rpc\(\s*['"]claim_payment_webhook_event['"]/);
assert.match(postSource, /if \(!eventRowId \|\| !shouldProcess\)[\s\S]*duplicate: true/);
assert.match(postSource, /status: ['"]processed['"][\s\S]*processed_at: now/);
assert.match(postSource, /catch \(error\)[\s\S]*status: ['"]failed['"][\s\S]*processing_failed/);
assert.ok(
  postSource.indexOf('claim_payment_webhook_event') < postSource.indexOf('getMercadoPagoAuthorizedPayment(resourceId)'),
  'El evento debe reclamarse antes de consultar o reconciliar Mercado Pago.'
);

assert.match(migrationSource, /status = ['"]failed['"]/);
assert.match(migrationSource, /status = ['"]received['"][\s\S]*interval ['"]5 minutes['"]/);
assert.match(migrationSource, /error_message = null/);
assert.match(migrationSource, /processed_at = null/);
assert.match(migrationSource, /return query select v_id, false, coalesce\(v_status, ['"]unknown['"]\)/);
assert.match(migrationSource, /revoke all on function public\.claim_payment_webhook_event[\s\S]*from public, anon, authenticated/);
assert.match(migrationSource, /grant execute on function public\.claim_payment_webhook_event[\s\S]*to service_role/);


const fixedNow = Date.parse('2026-11-05T12:00:00.000Z');
assert.equal(preapprovalCheckoutStatus('authorized', 'pending'), 'approved');
assert.equal(preapprovalCheckoutStatus('canceled', 'pending'), 'failed',
  'Un checkout cancelado antes del pago no puede quedar pendiente para siempre.');
assert.equal(preapprovalCheckoutStatus('canceled', 'approved'), 'approved',
  'Una compra ya confirmada no debe volver a pendiente al cancelar la renovación.');
assert.equal(preapprovalCheckoutStatus('paused', 'approved'), 'approved');
assert.equal(preapprovalCheckoutStatus('pending', 'created'), 'pending');
assert.equal(
  canceledSubscriptionAccessUntil(null, ['2026-12-05T12:00:00Z', null], fixedNow),
  '2026-12-05T12:00:00.000Z',
  'No quitar el acceso pagado si Mercado Pago omite la fecha al cancelar.',
);
assert.equal(
  canceledSubscriptionAccessUntil('2026-11-20T12:00:00Z',
    ['2026-12-05T12:00:00Z'], fixedNow),
  '2026-12-05T12:00:00.000Z',
);
assert.equal(canceledSubscriptionAccessUntil(null, [null], fixedNow),
  '2026-11-05T12:00:00.000Z',
  'Nunca inventar meses de Premium sin una fecha verificada.');
assert.match(routeSource, /canceledSubscriptionAccessUntil\(/);
assert.match(routeSource, /preapprovalCheckoutStatus\(internalStatus, attempt.status\)/);
assert.match(routeSource, /\.eq\('provider_subscription_id', providerSubscription.id\)/);

console.log('Mercado Pago webhook retry and subscription cancellation smoke tests passed.');
