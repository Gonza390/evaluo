import assert from 'node:assert/strict';
import { parseBingDate, summarizeBingStats, fetchBingKeywordStats, main } from '../scripts/seo/bing-keyword-research.mjs';

const now = new Date('2026-11-05T12:00:00Z');
const rows = Array.from({ length: 7 }, (_, i) => ({
  Date: '/Date(' + Date.UTC(2026, 8, 15 + i * 7) + ')/',
  Impressions: 120,
  BroadImpressions: 900,
}));
assert.equal(parseBingDate(rows[0].Date).toISOString().slice(0, 10), '2026-09-15');
const stats = summarizeBingStats({ d: rows }, { now });
assert.equal(stats.cadence, 'weekly');
assert.equal(stats.bingMonthlyEstimate, 520);
assert.equal(stats.googleMonthlyVolume, null);
assert.equal(stats.eligibleForGoogle500Rule, false);
assert.equal(summarizeBingStats({ d: [] }, { now }).status, 'INSUFFICIENT_BING_DATA');
const result = await fetchBingKeywordStats({
  keyword: 'tecnica feynman', country: 'es', language: 'es-ES', apiKey: 'TEST_KEY', now,
  fetchImpl: async (url) => {
    assert.equal(url.searchParams.get('q'), 'tecnica feynman');
    assert.equal(url.searchParams.get('country'), 'es');
    return { ok: true, json: async () => ({ d: rows }) };
  },
});
assert.equal(result.bingMonthlyEstimate, 520);
await assert.rejects(fetchBingKeywordStats({ keyword: 'x', country: 'es', language: 'es-ES' }), /Missing BING/);
await assert.rejects(fetchBingKeywordStats({
  keyword: 'x', country: 'es', language: 'es-ES', apiKey: 'TEST_KEY',
  fetchImpl: async () => ({ ok: false, status: 403 }),
}), /HTTP 403/);
await assert.rejects(main(['--keywords=tecnica feynman'], {}), /Missing BING/);
console.log('PASS Bing research: dates, normalization, Bing-only eligibility, API errors, missing credentials');
