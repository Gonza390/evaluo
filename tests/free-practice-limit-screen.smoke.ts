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
assert.match(screen, /fixed inset-0.*h-dvh/);
assert.match(screen, /max-w-\[520px\]/, 'Keep the original centered HTML width');
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
assert.match(modePage, /if \(!matching\.allowed\)/);
assert.match(modePage, /if \(!simulator\.allowed\)/);
assert.match(modePage, /return exhausted\('matching_round'\)/);
assert.match(modePage, /return exhausted\('simulator'\)/);
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
