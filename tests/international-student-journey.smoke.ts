import assert from 'node:assert/strict';
import { accountAppLocale } from '../lib/i18n/app-locale.ts';
import { resolveStudyLocale, studyGenerationInstruction, detectDocumentLanguage } from '../lib/i18n/study-language.ts';
import { accountTimeZone, dateKeyInTimeZone, shiftDateKey } from '../lib/i18n/account-time-zone.ts';
import { topicPracticeFeedback } from '../lib/student-materials/topic-practice-feedback.ts';
import { buildStudentMaterialReadyMessage } from '../lib/email/student-material-ready.ts';
import { buildStudyReturnD1Message } from '../lib/email/study-return-d1.ts';
import { resolveCheckoutMarket } from '../lib/payments/checkout-market.ts';
import { hasPremiumSubscriptionAccess } from '../lib/payments/status.ts';
import { isCreemModeEnabled, CREEM_USD_MONTHLY_CENTS } from '../lib/payments/creem-international.ts';

// This is a synthetic journey contract. It does NOT create a Supabase user,
// upload a real PDF, invoke Gemini, render a browser, send email, or charge a card.
// Those actions require a controlled authenticated test environment.
const testAccount = {
  ui_locale: 'en',
  time_zone: 'America/New_York',
};
assert.equal(accountAppLocale(testAccount), 'en');
assert.equal(resolveStudyLocale(testAccount), 'en');
assert.equal(resolveStudyLocale({ ...testAccount, study_locale: 'es' }), 'es',
  'A student's explicit study-language override must be respected');
const generatedLanguage = studyGenerationInstruction(resolveStudyLocale(testAccount));
assert.match(generatedLanguage, /Write student-facing questions, scenarios, summaries, definitions and explanations in clear academic English/);
assert.match(generatedLanguage, /Keep all literal evidence quotes verbatim in the ORIGINAL document language/);

const source = [
  'Retrieval practice means recalling an answer from memory before checking the source.',
  'Spacing distributes study sessions over several days, and interleaving alternates related problem types.',
  'Corrective feedback explains why a response is correct and contrasts it with mistaken reasoning.',
  'Maya has an exam in ten days and can study for thirty minutes every day.',
  'A learner answers sixteen of twenty questions correctly: the accuracy is eighty percent.',
].join(' ');
assert.equal(detectDocumentLanguage(source), 'en');
assert.equal(CREEM_USD_MONTHLY_CENTS, 999);
for (const country of ['US','GB','ES','MX','BR']) {
  assert.equal(resolveCheckoutMarket(country, 'production'), 'international');
}
assert.equal(resolveCheckoutMarket('AR', 'production'), 'argentina');
assert.equal(resolveCheckoutMarket(null, 'production'), 'unknown');

const hypotheticalMaterialId = '11111111-2222-4333-8444-555555555555';
const ready = buildStudentMaterialReadyMessage({
  firstname: 'Maya', materialId: hypotheticalMaterialId,
  materialFileName: 'Learning Science - QA.pdf', locale: 'en',
});
assert.match(ready.subject, /is ready to study/);
assert.match(ready.html, /<html lang="en">/);
assert.match(ready.text, /Hi Maya/);
assert.match(ready.url, /\/materiales\/11111111-2222-4333-8444-555555555555/);
assert.doesNotMatch(ready.text, /Ya está listo|Empezá/);

const practiceFeedback = topicPracticeFeedback({
  sectionIndex: 0, total: 6, correct: 4, incorrect: 2, incorrectPrompts: ['What is spacing?'],
}, 2, false, 'en');
assert.match(practiceFeedback, /^Review explanations/);
assert.doesNotMatch(practiceFeedback, /\b(Podés|Revisá|preguntas)\b/);

// Simulate the following calendar day across UTC and account-local boundaries.
const firstVisit = new Date('2026-11-06T23:50:00Z');
const secondVisit = new Date('2026-11-07T23:50:00Z');
const tz = accountTimeZone(testAccount);
assert.equal(tz, 'America/New_York');
assert.equal(dateKeyInTimeZone(firstVisit, tz), '2026-11-06');
assert.equal(dateKeyInTimeZone(secondVisit, tz), '2026-11-07');
assert.equal(shiftDateKey(dateKeyInTimeZone(firstVisit, tz), 1), dateKeyInTimeZone(secondVisit, tz));
assert.equal(resolveStudyLocale(testAccount), 'en', 'Language is persistent across virtual visits');

const dayAfter = buildStudyReturnD1Message({
  firstname:'Maya', materialTitle:'Learning Science',
  action:{kind:'resume_practice',title:'Retomar práctica',description:'Sin terminar',cta:'Volver a practicar'},
  returnUrl:'https://evaluoapp.com/materiales/' + hypotheticalMaterialId,
  pendingTopics:['Spacing'], locale:'en',
});
assert.match(dayAfter.html, /<html lang="en">/);
assert.match(dayAfter.subject, /unfinished practice/);
assert.match(dayAfter.html, /Resume practice/);
assert.doesNotMatch(dayAfter.html, /Retomar práctica|Volver a practicar|Equipo Evaluo/);

// Premium access can be granted only by verified paid subscription state, not
// by the existence of a checkout attempt or an external return URL.
const now = new Date('2026-11-06T20:00:00Z').getTime();
assert.equal(hasPremiumSubscriptionAccess('pending', null, now), false);
assert.equal(hasPremiumSubscriptionAccess('active', '2026-12-06T20:00:00Z', now), true);
assert.equal(hasPremiumSubscriptionAccess('active', '2026-10-06T20:00:00Z', now), false);
assert.equal(hasPremiumSubscriptionAccess('refunded', '2026-12-06T20:00:00Z', now), false);

const previous = {
  VERCEL_ENV: process.env.VERCEL_ENV,
  CREEM_INTERNATIONAL_ENABLED: process.env.CREEM_INTERNATIONAL_ENABLED,
  CREEM_LIVE_API_KEY: process.env.CREEM_LIVE_API_KEY,
  CREEM_LIVE_PRODUCT_ID: process.env.CREEM_LIVE_PRODUCT_ID,
  CREEM_LIVE_WEBHOOK_SECRET: process.env.CREEM_LIVE_WEBHOOK_SECRET,
};
try {
  process.env.VERCEL_ENV = 'production';
  process.env.CREEM_INTERNATIONAL_ENABLED = 'true';
  delete process.env.CREEM_LIVE_API_KEY;
  delete process.env.CREEM_LIVE_PRODUCT_ID;
  delete process.env.CREEM_LIVE_WEBHOOK_SECRET;
  assert.equal(isCreemModeEnabled('live'), false, 'No live purchase without all merchant credentials');
} finally {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
console.log('[international-journey] Synthetic English registration preference, study prompt, result feedback, next-day email, 5 overseas markets and fail-closed billing passed. Not an authenticated E2E.');
