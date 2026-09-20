import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { subscriptionStatusForPayment } from '../lib/payments/status.ts';

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

console.log('Mercado Pago webhook retry smoke tests passed.');
