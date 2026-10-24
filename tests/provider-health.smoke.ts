import assert from 'node:assert/strict';
import { isProviderAttemptBlocked, markProviderHttpFailure, clearProviderFailure } from '../lib/ai/provider-health.ts';

const now = 100_000;
const model = 'fixture-retired-model';
const alternate = 'fixture-fallback-model';
const key = 'fixture-key';
const secondKey = 'fixture-alternate-key';

assert.equal(isProviderAttemptBlocked('nvidia', model, key, now), false);
markProviderHttpFailure('nvidia', model, key, 404, now);
assert.equal(isProviderAttemptBlocked('nvidia', model, key, now), true);
assert.equal(isProviderAttemptBlocked('nvidia', model, secondKey, now), true);
assert.equal(isProviderAttemptBlocked('nvidia', alternate, key, now), false);
assert.equal(isProviderAttemptBlocked('nvidia', model, key, now + 30 * 60 * 1000), false);

markProviderHttpFailure('groq', model, key, 401, now);
assert.equal(isProviderAttemptBlocked('groq', alternate, key, now), true);
assert.equal(isProviderAttemptBlocked('groq', model, secondKey, now), false);
assert.equal(isProviderAttemptBlocked('groq', alternate, key, now + 30 * 60 * 1000), false);

markProviderHttpFailure('github', model, key, 429, now);
markProviderHttpFailure('github', model, key, 503, now);
assert.equal(isProviderAttemptBlocked('github', model, key, now), false);

markProviderHttpFailure('nvidia', model, key, 410, now);
assert.equal(isProviderAttemptBlocked('nvidia', model, secondKey, now), true);
clearProviderFailure('nvidia', model, key);
assert.equal(isProviderAttemptBlocked('nvidia', model, key, now), false);
markProviderHttpFailure('groq', model, key, 403, now);
assert.equal(isProviderAttemptBlocked('groq', model, key, now), true);
clearProviderFailure('groq', model, key);
assert.equal(isProviderAttemptBlocked('groq', model, key, now), false);

console.log('AI provider model/credential cooldown tests passed.');
