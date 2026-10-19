import assert from 'node:assert/strict';
import { classifyAIKeyHttpStatus } from '../lib/ai/key-health-utils.ts';

assert.equal(classifyAIKeyHttpStatus(200), 'ok');
assert.equal(classifyAIKeyHttpStatus(201), 'ok');
assert.equal(classifyAIKeyHttpStatus(401), 'unauthorized');
assert.equal(classifyAIKeyHttpStatus(403), 'unauthorized');
assert.equal(classifyAIKeyHttpStatus(429), 'rate_limited');
assert.equal(classifyAIKeyHttpStatus(503), 'provider_unavailable');
assert.equal(classifyAIKeyHttpStatus(400), 'bad_request');
assert.equal(classifyAIKeyHttpStatus(404), 'bad_request');
console.log('AI key health status classification smoke tests passed.');
