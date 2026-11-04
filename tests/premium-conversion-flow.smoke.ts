import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  safePremiumReturnTo, premiumPricingHref, premiumUpgradeForLimit,
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

const cases:Record<PremiumGateReason,string>={
  material_upload:'/dashboard/materiales',
  multiple_choice:'/materiales/'+materialId,
  true_false:'/dashboard/practicar/'+materialId+'/opciones',
  matching_round:'/dashboard/practicar/'+materialId+'/unir',
  case:'/dashboard/practicar/'+materialId+'/casos',
  flashcard:'/dashboard/practicar/'+materialId+'/flashcards',
  simulator:'/dashboard/practicar/'+materialId+'/simulacro',
  study_plan:'/dashboard/plan-de-estudio',
  mind_map:'/materiales/'+materialId+'?tab=mapa',
};
for(const [reason,returnTo] of Object.entries(cases)){
  const upgrade=premiumUpgradeForLimit(reason as PremiumGateReason,{materialId});
  assert.equal(upgrade.returnTo,returnTo);
  assert.equal(upgrade.reason,reason);
  assert.equal(new URL(upgrade.href,'https://evaluoapp.com').searchParams.get('returnTo'),returnTo);
}
assert.equal(premiumUpgradeForLimit('case',{materialId,returnTo:original}).returnTo,original);
assert.equal(new FreeStudyV2UploadLimitError('used').code,'free_v2_material_limit');

// Plan y derecho efectivo tienen prioridad sobre strings del proveedor.
assert.equal(premiumPurchaseDisplayState({plan:'premium',status:'canceled'}),'active');
assert.equal(premiumPurchaseDisplayState({plan:'free',status:'active'}),'inactive');
assert.equal(premiumPurchaseDisplayState({plan:'free',status:'past_due'}),'attention');
assert.equal(premiumPaymentResultState({plan:'premium',status:'canceled',checkoutStatus:'approved'}),'approved');
assert.equal(premiumPaymentResultState({plan:'free',status:'active',checkoutStatus:'pending'}),'processing');
assert.equal(premiumPaymentResultState({plan:'free',status:'active',checkoutStatus:'failed'}),'failed');
assert.equal(premiumPaymentResultState({plan:'free',status:'past_due'}),'attention');

const pricing=read('app/(es)/pricing/page.tsx');
const selector=read('components/pricing/PricingPlanSelector.tsx');
const card=read('components/pricing/PaymentCheckoutCard.tsx');
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
assert.match(card,/returnTo,/);
assert.match(card,/premiumPurchaseDisplayState\(payload\)/);
assert.match(checkout,/returnTo:|checkoutReturnPath\(requestBody\.returnTo\)/);
assert.match(checkout,/hasPremiumSubscriptionAccess\(subscription\.status, subscription\.expires_at\)/);
assert.match(resultPage,/safePremiumReturnTo\(value\)/);
assert.match(result,/premiumPaymentResultState\(details\)/);
assert.match(result,/notifyPremiumAccessChanged\(\)/);
assert.match(result,/cta: 'Continuar estudiando'/);
assert.match(result,/premiumPricingHref\(\{source, materiaId, parcial, returnTo\}\)/);
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

console.log('Premium: contexto de regreso, permisos, estados de pago y gates Free V2 verificados.');
