import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reserveFreeQuestionSession } from '../lib/free-study-v2-practice-session.ts';

const all = Array.from({ length: 8 }, (_, i) => 'q-' + (i + 1));
let remaining = 1;
const claimed: string[] = [];
const almostExhausted = await reserveFreeQuestionSession({
  candidateIds: all, maxQuestions: 6, unlockedIds: new Set(),
  claim: async id => {
    if (!remaining) return false;
    remaining--;
    claimed.push(id);
    return true;
  },
});
assert.deepEqual(almostExhausted.questionIds, ['q-1'],
  'With one remaining Free question, show a one-question session, never interrupt a six-question batch.');
assert.equal(almostExhausted.exhausted, true);
assert.equal(claimed.length, 1, 'Never spend more than the remaining quota.');

const repeat = await reserveFreeQuestionSession({
  candidateIds: ['q-2', 'q-1', 'q-3', 'q-1'], maxQuestions: 6,
  unlockedIds: new Set(['q-1']),
  claim: async () => false,
});
assert.deepEqual(repeat.questionIds, ['q-1'], 'Previously unlocked questions remain replayable.');
assert.equal(repeat.exhausted, true);
const untouched = await reserveFreeQuestionSession({
  candidateIds: ['q-2', 'q-1'], maxQuestions: 1,
  unlockedIds: new Set(['q-1']),
  claim: async () => false,
});
assert.deepEqual(untouched.questionIds, ['q-1']);
const full = await reserveFreeQuestionSession({
  candidateIds: all, maxQuestions: 4, unlockedIds: new Set(),
  claim: async () => true,
});
assert.equal(full.questionIds.length, 4, 'Never exceed the displayed session size.');
await assert.rejects(
  reserveFreeQuestionSession({
    candidateIds: ['q-2'], maxQuestions: 1, unlockedIds: new Set(),
    claim: async () => { throw new Error('network'); },
  }),
  /network/,
  'Network failures must not be mistaken for exhausted Free credits.'
);

const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const ui = read('components/student-material-exam.tsx');
const route = read('app/api/free-study-v2/practice-session/route.ts');
assert.match(ui, /await fetch\('\/api\/free-study-v2\/practice-session'/);
assert.ok(ui.indexOf('await fetch(\'/api/free-study-v2/practice-session\'') <
  ui.indexOf('setQuestions(accessibleQuestions.map('),
  'The entire batch is granted BEFORE the first question appears.');
assert.match(ui, /preclaimedFreeQuestionIds\.current\.has\(current\.id\)/);
assert.match(ui, /setFreeQuotaReached\(true\)/);
assert.match(route, /listFreeStudyUnlockedKeys/);
assert.match(route, /claimFreeStudyUnlock/);
assert.match(route, /isVerifiedChoice/);
assert.match(route, /status: 503/);
console.log('Free multiple-choice batches: all-or-shortened sessions, replay and retry checks passed.');
