// Manually submit only newly published/updated public canonical URLs to IndexNow.
// IndexNow is used by Bing and participating engines, not Google Search.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ORIGIN = 'https://evaluoapp.com';
const HOST = 'evaluoapp.com';
const KEY = 'c9933f4f9ebf4b7f57b69d5cf571baa4';
const KEY_LOCATION = ORIGIN + '/' + KEY + '.txt';
const API = 'https://api.indexnow.org/indexnow';

function attribute(tag, name) {
  const match = tag.match(new RegExp('(?:\\s|^)' + name + '\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]', 'i'));
  return match?.[1] || '';
}

function pageCanonical(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const canonical = tags.find((tag) => attribute(tag, 'rel').toLowerCase() === 'canonical');
  return canonical ? attribute(canonical, 'href') : '';
}

function hasNoindex(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  return tags.some((tag) =>
    attribute(tag, 'name').toLowerCase() === 'robots' &&
    /(?:^|[,\s])noindex(?:$|[,\s])/i.test(attribute(tag, 'content')));
}

function requestedUrls() {
  const input = process.env.INDEXNOW_URLS?.trim();
  assert.ok(input, 'Provide INDEXNOW_URLS (comma, newline or whitespace separated).');
  const urls = [...new Set(input.split(/[\s,]+/).filter(Boolean))];
  assert.ok(urls.length > 0 && urls.length <= 20, 'Send 1-20 changed URLs per run, never the whole sitemap.');
  for (const value of urls) {
    const url = new URL(value);
    assert.equal(url.origin, ORIGIN, 'Only the canonical Evaluo host is allowed.');
    assert.equal(url.toString(), value, 'URLs must be absolute, without query or hash or normalization.');
    assert.ok(!url.search && !url.hash && !url.username && !url.password, 'No tracking or private URL parameters.');
  }
  return urls;
}

async function fetchOk(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { 'user-agent': 'EvaluoIndexNowPublisher/1.0' },
  });
  assert.equal(response.status, 200, 'Expected HTTP 200 for ' + url);
  return response.text();
}

const keyFile = (await readFile(new URL('../public/' + KEY + '.txt', import.meta.url), 'utf8')).trim();
assert.equal(keyFile, KEY, 'Repository IndexNow key file mismatch.');
const onlineKey = (await fetchOk(KEY_LOCATION)).trim();
assert.equal(onlineKey, KEY, 'The key must be publicly deployed before submitting URLs.');
const sitemapXml = await fetchOk(ORIGIN + '/sitemap.xml');
const urls = requestedUrls();
for (const url of urls) {
  assert.ok(sitemapXml.includes('<loc>' + url + '</loc>'), 'Only URLs published in the sitemap may be submitted: ' + url);
  const html = await fetchOk(url);
  assert.ok(!hasNoindex(html), 'Do not submit a noindex page: ' + url);
  assert.equal(pageCanonical(html), url, 'Canonical must point to this same URL: ' + url);
}
const result = await fetch(API, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
  signal: AbortSignal.timeout(30000),
});
assert.ok(result.status === 200 || result.status === 202, 'IndexNow rejected submission: HTTP ' + result.status + ' ' + (await result.text()).slice(0, 600));
console.log('IndexNow accepted ' + urls.length + ' changed, canonical public Evaluo URLs (HTTP ' + result.status + ').');
console.log('Acceptance does not guarantee indexing or rankings. Check Bing Webmaster Tools for results.');
