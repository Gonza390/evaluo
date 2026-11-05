/**
 * Execute a small, provenance-safe batch of Bing keyword research requests.
 * Bing stats are a SEPARATE data source; never use them to validate Google volume.
 *
 * node scripts/seo/bing-batch-research.mjs --file=seo/keyword-data/bing-requests.json --out=artifacts/seo/bing-latest.json
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBingKeywordStats } from './bing-keyword-research.mjs';

const ISO_MARKET = new Map([['ar','es-AR'],['es','es-ES'],['mx','es-MX'],['co','es-CO']]);
const MAX_REQUESTS = 15;

export function parseBatchRequests(input) {
  const items = input?.requests;
  if (!Array.isArray(items)) throw new Error('Expected a JSON object with requests[]');
  if (items.length < 1 || items.length > MAX_REQUESTS) throw new Error('Expected 1-15 keyword requests');
  const seen = new Set();
  return items.map((r) => {
    if (!r || typeof r.keyword !== 'string' || typeof r.country !== 'string') throw new Error('Invalid request');
    const keyword = r.keyword.trim().toLocaleLowerCase('es');
    const country = r.country.toLowerCase();
    const language = r.language || ISO_MARKET.get(country);
    if (keyword.length < 3 || keyword.length > 120 || !ISO_MARKET.has(country) || language !== ISO_MARKET.get(country)) {
      throw new Error('Invalid keyword or target market');
    }
    const id = [keyword, country, language].join('|');
    if (seen.has(id)) throw new Error('Duplicate request: ' + id);
    seen.add(id);
    return { keyword, country, language };
  });
}

export async function runBatch(input, { apiKey = process.env.BING_WEBMASTER_API_KEY, now = new Date(), client = fetchBingKeywordStats } = {}) {
  const requests = parseBatchRequests(input);
  if (!apiKey) throw new Error('BING_WEBMASTER_API_KEY not available; no request sent');
  const records = [];
  for (const r of requests) {
    try {
      const data = await client({ ...r, apiKey, now });
      records.push({
        ...data,
        keyword: r.keyword,
        country: r.country.toUpperCase(),
        language: r.language,
        googleMonthlyVolume: null,
        eligibleForGoogle500Rule: false,
      });
    } catch (error) {
      const message = String(error?.message || 'Bing API error')
        .replaceAll(apiKey, '[REDACTED]')
        .slice(0, 180);
      records.push({
        ...r, country: r.country.toUpperCase(), searchEngine: 'BING',
        status: 'ERROR', error: message, bingMonthlyEstimate: null,
        googleMonthlyVolume: null, eligibleForGoogle500Rule: false,
      });
    }
  }
  return {
    schemaVersion: 1,
    source: 'Bing Webmaster Tools GetKeywordStats',
    fetchedAt: now.toISOString(),
    scope: 'BING (NOT Google Search)',
    googleVolumeValidatedCount: 0,
    warnings: ['Bing strict-match impressions are not Google search volume.', 'Do not infer Google >=500/month from this output.'],
    results: records,
    successfulApiCalls: records.filter((r) => r.status !== 'ERROR').length,
    errorCount: records.filter((r) => r.status === 'ERROR').length,
  };
}

export async function main(args = process.argv.slice(2)) {
  const flags = Object.fromEntries(args.filter((v) => /^--[^=]+=/.test(v)).map((v) => {
    const i = v.indexOf('=');
    return [v.slice(2, i), v.slice(i + 1)];
  }));
  if (!flags.file || !flags.out) throw new Error('Expected --file=input.json and --out=report.json');
  const input = JSON.parse(await readFile(flags.file, 'utf8'));
  const result = await runBatch(input);
  await mkdir(dirname(flags.out), { recursive: true });
  await writeFile(flags.out, JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify({
    source: 'BING',
    successfulApiCalls: result.successfulApiCalls,
    errorCount: result.errorCount,
    summary: result.results.map(({ keyword, country, status, bingMonthlyEstimate }) => ({ keyword, country, status, bingMonthlyEstimate })),
  }, null, 2) + '\n');
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(String(e.message).slice(0, 250) + '\n');
    process.exitCode = 1;
  });
}
