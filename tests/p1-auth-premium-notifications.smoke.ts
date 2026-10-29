import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isPremiumFunnelDismissReturn,
  withPremiumDismissMarker,
} from '../lib/premium/funnel-return.ts';

// Returned gates remain dismissed even if sessionStorage is blocked.
const origin = '/materiales/123?tab=mapa&studyTopic=2#resumen';
assert.equal(
  withPremiumDismissMarker(origin, 'material_mapa_mental', '/explorar'),
  '/materiales/123?tab=mapa&studyTopic=2&premiumReturn=material_mapa_mental#resumen'
);
assert.equal(
  isPremiumFunnelDismissReturn('?premiumReturn=material_mapa_mental', 'material_mapa_mental'),
  true
);
assert.equal(
  isPremiumFunnelDismissReturn('?premiumReturn=material_mapa_mental', 'errores_review'),
  false
);
assert.equal(isPremiumFunnelDismissReturn('', 'material_mapa_mental'), false);
assert.equal(
  withPremiumDismissMarker('/materiales/123?premiumReturn=old', 'errores_review', '/dashboard'),
  '/materiales/123?premiumReturn=errores_review'
);
for (const invalid of [
  'https://attacker.example', '//attacker.example', '/\\attacker.example', 'javascript:alert(1)', '',
]) {
  assert.equal(
    withPremiumDismissMarker(invalid, 'errores_review', '/dashboard'),
    '/dashboard?premiumReturn=errores_review',
    `Unsafe return path: ${invalid}`
  );
}

const source = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const login = source('components/LoginFormGoogleFirst.tsx');
assert.doesNotMatch(login, /resolvePostLoginPath|getSafeInternalPath\(nextPath\)|\/completar-perfil\?next=/);
assert.match(login, /const redirectPath = nextPath;/, 'Email should honor the same requested destination as Google.');
assert.match(login, /getEmailSignupDestination\(data\.session, nextPath\)/, 'Do not change signup confirmation logic.');

const upsell = source('components/premium/premium-upsell.tsx');
assert.match(upsell, /isPremiumFunnelDismissReturn\(window\.location\.search, source\)/);
for (const path of ['components/premium/mapa-mental-premium-funnel.tsx', 'components/premium/errores-premium-funnel.tsx']) {
  const file = source(path);
  assert.match(file, /router\.replace\(withPremiumDismissMarker\(returnTo, SOURCE,/);
  assert.doesNotMatch(file, /router\.back\(\)/, 'Closing should use explicit source path.');
}

const notifications = source('components/notifications/notification-bell.tsx');
const requestIndex = notifications.indexOf('const result = await dismissExamReminderAction(reminder.id);');
const removeIndex = notifications.indexOf('setReminders((current) => current.filter((item) => item.id !== reminder.id));');
assert.ok(requestIndex > 0 && removeIndex > requestIndex, 'Do not remove a reminder before the server confirms.');
assert.match(notifications, /if \(!result\.success\)/);
assert.match(notifications, /disabled=\{dismissingIds\.has\(reminder\.id\)\}/);
assert.match(notifications, /No pudimos descartar el recordatorio/);
console.log('p1-auth-premium-notifications.smoke passed');
