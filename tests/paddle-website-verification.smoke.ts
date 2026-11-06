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
assert.doesNotMatch(pricing, /2 PDFs cada 15 días|2 cada 15 días/,
  'La página pública no puede ofrecer la cuota anterior si Free V2 se lanza.');
for (const freeEntitlement of [
  '1 material PDF o Word gratis de por vida',
  '12 preguntas de opción múltiple y 10 de verdadero/falso',
  '25 flashcards, 2 casos prácticos y 1 ronda de unir conceptos',
  '1 simulacro y 1 plan de estudio gratuito',
]) assert.ok(pricing.includes(freeEntitlement),
  'La oferta publicada debe coincidir con el backend: ' + freeEntitlement);

assert.match(pricing, /href="\/reembolsos"/);
assert.doesNotMatch(refunds, /reembolso garantizado durante 30 días/i,
  'Do not invent unsupported refund promises.');
console.log('Paddle verification web content smoke passed.');
