import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveCheckoutMarket } from '../lib/payments/checkout-market.ts';

assert.equal(resolveCheckoutMarket('AR', 'production'), 'argentina');
assert.equal(resolveCheckoutMarket('ar', 'production'), 'argentina');
assert.equal(resolveCheckoutMarket('US', 'production'), 'international');
assert.equal(resolveCheckoutMarket('ES', 'production'), 'international');
assert.equal(resolveCheckoutMarket('MX', 'production'), 'international');
assert.equal(resolveCheckoutMarket('CO', 'production'), 'international');
// País sin confirmar → USD (nunca ARS por defecto).
assert.equal(resolveCheckoutMarket(null, 'production'), 'international');
assert.equal(resolveCheckoutMarket('', 'production'), 'international');
assert.equal(resolveCheckoutMarket('bad-header', 'production'), 'international');
assert.equal(resolveCheckoutMarket('AR', 'preview'), 'argentina');
assert.equal(resolveCheckoutMarket(null, 'preview'), 'international');
assert.equal(resolveCheckoutMarket('US', 'preview'), 'international');
assert.equal(resolveCheckoutMarket('MX', 'preview'), 'international');

const read = (p: string) => readFileSync(p, 'utf8');
const availability = read('app/api/payments/creem/availability/route.ts');
const argentina = read('app/api/payments/checkout/route.ts');
const international = read('app/api/payments/creem/checkout/route.ts');
const pricing = read('app/(en)/en/pricing/page.tsx');
const englishReturn = read('app/(en)/en/pricing/result/page.tsx');
const resultClient = read('components/pricing/EnglishCreemPaymentResult.tsx');
// La lógica de checkout USD vive en un hook compartido por la tarjeta y /pricing.
const creemCard = read('components/pricing/CreemCheckoutCard.tsx') + read('hooks/use-creem-checkout.ts');
const publicPricing = read('components/pricing/PricingPlanSelector.tsx');
const premiumPricing = read('components/pricing/PremiumDashboardScreen.tsx');
const login = read('components/LoginFormGoogleFirst.tsx');
const callback = read('app/(es)/auth/callback/route.ts');

assert.match(availability, /const market = resolveCheckoutMarket/);
assert.match(availability, /market === 'unknown' \? null/);
assert.match(argentina, /resolveCheckoutMarket\(request\.headers\.get\('x-vercel-ip-country'\)/);
assert.match(argentina, /argentina_checkout_only/);
assert.match(international, /resolveCheckoutMarket\(country, process\.env\.VERCEL_ENV\) !== 'international'/);
assert.match(international, /amountCents: CREEM_USD_MONTHLY_CENTS/);
assert.match(international, /successPath = english \? '\/en\/pricing\/result'/);
assert.match(creemCard, /locale: english \? 'en' : 'es'/);
assert.match(pricing, /<PricingPlanSelector locale="en"/);
assert.match(pricing, /<RegionalPricingMessage locale="en" placement="billing"/);
assert.doesNotMatch(pricing, /In Argentina, local offers are billed/);
assert.match(publicPricing, /market\.market === 'unknown'/);
assert.match(premiumPricing, /market\.market==='unknown'/);
assert.match(login, /callback\.searchParams\.set\('ui_locale', locale\)/);
assert.match(callback, /authEntryLocale === 'en' \? '\/en\/login'/);
assert.match(englishReturn, /robots: \{ index: false, follow: false \}/);
assert.match(resultClient, /payload\.plan === 'premium' && payload\.provider === 'creem' && payload\.checkoutStatus === 'paid'/);
assert.match(resultClient, /payload\.checkoutMode === 'test'/);
assert.match(resultClient, /payload\.checkoutAttemptId !== attemptId/);
assert.match(resultClient, /We will only enable it after the provider confirms/);
console.log('[international-checkout] country fail-closed, AR/US providers, English return and verified entitlement contract passed');
