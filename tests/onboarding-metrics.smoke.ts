import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAllowedAnalyticsEventName } from '../lib/analytics-events.ts';
import { sanitizeAnalyticsMetadata } from '../lib/analytics-metadata.ts';
import {
  FIRST_PDF_GUIDE_VERSION,
  summarizeFirstPdfOnboarding,
  type FirstPdfGuideEvent,
} from '../lib/onboarding-funnel.ts';

const root = (path: string) => readFileSync(path, 'utf8');
const workspace = root('components/material-study-workspace.tsx');
const adminActions = root('app/(es)/administrador/product-actions.ts');
const adminPanel = root('app/(es)/administrador/product-panel.tsx');
const whitelist = root('lib/analytics-metadata.ts');
const allowed = root('lib/analytics-events.ts');

assert.match(workspace, /first_pdf_guide_started/);
assert.match(workspace, /first_pdf_guide_step_viewed/);
assert.match(workspace, /first_pdf_guide_post_action/);
assert.match(workspace, /getGuideMetadata\(\)/);
assert.match(adminActions, /summarizeFirstPdfOnboarding\(productClientEvents\)/);
assert.doesNotMatch(adminPanel, /④ Aprende — nuevo flujo del resumen/);
assert.match(adminPanel, /Onboarding — primer PDF/);
assert.match(adminPanel, /Estudiar por tema/);
assert.match(adminPanel, /Sin cierre registrado/);
for (const event of ['first_pdf_guide_started','first_pdf_guide_step_viewed','first_pdf_guide_completed','first_pdf_guide_skipped','first_pdf_guide_post_action']) {
  assert.match(allowed, new RegExp("'" + event + "'"));
  assert.match(whitelist, new RegExp(event + ':'));
}
for (const key of ['guide_version','guide_run_id']) {
  assert.match(whitelist, new RegExp("'" + key + "'"));
}
// El popup académico tiene un embudo medible sin enviar universidad, carrera ni texto libre.
const academicPopup = root('components/dashboard/academic-profile-reminder.tsx');
const academicForm = root('components/profile-academic-simple.tsx');
for (const event of [
  'academic_profile_popup_viewed',
  'academic_profile_popup_postponed',
  'academic_profile_popup_completed',
]) {
  assert.ok(isAllowedAnalyticsEventName(event), event + ' must be registered by the API.');
  assert.match(academicPopup, new RegExp(event));
}
const safeAcademicEvent = sanitizeAnalyticsMetadata('academic_profile_popup_postponed', {
  page_type: 'dashboard',
  popup_id: 'test-popup-run',
  popup_version: 'academic_profile_popup_v1',
  missing_university: true,
  dismiss_method: 'later',
  universidad_id: 'should-not-be-logged',
  carrera_id: 'should-not-be-logged',
  carrera_nombre: 'sensitive free text',
});
assert.deepEqual(safeAcademicEvent, {
  page_type: 'dashboard',
  popup_id: 'test-popup-run',
  popup_version: 'academic_profile_popup_v1',
  missing_university: true,
  dismiss_method: 'later',
});
assert.match(academicPopup, /viewedRef\.current/);
assert.match(academicPopup, /outcomeRef\.current/);
assert.match(academicPopup, /onComplete=\{complete\}/);
assert.match(academicPopup, /onLater=\{\(\) => dismiss\('later'\)\}/);
assert.match(academicForm, /if \(!result\.success\)/);
assert.match(academicForm, /if \(onComplete\) onComplete\(\)/);

const t = '2026-10-20T09:00:00.000Z';
const at = (sec: number) => new Date(Date.parse(t) + sec * 1000).toISOString();
const row = (name: string, sec: number, overrides: {
  actor?: string; run?: string; step?: string; version?: string; action?: string; device?: string; session?: string;
} = {}): FirstPdfGuideEvent => ({
  event_name: name,
  user_id: overrides.actor ?? 'student-a',
  session_key: overrides.session ?? 'session-a',
  device_type: overrides.device ?? 'mobile',
  created_at: at(sec),
  metadata: {
    guide_version: overrides.version ?? FIRST_PDF_GUIDE_VERSION,
    guide_run_id: overrides.run ?? 'run-a',
    material_id: 'material-a',
    ...(overrides.step ? { step: overrides.step } : {}),
    ...(overrides.action ? { action: overrides.action } : {}),
  },
});
const dataset: FirstPdfGuideEvent[] = [
  row('first_pdf_guide_started',0),
  row('first_pdf_guide_step_viewed',1,{step:'summary'}),
  row('first_pdf_guide_step_viewed',2,{step:'practice'}),
  row('first_pdf_guide_step_viewed',3,{step:'topic'}),
  row('first_pdf_guide_step_viewed',4,{step:'errors'}),
  row('first_pdf_guide_step_viewed',5,{step:'topic'}), // revisit must not inflate
  row('first_pdf_guide_completed',18),
  row('first_pdf_guide_post_action',25,{action:'practica'}),
  row('first_pdf_guide_post_action',28,{action:'glosario'}), // count first only
  row('first_pdf_guide_started',0,{actor:'student-b',run:'run-b',session:'session-b',device:'desktop'}),
  row('first_pdf_guide_step_viewed',2,{actor:'student-b',run:'run-b',session:'session-b',step:'summary'}),
  row('first_pdf_guide_step_viewed',3,{actor:'student-b',run:'run-b',session:'session-b',step:'practice'}),
  row('first_pdf_guide_skipped',4,{actor:'student-b',run:'run-b',session:'session-b',step:'practice'}),
  row('first_pdf_guide_started',0,{actor:'student-c',run:'run-c',session:'session-c'}),
  row('first_pdf_guide_step_viewed',2,{actor:'student-c',run:'run-c',session:'session-c',step:'summary'}),
  row('first_pdf_guide_started',30,{run:'another-run-same-user'}), // exclude repeat run
  row('first_pdf_guide_completed',34,{run:'another-run-same-user'}),
  row('first_pdf_guide_started',0,{actor:'old-user',run:'old-run',version:'legacy',session:'session-old'}),
  row('first_pdf_guide_completed',5,{actor:'old-user',run:'old-run',version:'legacy',session:'session-old'}),
  row('first_pdf_guide_step_viewed',1,{actor:'orphan',run:'orphan-run',session:'session-orphan',step:'topic'}),
  { ...row('first_pdf_guide_started',1,{actor:'demo',run:'demo-run',session:'session-demo'}), user_id:null },
];
const stats=summarizeFirstPdfOnboarding(dataset);
assert.equal(stats.started,3);
assert.equal(stats.completed,1);
assert.equal(stats.skipped,1);
assert.equal(stats.incomplete,1);
assert.equal(stats.completionPct,33.3);
assert.equal(stats.skipPct,33.3);
assert.deepEqual(stats.steps.map(s=>s.reached),[3,2,1,1]);
assert.deepEqual(stats.steps.map(s=>s.dropoffs),[1,1,0,0]);
assert.equal(stats.mobileStarts,2);
assert.equal(stats.desktopStarts,1);
assert.equal(stats.firstActions,1);
assert.equal(stats.firstActionPct,100);
assert.deepEqual(stats.actions,{practica:1});
assert.equal(stats.medianDurationSeconds,18);
assert.equal(summarizeFirstPdfOnboarding([]).started,0);

// Si un estudiante salta primero y completa luego, debe contar como finalizado.
const twoAttempts: FirstPdfGuideEvent[] = [
  row('first_pdf_guide_started', 0, { actor: 'retry', run: 'retry-one', session: 'sess-one' }),
  row('first_pdf_guide_step_viewed', 2, { actor: 'retry', run: 'retry-one', session: 'sess-one', step: 'summary' }),
  row('first_pdf_guide_skipped', 5, { actor: 'retry', run: 'retry-one', session: 'sess-one', step: 'summary' }),
  row('first_pdf_guide_started', 60, { actor: 'retry', run: 'retry-two', session: 'sess-two', device: 'desktop' }),
  row('first_pdf_guide_step_viewed', 61, { actor: 'retry', run: 'retry-two', session: 'sess-two', step: 'summary' }),
  row('first_pdf_guide_step_viewed', 62, { actor: 'retry', run: 'retry-two', session: 'sess-two', step: 'practice' }),
  row('first_pdf_guide_step_viewed', 63, { actor: 'retry', run: 'retry-two', session: 'sess-two', step: 'topic' }),
  row('first_pdf_guide_step_viewed', 64, { actor: 'retry', run: 'retry-two', session: 'sess-two', step: 'errors' }),
  row('first_pdf_guide_completed', 72, { actor: 'retry', run: 'retry-two', session: 'sess-two' }),
  row('first_pdf_guide_post_action', 76, { actor: 'retry', run: 'retry-two', session: 'sess-two', action: 'practica' }),
];
const retried = summarizeFirstPdfOnboarding(twoAttempts);
assert.equal(retried.started, 1, 'Two attempts cannot become two students.');
assert.equal(retried.completed, 1, 'A later completion supersedes an earlier skip.');
assert.equal(retried.skipped, 0, 'Do not count a completed user as skipped.');
assert.equal(retried.incomplete, 0);
assert.deepEqual(retried.steps.map(step => step.reached), [1,1,1,1]);
assert.deepEqual(retried.steps.map(step => step.dropoffs), [0,0,0,0]);
assert.equal(retried.mobileStarts, 1, 'Devices reflect first attempt.');
assert.equal(retried.medianDurationSeconds, 12, 'Completion duration uses the completed attempt.');
assert.equal(retried.firstActions, 1);
assert.equal(retried.actions.practica, 1);
const retriesAfterCompletion = summarizeFirstPdfOnboarding([
  ...twoAttempts,
  row('first_pdf_guide_started', 120, { actor: 'retry', run: 'retry-three', session: 'sess-three' }),
  row('first_pdf_guide_skipped', 123, { actor: 'retry', run: 'retry-three', session: 'sess-three' }),
]);
assert.equal(retriesAfterCompletion.skipped, 0, 'Events after completion cannot reopen the guide.');
assert.equal(retriesAfterCompletion.completed, 1);

console.log('onboarding-metrics.smoke passed');
