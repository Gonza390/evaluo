// Live, read-only SEO migration audit. Run in GitHub Actions with public network access.
// This script never submits forms, calls private APIs or changes production data.
import assert from 'node:assert/strict';

const NEW = 'https://evaluoapp.com';
const OLD = ['https://evaluo.com.ar', 'https://www.evaluo.com.ar'];
const REGION_PATHS = ['/estudiar-pdf-con-ia', '/es/estudiar-pdf-con-ia',
  '/es-mx/estudiar-pdf-con-ia', '/es-co/estudiar-pdf-con-ia', '/es-es/estudiar-pdf-con-ia'];
const LANDINGS = [...REGION_PATHS, '/pregunteros', '/landings/parciales',
  '/funciones/resumir-pdf-con-ia', '/funciones/crear-flashcards-desde-pdf',
  '/uba-xxi/parciales', '/convertir-pdf-en-preguntas'];
const HREFLANG = {
  'es-AR': '/estudiar-pdf-con-ia',
  es: '/es/estudiar-pdf-con-ia',
  'es-MX': '/es-mx/estudiar-pdf-con-ia',
  'es-CO': '/es-co/estudiar-pdf-con-ia',
  'es-ES': '/es-es/estudiar-pdf-con-ia',
  'x-default': '/es/estudiar-pdf-con-ia',
};
const results = [];
let failures = 0;

function check(label, ok, detail = '') {
  const msg = (ok ? 'PASS' : 'FAIL') + ' ' + label + (detail ? ' — ' + detail : '');
  console.log(msg);
  results.push({ label, ok, detail });
  if (!ok) failures += 1;
}
async function request(url, options = {}) {
  let lastError;
  for (let n = 0; n < 2; n += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'manual', signal: AbortSignal.timeout(25000),
        headers: { 'user-agent': 'EvaluoDomainMigrationAudit/1.0 (+github-actions)' },
        ...options,
      });
      const text = options.method === 'HEAD' ? '' : await response.text();
      return { status: response.status, location: response.headers.get('location'),
        text, contentType: response.headers.get('content-type') ?? '' };
    } catch (error) {
      lastError = error;
      if (n === 0) await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}
function attribute(tag, name) {
  const match = tag.match(new RegExp('(?:\\s|^)' + name + '\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]', 'i'));
  return match?.[1] || '';
}
function headTags(html, tagName) {
  const head = html.slice(0, html.indexOf('</head>') >= 0 ? html.indexOf('</head>') : 20000);
  return head.match(new RegExp('<' + tagName + '\\b[^>]*>', 'gi')) || [];
}
function canonical(html) {
  return headTags(html, 'link').find((tag) => attribute(tag, 'rel').toLowerCase() === 'canonical');
}
function hreflang(html) {
  const tags = headTags(html, 'link');
  const mapped = new Map();
  for (const tag of tags) {
    const key = attribute(tag, 'hrefLang') || attribute(tag, 'hreflang');
    if (key && attribute(tag, 'rel') === 'alternate') mapped.set(key, attribute(tag, 'href'));
  }
  return mapped;
}

console.log('Live migration audit: ' + new Date().toISOString());
console.log('Legacy -> canonical host checks');
for (const host of OLD) {
  for (const path of ['/', '/pregunteros', '/estudiar-pdf-con-ia',
    '/es-mx/estudiar-pdf-con-ia?utm_source=migration-audit']) {
    const url = host + path;
    try {
      const r = await request(url);
      const expected = NEW + path;
      check(url, r.status === 301 && r.location === expected,
        'HTTP ' + r.status + ', Location=' + (r.location || '(missing)'));
    } catch (error) {
      check(url, false, String(error));
    }
  }
}

console.log('Public discoverability');
let sitemap = '';
try {
  const r = await request(NEW + '/robots.txt');
  check('robots.txt HTTP 200', r.status === 200, 'HTTP ' + r.status);
  check('robots.txt points at new sitemap', r.text.includes(NEW + '/sitemap.xml'));
  check('robots.txt omits old host', !r.text.includes('evaluo.com.ar'));
} catch (error) { check('robots.txt request', false, String(error)); }
try {
  const r = await request(NEW + '/sitemap.xml');
  sitemap = r.text;
  check('sitemap.xml HTTP 200 XML', r.status === 200 && /<urlset|<sitemapindex/.test(sitemap),
    'HTTP ' + r.status + ', content type=' + r.contentType);
  check('sitemap uses only new host', !sitemap.includes('evaluo.com.ar') && sitemap.includes(NEW + '/'));
  for (const path of LANDINGS) {
    check('sitemap includes ' + path, sitemap.includes('<loc>' + NEW + path + '</loc>'));
  }
} catch (error) { check('sitemap.xml request', false, String(error)); }

console.log('Canonical and hreflang rendered HTML');
for (const path of LANDINGS) {
  try {
    const r = await request(NEW + path);
    check('landing HTTP 200 ' + path, r.status === 200, 'HTTP ' + r.status + (r.location ? ' -> ' + r.location : ''));
    if (r.status !== 200) continue;
    const canonicalTag = canonical(r.text);
    const got = canonicalTag ? attribute(canonicalTag, 'href') : '';
    check('canonical ' + path, got === NEW + path, got || '(missing)');
    const robotsTags = headTags(r.text, 'meta').filter((tag) => attribute(tag, 'name').toLowerCase() === 'robots');
    check('indexable ' + path, !robotsTags.some((tag) => /noindex/i.test(attribute(tag, 'content'))));
    if (REGION_PATHS.includes(path)) {
      const links = hreflang(r.text);
      for (const [locale, target] of Object.entries(HREFLANG)) {
        check('hreflang ' + locale + ' on ' + path,
          links.get(locale) === NEW + target,
          links.get(locale) || '(missing)');
      }
    }
  } catch (error) {
    check('landing request ' + path, false, String(error));
  }
}
console.log('TOTAL ' + results.length + ' checks; PASS ' + (results.length - failures) + '; FAIL ' + failures);
if (failures) process.exitCode = 1;
