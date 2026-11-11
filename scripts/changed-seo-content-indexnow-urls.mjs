// Selector IndexNow para contenido SEO que no cubren los otros workflows:
// - guías en español (lib/es-study-guides.ts → /es/guias/<slug>)
// - artículos del blog en archivos con fecha (lib/study-blog-<...>.ts, ES y EN)
// - landings y comparativas en español y la guía de mejores IA (ES/EN)
// Compara el commit anterior y el nuevo de main y devuelve solo URLs nuevas o modificadas.
// IndexNow lo usan Bing y otros buscadores; Google usa su propio sitemap.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const ROOT = 'https://evaluoapp.com';
const MAX_URLS = 20;
const BEFORE = process.env.GITHUB_EVENT_BEFORE?.trim();
const AFTER = process.env.GITHUB_SHA?.trim();

// Archivos del blog que ya cubre study-blog-indexnow.yml o que no son artículos.
const BLOG_EXCLUDED = new Set([
  'lib/study-blog-articles.ts',
  'lib/study-blog-workshops-es.ts',
  'lib/study-blog-workshops-en.ts',
  'lib/study-blog-workshop-types.ts',
]);

// Rutas fijas: archivo (o carpeta terminada en /) → URLs públicas afectadas.
const STATIC_ROUTES = [
  ['app/(es)/es/page.tsx', ['/es']],
  ['app/(es)/es/como-funciona/', ['/es/como-funciona']],
  ['app/(es)/es/estudiar-pdf-con-ia/', ['/es/estudiar-pdf-con-ia']],
  ['app/(es)/es/resumenes-con-ia/', ['/es/resumenes-con-ia']],
  ['app/(es)/es/flashcards-con-ia/', ['/es/flashcards-con-ia']],
  ['app/(es)/es/generador-de-examenes-con-ia/', ['/es/generador-de-examenes-con-ia']],
  ['app/(es)/es/mejores-ia-para-estudiar/', ['/es/mejores-ia-para-estudiar']],
  ['app/(en)/en/best-ai-for-studying/', ['/en/best-ai-for-studying']],
  ['lib/best-ai-study-tools.ts', ['/es/mejores-ia-para-estudiar', '/en/best-ai-for-studying']],
  ['components/marketing/best-ai-study-page.tsx', ['/es/mejores-ia-para-estudiar', '/en/best-ai-for-studying']],
  ['app/(es)/comparar/page.tsx', ['/comparar']],
  ['app/(es)/comparar/evaluo-vs-notebooklm/', ['/comparar/evaluo-vs-notebooklm']],
  ['app/(es)/comparar/evaluo-vs-chatgpt/', ['/comparar/evaluo-vs-chatgpt']],
  ['app/(es)/comparar/evaluo-vs-quizlet/', ['/comparar/evaluo-vs-quizlet']],
  [
    'components/marketing/seo-comparison-landings.tsx',
    ['/comparar/evaluo-vs-notebooklm', '/comparar/evaluo-vs-chatgpt', '/comparar/evaluo-vs-quizlet'],
  ],
  ['app/(es)/es/guias/page.tsx', ['/es/guias']],
  ['app/(es)/es/paises/guatemala-pruebas-basicas-usac/', ['/es/paises/guatemala-pruebas-basicas-usac']],
];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function fileAt(sha, path) {
  try {
    return git(['show', `${sha}:${path}`]);
  } catch {
    return null; // el archivo no existía en ese commit
  }
}

// Devuelve Map<"locale:slug", cuerpo> con cada artículo/guía del archivo.
export function parseEntries(source, defaultLocale) {
  const entries = new Map();
  if (!source) return entries;
  const sections = source.split(/^export const /m);
  for (const section of sections) {
    const name = section.match(/^([A-Za-z0-9_]+)/)?.[1] ?? '';
    const locale = defaultLocale ?? (/(^|_)EN(_|$)/.test(name) ? 'en' : 'es');
    const matches = [...section.matchAll(/^\s*["']?slug["']?\s*:\s*["']([a-z0-9]+(?:-[a-z0-9]+)*)["']/gm)];
    for (let i = 0; i < matches.length; i++) {
      const end = i + 1 < matches.length ? matches[i + 1].index : section.length;
      entries.set(`${locale}:${matches[i][1]}`, section.slice(matches[i].index, end).trim());
    }
  }
  return entries;
}

export function changedEntries(beforeSource, afterSource, defaultLocale) {
  const before = parseEntries(beforeSource, defaultLocale);
  const after = parseEntries(afterSource, defaultLocale);
  return [...after].filter(([key, body]) => before.get(key) !== body).map(([key]) => key);
}

function blogUrl(key) {
  const [locale, slug] = key.split(':');
  return ROOT + (locale === 'en' ? '/en/blog/' : '/blog/') + slug;
}

function main() {
  assert.match(BEFORE ?? '', /^[a-f0-9]{40}$/i, 'Falta el SHA anterior.');
  assert.match(AFTER ?? '', /^[a-f0-9]{40}$/i, 'Falta el SHA nuevo.');
  const changed = git(['diff', '--name-only', BEFORE, AFTER]).split('\n').filter(Boolean);
  const urls = new Set();

  // Guías en español.
  const guidesFile = 'lib/es-study-guides.ts';
  if (changed.includes(guidesFile)) {
    const keys = changedEntries(fileAt(BEFORE, guidesFile), readFileSync(guidesFile, 'utf8'), 'es');
    for (const key of keys) urls.add(`${ROOT}/es/guias/${key.split(':')[1]}`);
    if (keys.length) urls.add(`${ROOT}/es/guias`);
  }

  // Artículos del blog en archivos con fecha o de expansión.
  for (const path of changed) {
    if (!/^lib\/study-blog-[a-z0-9-]+\.ts$/.test(path) || BLOG_EXCLUDED.has(path) || !existsSync(path)) continue;
    const defaultLocale = path.endsWith('-en.ts') ? 'en' : undefined;
    const keys = changedEntries(fileAt(BEFORE, path), readFileSync(path, 'utf8'), defaultLocale);
    for (const key of keys) {
      urls.add(blogUrl(key));
      urls.add(ROOT + (key.startsWith('en:') ? '/en/blog' : '/blog'));
    }
  }

  // Páginas fijas.
  for (const file of changed) {
    for (const [path, routes] of STATIC_ROUTES) {
      if (file === path || (path.endsWith('/') && file.startsWith(path))) {
        for (const route of routes) urls.add(ROOT + route);
      }
    }
  }

  const all = [...urls];
  const selected = all.slice(0, MAX_URLS);
  if (all.length > MAX_URLS) {
    console.log(`Hay ${all.length} URLs; se envían las primeras ${MAX_URLS}. Omitidas: ${all.slice(MAX_URLS).join(' ')}`);
  }
  const output = selected.join(' ');
  console.log(selected.length ? 'URLs SEO modificadas: ' + output : 'Sin cambios de contenido SEO cubierto.');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'urls=' + output + '\n');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) main();
