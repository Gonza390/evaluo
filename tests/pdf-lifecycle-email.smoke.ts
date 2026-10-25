import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAllowedAnalyticsEventName } from '../lib/analytics-events.ts';
import { sanitizeAnalyticsMetadata } from '../lib/analytics-metadata.ts';

// Source-level regression checks: do not turn an email dispatch into user activity,
// and do not deliver two near-identical reminders within a few hours.
const d1 = readFileSync('lib/email/study-return-d1.ts', 'utf8');
const followup = readFileSync('lib/email/study-return-48h.ts', 'utf8');

assert.match(d1, /\.or\('session_key\.is\.null,session_key\.not\.like\.server:%'\)/);
assert.match(d1, /\.gt\('created_at', candidate\.lastActivityAt\)/);
assert.match(d1, /summary\.skippedReturned \+= 1/);
assert.match(d1, /getDashboardNextStudyAction\(candidate\.userId/);
assert.match(d1, /pendingTopics:/);
assert.match(d1, /Retomá los temas que te costaron/);

assert.match(followup, /CANDIDATE_WINDOW_HOURS = 96/);
assert.match(followup, /D1_COOLDOWN_HOURS = 36/);
assert.match(followup, /\.like\('campaign_key', 'study_return_d1_v1:%'\)/);
assert.match(followup, /\.contains\('context', \{ material_id: candidate\.material_id \}\)/);
assert.match(followup, /summary\.skippedRecentD1 \+= 1/);
assert.match(followup, /url\.searchParams\.set\('tab', hasPending \? 'progreso' : 'ejercicios'\)/);
assert.doesNotMatch(followup, /new URL\(hasPending/);
assert.match(followup, /Temas que te conviene repasar/);
assert.match(followup, /Ir a mi práctica/);
assert.match(d1, /url\.searchParams\.set\('error', pendingErrorId\)/);
assert.match(d1, /action\.kind === 'reinforce'/);
assert.match(d1, /pendingTopics\.data\?\.\[0\]\?\.id/);

// One email click restores the last chapter read, not just the summary tab.
const actions = readFileSync('lib/dashboard-next-study-action.ts', 'utf8');
const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const materialPage = readFileSync('app/materiales/[id]/page.tsx', 'utf8');
assert.ok(isAllowedAnalyticsEventName('summary_chapter_read'));
assert.deepEqual(sanitizeAnalyticsMetadata('summary_chapter_read', {
  material_id: 'pdf-1',
  chapter_index: 3,
  flow_version: 'test',
  private_notes: 'must not be stored',
}), { material_id: 'pdf-1', chapter_index: 3, flow_version: 'test' });
assert.match(workspace, /summaryChapterLastTrackedAtRef/);
assert.match(workspace, /chapterReadTimer = window\.setTimeout/);
assert.match(workspace, /\}, 8_000\)/);
assert.match(workspace, /summaryActiveReadingSectionRef\.current !== dominantSection/);
assert.match(workspace, /summary_chapter_read/);
assert.match(workspace, /if \(sections\.length === 0\) return/);
assert.match(workspace, /initialSummarySectionIndex/);
assert.match(workspace, /reader\.scrollTo\(\{/);
assert.match(actions, /'summary_chapter_read'/);
assert.match(actions, /lastRead\.metadata!\.chapter_index/);
assert.match(actions, /params\.set\('summaryTopic', String\(/);
assert.match(actions, /href: `\/materiales\/\$\{fallbackMaterial\.id\}\?\$\{params\.toString\(\)\}`/);
assert.match(materialPage, /summaryTopic\?: string/);
assert.match(materialPage, /initialSummarySectionIndex=/);
assert.match(materialPage, /Number\(query\.summaryTopic\) </);
assert.match(d1, /'summary_chapter_read'/);

console.log('pdf-lifecycle-email.smoke passed');
