import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function assertIncludesAll(path: string, required: string[]) {
  const content = source(path);
  for (const token of required) {
    assert.ok(content.includes(token), `${path} must include ${token}`);
  }
}

assertIncludesAll('app/layout.tsx', [
  'metadataBase',
  'alternates',
  'openGraph',
  'twitter',
  'lang="es-AR"',
]);

assertIncludesAll('app/robots.ts', ['rules', 'sitemap']);
assertIncludesAll('app/sitemap.ts', [
  'hasAcademicContent',
  'lastModified',
  '/explorar/materia/',
  '/pregunteros/',
  '/resumenes/',
  '/landings/estudiar/',
]);

const indexableDynamicPages = [
  'app/explorar/materia/[id]/page.tsx',
  'app/pregunteros/[materia]/page.tsx',
  'app/landings/estudiar/[materia]/page.tsx',
];

for (const path of indexableDynamicPages) {
  assertIncludesAll(path, [
    'title:',
    'description',
    'alternates',
    'canonical',
    'robots',
    'openGraph',
  ]);
}

assertIncludesAll('app/explorar/materia/[id]/page.tsx', [
  'SeoBreadcrumbs',
  'buildBreadcrumbJsonLd',
  "twitter:",
]);

assertIncludesAll('app/landings/estudiar/[materia]/page.tsx', [
  'SeoBreadcrumbs',
  'buildBreadcrumbJsonLd',
  'getMateriaSeoContentSignals',
  'permanentRedirect',
  "twitter:",
  'contentSignals.questionCount',
  'contentSignals.summaryCount',
  'contentSignals.resourceCount',
]);

const studyLanding = source('app/landings/estudiar/[materia]/page.tsx');
assert.ok(
  studyLanding.includes('index: contentSignals.hasAcademicContent'),
  'study landing must stay noindex until it has academic content'
);
assert.ok(
  studyLanding.includes('const materiaSlug = buildSeoEntitySlug(materiaNombre, materia.id)'),
  'study landing must derive its canonical slug from the current entity name and id'
);

console.log('SEO smoke tests passed.');
