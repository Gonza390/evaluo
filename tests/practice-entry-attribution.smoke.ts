import assert from 'node:assert/strict';
import { practiceScope, resolvePracticeEntrySource } from '../lib/student-materials/practice-entry.ts';
import { isAllowedAnalyticsEventName } from '../lib/analytics-events.ts';
import { sanitizeAnalyticsMetadata } from '../lib/analytics-metadata.ts';

assert.equal(resolvePracticeEntrySource('tab'), 'direct_tab');
assert.equal(resolvePracticeEntrySource('summary_popup'), 'summary_popup');
assert.equal(resolvePracticeEntrySource('summary_chapter'), 'topic_practice');
assert.equal(practiceScope(undefined), 'general');
assert.equal(practiceScope(0), 'topic');
assert.equal(practiceScope(3), 'topic');

for (const name of [
  'summary_completion_popup_viewed',
  'summary_next_step_clicked',
  'student_material_practice_entry_opened',
  'student_material_exam_started',
  'student_material_exam_completed',
]) {
  assert.ok(isAllowedAnalyticsEventName(name), `Missing allowlisted analytics event: ${name}`);
}
const practiceMetadata = {
  material_id: 'demo-material',
  entry_source: 'summary_popup',
  entry_id: '1a111111-1111-4111-8111-111111111111',
  attempt_id: '2a222222-2222-4222-8222-222222222222',
  practice_scope: 'general',
  question_count: 5,
  unknown_field: 'must be dropped',
};
for (const name of ['student_material_exam_started', 'student_material_exam_completed'] as const) {
  const data = sanitizeAnalyticsMetadata(name, practiceMetadata) as Record<string, unknown>;
  assert.equal(data.entry_source, 'summary_popup');
  assert.equal(data.practice_scope, 'general');
  assert.equal(data.entry_id, practiceMetadata.entry_id);
  assert.equal(data.attempt_id, practiceMetadata.attempt_id);
  assert.equal(data.unknown_field, undefined);
}
const entry = sanitizeAnalyticsMetadata('student_material_practice_entry_opened', practiceMetadata) as Record<string, unknown>;
assert.equal(entry.entry_source, 'summary_popup');
assert.equal(entry.entry_id, practiceMetadata.entry_id);
const popup = sanitizeAnalyticsMetadata('summary_completion_popup_viewed', {
  material_id: 'demo-material', pending_count: 2, flow_version: 'summary_v2',
}) as Record<string, unknown>;
assert.equal(popup.pending_count, 2);
const click = sanitizeAnalyticsMetadata('summary_next_step_clicked', {
  material_id: 'demo-material', action: 'practice', entry_source: 'summary_popup',
}) as Record<string, unknown>;
assert.equal(click.action, 'practice');
assert.equal(click.entry_source, 'summary_popup');

for (const name of ['page_view', 'signup_completed', 'pdf_uploaded', 'first_pdf_practice_opened'] as const) {
  const sanitized = sanitizeAnalyticsMetadata(name, {
    attribution: {
      source: 'google',
      latest_source: 'google',
      landing_path: '/ia-para-estudiantes',
      utm_campaign: 'seo-organic',
      referrer: 'https://google.com/search?q=private-query',
      unknown_field: 'must be dropped',
    },
    unknown_field: 'must be dropped',
  }) as Record<string, unknown>;
  const attribution = sanitized.attribution as Record<string, unknown>;
  assert.equal(attribution.source, 'google', name);
  assert.equal(attribution.latest_source, 'google', name);
  assert.equal(attribution.landing_path, '/ia-para-estudiantes', name);
  assert.equal(attribution.referrer, undefined, 'Do not persist referrer search queries.');
  assert.equal(attribution.unknown_field, undefined, 'Keep attribution allowlisted.');
  assert.equal(sanitized.unknown_field, undefined);
}
