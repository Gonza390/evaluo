import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=(path:string)=>readFileSync(path,'utf8');
const page=read('app/(es)/dashboard/premium/page.tsx');
const screen=read('components/pricing/PremiumDashboardScreen.tsx');
const nav=read('components/navbar.tsx');
const mobileMenu=read('components/mobile-profile-menu.tsx');
const localeMessages=read('lib/i18n/messages.ts');
assert.match(localeMessages,/por semana · cobro mensual/, 'The Spanish monthly-billing disclosure must remain in the ES dictionary.');

assert.match(page,/auth\.getUser\(\)/,'Premium dashboard must require student authentication.');
assert.match(page,/safePremiumReturnTo\(params\.returnTo\)/,'Returning to the current study activity should stay safe.');
assert.match(nav,/href="\/dashboard\/premium"/,'Student sidebar must open redesigned Premium screen.');
assert.match(nav, /data-sidebar-plan-upgrade/,
  'The plans link remains a distinct entry in the desktop sidebar.');
assert.match(nav, /<TrendingUp className="h-4 w-4" aria-hidden="true" \/>/,
  'The improvement link uses a progress icon instead of a crown.');
assert.doesNotMatch(nav, /<Crown/,
  'The sidebar upgrade link should not display a crown.');
assert.match(nav, /messages\.navigation\.improvePlan/,
  'The new label must follow the current application language.');
assert.match(localeMessages, /improvePlan: 'Mejorar mi plan'/,
  'Spanish should display exactly the selected upgrade label.');
assert.match(localeMessages, /improvePlan: 'Improve my plan'/,
  'The English sidebar must be localized too.');
assert.match(nav, /hover:bg-\[#EEF2FF\]/,
  'Keep the indigo highlight subtle, with no permanently tinted card.');
assert.match(nav, /collapsed \? messages\.navigation\.improvePlan : undefined/,
  'The collapsed sidebar must expose an accessible label.');
assert.match(nav, /isNavItemActive\(pathname, '\/dashboard\/premium'\)/,
  'The upgrade entry should signal the current page when opened.');
assert.match(mobileMenu,/href="\/dashboard\/premium\?source=mobile_profile_menu"/,
  'Mobile profile upsell must open redesigned Premium, not outdated public pricing.');
assert.match(mobileMenu,/messages\.navigation\.perWeek/,
  'Preserve the weekly-equivalent amount, clearly labeled as monthly billing.');
assert.match(mobileMenu,/!isPremium \? \(/,
  'Mobile upsell remains visible to Free accounts only.');
assert.match(mobileMenu,/data-mobile-profile-menu-trigger/,
  'The profile avatar remains the menu trigger.');
assert.match(mobileMenu,/focus:text-\[#0F1B3D\]/,
  'Premium menu card must remain dark and readable when it receives touch focus.');
assert.match(mobileMenu,/hover:text-\[#0F1B3D\]/,
  'Premium menu card must preserve readable text on hover.');
assert.match(mobileMenu,/data-\[highlighted\]:text-\[#0F1B3D\]/,
  'Radix highlighted state must never use the white accent foreground on the light Premium card.');
assert.match(mobileMenu,/focus:bg-\[#EEF2FF\]/,
  'The Premium menu focus background must have sufficient contrast with the label.');
const highlight = mobileMenu.match(/const mobileMenuItemHighlight =\s*'([^']+)'/)?.[1];
assert.ok(highlight, 'The profile menu must have one shared highlight style.');
for (const state of [
  'hover:bg-[#EEF2FF]', 'focus:bg-[#EEF2FF]', 'data-[highlighted]:bg-[#EEF2FF]',
  'hover:text-[#0F1B3D]', 'focus:text-[#0F1B3D]', 'data-[highlighted]:text-[#0F1B3D]',
]) assert.ok(highlight.includes(state), 'The shared mobile menu highlight lacks ' + state);
assert.match(mobileMenu,/DropdownMenuItem asChild className=\{mobileMenuItemHighlight\}>\s*<Link href="\/configuracion"/,
  'Settings must use the shared Premium highlight.');
assert.match(mobileMenu,/text-\[13px\] ' \+ mobileMenuItemHighlight\}\s*onSelect=\{\(\) => setFeedbackOpen\(true\)\}/,
  'Suggestions must use the shared Premium highlight.');
assert.match(mobileMenu,/!isPremium \? \(\s*<DropdownMenuItem asChild className=\{mobileMenuItemHighlight\}>/,
  'Premium must use the same profile menu highlight.');


assert.match(screen,/max-w-\[680px\]/,'Central premium page should fit Evaluo desktop dimensions.');
assert.match(screen,/min-\[850px\]:grid-cols-3/,'Benefits should remain stacked until there is room inside the app sidebar.');
assert.match(screen,/overflow-x-auto/,'Comparison remains accessible if browser font settings increase cell widths.');
assert.match(screen,/w-full min-w-0 table-fixed/,'Premium comparison should fit mobile widths instead of requiring a 480px table.');
assert.match(screen,/lg:text-\[40px\]/,'Original desktop headline should be 40px.');
assert.match(screen,/sm:text-\[44px\]/,'Original monthly price should be 44px on desktop.');
assert.match(screen,/sm:text-\[24px\]/,'Section headings should retain the original 24px scale.');
assert.match(screen,/lg:pt-12/,'Desktop screen should use the original 48px upper spacing.');
assert.match(screen,/rounded-\[24px\] border-2 border-\[#476ebe\]/,'Original Premium hero card radius and highlight must be kept.');

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
