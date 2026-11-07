import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getStudyGuide } from '@/lib/es-study-guides';
import {
  HREFLANG_CLUSTERS,
  hreflangAlternatePath,
  hreflangAlternates,
  hreflangClusterForPath,
  hreflangLanguages,
  hreflangSitemapEntries,
  type HreflangClusterId,
  type HreflangLocale,
} from '@/lib/seo/hreflang-clusters';

// Contrato de comportamiento del registro hreflang: reciprocidad, autorreferencia,
// x-default y URLs absolutas. Reemplaza las aserciones sobre strings literales.
const VALID_CODES = new Set(['es', 'es-AR', 'es-MX', 'es-CO', 'es-ES', 'en', 'x-default']);
const seenUrls = new Map<string, HreflangClusterId>();

for (const id of Object.keys(HREFLANG_CLUSTERS) as HreflangClusterId[]) {
  const cluster = HREFLANG_CLUSTERS[id] as Partial<Record<HreflangLocale, string>>;
  const languages = hreflangLanguages(id);

  assert.ok(cluster.es, `${id}: todo cluster necesita una versión "es"`);
  assert.ok(cluster.en, `${id}: todo cluster necesita una versión "en"`);
  assert.equal(languages['x-default'], languages.es, `${id}: x-default debe apuntar a la versión es`);

  for (const [code, url] of Object.entries(languages)) {
    assert.ok(VALID_CODES.has(code), `${id}: código hreflang inválido "${code}"`);
    assert.match(url, /^https:\/\//, `${id}: ${code} debe ser una URL absoluta`);
    assert.ok(!url.includes('?'), `${id}: ${code} no debe llevar parámetros`);
  }

  for (const [locale, path] of Object.entries(cluster) as Array<[HreflangLocale, string]>) {
    // Una URL pertenece a un único cluster.
    const owner = seenUrls.get(path);
    assert.ok(!owner || owner === id, `${path} figura en "${owner}" y en "${id}"`);
    seenUrls.set(path, id);

    // Canonical propio + autorreferencia + reciprocidad: todas las versiones
    // del cluster publican exactamente el mismo conjunto de alternates.
    const alternates = hreflangAlternates(id, locale);
    assert.equal(alternates.canonical, languages[locale], `${id}/${locale}: canonical debe ser la propia URL`);
    assert.ok(Object.values(alternates.languages).includes(alternates.canonical), `${id}/${locale}: falta autorreferencia`);
    assert.deepEqual(alternates.languages, languages, `${id}/${locale}: alternates no recíprocos`);
  }
}

// El sitemap emite cada URL de cada cluster una sola vez, con los mismos alternates que el <head>.
const entries = hreflangSitemapEntries();
const urls = entries.map((entry) => entry.url);
assert.equal(new Set(urls).size, urls.length, 'URLs duplicadas en las entradas hreflang del sitemap');
for (const entry of entries) {
  const id = seenUrls.get(new URL(entry.url).pathname);
  assert.ok(id, `${entry.url} no pertenece a ningún cluster`);
  assert.deepEqual(entry.alternates.languages, hreflangLanguages(id!));
}

// Pares críticos para las keywords objetivo.
assert.equal(HREFLANG_CLUSTERS.home.en, '/en');
assert.equal(HREFLANG_CLUSTERS.pricing.en, '/en/pricing');
assert.equal(HREFLANG_CLUSTERS['pdf-to-flashcards'].en, '/en/pdf-to-flashcards');

assert.equal(HREFLANG_CLUSTERS['mock-exam'].en, '/en/ai-test-prep');
// "estudiar con IA": guía ES neutra como `es`/x-default y la landing en voseo como `es-AR`.
assert.equal(hreflangLanguages('ai-for-students')['x-default'], hreflangLanguages('ai-for-students').es);
assert.match(hreflangLanguages('ai-for-students').es, /\/es\/guias\/como-estudiar-con-ia$/);
assert.match(hreflangLanguages('ai-for-students')['es-AR'], /\/ia-para-estudiantes$/);
for (const tool of ['notebooklm', 'chatgpt', 'quizlet'] as const) {
  assert.equal(hreflangAlternatePath(`/comparar/evaluo-vs-${tool}`, 'en'), `/en/compare/evaluo-vs-${tool}`);
  assert.equal(hreflangAlternatePath(`/en/compare/evaluo-vs-${tool}`, 'es'), `/comparar/evaluo-vs-${tool}`);
}
assert.equal(hreflangClusterForPath('/no-existe'), undefined);

// Toda URL registrada tiene su página en app/: un alternate hacia un 404 invalida el cluster.
const routeFile = (path: string) => {
  if (path === '/') return 'app/(es)/page.tsx';
  // Guías ES: ruta dinámica; el slug tiene que existir en STUDY_GUIDES.
  if (path.startsWith('/es/guias/')) {
    assert.ok(getStudyGuide(path.slice('/es/guias/'.length)), `Guía inexistente: ${path}`);
    return 'app/(es)/es/guias/[slug]/page.tsx';
  }
  if (path.startsWith('/en')) return `app/(en)${path}/page.tsx`;
  return `app/(es)${path}/page.tsx`;
};
for (const path of seenUrls.keys()) {
  assert.ok(existsSync(new URL(`../${routeFile(path)}`, import.meta.url)), `Falta la página de ${path}`);
}

// Consolidación de canibalización: la guía duplicada redirige (301) al artículo del blog.
const nextConfig = (await import('../next.config.mjs')).default;
const redirects = await nextConfig.redirects();
assert.ok(
  redirects.some((r: { source: string; destination: string; permanent: boolean }) =>
    r.source === '/es/guias/como-estudiar-examen-tipo-test' &&
    r.destination === '/blog/como-estudiar-examen-tipo-test' &&
    r.permanent),
  'La guía de examen tipo test debe redirigir con 301 al blog',
);

console.log('hreflang-clusters smoke ok');
