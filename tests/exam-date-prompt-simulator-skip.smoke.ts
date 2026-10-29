import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isNewExamDatePromptSignal } from '../lib/exam-date-prompt-trigger.ts';

// One completed activity must never trigger duplicate eligibility requests.
const a = { materialId: 'pdf-a', nonce: 1 };
assert.equal(isNewExamDatePromptSignal(null, a), true);
assert.equal(isNewExamDatePromptSignal(a, a), false);
assert.equal(isNewExamDatePromptSignal(a, { ...a, nonce: 0 }), false);
assert.equal(isNewExamDatePromptSignal(a, { ...a, nonce: 1 }), false);
assert.equal(isNewExamDatePromptSignal(a, { ...a, nonce: 2 }), true);
assert.equal(isNewExamDatePromptSignal(a, { materialId: 'pdf-b', nonce: 1 }), true);
assert.equal(isNewExamDatePromptSignal(null, { ...a, nonce: -1 }), false);
assert.equal(isNewExamDatePromptSignal(null, { ...a, nonce: Number.NaN }), false);
assert.equal(isNewExamDatePromptSignal(null, { ...a, nonce: 1.5 }), false);

const prompt = readFileSync(new URL('../components/exam-date-plan-prompt.tsx', import.meta.url), 'utf8');
assert.match(prompt, /lastCheckedTriggerRef\.current = signal;/,
  'Consume the signal before triggering an async eligibility request.');
assert.match(prompt, /checkInFlightRef\.current/,
  'An in-flight guard should stop concurrent eligibility requests.');
assert.match(prompt, /finally\s*\{\s*checkInFlightRef\.current = false;/,
  'Restore check state after rejected eligibility promises.');
assert.match(prompt, /catch\s*\{\s*setError\('No pudimos guardar la fecha/,
  'Rejected save actions must display a recoverable error.');
assert.match(prompt, /finally\s*\{\s*setSaving\(false\);/,
  'Rejected save actions must re-enable the submit button.');

const simulator = readFileSync(new URL('../components/simulador/SimuladorExamenLegacy.tsx', import.meta.url), 'utf8');
assert.match(simulator, /<ProfileCompletionModal[\s\S]*?allowSkip=\{false\}/,
  'Required profile flow must not show actions that appear to skip its gate.');
assert.match(simulator, /onClose=\{\(\) => window\.location\.assign\(/,
  'Closing the mandatory profile modal must exit to a real destination.');

const modal = readFileSync(new URL('../components/profile-completion-modal.tsx', import.meta.url), 'utf8');
assert.match(modal, /!allowSkip && onClose[\s\S]*?Salir del simulador/,
  'The mandatory modal needs an explicit leave action.');
console.log('exam-date-prompt-simulator-skip.smoke passed');
