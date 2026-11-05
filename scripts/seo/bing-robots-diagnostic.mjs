/**
 * Read-only Bing Webmaster diagnostic. GetCrawlIssues is NOT the same as
 * Recommendations: absent URLs here do not clear Recommendation warnings.
 * No mutation, no URL submission, no API key in logs or artifacts.
 *
 * BING_WEBMASTER_API_KEY=... node scripts/seo/bing-robots-diagnostic.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const SITE = 'https://evaluoapp.com/';
const API = 'https://ssl.bing.com/webmaster/api.svc/json/GetCrawlIssues';
const OUT = 'artifacts/seo/bing-crawl-issues.json';
const key = process.env.BING_WEBMASTER_API_KEY;
if (!key) {
  process.stderr.write('Missing Bing Webmaster API secret\n');
  process.exit(1);
}
const url = new URL(API);
url.searchParams.set('apikey', key);
url.searchParams.set('siteUrl', SITE);
let response, body;
try {
  response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Bing API HTTP ' + response.status);
  body = await response.json();
  if (body?.ErrorCode || (body?.Message && !Array.isArray(body?.d))) {
    throw new Error('Bing API returned a structured error');
  }
} catch (err) {
  process.stderr.write('Bing read-only diagnostics unavailable: ' +
    String(err?.message || 'request failed').slice(0, 160) + '\n');
  process.exit(1);
}
const items = Array.isArray(body?.d) ? body.d : Array.isArray(body) ? body : [];
// Accept only URLs within the verified domain, no tokens or untrusted query values.
const sanitized = items.filter((item) => {
  if (typeof item?.Url !== 'string') return false;
  try {
    const parsed = new URL(item.Url);
    return parsed.protocol === 'https:' && parsed.hostname === 'evaluoapp.com';
  } catch { return false; }
}).map((item) => {
  const parsed = new URL(item.Url);
  return {
    page: parsed.origin + parsed.pathname,
    httpCode: Number.isInteger(item.HttpCode) ? item.HttpCode : null,
    issuesRaw: typeof item.Issues === 'number' || typeof item.Issues === 'string'
      ? String(item.Issues).slice(0, 60) : null,
    inboundLinks: Number.isInteger(item.InLinks) ? item.InLinks : null,
  };
});
const result = {
  source: 'Bing Webmaster GetCrawlIssues API (not Recommendations)',
  observedAt: new Date().toISOString(),
  site: SITE,
  status: sanitized.length ? 'CRAWL_ISSUE_URLS_RETURNED' : 'NO_CRAWL_ISSUES_REPORTED',
  recommendationMetaRobotsUrls: 'UNKNOWN_FROM_THIS_ENDPOINT',
  caveat: 'Recommendations has its own UI list; these crawl issues may be unrelated. Never infer that a page should be indexed from this list alone.',
  returnedRows: items.length,
  issuePages: sanitized,
};
mkdirSync('artifacts/seo', { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n', 'utf8');
process.stdout.write('Bing crawl diagnostic saved, ' + sanitized.length + ' site URLs, recommendation page URLs still unconfirmed.\n');
