import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const paths = ['app/(es)/terminos/page.tsx','app/(es)/reembolsos/page.tsx','app/(es)/facturacion/page.tsx','app/(es)/pricing/page.tsx','app/(es)/privacidad/page.tsx'];
const [terms,refunds,billing,pricing,privacy] = paths.map(read);
const footer=read('components/footer-home.tsx');
for(const source of [terms,refunds,billing,pricing,privacy]) { assert.doesNotMatch(source,/Paddle|paddle\\.net/i); assert.match(source,/Creem/); }
for(const url of ['/terminos','/privacidad','/reembolsos','/politica-de-uso-aceptable']) assert.ok(footer.includes('href="'+url+'"'),url);
assert.match(terms,/Merchant of Record/);
assert.match(refunds,/derechos de desistimiento/);
assert.match(billing,/Compras internacionales con Creem/);
assert.match(pricing,/US\\$ 9,99/);
assert.match(pricing,/todavía no disponible para comprar/);
assert.match(pricing,/Renovación automática mensual/);
assert.match(footer,/mailto:facturacion@evaluo\\.com\\.ar/);
assert.doesNotMatch(refunds,/reembolso garantizado durante 30 días/i);
console.log('Creem website compliance smoke passed.');
