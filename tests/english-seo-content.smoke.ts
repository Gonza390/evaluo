import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ENGLISH_PAGES, ENGLISH_PAGE_ORDER, type EnglishPageKey } from '@/lib/english-seo-content';
import { ENGLISH_HUBS } from '@/lib/english-seo-hubs';
import { hreflangClusterForPath } from '@/lib/seo/hreflang-clusters';

// Guardas de calidad para las guías SEO en inglés (helpful content): metadatos únicos y
// con largo razonable, ejemplo resuelto, método, FAQ y nada de promesas no verificables.
const keys = Object.keys(ENGLISH_PAGES) as EnglishPageKey[];
const titles = new Set<string>();
const descriptions = new Set<string>();
const FORBIDDEN = [/guarantee/i, /100% accurate/i, /real exam questions/i, /leaked/i, /ace (your|the) exam/i, /best in the world/i];

assert.deepEqual([...ENGLISH_PAGE_ORDER].sort(), [...keys].sort(), 'Cada guía debe estar en ENGLISH_PAGE_ORDER');

for (const key of keys) {
  const page = ENGLISH_PAGES[key];
  assert.ok(page.title.length >= 30 && page.title.length <= 65, `${key}: title de 30-65 caracteres (${page.title.length})`);
  assert.ok(page.description.length >= 110 && page.description.length <= 165, `${key}: description de 110-165 caracteres (${page.description.length})`);
  assert.ok(!titles.has(page.title), `${key}: title duplicado`);
  assert.ok(!descriptions.has(page.description), `${key}: description duplicada`);
  titles.add(page.title);
  descriptions.add(page.description);

  assert.ok(page.exampleSource && page.exampleQuestion && page.exampleAnswer && page.verification, `${key}: ejemplo resuelto incompleto`);
  assert.ok(page.steps.length >= 4, `${key}: al menos 4 pasos de método`);
  assert.ok(page.mistakes.length >= 2, `${key}: al menos 2 errores comunes`);
  assert.ok(page.faq.length >= 3, `${key}: al menos 3 preguntas frecuentes`);

  const text = JSON.stringify(page);
  for (const pattern of FORBIDDEN) assert.ok(!pattern.test(text.replace(/not (official, )?leaked/gi, '')), `${key}: afirmación no verificable ${pattern}`);

  assert.ok(existsSync(new URL(`../app/(en)${page.path}/page.tsx`, import.meta.url)), `${key}: falta la página ${page.path}`);

  if (page.reviewed) {
    assert.match(page.reviewed, /^\d{4}-\d{2}-\d{2}$/, `${key}: reviewed debe ser ISO`);
    assert.ok(page.product, `${key}: las guías nuevas explican qué hace Evaluo`);
    assert.match(page.product!.plan, /Free|Premium/, `${key}: el bloque de producto debe aclarar el plan`);
    assert.ok(hreflangClusterForPath(page.path), `${key}: las guías nuevas deben tener pareja hreflang`);
  }
}

// La página de mapa mental debe decir que es Premium (no prometer una función gratis que no existe).
assert.match(JSON.stringify(ENGLISH_PAGES['pdf-to-mind-map']), /Premium feature/);

for (const hub of Object.values(ENGLISH_HUBS)) {
  assert.ok(hub.decisions.length >= 3, `${hub.path}: tabla de decisión`);
  assert.ok(hub.cards.length >= 3, `${hub.path}: enlaces internos`);
  for (const card of hub.cards) {
    assert.ok(existsSync(new URL(`../app/(en)${card.href}/page.tsx`, import.meta.url)), `${hub.path}: enlace roto ${card.href}`);
  }
  assert.ok(hreflangClusterForPath(hub.path), `${hub.path}: pareja hreflang`);
}

console.log('english-seo-content smoke ok');
