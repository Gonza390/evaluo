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
  'Evaluo | Estudiá tu PDF con IA y prepará tu examen',
  'openGraph',
  'twitter',
  'lang="es-AR"',
]);
assertIncludesAll('app/robots.ts', ['rules', 'sitemap']);
assert.ok(source('lighthouserc.cjs').includes('/uba-xxi/parciales'), 'UBA XXI landing must be covered by Lighthouse CI');
assert.ok(source('lib/analytics-client.ts').includes("seo-uba-xxi-parciales"), 'UBA XXI must have a dedicated analytics page type');
assert.ok(source('components/marketing/seo-study-experiences-v2.tsx').includes('href="/uba-xxi/parciales"'), 'UBA XXI needs contextual internal linking');
assertIncludesAll('app/como-estudiar-ingreso-unlam/page.tsx', [
  'Curso de Ingreso UNLaM 2027: materias y cómo estudiar',
  'canonical: toAbsoluteUrl(path)',
  "const modifiedAt = '2026-10-20';",
  'UnlamEditorialGuide',
]);
assertIncludesAll('components/marketing/unlam-editorial-guide.tsx', [
  'UnlamIngresoToolkit',
  '/estudiar-pdf-con-ia?source=ingreso-unlam-2027',
  'Revisado el 20 de octubre de 2026',
]);
assertIncludesAll('components/marketing/unlam-ingreso-toolkit.tsx', [
  'Profesorado en Educación Física',
  'Materias por carrera',
  'Educación Médica',
  'Introducción al conocimiento proyectual',
  'Matemática',
  'Filosofía',
  'https://www.unlam.edu.ar/curso-de-ingreso/',
]);
assertIncludesAll('components/marketing/unlam-ingreso-practice.tsx', [
  'seo_unlam_practice_started',
  'seo_unlam_practice_answered',
  'seo_unlam_practice_completed',
  'El resultado es orientativo',
  'Practicar con mi manual PDF',
]);
assertIncludesAll('lib/analytics-events.ts', [
  'seo_unlam_practice_started',
  'seo_unlam_practice_answered',
  'seo_unlam_practice_completed',
]);
assert.ok(source('app/sitemap.ts').includes("new Date('2026-10-20')"), 'Updated UNLaM guide must have recent sitemap modification date');
assertIncludesAll('app/uba-xxi/parciales/page.tsx', [
  'linear-gradient(145deg,#0D2F82_0%,#174BBD_52%,#2563EB_100%)',
  'Parciales UBA XXI: exámenes anteriores y práctica',
  'canonical: toAbsoluteUrl(PATH)',
  'index: true',
  'follow: true',
  'https://ubaparciales.com/materias/ipc/buacar/primer-parcial/1c-2025/tema-3',
  'https://ubaparciales.com/materias/ipc/buacar/primer-parcial/1c-2026/tema-1',
  'https://ubaparciales.com/materias/icse/pedrosa/primer-parcial/1c-2025/tema-1',
  'UbaXxiParcialesPractice',
  '/estudiar-pdf-con-ia?source=seo-uba-xxi-parciales',
]);
const ubaXxiPage = source('app/uba-xxi/parciales/page.tsx');
assert.ok(
  ubaXxiPage.indexOf('<section id="practica"') < ubaXxiPage.indexOf('<section aria-labelledby="anteriores"'),
  'UBA XXI practice must appear before external exam archives',
);
assert.ok(
  ubaXxiPage.indexOf("title: 'IPC · primer parcial 2026'") < ubaXxiPage.indexOf("title: 'IPC · primer parcial 2025'"),
  'UBA XXI must feature the verified 2026 IPC exam first',
);
assertIncludesAll('components/marketing/uba-xxi-parciales-practice.tsx', [
  'topicsToReview',
  'Reforzar con mis apuntes PDF',
  'Seguir practicando con mi PDF',
  'seo_uba_xxi_practice_started',
  'seo_uba_xxi_practice_answered',
  'seo_uba_xxi_practice_completed',
  'Revisá la respuesta',
  'Respuesta correcta:',
]);
assertIncludesAll('lib/analytics-events.ts', [
  'seo_uba_xxi_practice_started',
  'seo_uba_xxi_practice_answered',
  'seo_uba_xxi_practice_completed',
]);
assert.ok(source('app/sitemap.ts').includes('/uba-xxi/parciales'), 'UBA XXI must be in sitemap');
assert.ok(source('components/footer-home.tsx').includes('href="/uba-xxi/parciales"'), 'UBA XXI must have a crawlable internal link');
assertIncludesAll('app/sitemap.ts', [
  'hasAcademicContent',
  'hasSubstantialStudyLandingContent',
  'hasIndexableStudyLandingContent',
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
  'PregunteroPracticeHero',
  'simuladorHref={simuladorHref}',
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

assertIncludesAll('app/landings/resumenes/page.tsx', [
  'loadSummaryCatalog',
  'fetchQuestionRows',
  '.range(from, from + pageSize - 1)',
  'ItemList',
  'Materias con resúmenes disponibles',
]);

const studyLandingPath = 'app/landings/estudiar/[materia]/page.tsx';
assertIncludesAll(studyLandingPath, [
  'buildSeoEntitySlug',
  'permanentRedirect',
  'SeoBreadcrumbs',
  'buildBreadcrumbJsonLd',
  'getMateriaSeoContentSignals',
  'loadStudyLandingData',
  'data.questionCount',
  'data.hasSummaries',
  'sampleQuestions',
  'Preguntas de muestra de',
  'hasSubstantialStudyLandingContent',
  'index: hasSubstantialStudyLandingContent(signals)',
  'twitter',
  'export function generateStaticParams()',
  'return [];',
]);

const studyLanding = source(studyLandingPath).toLowerCase();
assert.ok(!studyLanding.includes('buildcoursejsonld'), 'study landing must not use Course schema');
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
    'seo-study-experiences-v2',
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

assertIncludesAll('components/marketing/seo-study-experiences-v2.tsx', [
  'export function IaParaEstudiantesExperience()',
  'export function EstudiarPdfExperience()',
  'export function ResumirPdfExperience()',
  'export function FlashcardsPdfExperience()',
  'IA para estudiantes universitarios:',
  'Cómo usar IA para preparar un parcial o final',
  'estudiantes universitarios',
  'app o página para estudiar con IA',
  'Estudiá un PDF con IA:',
  'Resumí un PDF con IA',
  'Creá flashcards con IA',
  '/demo/material-estudio',
  '/ia-para-estudiantes',
  '/estudiar-pdf-con-ia',
  '/funciones/resumir-pdf-con-ia',
  '/funciones/crear-flashcards-desde-pdf',
  'PublicSiteHeader',
  'FooterHome',
  'buildBreadcrumbJsonLd',
  '<h1',
  '<details',
]);

const optimizedAiStudySource = source('components/marketing/seo-study-experiences-v2.tsx').toLowerCase();
assert.ok(
  !optimizedAiStudySource.includes('ver página'),
  'optimized AI study links must use descriptive visible anchor copy instead of generic Ver página'
);
assert.ok(
  !optimizedAiStudySource.includes('faqpage'),
  'AI study pages should keep useful visible FAQs without adding FAQ rich-result schema'
);
for (const unsupportedClaim of ['100% preciso', 'garantizado', 'preguntas reales', 'examen real']) {
  assert.ok(
    !optimizedAiStudySource.includes(unsupportedClaim),
    `optimized AI study experiences must not claim ${unsupportedClaim}`
  );
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
  'href="/estudiar-pdf-con-ia"',
  'href="/funciones/resumir-pdf-con-ia"',
  'href="/funciones/crear-flashcards-desde-pdf"',
  'href="/funciones/crear-mapa-mental-desde-pdf"',
  'mapas mentales',
]);

assertIncludesAll('app/estudiar/[universidad]/[carrera]/page.tsx', [
  'officialProfile.officialUrl',
  'officialProfile.sourceName',
  'información oficial de la carrera',
]);

for (const path of [
  'app/demo/layout.tsx',
  'app/pricing/resultado/layout.tsx',
  'app/premium/mapa-mental/layout.tsx',
  'app/empezar/layout.tsx',
]) {
  assertIncludesAll(path, ['index: false', 'follow: true']);
}

assertIncludesAll('vercel.json', [
  '"www.evaluo.com.ar"',
  '"https://evaluo.com.ar/:path*"',
  '"permanent": true',
]);

const homeHeroSource = source('components/marketing/home-hero-v2.tsx');
assert.ok(
  !homeHeroSource.includes('animate-surface-reveal flex min-w-0 flex-col items-start text-left'),
  'critical home hero copy must render without the reveal animation'
);

const packageJson = source('package.json');
assert.ok(packageJson.includes('"tw-animate-css"'), 'tw-animate-css must remain installed');

console.log('SEO smoke tests passed.');
/* Expansión internacional: rutas estáticas, hreflang, contenidos y PDF-first. */
for (const market of ['es', 'es-mx', 'es-co', 'es-es']) {
  assertIncludesAll(`app/${market}/estudiar-pdf-con-ia/page.tsx`, [
    'InternationalStudyLanding',
    'getStudyLandingMetadata',
  ]);
  assert.ok(
    source('app/sitemap.ts').includes(`/${market}/estudiar-pdf-con-ia`),
    `International market ${market} needs an indexable sitemap URL`,
  );
}
assertIncludesAll('lib/international-study-landings.ts', [
  "es: toAbsoluteUrl(STUDY_MARKETS.es.path)",
  "'es-MX':",
  "'es-CO':",
  "'es-ES':",
  "'es-AR':",
  "'x-default':",
  'canonical: url',
  'robots: { index: true, follow: true }',
  'guía de estudio',
  'parciales',
  'tipo test',
]);
assertIncludesAll('app/estudiar-pdf-con-ia/page.tsx', [
  'languages: STUDY_HREFLANG',
]);
assertIncludesAll('components/marketing/international-study-landing.tsx', [
  'PdfFirstLandingUploader',
  'market={market}',
  'locale="neutral"',
  'id="seleccionar-pdf"',
  'STUDY_MARKET_ORDER',
]);
assertIncludesAll('components/marketing/pdf-first-landing-uploader.tsx', [
  "locale?: 'neutral'",
  'market?: string',
  'market,',
  'isInternational',
]);


/* Validación de contenido útil, enlazado e indexación de mercados internacionales. */
assertIncludesAll('lib/regional-study-guides.ts', [
  'REGIONAL_STUDY_GUIDES',
  'es-mx',
  'es-co',
  'es-es',
  'guideTitle',
  'selfCheckQuestions',
  'guía de estudio',
  'parcial',
  'temario',
]);
assertIncludesAll('components/marketing/international-study-landing.tsx', [
  'REGIONAL_STUDY_GUIDES[market]',
  'guide.guideTitle',
  'guide.steps.map(',
  'guide.mistakes.map(',
  'guide.selfCheckQuestions.map(',
  'copy.exampleOptions.map(',
  'Intenta responder y descubre la explicación',
  'buildBreadcrumbJsonLd',
  'InternationalDocumentLanguage',
  '/funciones/resumir-pdf-con-ia',
  '/funciones/crear-flashcards-desde-pdf',
  '/funciones/crear-mapa-mental-desde-pdf',
]);
assertIncludesAll('components/marketing/seo-study-experiences-v2.tsx', [
  '/es-mx/estudiar-pdf-con-ia',
  '/es-co/estudiar-pdf-con-ia',
  '/es-es/estudiar-pdf-con-ia',
  '/es/estudiar-pdf-con-ia',
]);
assertIncludesAll('components/footer-home.tsx', [
  'href="/es/estudiar-pdf-con-ia"',
]);
assertIncludesAll('lib/analytics-client.ts', [
  "return 'seo-international-study-pdf';",
]);
assertIncludesAll('lighthouserc.cjs', [
  '/es-es/estudiar-pdf-con-ia',
]);
