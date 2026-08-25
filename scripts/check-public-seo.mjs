const baseUrl = new URL(process.env.SEO_BASE_URL || 'https://evaluo.com.ar');
const concurrency = Math.max(1, Number.parseInt(process.env.SEO_AUDIT_CONCURRENCY || '6', 10));
const maxUrls = Number.parseInt(process.env.SEO_AUDIT_MAX_URLS || '0', 10);

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

function parseAttributes(tag) {
  const attributes = new Map();
  for (const match of tag.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? '');
  }
  return attributes;
}

function getMetaContent(html, key, value) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if ((attributes.get(key) || '').toLowerCase() === value.toLowerCase()) {
      return attributes.get('content')?.trim() || '';
    }
  }
  return '';
}

function getCanonical(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    const rel = (attributes.get('rel') || '').toLowerCase().split(/\s+/);
    if (rel.includes('canonical')) return attributes.get('href')?.trim() || '';
  }
  return '';
}

function normalizeUrl(value) {
  const url = new URL(value, baseUrl);
  url.hash = '';
  url.search = '';
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}

async function loadSitemap(url, seen = new Set()) {
  const normalized = normalizeUrl(url);
  if (seen.has(normalized)) return [];
  seen.add(normalized);

  const response = await fetch(url, {
    headers: { 'user-agent': 'EvaluoSeoAudit/1.0' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`Sitemap ${url} devolvió ${response.status}`);

  const xml = await response.text();
  const locs = extractLocs(xml);
  if (!/<sitemapindex\b/i.test(xml)) return locs;

  const nested = await Promise.all(locs.map((loc) => loadSitemap(loc, seen)));
  return nested.flat();
}

async function auditUrl(url) {
  const issues = [];
  let response;

  try {
    response = await fetch(url, {
      headers: { 'user-agent': 'EvaluoSeoAudit/1.0' },
      redirect: 'follow',
    });
  } catch (error) {
    return { url, issues: [`fetch falló: ${error instanceof Error ? error.message : String(error)}`] };
  }

  if (response.status !== 200) issues.push(`status ${response.status}`);
  const html = await response.text();

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  if (!title) issues.push('falta <title>');

  const description = getMetaContent(html, 'name', 'description');
  if (!description) issues.push('falta meta description');

  const canonical = getCanonical(html);
  if (!canonical) {
    issues.push('falta canonical');
  } else {
    try {
      if (normalizeUrl(canonical) !== normalizeUrl(url)) {
        issues.push(`canonical distinto (${canonical})`);
      }
    } catch {
      issues.push(`canonical inválido (${canonical})`);
    }
  }

  const robots = getMetaContent(html, 'name', 'robots').toLowerCase();
  if (robots.includes('noindex')) issues.push(`robots contiene noindex (${robots})`);

  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  if (h1Count !== 1) issues.push(`se esperaban 1 H1 y hay ${h1Count}`);

  const ogImage = getMetaContent(html, 'property', 'og:image');
  if (!ogImage) issues.push('falta og:image');

  return { url, issues };
}

async function mapConcurrent(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
const sitemapUrls = await loadSitemap(sitemapUrl);
const sameOriginUrls = [...new Set(sitemapUrls)]
  .filter((value) => {
    try {
      return new URL(value).origin === baseUrl.origin;
    } catch {
      return false;
    }
  })
  .slice(0, maxUrls > 0 ? maxUrls : undefined);

if (sameOriginUrls.length === 0) {
  console.error(`SEO audit: no se encontraron URLs en ${sitemapUrl}`);
  process.exit(1);
}

console.log(`SEO audit: revisando ${sameOriginUrls.length} URLs de ${baseUrl.origin}`);
const results = await mapConcurrent(sameOriginUrls, concurrency, auditUrl);
const failures = results.filter((result) => result.issues.length > 0);

for (const failure of failures) {
  console.error(`\n${failure.url}`);
  for (const issue of failure.issues) console.error(`  - ${issue}`);
}

if (failures.length > 0) {
  console.error(`\nSEO audit: ${failures.length}/${results.length} URLs con problemas.`);
  process.exit(1);
}

console.log(`SEO audit: ${results.length}/${results.length} URLs correctas.`);
