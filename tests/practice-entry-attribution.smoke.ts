import assert from 'node:assert/strict';
import { practiceScope, resolvePracticeEntrySource } from '../lib/student-materials/practice-entry.ts';

assert.equal(resolvePracticeEntrySource('tab'), 'direct_tab');
assert.equal(resolvePracticeEntrySource('summary_popup'), 'summary_popup');
assert.equal(resolvePracticeEntrySource('summary_chapter'), 'topic_practice');
assert.equal(practiceScope(undefined), 'general');
assert.equal(practiceScope(0), 'topic');
assert.equal(practiceScope(3), 'topic');
