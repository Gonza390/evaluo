/**
 * Disposable HTTP/PostgREST integration, not a production or GoTrue test.
 * JWTs below are signed only by this throwaway CI service's test secret.
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

const base = process.env.QA_POSTGREST_URL || 'http://127.0.0.1:3101';
const secret = process.env.QA_JWT_SECRET;
assert.ok(secret?.length >= 32, 'CI-only JWT secret required');

const free = '00000000-0000-4000-8000-000000000002';
const newStudent = '00000000-0000-4000-8000-000000000006';
const material = '20000000-0000-4000-8000-000000000004';
const newMaterial = '60000000-0000-4000-8000-000000000001';
const secondMaterial = '60000000-0000-4000-8000-000000000002';

function token(role, sub) {
  const encoded = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({
      role, sub, aud: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString('base64url'),
  ].join('.');
  return encoded + '.' + createHmac('sha256', secret).update(encoded).digest('base64url');
}

async function request(path, { role = 'anon', sub = free, method = 'GET', body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token(role, sub),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: response.status, data };
}
function denied(response, why) {
  assert.ok([401, 403, 404].includes(response.status),
    why + ': expected access denied; got ' + response.status + ' ' + JSON.stringify(response.data));
}
function allowed(response, why) {
  assert.ok(response.status >= 200 && response.status < 300,
    why + ': HTTP ' + response.status + ' ' + JSON.stringify(response.data));
}
const claim = (item_key) => ({
  p_user_id: free,
  p_material_id: material,
  p_kind: 'multiple_choice',
  p_item_key: item_key,
});
const api = '/rpc/claim_free_study_v2_unlock';

denied(await request('/free_study_v2_unlocks', { role: 'anon' }), 'Anonymous quota read');
denied(await request('/free_study_v2_unlocks', { role: 'authenticated' }), 'Student quota read');
denied(await request('/free_study_v2_upload_claims', { role: 'authenticated' }), 'Student lifetime claim read');
denied(await request('/free_study_v2_banks', { role: 'authenticated' }), 'Student cached bank read');
denied(await request(api, {
  role: 'authenticated', method: 'POST', body: claim(material + ':q:13'),
}), 'Forged authenticated quota claim');
denied(await request('/rpc/save_free_study_v2_plan', {
  role: 'authenticated', method: 'POST', body: {
    p_user_id: free,
    p_exam_date: '2027-01-14',
    p_daily_minutes: 30,
    p_material_ids: [material],
    p_preferences: ['practicar'],
    p_schedule: [],
  },
}), 'Forged authenticated plan RPC');

const exhausted = await request(api, {
  role: 'service_role', method: 'POST', body: claim(material + ':q:13'),
});
allowed(exhausted, 'Service-role quota status');
assert.equal(exhausted.data[0].allowed, false, '13th question must be denied');
assert.equal(exhausted.data[0].used_count, 12);
assert.equal(exhausted.data[0].limit_count, 12);
const replay = await request(api, {
  role: 'service_role', method: 'POST', body: claim(material + ':q:1'),
});
allowed(replay, 'Service-role previously unlocked replay');
assert.equal(replay.data[0].allowed, true);
assert.equal(replay.data[0].already_unlocked, true);

// Premium subscription states and daily upload cap via the same signed REST path.
const paid = '00000000-0000-4000-8000-000000000004';
const paidUpload = '70000000-0000-4000-8000-000000000001';
const premiumStatusRpc = '/rpc/free_study_v2_is_premium_account';
async function premiumStatus() {
  const response = await request(premiumStatusRpc, {
    role: 'service_role', method: 'POST', body: { p_user_id: paid },
  });
  allowed(response, 'Premium entitlement RPC');
  return response.data;
}
assert.equal(await premiumStatus(), true, 'Active premium must have entitlement');
const fourthPaid = await request('/student_materials', {
  role: 'authenticated', sub: paid, method: 'POST',
  body: { id: paidUpload, user_id: paid, processing_status: 'ready' },
});
assert.equal(fourthPaid.status, 400, 'Fourth daily Premium upload must be blocked');
assert.equal(fourthPaid.data?.message, 'premium_daily_upload_limit');
const cancel = await request('/user_subscriptions?user_id=eq.' + paid, {
  role: 'service_role', method: 'PATCH',
  body: { status: 'canceled', expires_at: new Date(Date.now() + 86400000).toISOString() },
});
allowed(cancel, 'Cancel subscription preserving paid period');
assert.equal(await premiumStatus(), true, 'Cancellation should preserve remaining entitlement');
const expire = await request('/user_subscriptions?user_id=eq.' + paid, {
  role: 'service_role', method: 'PATCH',
  body: { status: 'canceled', expires_at: new Date(Date.now() - 86400000).toISOString() },
});
allowed(expire, 'Expire canceled subscription');
assert.equal(await premiumStatus(), false, 'Expired premium must not retain entitlement');
const expiredPaidUpload = await request('/student_materials', {
  role: 'authenticated', sub: paid, method: 'POST',
  body: { id: paidUpload, user_id: paid, processing_status: 'ready' },
});
assert.equal(expiredPaidUpload.status, 400, 'Expired premium must follow Free upload limit');
assert.equal(expiredPaidUpload.data?.message, 'free_v2_lifetime_upload_limit');

denied(await request('/student_materials', {
  role: 'authenticated', sub: newStudent, method: 'POST',
  body: { id: newMaterial, user_id: '00000000-0000-4000-8000-000000000007', processing_status: 'ready' },
}), 'Student impersonation on file insertion');

const first = await request('/student_materials', {
  role: 'authenticated', sub: newStudent, method: 'POST',
  body: { id: newMaterial, user_id: newStudent, processing_status: 'ready' },
});
allowed(first, 'First user-owned Free material');
const second = await request('/student_materials', {
  role: 'authenticated', sub: newStudent, method: 'POST',
  body: { id: secondMaterial, user_id: newStudent, processing_status: 'ready' },
});
assert.equal(second.status, 400, 'Second material should be rejected by insert trigger');
assert.equal(second.data?.message, 'free_v2_lifetime_upload_limit');

const removed = await request('/student_materials?id=eq.' + newMaterial, {
  role: 'authenticated', sub: newStudent, method: 'DELETE',
});
allowed(removed, 'Delete first material');
const reupload = await request('/student_materials', {
  role: 'authenticated', sub: newStudent, method: 'POST',
  body: { id: secondMaterial, user_id: newStudent, processing_status: 'ready' },
});
assert.equal(reupload.status, 400, 'Deletion must never replenish the Free material');
assert.equal(reupload.data?.message, 'free_v2_lifetime_upload_limit');

denied(await request('/student_personal_study_plans', {
  role: 'authenticated', sub: newStudent, method: 'POST',
  body: { user_id: newStudent, exam_date: '2027-01-14' },
}), 'Authenticated direct plan INSERT with rollout enabled');

const claims = await request('/free_study_v2_upload_claims?user_id=eq.' + newStudent, {
  role: 'service_role',
});
allowed(claims, 'Lifetime claim persisted through deletion');
assert.equal(claims.data.length, 1);
const dbFlag = await request('/free_study_v2_rollout?id=eq.true', { role: 'service_role' });
allowed(dbFlag, 'Database rollout state');
assert.equal(dbFlag.data[0]?.enabled, true);

console.log('PASS Free V2 HTTP integration: signed test JWT, RLS, Free/Premium entitlements, cancellation, daily/lifetime uploads, replay and plan guard.');
