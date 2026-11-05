import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const screen = read('components/dashboard/free-practice-limit-screen.tsx');
const materialExam = read('components/student-material-exam.tsx');
const materialWorkspace = read('components/material-study-workspace.tsx');
const modePage = read('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx');
const modePicker = read('components/dashboard/practice-mode-picker.tsx');
const practiceHome = read('app/(es)/dashboard/practicar/page.tsx');
const demo = read('app/(es)/dashboard/practicar/limite-demo/page.tsx');
const proxy = read('proxy.ts');

assert.ok(existsSync('public/evi-practica-limite.svg'), 'Must preserve the original supplied Evi illustration');
assert.match(screen, /\/evi-practica-limite\.svg/);
assert.match(screen, /data-free-practice-limit/);
assert.match(screen, /role="dialog"/);
assert.match(screen, /createPortal\(/, 'Standalone full-viewport screen must cover existing sidebar/navigation');
assert.match(screen, /import '\.\/practice-motion\.css'/, 'Reuse the existing practice transition stylesheet');
assert.match(screen, /practice-screen-enter/, 'Animated entry is required on the centered screen');
assert.match(screen, /practice-screen-leave/, 'Animated exit is required when the student leaves');
assert.match(screen, /window\.setTimeout\(navigate, 200\)/, 'Keep the exit animation visible before navigation');
assert.match(screen, /onClick=\{event => onLinkClick\(event, premiumHref\)\}/,
  'Premium navigation must play the exit transition');
assert.match(screen, /transitionOut\(onBack\)/, 'Returning to the original topic must animate too');
const motion = read('components/dashboard/practice-motion.css');
assert.match(motion, /practice-screen-arrive 280ms/);
assert.match(motion, /practice-screen-depart 200ms/);
assert.match(motion, /prefers-reduced-motion:reduce/, 'Respect reduced motion preferences');

assert.match(screen, /fixed inset-0.*h-dvh/);
assert.match(screen, /max-w-\[460px\]/, 'Compact the centered reference HTML without changing its layout.');
assert.match(screen, /data-free-practice-fit-viewport/, 'The screen must reserve a measured area below its header.');
assert.match(screen, /data-free-practice-fit-content/, 'All controls and the bottom note must fit as one block.');
assert.match(screen, /new ResizeObserver\(fit\)/, 'Resize the full composition when available viewport changes.');
assert.match(screen, /content\.scrollHeight/, 'Measure the complete unscaled composition.');
assert.match(screen, /viewport\.clientHeight/, 'Never center content outside the space below the header.');
assert.match(screen, /translate\(-50%, -50%\) scale/, 'Keep the fitted content centered on narrow screens.');
assert.match(screen, /fixed inset-0.*h-dvh.*overflow-hidden/, 'No outer scroll in the limit experience.');
assert.match(screen, /flex h-full min-h-0 w-full flex-col overflow-hidden/, 'Header and body cannot overlap at short heights.');
assert.match(screen, /size-\[72px\]/, 'Keep the Evi illustration compact.');
assert.match(screen, /min-h-\[44px\]/, 'Primary and secondary buttons must stay visible and touch-friendly.');
assert.match(screen, /flex-col items-stretch justify-center gap-2 sm:flex-row/,
  'On mobile, Premium and Volver buttons must be stacked rather than squeezing side by side.');
assert.match(screen, /min-h-\[44px\] w-full items-center/,
  'Mobile buttons must use full width and retain touch target heights.');
assert.match(screen, /sm:w-auto/, 'Buttons must resume natural width on desktop.');
assert.match(screen, /min-w-0 flex-1 truncate text-center/,
  'The contextual header label must shrink rather than push the close button outside a phone.');
assert.match(screen, /flex size-11 shrink-0 items-center justify-center rounded-full/,
  'The close button must remain a 44px touch target.');
assert.match(screen, /data-free-practice-secondary-note/,
  'The redundant note needs an optional compact-height fallback.');
assert.match(motion, /@media \(max-height: 630px\)/,
  'Short phones should keep Evi, the explanatory copy and buttons legible.');
assert.match(motion, /data-free-practice-secondary-note/,
  'Only the redundant note should disappear on very short windows.');
assert.match(modePage, /\^\\d\{1,3\}\$/,
  'Topic context must parse a numeric planTopic; otherwise Volver al tema breaks.');

assert.doesNotMatch(screen, /overflow-y-auto/, 'Never introduce page scrolling in the quota experience.');
assert.match(screen, /rounded-\[20px\]/, 'Preserve the layered blurred exercise card');
assert.match(screen, /blur-\[5px\]/);
assert.match(screen, /Se desbloquea con Premium/);
assert.match(screen, /Ya agotaste tu límite gratuito/);
assert.match(screen, /kind: FreePracticeLimitKind/);
assert.match(screen, /premiumHref: string/);
assert.match(screen, /backHref: string/);
assert.match(screen, /onBack\?: \(\) => void/);
for (const kind of ['multiple_choice','true_false','matching_round','case','flashcard','simulator'])
  assert.match(screen, new RegExp(kind), 'Every practice type needs a contextual label: '+kind);
for(const copy of ['rondas de unir conceptos', 'flashcards', 'casos prácticos','verdadero o falso','simulacros de examen'])
  assert.ok(screen.includes(copy), 'Contextual explanation must mention '+copy);
assert.doesNotMatch(screen, /por semana|una vez por mes|límite mensual|Practicar con Pro|plan Pro/i,
  'Never claim Free limits renew monthly or Premium charges weekly');

// The limit must only appear after a real server denial, not a content/AI error.
assert.match(materialExam, /response\.ok && reply/);
assert.match(materialExam, /reply\.allowed === false/);
assert.match(materialExam, /setFreeQuotaReached\(true\)/);
assert.match(materialExam, /if \(freeStudyV2 && freeQuotaReached && !simulation\)/);
assert.match(materialExam, /kind="multiple_choice"/);
assert.match(materialExam, /onReturnToTopic\(false\)/);
assert.match(materialWorkspace, /materialTitle=\{title\}/, 'Display the actual material title');

// Existing unlocked items must remain reusable, exhausted account quotas only.
assert.match(modePage, /if \(freeV2 && artifacts\.flashcards\.length > 0 && freeFlashcards\.length === 0\)/);
assert.match(modePage, /if \(freeV2 && mode === 'casos' && sourceCases\.length > 0 && cases\.length === 0\)/);
assert.match(modePage, /listFreeStudyUnlockedKeys/);
assert.match(modePage, /!Array\.from\(keys\)\.some\(key => key\.startsWith\(material\.id \+ ':'\)\)/);
// La navegación no debe consumir la única ronda ni el simulacro antes de estar listos.
assert.match(modePage, /keys\.size >= 1 && !keys\.has\(ownedKey\)/);
assert.match(modePage, /return exhausted\(kind\)/);
assert.doesNotMatch(modePage, /await claimFreeStudyUnlock\(\{\s*userId:user\.id,materialId:material\.id,kind:'simulator'/);
assert.match(modePage, /return exhausted\(mode === 'completar' \? 'complete' : 'mixed'\)/);
assert.match(screen, /premiumOnly = kind === 'complete' \|\| kind === 'mixed'/);
assert.match(screen, /Esta práctica es parte de Premium/);
const session = read('components/dashboard/practice-session.tsx');
assert.match(session, /const claimSessionQuota = useCallback/);
assert.match(session, /mode === 'unir' && ready && freeSessionGate === 'new'/);
assert.match(session, /freeV2 && response\.status === 403 && code === 'free_quota_exhausted'/);
assert.match(session, /freeV2 && response\.status === 403 && errorCode === 'free_quota_exhausted'/);
assert.match(session, /kind=\{mode === 'unir' \? 'matching_round' : mode === 'casos' \? 'case'/);
assert.match(session, /contexts\.length >= \(freeV2 \? 1 : MIN_CASES_PER_PRACTICE\)/);
assert.match(session, /Comenzar simulacro/);
assert.match(session, /claimSessionQuota\(\)\.then\(allowed/);
const flashcards = read('components/dashboard/practice-flashcard-session.tsx');
assert.match(flashcards, /approvedIndices\.length < \(freeV2 \? 1 : MIN_CASES_PER_PRACTICE\)/);
for (const route of ['app/api/practice/cases/route.ts', 'app/api/practice/true-false/route.ts']) {
  const text = read(route);
  assert.match(text, /free_quota_exhausted/);
  assert.match(text, /listFreeStudyUnlockedKeys/);
  assert.match(text, /status:403/);
  assert.ok(text.indexOf('free_quota_exhausted') < text.indexOf('enforceStrictRateLimit('),
    'Do not pay for unused AI once Free exercises are exhausted.');
}
assert.match(modePage, /returnTo:practiceHref/, 'Premium activation should resume the attempted exercise');
assert.match(modePage, /backHref=\{backHref\}/, 'The secondary CTA must return to the previous context');
assert.match(modePage, /safePremiumReturnTo\(returnTo\)/, 'Never allow external return URLs');
assert.match(modePicker, /encodeURIComponent\(returnTo\)/);
assert.match(practiceHome, /requestedMaterialId && materials\.some/, 'Back link must preselect the original owned material');

// The visual-only demonstration is never routable on Vercel or production.
assert.match(demo, /process\.env\.NODE_ENV !== 'development'/);
assert.match(proxy, /pathname === '\/dashboard\/practicar\/limite-demo'/);
assert.match(proxy, /process\.env\.NODE_ENV === 'development'/);
assert.match(proxy, /if \(isProtectedRoute && !user\)/);
console.log('Free practice limit: visual reference, verified quota gating, safe contextual return and dev-only demo checks passed.');
