import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localizePedagogicalFlashcards } from '../lib/student-materials/flashcard-language.ts';

const read = (p: string) => readFileSync(p, 'utf8');
const types = read('lib/student-materials/types.ts');
const worker = read('lib/student-materials/processing-service.ts');
const canonical = read('lib/student-materials/canonical-summary.ts');
const localizer = read('lib/student-materials/glossary-localizer.ts');
const store = read('lib/student-materials/persistence.ts');
const schema = read('supabase/migrations/20261106200000_free_study_v2_i18n_cache_modes.sql');
const bank = read('lib/free-study-v2-server.ts');

assert.ok(types.includes("studyLocale?: 'es' | 'en'"));
assert.ok(worker.includes('resolveStudyLocale(ownerAuth?.user?.user_metadata)'));
assert.ok(worker.includes("processStudentMaterial.studyLanguageLookup"));
assert.ok(worker.includes("studyLocale === 'en'"));
assert.ok(worker.includes('localizeCanonicalGlossary'));
assert.ok(canonical.includes("studyGenerationInstruction(input.studyLocale ?? 'es')"));
assert.ok(localizer.includes('term: item.term'));
assert.ok(localizer.includes('sourceQuotes.some'));
assert.ok(store.includes("englishTerm: 'englishTerm' in item"));
assert.ok(store.includes("chapterTitle: 'chapterTitle' in item"));
assert.ok(read('components/material-study-workspace.tsx').includes('english && englishTerm ? englishTerm : item.term'));
for (const suffix of ["'cases:en'", "'true_false:en'"]) {
  assert.ok(schema.includes(suffix), 'Missing migration key: ' + suffix);
  assert.ok(bank.includes(suffix), 'Missing backend bank mode: ' + suffix);
}
assert.ok(schema.includes("mode ~ '^topic:[0-9]{1,3}:round:[0-4](:en)?$'"));
assert.ok(!schema.toLowerCase().includes('truncate public.free_study_v2_unlocks'));
assert.ok(!schema.toLowerCase().includes('delete from public.free_study_v2_unlocks'));
assert.ok(read('app/api/practice/cases/route.ts').includes("studyLocale === 'en' ? 'cases:en'"));
assert.ok(read('app/api/practice/true-false/route.ts').includes("studyLocale === 'en' ? 'true_false:en'"));
// Exercise the pure renderer transformation: translations must never alter grading
// IDs, question banks, original source quotations or page references.
const originalReference = {
  pageStart: 4, pageEnd: 4, sectionTitle: 'Segmentación de mercados',
  excerpt: 'La segmentación consiste en dividir el mercado en grupos de consumidores.',
};
const original = {
  flashcards: [{
    front: '¿Qué significa “Segmentación”?',
    back: 'Dividir el mercado en grupos.',
    level: 'recordar' as const,
    reference: originalReference,
  }],
  questions: [{
    id: 'q-1', type: 'multiple_choice' as const, level: 'recordar' as const,
    prompt: '¿Qué significa la segmentación?', options: ['A', 'B'],
    answer: 'A', explanation: 'En el material dice A.',
    reference: originalReference,
  }],
  miniExamQuestionIds: ['q-1'],
  coverage: { conceptsUsed: 1, sectionsUsed: 1, referencedItems: 2, totalItems: 2 },
};
const localized = localizePedagogicalFlashcards(original, [{
  term: 'Segmentación',
  englishTerm: 'Market segmentation',
  definition: 'Dividing a market into groups of consumers.',
  context: 'Marketing course', importance: 'alta',
}]);
assert.equal(localized.flashcards[0]?.front, 'What does “Market segmentation (Segmentación)” mean?');
assert.equal(localized.flashcards[0]?.back, 'Dividing a market into groups of consumers.');
assert.equal(localized.flashcards[0]?.reference.excerpt, originalReference.excerpt);
assert.deepEqual(localized.flashcards[0]?.reference, originalReference);
assert.deepEqual(localized.questions, original.questions);
assert.deepEqual(localized.miniExamQuestionIds, ['q-1']);
assert.equal(original.flashcards[0]?.front, '¿Qué significa “Segmentación”?');
const unchanged = localizePedagogicalFlashcards(original, []);
assert.equal(unchanged.flashcards[0]?.back, 'Dividir el mercado en grupos.');
assert.equal(unchanged.flashcards[0]?.reference.pageStart, 4);

// Safeguard the whole P1 student journey, not only the PDF-generated artifacts.
const calendar = read('app/(es)/calendario/page.tsx');
const reminderBell = read('components/notifications/notification-bell.tsx');
const planPage = read('app/(es)/dashboard/plan-de-estudio/page.tsx');
const planEmpty = read('components/dashboard/empty-study-plan.tsx');
const planNext = read('components/dashboard/study-plan-next.tsx');
const planNextStep = read('components/dashboard/study-plan-next-step.tsx');
const planRoadmap = read('components/dashboard/study-plan-roadmap.tsx');
const planCard = read('components/dashboard/study-plan-exam-card.tsx');
const planSelector = read('components/dashboard/study-plan-material-selector.tsx');

assert.ok(reminderBell.includes("useOptionalAppLocale"));
assert.ok(reminderBell.includes("locale === 'en' ? 'en-US' : 'es-AR'"));
assert.ok(reminderBell.includes("Dismiss reminder"));
assert.ok(calendar.includes("english ? 'Will be saved as'"));
assert.match(calendar, /english\s*\?\s*['"]Study plan exam['"]/);
assert.ok(calendar.includes("english ? 'Unlimited exams'") || calendar.includes("features={english ? ['Unlimited exams'"));
assert.ok(planPage.includes("accountAppLocale(user.user_metadata)"));
assert.ok(planPage.includes('<EmptyStudyPlan locale={locale} />'));
assert.ok(planEmpty.includes("english ? 'Your plan preview'"));
assert.ok(planCard.includes("english ? 'Prepare for your exam'"));
assert.ok(planSelector.includes("Choose PDF for study plan"));
assert.ok(planNext.includes("english ? 'Topic' : 'Tema'"));
assert.ok(planNextStep.includes("english ? 'Material progress'"));
assert.ok(planRoadmap.includes("english ? 'Your journey'"));
const examReminderEmail = read('lib/email/exam-reminders.ts');
const materialReadyEmail = read('lib/email/student-material-ready.ts');
const transactionalTemplate = read('lib/email/evaluo-email.ts');
assert.ok(examReminderEmail.includes("accountAppLocale(user.user_metadata) ?? 'es'"));
assert.ok(examReminderEmail.includes("formatExamDate(candidate.examDate, locale)"));
assert.ok(examReminderEmail.includes("Your ${materia} exam is tomorrow"));
assert.ok(examReminderEmail.includes("locale: input.locale"));
assert.ok(examReminderEmail.includes('escapeEmailHtml(topic)'));
assert.ok(materialReadyEmail.includes("accountAppLocale(user.user_metadata) ?? 'es'"));
assert.ok(materialReadyEmail.includes("english ? 'Your PDF is ready to study'"));
assert.ok(materialReadyEmail.includes('escapeHtml(intro)'));
assert.ok(transactionalTemplate.includes('locale?: \'es\' | \'en\''));
assert.ok(transactionalTemplate.includes('<html lang="${locale}">'));
console.log('[study-i18n-release] English PDF learning, evidence fidelity, plan, calendar and transactional email guards verified.');
