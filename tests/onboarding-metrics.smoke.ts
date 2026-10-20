import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FIRST_PDF_GUIDE_VERSION,
  summarizeFirstPdfOnboarding,
  type FirstPdfGuideEvent,
} from '../lib/onboarding-funnel.ts';

const root = (path: string) => readFileSync(path, 'utf8');
const workspace = root('components/material-study-workspace.tsx');
const adminActions = root('app/administrador/product-actions.ts');
const adminPanel = root('app/administrador/product-panel.tsx');
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
console.log('onboarding-metrics.smoke passed');
