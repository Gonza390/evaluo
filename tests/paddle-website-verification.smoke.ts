import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

// Compliance de pagos internacionales (Creem como Merchant of Record).
// El precio y la mención a Creem en /pricing viven en RegionalPricingMessage (oferta regional fail-closed).
const paths = [
  'app/(es)/terminos/page.tsx',
  'app/(es)/reembolsos/page.tsx',
  'app/(es)/facturacion/page.tsx',
  'app/(es)/pricing/page.tsx',
  'app/(es)/privacidad/page.tsx',
];
const [terms, refunds, billing, pricing, privacy] = paths.map(read);
const regionalPricing = read('components/pricing/RegionalPricingMessage.tsx');
const footer = read('components/footer-home.tsx');

for (const source of [terms, refunds, billing, pricing, privacy, regionalPricing]) {
  assert.doesNotMatch(source, /Paddle|paddle\.net/i);
}
for (const source of [terms, refunds, billing, privacy, regionalPricing]) {
  assert.match(source, /Creem/);
}
for (const url of ['/terminos', '/privacidad', '/reembolsos', '/politica-de-uso-aceptable']) {
  assert.ok(footer.includes('href="' + url + '"'), url);
}

assert.match(terms, /Merchant of Record/);
assert.match(terms, /creem\.io\/buyer-terms/);
assert.match(refunds, /derechos de desistimiento/);
assert.match(billing, /Compras internacionales con Creem/);
assert.match(billing, /Merchant of Record/);
assert.match(pricing, /<RegionalPricingMessage locale="es" placement="featured" \/>/);
assert.match(pricing, /<RegionalPricingMessage locale="es" placement="billing" \/>/);
assert.match(regionalPricing, /US\$ 9,99/);
assert.match(regionalPricing, /renovación mensual automática/);
// Links legales visibles junto al precio (recuperados de main).
for (const url of ['/terminos', '/privacidad', '/reembolsos', '/facturacion']) {
  assert.ok(regionalPricing.includes('href="' + url + '"'), 'pricing legal link ' + url);
}
assert.match(footer, /mailto:facturacion@evaluo\.com\.ar/);
assert.doesNotMatch(refunds, /reembolso garantizado durante 30 días/i);
console.log('Creem website compliance smoke passed.');
