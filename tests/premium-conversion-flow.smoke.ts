import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  safePremiumReturnTo, premiumPricingHref, premiumDashboardHref, legacyPremiumFunnelHref, premiumUpgradeForLimit,
  FreeStudyV2UploadLimitError, type PremiumGateReason,
} from '../lib/premium-flow.ts';
import {
  premiumPaymentResultState, premiumPurchaseDisplayState,
} from '../lib/payments/status.ts';

const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const materialId='11111111-1111-4111-8111-111111111111';
const original='/dashboard/practicar/'+materialId+'/casos?tema=3#pregunta-5';

assert.equal(safePremiumReturnTo(original),original);
for(const malicious of ['https://evil.test/','//evil.test/x','/\\evil.test','/pricing?returnTo=%2Fdashboard',
  '/login?next=/dashboard','/premium/errores','/api/payments/checkout','/dashboard\nheader','']) {
  assert.equal(safePremiumReturnTo(malicious),undefined,malicious);
}
const priceHref=premiumPricingHref({source:'free_v2_case_limit',materiaId:materialId,parcial:2,returnTo:original});
const parsed=new URL(priceHref,'https://evaluoapp.com');
assert.equal(parsed.pathname,'/pricing');
assert.equal(parsed.searchParams.get('returnTo'),original);
assert.equal(parsed.searchParams.get('materia'),materialId);
assert.equal(parsed.searchParams.get('parcial'),'2');
assert.equal(parsed.hash,'#elegir-plan');
// /pricing stays public; only in-app Premium upgrades use the attached HTML screen.
const inApp = new URL(premiumDashboardHref({source:'free_v2_case_limit',materiaId:materialId,parcial:2,returnTo:original}), 'https://evaluoapp.com');
assert.equal(inApp.pathname,'/dashboard/premium');
assert.equal(inApp.searchParams.get('returnTo'),original);
assert.equal(inApp.searchParams.get('materia'),materialId);
assert.equal(inApp.hash,'');

const cases:Record<PremiumGateReason,string>={
  material_upload:'/dashboard/materiales',
  multiple_choice:'/materiales/'+materialId,
  true_false:'/dashboard/practicar/'+materialId+'/opciones',
  matching_round:'/dashboard/practicar/'+materialId+'/unir',
  case:'/dashboard/practicar/'+materialId+'/casos',
  flashcard:'/dashboard/practicar/'+materialId+'/flashcards',
  simulator:'/dashboard/practicar/'+materialId+'/simulacro',
  complete:'/dashboard/practicar/'+materialId+'/completar',
  mixed:'/dashboard/practicar/'+materialId+'/mixto',
  study_plan:'/dashboard/plan-de-estudio',
  mind_map:'/materiales/'+materialId+'?tab=mapa',
};
for(const [reason,returnTo] of Object.entries(cases)){
  const upgrade=premiumUpgradeForLimit(reason as PremiumGateReason,{materialId});
  assert.equal(upgrade.returnTo,returnTo);
  assert.equal(upgrade.reason,reason);
  assert.equal(new URL(upgrade.href,'https://evaluoapp.com').pathname,'/dashboard/premium');
  assert.equal(new URL(upgrade.href,'https://evaluoapp.com').searchParams.get('returnTo'),returnTo);
}
assert.equal(premiumUpgradeForLimit('case',{materialId,returnTo:original}).returnTo,original);

const oldFunnelSources = {
  'mapa-mental':'material_mapa_mental',
  errores:'errores_review',
  simulador:'premium_simulator',
  explicaciones:'simulator_explanations',
} as const;
for (const [funnel,source] of Object.entries(oldFunnelSources)) {
  const url = new URL(legacyPremiumFunnelHref(
    funnel as keyof typeof oldFunnelSources,
    {materiaId:materialId,parcial:'2',returnTo:original},
  ), 'https://evaluoapp.com');
  assert.equal(url.pathname,'/dashboard/premium',funnel);
  assert.equal(url.searchParams.get('source'),source,funnel);
  assert.equal(url.searchParams.get('materia'),materialId,funnel);
  assert.equal(url.searchParams.get('parcial'),'2',funnel);
  assert.equal(url.searchParams.get('returnTo'),original,funnel);
  const unsafe = new URL(legacyPremiumFunnelHref(
    funnel as keyof typeof oldFunnelSources,
    {materiaId:materialId,returnTo:'https://evil.example/redirect'},
  ), 'https://evaluoapp.com');
  assert.equal(unsafe.pathname,'/dashboard/premium');
  assert.notEqual(unsafe.searchParams.get('returnTo'),'https://evil.example/redirect');
}
for(const [funnel,route] of [
  ['mapa-mental','/materiales/'+materialId+'?tab=mapa'],
  ['errores','/simulador/errores/'+materialId+'?parcial=2'],
  ['simulador','/simulador/premium/'+materialId+'/2'],
  ['explicaciones','/dashboard/explicaciones'],
] as const) {
  const path=legacyPremiumFunnelHref(funnel,{materiaId:materialId,parcial:'2'});
  assert.equal(new URL(path,'https://evaluoapp.com').searchParams.get('returnTo'),route);
}
for (const name of ['mapa-mental','errores','simulador','explicaciones']) {
  const legacy=read('app/(es)/premium/'+name+'/page.tsx');
  assert.match(legacy,/redirect\(legacyPremiumFunnelHref\(/,
    'Historic '+name+' links must reach the single commerce screen');
  assert.doesNotMatch(legacy,/<(?:MapaMental|Errores|Simulador|Explicaciones)PremiumFunnel/,
    'Do not render a second payment flow');
}
const upsell=read('components/premium/premium-upsell.tsx');
assert.match(upsell,/premiumDashboardHref\(/);
assert.doesNotMatch(upsell,/openContextualFlow|PREMIUM_FLOWS|premiumPricingHref/,
  'Map and error upsells must not auto-open a legacy funnel or public pricing');
const simulatorLegacy=read('components/simulador/SimuladorExamenLegacy.tsx');
assert.match(simulatorLegacy,/premiumDashboardHref\(\{/);
assert.doesNotMatch(simulatorLegacy,/\/premium\/explicaciones\?/);
for(const name of ['premium','ultimo-intento']) {
  const route=read('app/(es)/simulador/'+name+'/[materia_id]/[parcial]/page.tsx');
  assert.match(route,/redirect\(premiumDashboardHref\(/);
  assert.doesNotMatch(route,/redirect\(`\/premium\/simulador/);
}
const dashboardPremium=read('app/(es)/dashboard/premium/page.tsx');
assert.match(dashboardPremium,/nextPath = premiumDashboardHref\(\{source, materiaId, parcial, returnTo\}\)/,
  'After logging in, keep the original study action in the checkout context');
assert.match(read('components/pricing/PremiumDashboardScreen.tsx'),
  /status==='active'\?\(returnTo\?\?'\/dashboard'\)/,
  'Existing subscribers must resume their requested action instead of landing on the dashboard');

assert.equal(new FreeStudyV2UploadLimitError('used').code,'free_v2_material_limit');

// Plan y derecho efectivo tienen prioridad sobre strings del proveedor.
assert.equal(premiumPurchaseDisplayState({plan:'premium',status:'canceled'}),'active');
assert.equal(premiumPurchaseDisplayState({plan:'free',status:'active'}),'inactive');
assert.equal(premiumPurchaseDisplayState({plan:'free',status:'past_due'}),'attention');
assert.equal(premiumPaymentResultState({plan:'premium',status:'canceled',checkoutStatus:'approved'}),'approved');
assert.equal(premiumPaymentResultState({plan:'free',status:'active',checkoutStatus:'pending'}),'processing');
assert.equal(premiumPaymentResultState({plan:'free',status:'canceled',checkoutStatus:'pending'}),'processing');
assert.equal(premiumPaymentResultState({plan:'free',status:'expired',checkoutStatus:'approved'}),'processing');
assert.equal(premiumPaymentResultState({plan:'free',status:'active',checkoutStatus:'failed'}),'failed');
assert.equal(premiumPaymentResultState({plan:'free',status:'past_due'}),'attention');

const pricing=read('app/(es)/pricing/page.tsx');
const selector=read('components/pricing/PricingPlanSelector.tsx');
// La lógica de checkout ARS vive en un hook compartido por la tarjeta y /pricing.
const card=read('components/pricing/PaymentCheckoutCard.tsx')+read('hooks/use-mercadopago-checkout.ts');
const checkout=read('app/api/payments/checkout/route.ts');
const result=read('components/pricing/PaymentResult.tsx');
const resultPage=read('app/(es)/pricing/resultado/page.tsx');
const status=read('app/api/payments/status/route.ts');
const settings=read('components/pricing/SubscriptionSettings.tsx');
const premiumAction=read('lib/actions/premium.ts');
const premiumHook=read('hooks/usePremium.tsx');
assert.match(pricing,/safePremiumReturnTo\(params\.returnTo\)/);
assert.match(pricing,/returnTo=\{returnTo\}/);
assert.match(selector,/returnTo=\{returnTo\}/);
assert.match(selector, /offerCode="semester"[\s\S]*?\/?>/);
assert.match(selector, /returnTo=\{returnTo\}\s+offerCode="semester"/,
  'El plan semestral debe retomar la actividad original después del checkout.');
assert.match(selector, /parcial=\{parcial\}\s+returnTo=\{returnTo\}\s+offerCode="semester"/,
  'El plan semestral debe preservar el parcial además del contexto de regreso.');
assert.match(card,/returnTo,/);
assert.match(card,/premiumPurchaseDisplayState\(payload\)/);
assert.match(checkout,/returnTo:|checkoutReturnPath\(requestBody\.returnTo\)/);
assert.match(checkout,/hasPremiumSubscriptionAccess\(subscription\.status, subscription\.expires_at\)/);
assert.match(resultPage,/safePremiumReturnTo\(value\)/);
assert.match(result,/premiumPaymentResultState\(details\)/);
// El pie del resultado muestra el proveedor real del cobro (Creem o Mercado Pago).
assert.match(result,/paymentProviderNote\(details\.provider \?\? details\.checkoutProvider\)/);
assert.doesNotMatch(result,/>\s*Pago procesado de forma segura con Mercado Pago\.\s*</);
assert.match(result,/startsWith\('creem'\)\) return 'Pago procesado de forma segura con Creem\.'/);
assert.match(result,/notifyPremiumAccessChanged\(\)/);
assert.match(result,/cta: 'Continuar estudiando'/);
assert.match(result,/premiumPricingHref\(\{source, materiaId, parcial, returnTo\}\)/);
assert.match(result,/premiumDashboardHref\(\{source, materiaId, parcial, returnTo\}\)/);
assert.match(result,/inAppSource = source\.startsWith\('free_v2_'\)/,
  'Payment retries from Free gates must not fall back to a second checkout.');
assert.doesNotMatch(result,/return \`\/premium\/(?:mapa-mental|errores|simulador|explicaciones)/,
  'Payment result must never reopen retired three-step funnels.');
assert.match(result,/'configuracion'/,
  'In-app subscription recovery must return to the central Premium screen.');

assert.match(status,/subscriptionsError \|\| checkoutError/);
assert.match(status,/subscription_status_unavailable/);
assert.match(status,/\.limit\(100\)/);
assert.match(premiumAction,/unavailable: true/);
assert.match(premiumHook,/PREMIUM_ACCESS_CHANGED_EVENT/);
assert.match(premiumHook,/premiumCache\.delete\(userId\)/);
assert.match(settings,/notifyPremiumAccessChanged\(\)/);

for (const path of [
  'app/api/free-study-v2/claim/route.ts',
  'app/api/study-plans/route.ts',
  'app/(es)/dashboard/materiales/upload-actions.ts',
  'app/(es)/dashboard/materiales/pdf-first-upload-actions.ts',
]) assert.match(read(path),/premiumUpgradeForLimit/);


const quotaApi=read('app/api/free-study-v2/quota/route.ts');
assert.match(quotaApi,/getUser\(\)/);
assert.match(quotaApi,/eq\('user_id',user\.id\)/);
assert.match(quotaApi,/premiumUpgradeForLimit\(reason,\{materialId\}\)/);
assert.match(quotaApi,/free_study_v2_unlocks/);
assert.match(quotaApi,/free_study_v2_plan_claims/);
assert.match(quotaApi,/free_study_v2_monthly_upload_claims[\s\S]*freeUploadPeriod\(\)/);
assert.match(quotaApi,/Cache-Control': 'private, no-store/);
assert.match(quotaApi,/quotas:null/);
assert.match(quotaApi,/status:503/);

console.log('Premium: contexto de regreso, permisos, estados de pago y gates Free V2 verificados.');
