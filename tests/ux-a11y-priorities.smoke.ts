import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const workspace = source('components/material-study-workspace.tsx');
assert.match(workspace, /if \(outcome === 'completed' && \(demo \|\| isOwner\)\)/,
  'Finishing can transition into the study guide, skipping cannot.');
assert.match(workspace, /setStudyStartGuideOpen\(false\);/,
  'Skipping should close secondary study guidance rather than opening a new popup.');
assert.match(workspace, /evaluo:first-pdf-guide:skipped-session/,
  'A skipped tour should not reopen on every route change within the session.');

const nudge = source('components/pdf-activation/contextual-pdf-nudge.tsx');
assert.match(nudge, /DASHBOARD_NUDGE_CLOSED_KEY/);
assert.match(nudge, /const dismissedNotices = new Set<string>\(\);/,
  'Persisted closing needs a fallback for blocked storage.');
assert.match(nudge, /rememberNoticeDismissed\(activeNoticeKey\)/);
assert.match(nudge, /useModalFocusTrap<HTMLElement>/);
assert.match(nudge, /bottom-\[calc\(5\.75rem\+env\(safe-area-inset-bottom\)\)\]/,
  'Mobile dashboard notice must sit above the fixed bottom nav.');
assert.match(nudge, /z-\[91\]/,
  'Modal dialog should be above the mobile nav z-index.');

const focus = source('hooks/use-modal-focus-trap.ts');
assert.match(focus, /event\.key === 'Escape'/);
assert.match(focus, /event\.key !== 'Tab'/);
assert.match(focus, /event\.shiftKey/);
assert.match(focus, /previousFocus\?\.focus\(\)/);
assert.match(source('components/exam-date-plan-prompt.tsx'), /useModalFocusTrap<HTMLElement>\(visible, close\)/);

const feedback = source('components/material-feedback-prompt.tsx');
assert.match(feedback, /sessionStorage\.getItem\(getSessionKey/);
assert.match(feedback, /} catch \{\s*\/\/ El cierre funciona aun si el almacenamiento está deshabilitado/);
assert.match(feedback, /finally \{\s*setSaving\(false\);/);

const cards = source('components/dashboard/student-materials-workspace.tsx');
assert.match(cards, /aria-label=\{`Abrir material \$\{material\.title\}`\}/);
assert.match(cards, /before:absolute before:inset-0/);
assert.doesNotMatch(cards, /onClick=\{\(\) => router\.push\(getStudentMaterialRoute\(material\.id\)\)\}/);

const modal = source('components/profile-completion-modal.tsx');
assert.match(modal, /max-h-\[calc\(100dvh-1rem\)\] overflow-x-hidden overflow-y-auto/);
const academic = source('components/profile-academic-simple.tsx');
assert.match(academic, /flex-col-reverse gap-3 sm:flex-row/);
assert.match(academic, /min-h-11 w-full whitespace-normal/);
const hero = source('components/dashboard/maeve-study-hero.tsx');
assert.match(hero, /text-xs font-semibold tracking-\[0\.10em\] text-slate-600/);
assert.match(hero, /text-\[13px\] leading-\[1\.5\] text-slate-600/);
console.log('ux-a11y-priorities.smoke passed');
