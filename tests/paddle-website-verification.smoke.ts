import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const terms = read('app/(es)/terminos/page.tsx');
const refunds = read('app/(es)/reembolsos/page.tsx');
const billing = read('app/(es)/facturacion/page.tsx');
const pricing = read('app/(es)/pricing/page.tsx');
const footer = read('components/footer-home.tsx');
const privacy = read('app/(es)/privacidad/page.tsx');

for (const [name, source] of [['terms', terms], ['refunds', refunds], ['privacy', privacy]]) {
  assert.match(source, /FooterHome/, name + ' must include footer legal navigation');
}
for (const url of ['/terminos', '/privacidad', '/reembolsos']) {
  assert.ok(footer.includes('href="' + url + '"'), url + ' is required from homepage');
}
assert.match(footer, /mailto:facturacion@evaluo\.com\.ar/, 'Public support email');
assert.match(terms, /Paddle\.com, que actúa como Merchant of Record/);
assert.match(terms, /marca comercial/);
assert.match(terms, /US\$ 9,99/);
assert.match(terms, /renovará automáticamente/);
assert.match(terms, /https:\/\/paddle\.net/);
assert.match(refunds, /https:\/\/paddle\.net/);
assert.match(refunds, /https:\/\/www\.paddle\.com\/legal\/refund-policy/);
assert.match(refunds, /derechos de desistimiento/);
assert.match(billing, /4 bis\. Compras internacionales con Paddle/);
assert.match(pricing, /US\$ 9,99/);
assert.match(pricing, /todavía no disponible para comprar/);
assert.match(pricing, /Renovación automática mensual/);
assert.match(pricing, /href="\/reembolsos"/);
assert.doesNotMatch(refunds, /reembolso garantizado durante 30 días/i,
  'Do not invent unsupported refund promises.');
console.log('Paddle verification web content smoke passed.');
