import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveCheckoutMarket } from '../lib/payments/checkout-market.ts';

const read = (path: string) => readFileSync(path, 'utf8');
const countries: Array<[string | null, 'argentina' | 'international' | 'unknown']> = [
  ['AR', 'argentina'], ['ar', 'argentina'],
  ['US', 'international'], ['ES', 'international'],
  ['MX', 'international'], ['BR', 'international'],
  ['CL', 'international'], ['UY', 'international'], ['CO', 'international'],
  [null, 'unknown'], ['', 'unknown'], ['bad', 'unknown'],
  ['XX', 'unknown'], ['ZZ', 'unknown'], ['EU', 'unknown'],
];
for (const [country, expected] of countries) {
  assert.equal(resolveCheckoutMarket(country, 'production'), expected);
  assert.equal(resolveCheckoutMarket(country, 'preview'), expected);
}
const availability = read('app/api/payments/creem/availability/route.ts');
const selector = read('components/pricing/PricingPlanSelector.tsx');
const premium = read('components/pricing/PremiumDashboardScreen.tsx');
const spanish = read('app/(es)/pricing/page.tsx');
const english = read('app/(en)/en/pricing/page.tsx');
const home = read('components/marketing/home-redesign.tsx');
const homepageFaq = read('components/marketing/home-redesign-faqs.ts');
const regional = read('components/pricing/RegionalPricingMessage.tsx');
const hook = read('hooks/use-checkout-market.ts');
const mp = read('app/api/payments/checkout/route.ts');
const creem = read('app/api/payments/creem/checkout/route.ts');

assert.match(availability, /resolveCheckoutMarket\(country, process\.env\.VERCEL_ENV\)/);
assert.match(availability, /creemAvailable: mode === 'live' && isCreemModeEnabled\('live'\)/,
  'A Preview TEST key must not enable the LIVE checkout card');
assert.match(hook, /fetch\('\/api\/payments\/creem\/availability'/);
assert.match(hook, /market: 'unknown'/);
assert.match(selector, /useCheckoutMarket\(\)/);
assert.match(selector, /market\.market === 'international'/);
assert.match(selector, /market\.market === 'unknown'/);
assert.match(selector, /market\?\.market === 'argentina' \? <details/);
assert.doesNotMatch(selector, /<CreemCheckoutCard[^>]*mode="test"/,
  'Preview must not mix a USD test card with Argentina ARS plans');
assert.match(premium, /useCheckoutMarket\(\)/);
assert.match(premium, /market\?\.market !== 'argentina'/);
assert.match(premium, /market\.market==='international'/);
assert.match(spanish, /<RegionalPricingMessage locale="es" placement="featured"/);
assert.match(spanish, /<RegionalPricingMessage locale="es" placement="hero"/);
assert.match(spanish, /<RegionalPricingMessage locale="es" placement="billing"/);
assert.doesNotMatch(spanish, /<section aria-label="Precio internacional de Evaluo"/);
assert.match(english, /<RegionalPricingMessage locale="en" placement="billing"/);
assert.doesNotMatch(english, /In Argentina, local offers are billed/);
assert.match(home, /<RegionalPricingMessage placement="home-plan"/);
assert.match(home, /<RegionalPricingMessage placement="home-footer"/);
assert.match(home, /<RegionalPricingMessage placement="home-faq"/);
assert.match(homepageFaq, /Las opciones de pago y la moneda dependen del país/);
assert.match(homepageFaq, /Billing options and currency depend on the country/);
assert.doesNotMatch(homepageFaq, /Pagás en pesos argentinos mediante Mercado Pago/);
assert.doesNotMatch(home, /\{t\("Empezá gratis · Sin tarjeta · Pagás en pesos con Mercado Pago"\)\}/);
assert.match(regional, /market === 'argentina'/);
assert.match(regional, /market === 'international'/);
assert.match(regional, /market === 'unknown'/);
assert.match(regional, /US\$ 9,99/);
assert.match(regional, /Mercado Pago/);
assert.match(regional, /PREMIUM_MONTHLY_PRICE_ARS/,
  'The Argentina featured offer must display the ARS monthly price');
assert.ok(regional.includes("market === 'argentina' ? ("),
  'The ARS featured price must be restricted to Argentina');
assert.doesNotMatch(spanish, /incluidos en los tres planes/i,
  'The public page must not promise three plans to international visitors');

assert.match(regional, /Creem/);
assert.match(mp, /argentina_checkout_only/);
assert.match(creem, /international_checkout_only/);
// La API de ofertas en ARS y el menú móvil nunca deben mostrar pesos fuera de Argentina.
const offerApi = read('app/api/payments/offer/route.ts');
assert.match(offerApi, /resolveCheckoutMarket\(/);
assert.match(offerApi, /if \(market !== 'argentina'\)[\s\S]{0,200}offer_unavailable_for_region/);
const mobileMenu = read('components/mobile-profile-menu.tsx');
assert.match(mobileMenu, /loadCheckoutMarket\(\)/);
assert.match(mobileMenu, /availability\.market !== 'argentina'[\s\S]{0,120}setWeeklyPrice\(null\)/);
assert.ok(
  mobileMenu.indexOf("availability.market !== 'argentina'") < mobileMenu.indexOf("fetch('/api/payments/offer'"),
  'El menú móvil sólo puede pedir la oferta en ARS después de confirmar Argentina.'
);
console.log('[regional-premium] ARS in Argentina, USD abroad, no mixed public pricing, country-specific checkout passed.');
