/**
 * Non-mutating HTTP audit for the evaluo.com.ar -> evaluoapp.com move.
 * Run only against public URLs: node scripts/seo/migration-live-check.mjs
 * Results are observations, not a Search Console indexing report.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const previous = 'https://evaluo.com.ar';
const current = 'https://evaluoapp.com';
const paths = [
  '/',
  '/ia-para-estudiantes',
  '/como-estudiar-ingreso-unlam',
  '/uba-xxi/parciales',
  '/funciones/crear-mapa-mental-desde-pdf',
  '/funciones/resumir-pdf-con-ia',
  '/estudiar-pdf-con-ia',
];
const results = [];
const add = (route, check, status, detail) => results.push({ route, check, status, detail });
const request = async (url, redirect = 'manual') =>
  fetch(url, {
    redirect,
    headers: { 'user-agent': 'Evaluo-SEO-Migration-ReadOnly/1.0' },
    signal: AbortSignal.timeout(15000),
  });

for (const route of paths) {
  const expected = current + route;
  try {
    const response = await request(previous + route);
    if ([401, 403, 429].includes(response.status)) {
      add(route, 'old-domain-permanent-redirect', 'INCONCLUSIVE', 'Access restriction HTTP ' + response.status);
    } else if (![301, 308].includes(response.status)) {
      add(route, 'old-domain-permanent-redirect', 'FAIL', 'Expected HTTP 301/308; received ' + response.status);
    } else {
      const location = response.headers.get('location');
      const destination = location ? new URL(location, previous + route) : null;
      const correct = destination?.origin === current &&
        destination.pathname.replace(/\/+$/, '') === new URL(expected).pathname.replace(/\/+$/, '');
      add(route, 'old-domain-permanent-redirect', correct ? 'PASS' : 'FAIL',
        'HTTP ' + response.status + ' to ' + (destination?.href || '(missing Location)'));
    }
    await response.body?.cancel();
  } catch (error) {
    add(route, 'old-domain-permanent-redirect', 'INCONCLUSIVE', String(error.message).slice(0, 160));
  }
  try {
    const response = await request(expected, 'follow');
    if ([401, 403, 429].includes(response.status)) {
      add(route, 'canonical-html', 'INCONCLUSIVE', 'Access restriction HTTP ' + response.status);
    } else if (response.status !== 200) {
      add(route, 'canonical-html', 'FAIL', 'Expected HTTP 200; received ' + response.status);
    } else {
      const html = await response.text();
      const tags = html.match(/<link\b[^>]*>/gi) || [];
      const canonicalTag = tags.find((tag) => /\brel\s*=\s*["']canonical["']/i.test(tag));
      const link = canonicalTag?.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
      const canonical = link ? new URL(link, expected) : null;
      const ok = canonical && canonical.origin === current &&
        canonical.pathname.replace(/\/+$/, '') === new URL(expected).pathname.replace(/\/+$/, '');
      add(route, 'canonical-html', ok ? 'PASS' : 'FAIL', canonical?.href || '(canonical missing)');
    }
  } catch (error) {
    add(route, 'canonical-html', 'INCONCLUSIVE', String(error.message).slice(0, 160));
  }
}
for (const route of ['/robots.txt', '/sitemap.xml']) {
  try {
    const response = await request(current + route, 'follow');
    if ([401, 403, 429].includes(response.status)) {
      add(route, 'public-discovery-file', 'INCONCLUSIVE', 'Access restriction HTTP ' + response.status);
      continue;
    }
    const body = await response.text();
    const ok = response.status === 200 && body.includes(current) &&
      (route === '/robots.txt' ? body.includes('/sitemap.xml') : body.includes('<urlset'));
    add(route, 'public-discovery-file', ok ? 'PASS' : 'FAIL', 'HTTP ' + response.status);
  } catch (error) {
    add(route, 'public-discovery-file', 'INCONCLUSIVE', String(error.message).slice(0, 160));
  }
}
const summary = Object.fromEntries(['PASS', 'FAIL', 'INCONCLUSIVE']
  .map((status) => [status, results.filter((item) => item.status === status).length]));
const output = { at: new Date().toISOString(), previous, current, source: 'public-http', summary, results };
mkdirSync('artifacts/seo', { recursive: true });
writeFileSync('artifacts/seo/migration-live-check.json', JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
console.log('Coverage note: Google indexed count must be read from the Page indexing report, not from the deprecated sitemap indexed field.');
if (summary.FAIL) process.exitCode = 1;
