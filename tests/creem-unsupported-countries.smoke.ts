import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCreemSupportedLocation } from '../lib/payments/creem-countries.ts';

// Creem no acepta pagos desde estos lugares: no se ofrece el botón de pago.
for (const country of ['VE', 'CU', 'RU', 'IR', 'KP', 'SY', 'BY', 've']) {
  assert.equal(isCreemSupportedLocation(country), false, country);
}
assert.equal(isCreemSupportedLocation('UA', '43'), false, 'Crimea');
assert.equal(isCreemSupportedLocation('UA', 'UA-14'), false, 'Donetsk');
assert.equal(isCreemSupportedLocation('UA', '30'), true, 'Kyiv');
for (const country of ['ME', 'MX', 'CO', 'PY', 'US', 'ES', null, '']) {
  assert.equal(isCreemSupportedLocation(country), true, String(country));
}

const availability = readFileSync('app/api/payments/creem/availability/route.ts', 'utf8');
assert.match(availability, /isCreemModeEnabled\('live'\) && countrySupported/);
const checkout = readFileSync('app/api/payments/creem/checkout/route.ts', 'utf8');
assert.match(checkout, /creem_country_unsupported/);
assert.ok(checkout.indexOf('creem_country_unsupported') < checkout.indexOf('createClientServer()'),
  'Rechazar antes de crear cualquier sesión de pago.');

console.log('Creem unsupported countries: no payment button and 403 at checkout passed.');
