import assert from 'node:assert/strict';
import { parseBatchRequests, runBatch } from '../scripts/seo/bing-batch-research.mjs';

const req = { requests: [
  { keyword: '  tecnica Feynman ', country: 'es', language: 'es-ES' },
  { keyword: 'como estudiar para un examen tipo test', country: 'mx' }
]};
const parsed = parseBatchRequests(req);
assert.equal(parsed.length, 2);
assert.equal(parsed[0].keyword, 'tecnica feynman');
assert.equal(parsed[1].language, 'es-MX');
assert.throws(() => parseBatchRequests({ requests: [req.requests[0], req.requests[0]] }), /Duplicate/);
assert.throws(() => parseBatchRequests({ requests: [{ keyword: 'abc', country: 'us' }] }), /Invalid/);
await assert.rejects(runBatch(req, { apiKey: '' }), /BING_WEBMASTER_API_KEY/);
const result = await runBatch(req, {
  apiKey: 'TEST_SECRET',
  now: new Date('2026-11-05T12:00:00Z'),
  client: async ({ keyword }) => keyword === 'tecnica feynman'
    ? { status: 'BING_ESTIMATE_AVAILABLE', bingMonthlyEstimate: 1000, googleMonthlyVolume: 1000, eligibleForGoogle500Rule: true }
    : Promise.reject(new Error('403 test error with TEST_SECRET'))
});
assert.equal(result.successfulApiCalls, 1);
assert.equal(result.errorCount, 1);
assert.equal(result.googleVolumeValidatedCount, 0);
assert.equal(result.results[0].googleMonthlyVolume, null);
assert.equal(result.results[0].eligibleForGoogle500Rule, false);
assert.equal(result.results[1].googleMonthlyVolume, null);
assert.equal(result.results[1].eligibleForGoogle500Rule, false);
assert.ok(!JSON.stringify(result).includes('TEST_SECRET'));
console.log('PASS Bing batch research: limits, dedup, provenance, safe errors, no Google-volume promotion');
