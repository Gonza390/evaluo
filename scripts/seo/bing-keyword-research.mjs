/**
 * Bing Webmaster keyword statistics: read-only, no paid services.
 * Needs BING_WEBMASTER_API_KEY. Bing impressions are NOT Google volume.
 *
 * Usage: node scripts/seo/bing-keyword-research.mjs --keywords="tecnica feynman;examen tipo test" --country=es --language=es-ES --out=/tmp/bing-seo.json
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://ssl.bing.com/webmaster/api.svc/json/GetKeywordStats';
const DAY_MS = 86400000;

export function parseBingDate(raw) {
  if (typeof raw !== 'string') return null;
  const match = raw.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);
  const date = new Date(match ? Number(match[1]) : raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Calculate Bing-only monthly estimate when reporting cadence is recognizable. */
export function summarizeBingStats(payload, { now = new Date() } = {}) {
  const raw = Array.isArray(payload?.d) ? payload.d : Array.isArray(payload) ? payload : [];
  const parsed = raw.map((item) => ({
    date: parseBingDate(item.Date),
    exact: Number(item.Impressions),
  })).filter((x) => x.date && Number.isFinite(x.exact) && x.exact >= 0)
    .filter((x) => x.date.getTime() <= now.getTime() && now.getTime() - x.date.getTime() <= 183 * DAY_MS)
    .sort((a, b) => a.date - b.date);
  const rows = [...new Map(parsed.map((x) => [x.date.toISOString().slice(0, 10), x])).values()];
  const gaps = rows.slice(1).map((row, i) => (row.date - rows[i].date) / DAY_MS);
  const median = gaps.length ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : null;
  const cadence = median != null && median >= 5 && median <= 11 ? 'weekly'
    : median != null && median >= 24 && median <= 36 ? 'monthly' : 'unknown';
  const sample = cadence === 'weekly' ? rows.slice(-13) : cadence === 'monthly' ? rows.slice(-4) : [];
  const enough = cadence === 'weekly' ? sample.length >= 4 : cadence === 'monthly' ? sample.length >= 2 : false;
  const average = enough ? sample.reduce((sum, row) => sum + row.exact, 0) / sample.length : null;
  const monthly = average == null ? null : Math.round(average * (cadence === 'weekly' ? 52 / 12 : 1));
  return {
    status: monthly === null ? 'INSUFFICIENT_BING_DATA' : 'BING_ESTIMATE_AVAILABLE',
    searchEngine: 'BING',
    metric: 'strict-match Bing impressions, NOT Google searches',
    cadence,
    observations: sample.length,
    firstDate: sample.length ? sample[0].date.toISOString().slice(0, 10) : null,
    lastDate: sample.length ? sample[sample.length - 1].date.toISOString().slice(0, 10) : null,
    bingMonthlyEstimate: monthly,
    googleMonthlyVolume: null,
    eligibleForGoogle500Rule: false,
  };
}

export async function fetchBingKeywordStats({ keyword, country, language, apiKey, fetchImpl = fetch, now = new Date() }) {
  if (!keyword || !country || !language) throw new Error('keyword, country and language are required');
  if (!apiKey) throw new Error('Missing BING_WEBMASTER_API_KEY; no request was sent');
  if (!/^[a-z]{2}$/.test(country) || !/^[a-z]{2}-[A-Z]{2}$/.test(language)) {
    throw new Error('Use a lowercase country code and locale such as es-ES');
  }
  const url = new URL(API);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('q', keyword);
  url.searchParams.set('country', country);
  url.searchParams.set('language', language);
  // Never include URL in errors: this API places the key in the query string.
  let response;
  try {
    response = await fetchImpl(url, { method: 'GET', signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error('Could not reach Bing Webmaster API');
  }
  if (!response.ok) throw new Error('Bing Webmaster returned HTTP ' + response.status);
  let body;
  try { body = await response.json(); } catch { throw new Error('Invalid Bing Webmaster JSON'); }
  if (body?.ErrorCode || body?.Message) throw new Error('Bing Webmaster rejected the request');
  return { keyword, country: country.toUpperCase(), language, ...summarizeBingStats(body, { now }) };
}

export async function main(args = process.argv.slice(2), env = process.env) {
  const opts = Object.fromEntries(args.filter((v) => v.startsWith('--') && v.includes('=')).map((v) => {
    const i = v.indexOf('=');
    return [v.slice(2, i), v.slice(i + 1)];
  }));
  const keywords = opts.file
    ? (await readFile(opts.file, 'utf8')).split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'))
    : (opts.keywords || '').split(';').map((s) => s.trim()).filter(Boolean);
  const unique = [...new Set(keywords.map((s) => s.toLocaleLowerCase('es')))];
  if (!unique.length || unique.length > 30) throw new Error('Provide 1-30 keywords with --keywords or --file');
  if (!env.BING_WEBMASTER_API_KEY) throw new Error('Missing BING_WEBMASTER_API_KEY');
  const records = [];
  for (const keyword of unique) {
    try {
      records.push(await fetchBingKeywordStats({
        keyword, country: opts.country || 'es', language: opts.language || 'es-ES',
        apiKey: env.BING_WEBMASTER_API_KEY,
      }));
    } catch (error) {
      records.push({
        keyword, status: 'ERROR', error: error.message.replaceAll(env.BING_WEBMASTER_API_KEY, '[REDACTED]'),
        bingMonthlyEstimate: null, googleMonthlyVolume: null, eligibleForGoogle500Rule: false,
      });
    }
  }
  const report = {
    source: 'Bing Webmaster Tools GetKeywordStats',
    fetchedAt: new Date().toISOString(),
    searchEngine: 'BING',
    warning: 'Bing impression estimates cannot validate >=500 monthly Google searches.',
    records,
  };
  if (opts.out) await writeFile(opts.out, JSON.stringify(report, null, 2) + '\n', 'utf8');
  else process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
