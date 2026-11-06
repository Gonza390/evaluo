import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { previewLoginCanonicalUrl, EVALUO_MASTER_PREVIEW_HOST } from '../lib/auth/preview-login-origin.ts';

const input = {
  host: 'evaluo-k9xj7s8hw-olmosgonza69-9002s-projects.vercel.app',
  vercelEnvironment: 'preview',
  branch: 'master',
  pathname: '/login' as const,
  searchParams: {
    mode: 'login',
    next: '/pricing?source=creem_preview',
    intent: 'premium',
  },
};
const url = previewLoginCanonicalUrl(input);
assert.ok(url);
const target = new URL(url);
assert.equal(target.origin, 'https://' + EVALUO_MASTER_PREVIEW_HOST);
assert.equal(target.pathname, '/login');
assert.equal(target.searchParams.get('mode'), 'login');
assert.equal(target.searchParams.get('next'), '/pricing?source=creem_preview');
assert.equal(target.searchParams.get('intent'), 'premium');
assert.equal(previewLoginCanonicalUrl({ ...input, host: EVALUO_MASTER_PREVIEW_HOST }), null);
assert.equal(previewLoginCanonicalUrl({ ...input, vercelEnvironment: 'production' }), null);
assert.equal(previewLoginCanonicalUrl({ ...input, branch: 'experimental' }), null);
assert.equal(previewLoginCanonicalUrl({ ...input, host: 'evaluoapp.com' }), null);
assert.equal(previewLoginCanonicalUrl({ ...input, host: 'evil.example' }), null);
assert.equal(previewLoginCanonicalUrl({ ...input, host: 'evaluo-bad-attacker.vercel.app' }), null);
assert.equal(previewLoginCanonicalUrl({ ...input, host: EVALUO_MASTER_PREVIEW_HOST + '.evil.example' }), null);
const en = previewLoginCanonicalUrl({ ...input, pathname: '/en/login', searchParams: { next: '/en/pricing' }});
assert.equal(new URL(en!).pathname, '/en/login');
for (const page of ['app/(es)/login/page.tsx', 'app/(en)/en/login/page.tsx']) {
  const source = readFileSync(page, 'utf8');
  assert.match(source, /previewLoginCanonicalUrl/);
  assert.match(source, /if \(destination\) redirect\(destination\)/);
}
const primaryLogin = readFileSync('components/LoginFormGoogleFirst.tsx', 'utf8');
assert.match(primaryLogin, /new URL\('\/auth\/callback', window\.location\.origin\)/);
const callback = readFileSync('app/(es)/auth/callback/route.ts','utf8');
assert.match(callback, /requestUrl\.origin/);
const creemCheckout = readFileSync('app/api/payments/creem/checkout/route.ts', 'utf8');
assert.match(creemCheckout, /const successOrigin = mode === 'test' \? requestOrigin : site/);
assert.match(creemCheckout, /mode === 'test' && origin !== requestOrigin/);
console.log('Auth: master Preview login uses stable canonical origin, preserving path, production unchanged.');
