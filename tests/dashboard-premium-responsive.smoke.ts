import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=(path:string)=>readFileSync(path,'utf8');
const page=read('app/(es)/dashboard/premium/page.tsx');
const screen=read('components/pricing/UpgradeScreen.tsx');
const nav=read('components/navbar.tsx');
const mobileMenu=read('components/mobile-profile-menu.tsx');
const localeMessages=read('lib/i18n/messages.ts');
assert.match(localeMessages,/por semana · cobro mensual/, 'The Spanish monthly-billing disclosure must remain in the ES dictionary.');

assert.match(page,/await getSessionUser\(\)/,'Premium dashboard must require student authentication.');
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
// Menú circular del avatar (5ab9af2): solo Ajustes y Sugerencias; Premium se abre
// desde "Mejorar mi plan" en el menú lateral.
assert.match(mobileMenu,/data-mobile-profile-menu-trigger/,
  'The profile avatar remains the menu trigger.');
assert.match(mobileMenu,/id: 'settings'[\s\S]*?id: 'feedback'/,
  'The circular menu offers Settings and Suggestions.');


// "Mejorar mi plan" (7/11): una columna, precio por semana y cobro mensual visible.
assert.match(screen,/mx-auto flex max-w-\[420px\] flex-col items-center/,'Single centered column inside the app.');
assert.match(screen,/grid w-full grid-cols-4/,'Four comparison columns fit mobile widths.');
assert.match(screen,/text-destacado[^"]*sm:text-\[38px\]/,'Headline scale from the approved design.');
for(const text of [
  'Llegá a tu parcial', 'sabiendo que estás listo', 'Get to your exam',
  'Seguir con Premium', 'Pago seguro con', '/semana', '/week', 'Volver',
])assert.ok(screen.includes(text),'Upgrade screen copy changed: '+text);
assert.match(screen,/useMercadoPagoCheckout\(\{ offerCode: plan, source, materiaId, parcial, returnTo, english: en \}\)/,
  'Premium CTA must use the existing protected Mercado Pago checkout.');
assert.match(screen,/useCreemCheckout\(\{ english: en, mode: 'live' \}\)/,
  'International CTA must use the existing Creem checkout.');
assert.match(screen,/offer\?\.monthlyPriceArs/,'Never invent live offer amounts.');
assert.match(screen,/subscriptionStatus === 'attention'/,'Pending payments are handled safely.');
console.log('Premium dashboard layout and payment handoff checks passed.');
