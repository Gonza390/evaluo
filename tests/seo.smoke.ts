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

assertIncludesAll('app/layout.tsx', ['metadataBase', 'openGraph', 'twitter', 'lang="es-AR"']);
assertIncludesAll('app/robots.ts', ['rules', 'sitemap']);
assertIncludesAll('app/sitemap.ts', [
  'hasAcademicContent',
  'lastModified',
  '/explorar/materia/${materiaSlug}',
  '/pregunteros/',
  '/resumenes/',
  '/landings/estudiar/',
  '/ia-para-estudiantes',
  '/estudiar-pdf-con-ia',
  '/funciones/resumir-pdf-con-ia',
  '/funciones/crear-flashcards-desde-pdf',
  '/funciones/crear-mapa-mental-desde-pdf',
]);

assertIncludesAll('app/explorar/materia/[id]/page.tsx', [
  'buildSeoEntitySlug',
  'parseSeoEntitySlug',
  'canonicalHref',
  'buildBreadcrumbJsonLd',
  'openGraph',
  'twitter',
  'contentSignals.hasAcademicContent',
  "resolvedSearchParams.tab?.trim().toLowerCase() === 'pregunteros'",
  'permanentRedirect(pregunteroHref)',
  'MateriaPracticeLinks',
]);

const materiaPage = source('app/explorar/materia/[id]/page.tsx');
assert.ok(
  !materiaPage.includes('SeoBreadcrumbs'),
  'materia page must not render the redundant visual SEO breadcrumb'
);

assertIncludesAll('app/materias/page.tsx', [
  'index: false',
  'follow: true',
  '/estudiar/${buildSeoEntitySlug',
]);

assertIncludesAll('app/pregunteros/page.tsx', [
  'Pregunteros Siglo 21: materias y parciales',
  'Pregunteros Siglo 21 por materia y parcial',
  'isSiglo21University',
]);

assertIncludesAll('app/pregunteros/[materia]/page.tsx', [
  'buildPregunteroSearchTitle',
  'Todos los pregunteros',
  "{ name: 'Pregunteros', path: '/pregunteros' }",
]);

assertIncludesAll('app/pregunteros/[materia]/parcial/[parcial]/page.tsx', [
  'buildPregunteroParcialSearchTitle',
  'pregunteroHref',
  'Practicar ahora',
]);

assertIncludesAll('app/estudiar/[universidad]/[carrera]/page.tsx', [
  'id="materias"',
  '/explorar/materia/${buildSeoEntitySlug(materia.nombre, materia.id)}',
]);

const simulatorCareerPage = source('app/simulador-parcial/[carrera]/page.tsx');
assert.ok(
  !simulatorCareerPage.includes('/materias?carreraId='),
  'simulator career SEO page must not link to parameterized career catalog URLs'
);
assert.ok(
  simulatorCareerPage.includes('/explorar/materia/${buildSeoEntitySlug(materia.nombre, materia.id)}'),
  'simulator career SEO page must link to canonical materia slugs'
);

const studyLandingPath = 'app/landings/estudiar/[materia]/page.tsx';
assertIncludesAll(studyLandingPath, [
  'buildSeoEntitySlug',
  'permanentRedirect',
  'SeoBreadcrumbs',
  'buildBreadcrumbJsonLd',
  'getMateriaSeoContentSignals',
  'contentSignals.questionCount',
  'contentSignals.hasSummaries',
  'index: contentSignals.hasAcademicContent',
  'twitter',
  'export function generateStaticParams()',
  'return [];',
]);

const studyLanding = source(studyLandingPath).toLowerCase();
for (const unsupportedClaim of [
  'parciales resueltos',
  'preguntas reales',
  'ejercicios resueltos',
]) {
  assert.ok(
    !studyLanding.includes(unsupportedClaim),
    `study landing must not claim ${unsupportedClaim}`
  );
}

const aiStudyPages = [
  ['app/ia-para-estudiantes/page.tsx', 'IaParaEstudiantesExperience'],
  ['app/estudiar-pdf-con-ia/page.tsx', 'EstudiarPdfExperience'],
  ['app/funciones/resumir-pdf-con-ia/page.tsx', 'ResumirPdfExperience'],
  ['app/funciones/crear-flashcards-desde-pdf/page.tsx', 'FlashcardsPdfExperience'],
] as const;

for (const [pagePath, experience] of aiStudyPages) {
  assertIncludesAll(pagePath, [
    experience,
    'toAbsoluteUrl(path)',
    'canonical: toAbsoluteUrl(path)',
    'index: true',
    'follow: true',
    'openGraph',
  ]);

  const pageSource = source(pagePath).toLowerCase();
  for (const unsupportedClaim of ['100% preciso', 'garantizado', 'preguntas reales', 'examen real']) {
    assert.ok(
      !pageSource.includes(unsupportedClaim),
      `${pagePath} must not claim ${unsupportedClaim}`
    );
  }
}

assertIncludesAll('components/marketing/seo-study-experiences.tsx', [
  'export function IaParaEstudiantesExperience()',
  'export function EstudiarPdfExperience()',
  'export function ResumirPdfExperience()',
  'export function FlashcardsPdfExperience()',
  '/funciones/crear-mapa-mental-desde-pdf',
  'Mapa mental',
  'PublicSiteHeader',
  'FooterHome',
  'buildBreadcrumbJsonLd',
  '<h1',
  '<details',
]);

const mindMapPagePath = 'app/funciones/crear-mapa-mental-desde-pdf/page.tsx';
assertIncludesAll(mindMapPagePath, [
  'toAbsoluteUrl(path)',
  'canonical: toAbsoluteUrl(path)',
  'index: true',
  'follow: true',
  'openGraph',
  'buildBreadcrumbJsonLd',
  'PublicSiteHeader',
  'FooterHome',
  '<h1',
  'mapa mental',
]);
const mindMapPageSource = source(mindMapPagePath).toLowerCase();
for (const unsupportedClaim of ['100% preciso', 'garantizado', 'preguntas reales', 'examen real']) {
  assert.ok(
    !mindMapPageSource.includes(unsupportedClaim),
    `${mindMapPagePath} must not claim ${unsupportedClaim}`
  );
}

assertIncludesAll('components/footer-home.tsx', [
  'href="/ia-para-estudiantes"',
  'href="/funciones/crear-mapa-mental-desde-pdf"',
  'mapas mentales',
]);

const packageJson = source('package.json');
assert.ok(packageJson.includes('"tw-animate-css"'), 'tw-animate-css must remain installed');

console.log('SEO smoke tests passed.');
