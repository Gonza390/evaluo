import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PREMIUM_STUDY_LIMITS, PREMIUM_STUDY_ACCESS } from '../lib/study-commercial-entitlements.ts';
import { appliesFreeStudyV2 } from '../lib/free-study-v2.ts';
import { hasPremiumSubscriptionAccess } from '../lib/payments/status.ts';

const read = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
assert.equal(PREMIUM_STUDY_LIMITS.materialsPerUtcDay, 3);
assert.equal(PREMIUM_STUDY_LIMITS.maxSimultaneousProcessing, 1);
assert.ok(Object.values(PREMIUM_STUDY_ACCESS).every(x => typeof x === 'boolean'));
assert.equal(PREMIUM_STUDY_ACCESS.mindMapIncluded, true);
for (const [name, enabled] of Object.entries(PREMIUM_STUDY_ACCESS)) {
  if (name.endsWith('QuotaApplies')) assert.equal(enabled, false, name);
}

const future = new Date(Date.now() + 3600_000).toISOString();
const expired = new Date(Date.now() - 3600_000).toISOString();
for (const status of ['active', 'approved', 'authorized', 'trialing']) {
  assert.equal(hasPremiumSubscriptionAccess(status, future), true);
  assert.equal(hasPremiumSubscriptionAccess(status, expired), false);
}
assert.equal(hasPremiumSubscriptionAccess('canceled', future), true);
assert.equal(hasPremiumSubscriptionAccess('canceled', expired), false);
assert.equal(hasPremiumSubscriptionAccess('past_due', future), false);
assert.equal(hasPremiumSubscriptionAccess('rejected', future), false);

const previousEnv = [process.env.VERCEL_ENV, process.env.FREE_STUDY_V2_ENABLED];
try {
  process.env.VERCEL_ENV = 'production';
  process.env.FREE_STUDY_V2_ENABLED = '1';
  assert.equal(appliesFreeStudyV2(true), false, 'Premium never consumes Free quotas');
  assert.equal(appliesFreeStudyV2(false), true);
} finally {
  if (previousEnv[0] === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = previousEnv[0];
  if (previousEnv[1] === undefined) delete process.env.FREE_STUDY_V2_ENABLED;
  else process.env.FREE_STUDY_V2_ENABLED = previousEnv[1];
}

for (const path of [
  'app/(es)/dashboard/materiales/upload-actions.ts',
  'app/(es)/dashboard/materiales/pdf-first-upload-actions.ts',
]) {
  const source = read(path);
  assert.match(source, /PREMIUM_STUDY_LIMITS\.materialsPerUtcDay/);
  assert.match(source, /PREMIUM_STUDY_LIMITS\.maxSimultaneousProcessing/);
}
const entitlement = read('lib/premium.ts');
assert.match(entitlement, /if \(plansError \|\| subsError\) throw/);
assert.match(entitlement, /hasPremiumSubscriptionAccess\(s\.status, s\.expires_at\)/);
console.log('Premium entitlements, subscription expiry and payment access smoke tests passed.');
