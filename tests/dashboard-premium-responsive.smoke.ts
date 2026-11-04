import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=(path:string)=>readFileSync(path,'utf8');
const page=read('app/(es)/dashboard/premium/page.tsx');
const screen=read('components/pricing/PremiumDashboardScreen.tsx');
const nav=read('components/navbar.tsx');

assert.match(page,/auth\.getUser\(\)/,'Premium dashboard must require student authentication.');
assert.match(page,/safePremiumReturnTo\(params\.returnTo\)/,'Returning to the current study activity should stay safe.');
assert.match(nav,/href="\/dashboard\/premium"/,'Student sidebar must open redesigned Premium screen.');
assert.match(screen,/max-w-\[680px\]/,'Central premium page should fit Evaluo desktop dimensions.');
assert.match(screen,/sm:grid-cols-3/,'Benefits must become stacked cards on mobile.');
assert.match(screen,/overflow-x-auto/,'Comparison remains accessible if browser font settings increase cell widths.');
assert.match(screen,/w-full min-w-0 table-fixed/,'Premium comparison should fit mobile widths instead of requiring a 480px table.');
assert.match(screen,/lg:text-\[40px\]/,'Original desktop headline should be 40px.');
assert.match(screen,/sm:text-\[44px\]/,'Original monthly price should be 44px on desktop.');
assert.match(screen,/sm:text-\[24px\]/,'Section headings should retain the original 24px scale.');
assert.match(screen,/lg:pt-12/,'Desktop screen should use the original 48px upper spacing.');
assert.match(screen,/rounded-\[24px\] border-2 border-\[#1a5cff\]/,'Original Premium hero card radius and highlight must be kept.');

assert.doesNotMatch(screen,/min-h-\[2300px\]/,'Do not reproduce the HTML mockup fixed height.');
for(const text of [
  'Estudiá más. Practicá mejor.',
  'Llegá preparado a tu examen.',
  'Premium mensual',
  '¿Preferís pagar una sola vez?',
  '¿Tenés un código de descuento?',
  'Tres razones para pasarte a Premium',
  'Free vs. Premium',
  'Preguntas frecuentes',
  'Volver al estudio sin comprar',
  'Pago seguro con Mercado Pago',
])assert.ok(screen.includes(text),'Original Premium screen copy changed: '+text);
assert.match(screen,/ManualReferralCode offerCode="monthly" variant="compact" hideHeading/,
  'Coupon flow must reuse the real referral validator.');
assert.match(screen,/fetch\('\/api\/payments\/offer'/,
  'Never invent live offer amounts.');
assert.match(screen,/fetch\('\/api\/payments\/status'/,
  'Active and already-paid accounts must be handled safely.');
assert.match(screen,/fetch\('\/api\/payments\/checkout'/,
  'Premium CTA must use the existing protected checkout endpoint.');
assert.match(screen,/expectedBaseAmountArs:amount/,
  'Client must send the displayed base amount to price validation.');
assert.match(screen,/providerUrl|mercadopago\.com/,
  'Checkout URL must be verified before navigating.');
console.log('Premium dashboard layout and payment handoff checks passed.');
