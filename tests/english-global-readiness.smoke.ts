import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseAccountTimeZone, accountTimeZone, dateKeyInTimeZone, shiftDateKey, DEFAULT_ACCOUNT_TIME_ZONE } from '../lib/i18n/account-time-zone.ts';
import { buildFlashcardReviewMessage } from '../lib/email/flashcard-review-reminders.ts';
import { buildStudyReturn48hMessage } from '../lib/email/study-return-48h.ts';
import { buildStudyReturnD1Message } from '../lib/email/study-return-d1.ts';
import { buildReactivationMessage } from '../lib/email/reactivation-next-subject.ts';

const read = (p: string) => readFileSync(p, 'utf8');
const now = new Date('2026-11-06T23:30:00Z');
assert.equal(dateKeyInTimeZone(now, 'America/Argentina/Buenos_Aires'), '2026-11-06');
assert.equal(dateKeyInTimeZone(now, 'Pacific/Auckland'), '2026-11-07');
assert.equal(dateKeyInTimeZone(now, 'America/Los_Angeles'), '2026-11-06');
assert.equal(shiftDateKey('2026-12-31', 1), '2027-01-01');
assert.equal(shiftDateKey('2026-01-01', -1), '2025-12-31');
assert.equal(parseAccountTimeZone('Not/A_Zone'), null);
assert.equal(accountTimeZone({time_zone: 'Invalid/Zone'}), DEFAULT_ACCOUNT_TIME_ZONE);
assert.equal(accountTimeZone({time_zone: 'Pacific/Auckland'}), 'Pacific/Auckland');
assert.equal(accountTimeZone(null), DEFAULT_ACCOUNT_TIME_ZONE);

// A UTC day is not a safe proxy for the recipient's local day.
assert.equal(shiftDateKey(dateKeyInTimeZone(now, 'Pacific/Auckland'), 1), '2026-11-08');
assert.equal(shiftDateKey(dateKeyInTimeZone(now, 'America/Argentina/Buenos_Aires'), 1), '2026-11-07');

const flash = buildFlashcardReviewMessage({
  firstname: 'Emma', materialTitle: 'Economics & <Markets>', pendingCount: 2,
  topics: ['Market structure', 'Pricing', 'Demand'], reviewUrl:'https://evaluoapp.com/materiales/a', locale:'en',
});
assert.match(flash.subject, /^You have 2 concepts to review/);
assert.match(flash.html, /<html lang="en">/);
assert.match(flash.html, /Review now/);
assert.match(flash.html, /&lt;Markets&gt;/);
assert.doesNotMatch(flash.html, /Equipo Evaluo|Repasar ahora|En tus flashcards/);
const flashEs = buildFlashcardReviewMessage({
  firstname: 'Ana', materialTitle: 'Historia', pendingCount: 1, topics:['Tema'],
  reviewUrl:'https://evaluoapp.com/materiales/a',
});
assert.match(flashEs.html, /<html lang="es">/);
assert.match(flashEs.subject, /Tenés 1 concepto/);

const return48 = buildStudyReturn48hMessage({
 firstname:'Emma', materialTitle:'Biology', pendingCount:2,
 pendingTopics:['Cells', 'Genetics'], returnUrl:'https://evaluoapp.com/materiales/b',
 locale:'en',
});
assert.match(return48.html, /<html lang="en">/);
assert.match(return48.subject, /2 concepts to review/);
assert.match(return48.html, /Topics to review/);
assert.doesNotMatch(return48.html, /Hola|Equipo Evaluo|Temas que te conviene/);

const next = buildStudyReturnD1Message({
 firstname:'Emma', materialTitle:'Biology',
 action: {kind:'start_practice',title:'Ahora comprobá',description:'Probá el ejercicio',cta:'Practicar'},
 returnUrl:'https://evaluoapp.com/materiales/b', pendingTopics:['Cells'], locale:'en',
});
assert.match(next.subject, /Ready to practice Biology/);
assert.match(next.html, /<html lang="en">/);
assert.match(next.html, /Start practice/);
assert.match(next.html, /Topics to review/);
assert.doesNotMatch(next.html, /Hola|Equipo Evaluo|Probá el ejercicio|Ahora comprobá/);

const reactivation = buildReactivationMessage({
 firstname:'Emma', materia:'Biology',uploadUrl:'https://evaluoapp.com/dashboard/materiales',locale:'en',
});
assert.match(reactivation.subject,/What are you studying after Biology/);
assert.match(reactivation.html,/<html lang="en">/);
assert.match(reactivation.html,/Upload my PDF/);
assert.doesNotMatch(reactivation.html,/Equipo Evaluo|Te enviamos este mensaje|Hola/);

const campaignSources = [
 'lib/email/flashcard-review-reminders.ts',
 'lib/email/study-return-d1.ts',
 'lib/email/study-return-48h.ts',
 'lib/email/reactivation-next-subject.ts',
];
for (const p of campaignSources) {
 const source = read(p);
 assert.match(source, /accountAppLocale\(/, p + ' must resolve account language');
 assert.match(source, /locale[,:]/, p + ' must pass language through to rendering');
}
const exam = read('lib/email/exam-reminders.ts');
assert.match(exam, /const userToday = getDateKeyInTimeZone\(now, accountTimeZone\(user\.user_metadata\)\)/);
assert.match(exam, /REMINDER_DAYS\.find\(days => addDays\(userToday, days\) === rawCandidate\.examDate\)/);
assert.match(exam, /notDueInTimeZone/);
assert.match(exam, /for \(const offset of \[-1, 0, 1\]\)/);
const settings = read('app/(es)/configuracion/page.tsx');
const zoneUi = read('components/i18n/time-zone-preference.tsx');
assert.match(settings, /<TimeZonePreference\s*\/>/);
const localeProvider = read('components/i18n/app-locale-provider.tsx');
assert.match(localeProvider, /data\.time_zone = detectedZone/);
assert.match(localeProvider, /const savedZone = parseAccountTimeZone/);
assert.match(localeProvider, /data\.ui_locale = storedLocale\(\) \?\? locale/);
assert.match(zoneUi, /time_zone: value/);
assert.match(zoneUi, /Time zone for exam reminders/);
assert.match(read('components/dashboard/study-error-detail.tsx'), /english \? t\('No pudimos generar la ayuda\.'/);
for (const legal of ['terms','privacy','billing','refunds','acceptable-use','copyright']) {
 assert.match(read(`app/(en)/en/${legal}/page.tsx`), /EnglishLegalDocument/);
}
const enPricing=read('app/(en)/en/pricing/page.tsx');
assert.match(enPricing, /PricingPlanSelector locale="en"/);
assert.match(read('components/pricing/CreemCheckoutCard.tsx'), /creem\.io/);
console.log('[english-global] Four bilingual lifecycle emails, locale metadata, per-account exam dates, legal and study recovery verified.');
