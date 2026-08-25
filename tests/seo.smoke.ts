import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const metadataRoutes = [
  'app/universidad/[id]/page.tsx',
  'app/explorar/materia/[id]/page.tsx',
  'app/landings/estudiar/[materia]/page.tsx',
  'app/pregunteros/[materia]/page.tsx',
  'app/pregunteros/[materia]/parcial/[parcial]/page.tsx',
  'app/resumenes/[materia]/page.tsx',
  'app/estudiar/[universidad]/[carrera]/page.tsx',
  'app/simulador-parcial/[carrera]/page.tsx',
];

for (const route of metadataRoutes) {
  const source = read(route);
  assert.match(source, /generateMetadata/, `${route} debe definir generateMetadata`);
  assert.match(source, /title\s*:/, `${route} debe definir title`);
  assert.match(source, /description\s*:/, `${route} debe definir description`);
  assert.match(source, /alternates\s*:/, `${route} debe definir alternates`);
  assert.match(source, /canonical\s*:/, `${route} debe definir canonical`);
  assert.match(source, /openGraph\s*:/, `${route} debe definir Open Graph`);
}

const h1Contracts = [
  'app/universidad/[id]/page.tsx',
  'app/explorar/materia/[id]/materia-content.tsx',
  'app/landings/estudiar/[materia]/page.tsx',
  'app/pregunteros/[materia]/page.tsx',
  'app/pregunteros/[materia]/parcial/[parcial]/page.tsx',
  'app/resumenes/[materia]/page.tsx',
  'app/estudiar/[universidad]/[carrera]/page.tsx',
  'app/simulador-parcial/[carrera]/page.tsx',
];

for (const route of h1Contracts) {
  const source = read(route);
  const h1Count = (source.match(/<h1\b/g) ?? []).length;
  assert.equal(h1Count, 1, `${route} debe contener exactamente un H1`);
}

const breadcrumbLayouts = [
  'app/universidad/[id]/layout.tsx',
  'app/explorar/materia/[id]/layout.tsx',
  'app/landings/estudiar/[materia]/layout.tsx',
  'app/resumenes/[materia]/layout.tsx',
  'app/estudiar/[universidad]/[carrera]/layout.tsx',
  'app/simulador-parcial/[carrera]/layout.tsx',
];

for (const route of breadcrumbLayouts) {
  const source = read(route);
  assert.match(source, /SeoBreadcrumbs/, `${route} debe renderizar breadcrumbs visibles`);
}

const pregunteroLayout = read('app/pregunteros/[materia]/layout.tsx');
assert.match(
  pregunteroLayout,
  /PregunteroVisibleBreadcrumbs/,
  'Pregunteros debe renderizar su breadcrumb visible'
);
const pregunteroBreadcrumbs = read('components/seo/PregunteroVisibleBreadcrumbs.tsx');
assert.match(
  pregunteroBreadcrumbs,
  /parcial\\\/(1\|2\|integrador)/,
  'El breadcrumb de pregunteros debe distinguir parciales e integrador'
);

const breadcrumbs = read('components/seo/SeoBreadcrumbs.tsx');
assert.match(breadcrumbs, /buildBreadcrumbJsonLd/, 'SeoBreadcrumbs debe emitir BreadcrumbList JSON-LD');
assert.match(breadcrumbs, /BreadcrumbPage/, 'SeoBreadcrumbs debe marcar la página actual');

const sitemap = read('app/sitemap.ts');
assert.match(
  sitemap,
  /resumenes'\)\.select\('materia_id, created_at'\)/,
  'El sitemap debe leer la fecha real de los resúmenes'
);
assert.match(
  sitemap,
  /recursos'\)\.select\('materia_id, creado_at'\)/,
  'El sitemap debe leer la fecha real de los recursos'
);
assert.match(sitemap, /parcialLastModified/, 'El sitemap debe calcular frescura por parcial');
assert.doesNotMatch(
  sitemap,
  /lastModified\s*:\s*new Date\(\)/,
  'El sitemap no debe inventar lastModified con la hora de ejecución'
);

const auditScript = read('scripts/check-public-seo.mjs');
for (const signal of ['<title>', 'meta description', 'canonical', 'noindex', 'H1', 'og:image']) {
  assert.ok(auditScript.includes(signal), `El auditor público debe comprobar ${signal}`);
}

console.log('SEO smoke tests: OK');
