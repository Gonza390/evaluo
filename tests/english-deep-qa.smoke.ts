import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const check = (path: string, englishPhrases: string[]) => {
  const content = read(path);
  for (const phrase of englishPhrases) {
    assert.ok(content.includes(phrase), path + ' lacks English UI path: ' + phrase);
  }
  return content;
};

check('components/DocxViewer.tsx', ['useOptionalAppLocale', 'Download Word', 'could not display the original Word', 'contains images']);
check('components/PdfViewer.tsx', ['useOptionalAppLocale', 'Zoom out', 'Zoom in', 'Previous page', 'Next page', 'Exit full screen', 'Loading pages', 'Preparing page', 'Create an account and keep reading', "english ? '/en/login'"]);
check('components/exam-date-plan-prompt.tsx', ['useOptionalAppLocale', 'When is your exam?', 'Save exam date', '7 days before', '3 days before', '1 day before', 'Review plan', 'formatDate(examDate, true)']);
assert.doesNotMatch(read('components/exam-date-plan-prompt.tsx'), /America\/Argentina\/Buenos_Aires/);
check('components/material-feedback.tsx', ['useOptionalAppLocale', 'Was this study material useful?', 'What went wrong?', 'Report a problem with the summary', 'Tell us more (optional)']);
check('components/material-feedback-prompt.tsx', ['useOptionalAppLocale', 'Did this PDF help you?', 'Yes, it helped', 'Not really']);
check('components/study/summary-chapter-finish.tsx', ['useOptionalAppLocale', 'Find out what you know and what to review', 'Check my understanding']);
check('components/study/summary-topic-check-popup.tsx', ['useOptionalAppLocale', 'Check your understanding', 'Topic complete', 'Review now', 'Try another question', 'The key idea is:']);
check('components/study/summary-completion-popup.tsx', ['useOptionalAppLocale', 'You finished the summary', 'Review my mistakes', 'Want to review first?']);
check('components/study/pdf-study-start-guide.tsx', ['useOptionalAppLocale', 'Your document includes:', 'Read topic 1', 'Close guide and return to summary']);
check('components/material-study-workspace.tsx', ['Summary contents', "'chapter' : 'chapters'", "english ? 'Contents'"]);
check('components/student-material-author.tsx', ['useOptionalAppLocale', 'Share this PDF', 'Study material shared on Evaluo.']);
check('components/SessionIdleGuard.tsx', ["APP_LOCALE_STORAGE_KEY", "english ? '/en/login' : '/login'"]);
check('app/(es)/dashboard/progreso/page.tsx', ['accountAppLocale', 'Your progress', 'You have no processed documents yet']);
check('components/referrals/ReferralPortalNavLink.tsx', ['useOptionalAppLocale', 'Referrals']);
check('components/referrals/PartnerReferralActions.tsx', ['useOptionalAppLocale', 'Code copied', 'Copy link']);
check('app/(es)/referidos/page.tsx', ['accountAppLocale', 'Referral program', 'Attributed revenue', 'Performance by code']);
check('components/ClientLayoutClient.tsx', ["locale !== 'en' ? <EstimatedStudyActivity", 'Settings', 'Close study streak summary']);
for (const path of [
  'app/(es)/dashboard/loading.tsx',
  'app/(es)/dashboard/plan-de-estudio/loading.tsx',
  'app/(es)/dashboard/explicaciones/loading.tsx',
]) {
  check(path, ['useOptionalAppLocale', "=== 'en'", 'Loading']);
}
// A fallback to the Spanish source string is not acceptable for any English
// homepage CTA: this catches new t(...) literals not added to the dictionary.
const homepage = read('components/marketing/home-redesign.tsx');
const homeDictionary = read('lib/i18n/home-copy.ts');
const translatedHomeKeys = new Set(
  [...homeDictionary.matchAll(/^\\s*"([^"]+)":/gm)].map(m => m[1])
);
const homeKeys = [...homepage.matchAll(/\\bt\\(\\s*(["'])(.*?)\\1\\s*\\)/g)].map(m => m[2]);
const untranslatedHomeKeys = [...new Set(homeKeys.filter(key => !translatedHomeKeys.has(key)))];
assert.deepEqual(untranslatedHomeKeys, [], 'English homepage has unlocalized t(...) strings');

console.log('[english-deep-qa] English PDF/DOCX reader, exam date, summary, feedback, referral, loading, auth-recovery and screen-reader paths checked (static coverage).');
