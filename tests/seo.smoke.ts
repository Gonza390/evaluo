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
  'lang="es"',
]);
assertIncludesAll('app/robots.ts', ['rules', 'sitemap']);

for (const [page, experience] of [
  ['app/comparar/evaluo-vs-notebooklm/page.tsx', 'EvaluoVsNotebooklmPage'],
  ['app/comparar/evaluo-vs-chatgpt/page.tsx', 'EvaluoVsChatgptPage'],
  ['app/comparar/evaluo-vs-quizlet/page.tsx', 'EvaluoVsQuizletPage'],
] as const) {
  assertIncludesAll(page, [
    experience,
    'SeoComparisonLanding',
    'canonical: toAbsoluteUrl(path)',
    'index: true',
    'follow: true',
    'openGraph',
  ]);
}
assertIncludesAll('components/marketing/seo-comparison-landings.tsx', [
  'notebooklm:',
  'chatgpt:',
  'quizlet:',
  'NotebookLM también tiene cuestionarios',
  'ChatGPT tiene Modo de estudio',
  'Quizlet no es solo un creador manual',
  'PdfFirstLandingUploader',
  'buildBreadcrumbJsonLd',
  'MarketingAnalyticsSlot',
  'FooterHome',
  'href={uploaderAnchor}',
  '/comparar/evaluo-vs-notebooklm',
  '/comparar/evaluo-vs-chatgpt',
  '/comparar/evaluo-vs-quizlet',
  '/funciones/practicar-por-tema',
]);
assertIncludesAll('app/sitemap.ts', [
  '/comparar/evaluo-vs-notebooklm',
  '/comparar/evaluo-vs-chatgpt',
  '/comparar/evaluo-vs-quizlet',
]);
assertIncludesAll('components/footer-home.tsx', [
  'href="/comparar/evaluo-vs-notebooklm"',
  'href="/comparar/evaluo-vs-chatgpt"',
  'href="/comparar/evaluo-vs-quizlet"',
]);
assertIncludesAll('lib/analytics-client.ts', [
  "return 'seo-comparison';",
]);


assertIncludesAll('app/sitemap.ts', [
  '/convertir-pdf-en-preguntas',
  '/funciones/simulacro-examen-con-ia',
  '/funciones/practicar-por-tema',
]);
assertIncludesAll('app/convertir-pdf-en-preguntas/page.tsx', [
  'PdfPracticePage',
  'Generar preguntas a partir de PDF con IA',
  'canonical:toAbsoluteUrl(path)',
]);
for (const [pagePath, experience] of [
  ['app/funciones/simulacro-examen-con-ia/page.tsx', 'SimulacroExamenIaLanding'],
  ['app/funciones/practicar-por-tema/page.tsx', 'PracticarPorTemaLanding'],
] as const) {
  assertIncludesAll(pagePath, [
    experience,
    'canonical: toAbsoluteUrl(path)',
    'index: true',
    'follow: true',
    'openGraph',
  ]);
}
assertIncludesAll('components/marketing/seo-practice-tools-landings.tsx', [
  'SimulacroExamenIaLanding',
  'PracticarPorTemaLanding',
  'PdfFirstLandingUploader',
  'buildBreadcrumbJsonLd',
  'TrackedLink',
  'FooterHome',
  '/convertir-pdf-en-preguntas',
  '/funciones/simulacro-examen-con-ia',
  '/funciones/practicar-por-tema',
  'Ejemplo educativo',
]);
assertIncludesAll('components/marketing/editorial-study-pages.tsx', [
  'QuestionsCta',
  'id="elegir-pdf-preguntas"',
  'Generar preguntas a partir de PDF con IA',
  'href="/funciones/simulacro-examen-con-ia"',
  'href="/funciones/practicar-por-tema"',
]);
assertIncludesAll('components/footer-home.tsx', [
  'href="/convertir-pdf-en-preguntas"',
  'href="/funciones/simulacro-examen-con-ia"',
  'href="/funciones/practicar-por-tema"',
]);
assertIncludesAll('lib/analytics-client.ts', [
  "return 'seo-pdf-questions';",
  "return 'seo-mock-exam';",
  "return 'seo-topic-practice';",
]);

assert.ok(source('lighthouserc.cjs').includes('/uba-xxi/parciales'), 'UBA XXI landing must be covered by Lighthouse CI');
assert.ok(source('lib/analytics-client.ts').includes("seo-uba-xxi-parciales"), 'UBA XXI must have a dedicated analytics page type');
assert.ok(source('components/marketing/seo-study-experiences-v2.tsx').includes('href="/uba-xxi/parciales"'), 'UBA XXI needs contextual internal linking');
assertIncludesAll('app/como-estudiar-ingreso-unlam/page.tsx', [
  'Curso de Ingreso UNLaM 2027: materias y cómo estudiar',
  'canonical: toAbsoluteUrl(path)',
  "const modifiedAt = '2026-10-29';",
  'UnlamEditorialGuide',
]);
assertIncludesAll('components/marketing/unlam-editorial-guide.tsx', [
  'UnlamIngresoToolkit',
  '/estudiar-pdf-con-ia?source=ingreso-unlam-2027',
  'Revisado el 29 de octubre de 2026',
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
assert.ok(source('app/sitemap.ts').includes("new Date('2026-10-29')"), 'Updated UNLaM guide must have recent sitemap modification date');
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
  'Creá flashcards a partir de un PDF',
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

// The public old-domain URLs move in one hop; keep API webhooks, cron callbacks
// and legacy OAuth callbacks on their original host during the transition.
const domainMigrationRedirects = JSON.parse(source('vercel.json')).redirects as Array<{
  source: string;
  destination: string;
  statusCode?: number;
  has?: Array<{ type: string; value: string }>;
}>;
for (const hostname of ['evaluo.com.ar', 'www.evaluo.com.ar']) {
  const rule = domainMigrationRedirects.find((redirect) =>
    redirect.has?.some((condition) => condition.type === 'host' && condition.value === hostname)
  );
  assert.ok(rule, `Missing old-domain redirect for ${hostname}`);
  assert.equal(rule.destination, 'https://evaluoapp.com/:path');
  assert.equal(rule.statusCode, 301);
  assert.equal(rule.source, '/:path((?!api/|api$|auth/callback|_next/|_next$|_vercel/|_vercel$|\\.well-known/).*)');
}
const publicDomainRedirectPath = /^\/(?!api\/|api$|auth\/callback|_next\/|_next$|_vercel\/|_vercel$|\.well-known\/).*$/;
for (const path of ['/', '/estudiar-pdf-con-ia', '/es-mx/estudiar-pdf-con-ia']) {
  assert.ok(publicDomainRedirectPath.test(path), `Public path must redirect: ${path}`);
}
for (const path of ['/api', '/api/internal/exam-reminders', '/api/webhooks/mercadopago', '/auth/callback', '/_next/static/chunk.js', '/_vercel/insights', '/.well-known/security.txt']) {
  assert.ok(!publicDomainRedirectPath.test(path), `Sensitive path must not redirect: ${path}`);
}
assertIncludesAll('lib/site.ts', [`'https://evaluoapp.com'`]);
for (const path of [
  'lib/email/evaluo-email.ts',
  'lib/email/study-return-d1.ts',
  'lib/email/study-return-48h.ts',
  'lib/email/student-material-ready.ts',
  'lib/email/reactivation-next-subject.ts',
]) {
  assert.ok(!source(path).includes('https://evaluo.com.ar/evaluo-logo-landing-email.png'), `${path} must resolve its email image from SITE_URL`);
}

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
  'InternationalPracticePreview',
  'REGIONAL_STUDY_GUIDES[market]',
  'guide.guideTitle',
  'guide.steps.map(',
  'guide.mistakes.map(',
  'guide.selfCheckQuestions.map(',
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

/* El ejemplo interactivo jamás debe registrarse como práctica real con PDF. */
assertIncludesAll('components/marketing/international-practice-preview.tsx', [
  'demo_only: true',
  'international_study_demo_answer_revealed',
  'international_study_demo_progress_viewed',
  'Corregir mi respuesta',
  'Probar ejercicios con un PDF de muestra',
  'tour=0&start=ejercicios',
]);
assertIncludesAll('app/demo/material-estudio/page.tsx', [
  'internationalSource',
  'initialTab',
  'uploadHref',
  'start === \'ejercicios\'',
]);
assertIncludesAll('components/demo-four-step-study.tsx', [
  'international_study_demo_pdf_answered',
  'international_study_demo_pdf_progress_viewed',
  'demo_only: true',
]);
assertIncludesAll('lib/analytics-events.ts', [
  "'international_study_demo_answer_revealed'",
  "'international_study_demo_progress_viewed'",
  "'international_study_demo_pdf_answered'",
  "'international_study_demo_pdf_progress_viewed'",
]);
assertIncludesAll('lib/attribution.ts', [
  'landing_market',
  'latest_landing_market',
  'if (!hasAttribution && !landingMarket) return;',
]);

assertIncludesAll('lib/analytics-metadata.ts', [
  'international_study_demo_answer_revealed:',
  'international_study_demo_progress_viewed:',
  'international_study_demo_pdf_answered:',
  'international_study_demo_pdf_progress_viewed:',
  "'landing_market'",
  "'latest_landing_market'",
  "pdf_first_landing_viewed:",
]);


/* Acquisition SEO: transparent demos, contextual internal links and audit coverage. */
const studySeoSource = source('components/marketing/seo-study-experiences-v2.tsx');
for (const link of [
  '/convertir-pdf-en-preguntas',
  '/funciones/simulacro-examen-con-ia',
  '/funciones/practicar-por-tema',
]) {
  assert.ok(studySeoSource.includes("href: '" + link + "'"), 'Study pages must link contextually to ' + link);
}
assert.ok(
  (studySeoSource.match(/<RelatedSection/g) ?? []).length === 4,
  'Keep contextual related links on the four main study landings',
);
assertIncludesAll('components/marketing/seo-comparison-landings.tsx', [
  'SeoComparisonProductDemo',
  '<SeoComparisonProductDemo comparison={comparison} />',
  'Cómo preparar una materia: orientación y prueba de producto',
  'IA y nuevas tecnologías',
]);
assertIncludesAll('components/marketing/seo-comparison-product-demo.tsx', [
  "import demoArtifacts from '@/public/material-general-prueba.study.json'",
  'demoArtifacts.summary.sections',
  'demoArtifacts.glossary',
  'Probar los ejercicios reales de la demo',
  'start=ejercicios',
  'tour=0',
  'no modifican tu historial académico',
  'material-general-prueba.study.json',
]);
assertIncludesAll('app/demo/material-estudio/page.tsx', [
  "import demoArtifacts from '@/public/material-general-prueba.study.json'",
  'DemoFourStepStudy',
  "start === 'ejercicios'",
]);
const seoLandingLighthouseConfig = source('lighthouserc.seo.cjs');
for (const route of [
  '/ia-para-estudiantes',
  '/estudiar-pdf-con-ia',
  '/funciones/resumir-pdf-con-ia',
  '/funciones/crear-flashcards-desde-pdf',
  '/funciones/crear-mapa-mental-desde-pdf',
  '/convertir-pdf-en-preguntas',
  '/funciones/simulacro-examen-con-ia',
  '/funciones/practicar-por-tema',
  '/comparar/evaluo-vs-notebooklm',
  '/comparar/evaluo-vs-chatgpt',
  '/comparar/evaluo-vs-quizlet',
]) {
  assert.ok(seoLandingLighthouseConfig.includes('http://localhost:3000' + route + "'"), 'Dedicated Lighthouse must audit ' + route);
}
assertIncludesAll('lighthouserc.seo.cjs', [
  "'categories:seo': ['error', { minScore: 0.9 }]",
  'numberOfRuns: 1',
]);
assertIncludesAll('.github/workflows/ci.yml', [
  'seo-lighthouse:',
  'lighthouserc.seo.cjs',
  'SEO_LIGHTHOUSE_RESULT',
  'seo-acquisition-lighthouse-reports',
]);
assertIncludesAll('app/robots.ts', ["'/dashboard'", "'/login'", "'/administrador'"]);
assertIncludesAll('app/demo/material-estudio/page.tsx', ['index: false', 'follow: false']);


/* Keyword intent: one dominant intent per landing, no duplicated site name in SEO titles. */
const acquisitionSeoTitles: Array<[string, string]> = [
  ['app/ia-para-estudiantes/page.tsx', 'IA para estudiantes: estudiá apuntes y practicá'],
  ['app/estudiar-pdf-con-ia/page.tsx', 'Estudiar PDF con IA: resumen y práctica por tema'],
  ['app/funciones/resumir-pdf-con-ia/page.tsx', 'Resumir PDF con IA: resumen útil para estudiar'],
  ['app/funciones/crear-flashcards-desde-pdf/page.tsx', 'Crear flashcards a partir de PDF con IA'],
  ['app/funciones/crear-mapa-mental-desde-pdf/page.tsx', 'Crear mapa mental desde PDF con IA'],
  ['app/convertir-pdf-en-preguntas/page.tsx', 'Generar preguntas a partir de PDF con IA'],
  ['app/funciones/simulacro-examen-con-ia/page.tsx', 'Simulacro de examen con IA desde tus apuntes'],
  ['app/funciones/practicar-por-tema/page.tsx', 'Practicar por tema con IA: preguntas desde PDF'],
  ['app/comparar/evaluo-vs-notebooklm/page.tsx', 'Alternativa a NotebookLM para estudiar PDF'],
  ['app/comparar/evaluo-vs-chatgpt/page.tsx', 'Alternativa a ChatGPT para estudiar PDF y practicar'],
  ['app/comparar/evaluo-vs-quizlet/page.tsx', 'Alternativa a Quizlet: flashcards y exámenes desde PDF'],
];
assert.equal(new Set(acquisitionSeoTitles.map(([, title]) => title.toLowerCase())).size, acquisitionSeoTitles.length, 'Each acquisition page needs its own distinct title');
for (const [path, expectedTitle] of acquisitionSeoTitles) {
  const content = source(path);
  const head = content.slice(content.indexOf('export const metadata'), content.indexOf('openGraph:'));
  assert.ok(head.includes(expectedTitle), path + ' needs the intended keyword in the primary title');
  assert.ok(!/title:\s*['"][^'"\n]*\|\s*Evaluo/.test(head), path + ' must not duplicate the root title suffix');
  assert.ok(/canonical:\s*toAbsoluteUrl\(path\)/.test(content), path + ' must preserve its canonical');
  assert.ok(/index:\s*true/.test(content), path + ' must remain indexable');
  assert.ok(!content.includes('| Evaluo | Evaluo'), path + ' must have no duplicate brand in social metadata');
}
assertIncludesAll('components/marketing/seo-study-experiences-v2.tsx', [
  'Si buscás una IA para resumir PDF',
  'Creá flashcards a partir de un PDF',
  'Para estudiar un PDF con IA',
]);
assertIncludesAll('components/marketing/seo-practice-tools-landings.tsx', [
  'simulacro de examen con IA a partir de tus apuntes PDF',
  'practicar preguntas de un tema con IA',
]);
assertIncludesAll('components/marketing/seo-comparison-landings.tsx', [
  'Si buscás una alternativa a NotebookLM',
  'Si buscás una alternativa a ChatGPT',
  'Si buscás una alternativa a Quizlet',
]);

// Argentina acquisition: curated crawlable subject links and a secondary path
// from pregunteros to the PDF-first study flow without changing canonical URLs.
assertIncludesAll('app/pregunteros/page.tsx', [
  'FEATURED_SIGLO21_MATERIA_IDS',
  'featuredMateriaPriority(a.materiaId)',
  'Pregunteros Siglo 21 por materia y parcial',
  '/estudiar-pdf-con-ia?source=pregunteros-siglo21',
  "location: 'pregunteros_hub_after_catalog'",
  'Los ejercicios son para practicar: no son exámenes oficiales',
  'TrackedLink',
]);
assertIncludesAll('app/pregunteros/[materia]/page.tsx', [
  'PregunteroPracticeHero',
  'href={`/estudiar-pdf-con-ia?source=preguntero-materia&materiaId=${encodeURIComponent(data.materiaId)}`}',
  "location: 'preguntero_materia_after_questions'",
  "materia_id: data.materiaId",
  'Estudiar con mi PDF',
]);
assertIncludesAll('components/marketing/pdf-first-landing-uploader.tsx', [
  "normalizeSource(params.get('source') ?? sourceKey ?? params.get('utm_source'))",
  "const requestedMateriaId = new URLSearchParams(window.location.search).get('materiaId');",
  "if (isUuid(requestedMateriaId)) nextParams.set('materiaId', requestedMateriaId!);",
  "const nextPath = `/dashboard?${nextParams.toString()}`;",
  'savePdfFirstDraft(file, source)',
  "'pdf_selected'",
  "'create_material_clicked'",
]);
assertIncludesAll('components/simulador/SimulatorFinishedResult.tsx', [
  'simulator_result_primary_pdf_activation',
  'simulator_result_pdf_activation',
  'Subir mis apuntes',
]);

// Regional optimization regression: substantial worked examples, distinct markets,
// preserved canonical/hreflang, and current university calendar information.
assertIncludesAll('lib/regional-study-guides.ts', [
  'appliedExample:',
  'Ejemplo guiado: estudiar un capítulo de biología en PDF',
  'Ejemplo de guía de estudio con IA para un examen de administración',
  'Ejemplo: simulacro de parcial de economía con tus apuntes',
  'Ejemplo de test de práctica desde un temario universitario',
  'result:',
]);
assertIncludesAll('components/marketing/international-study-landing.tsx', [
  'guide.appliedExample.title',
  'guide.appliedExample.context',
  'guide.appliedExample.tasks.map',
  'guide.appliedExample.result',
  'seleccionar_pdf_desde_ejemplo',
  'href="#seleccionar-pdf"',
]);
assertIncludesAll('components/marketing/unlam-editorial-guide.tsx', [
  'Inscripción a la segunda instancia 2027: plazo finalizado',
  '26 de octubre de 2026',
  '1 de febrero al 6 de marzo de 2027',
  'Sistema de Ingresantes',
]);
assertIncludesAll('app/uba-xxi/parciales/page.tsx', [
  'id="uba-xxi-calendario"',
  '11 de noviembre',
  'La inscripción al segundo parcial fue del 5 al 6 de octubre',
  'OFFICIAL_CALENDAR',
]);

// SEO study-guide editorial cluster: one language hub, eight substantial
// published articles, no synthetic English variants until they are localized.
assertIncludesAll('app/es/guias/page.tsx', [
  'export const metadata',
]);
assertIncludesAll('app/es/guias/page.tsx', [
  "const path = '/es/guias'",
  'STUDY_GUIDES.filter(',
  'buildBreadcrumbJsonLd',
  'Estudiar mis apuntes en PDF',
  "'guia-hub'",
  'guide.slug',
  'FooterHome',
]);
assertIncludesAll('app/es/guias/[slug]/page.tsx', [
  'export const dynamicParams = false;',
  'generateStaticParams()',
  'generateMetadata',
  "getStudyGuide(slug)",
  'alternates: { canonical: toAbsoluteUrl(path) }',
  'buildBreadcrumbJsonLd',
  "'@type': 'Article'",
  'guide.steps.map',
  'guide.pitfalls.map',
  'guide.faq.map',
  "location: 'es_study_guide_after_article'",
  'guide_slug: guide.slug',
  'FooterHome',
]);
assertIncludesAll('app/sitemap.ts', [
  '`${baseUrl}/es/guias`',
  '`${baseUrl}/es/guias/${guide.slug}`',
  'STUDY_GUIDES',
]);
assertIncludesAll('components/footer-home.tsx', ['href="/es/guias"']);
assertIncludesAll('components/marketing/international-study-landing.tsx', [
  "market === 'es'",
  'href="/es/guias"',
]);
assertIncludesAll('lib/analytics-client.ts', ["return 'seo-study-guides';"]);

const guideSource = source('lib/es-study-guides.ts');
const guideJson = guideSource.match(/export const STUDY_GUIDES: StudyGuide\[\] = (\[[\s\S]*?\]);\n\nexport function/);
assert.ok(guideJson, 'Study guides must be a data-backed editorial list');
const guideRows = JSON.parse(guideJson![1]) as Array<{
  slug: string;
  opening: string;
  focus: string;
  steps: Array<{ title: string; detail: string }>;
  exampleTasks: string[];
  pitfalls: Array<{ title: string; detail: string }>;
  faq: Array<{ q: string; a: string }>;
  category: string;
  review: string;
}>;
assert.equal(guideRows.length, 8, 'Publish exactly eight original guides');
assert.equal(new Set(guideRows.map((guide) => guide.slug)).size, 8, 'SEO slugs must be unique');
for (const guide of guideRows) {
  const prose = [
    guide.opening, guide.focus, guide.review,
    ...guide.steps.map((step) => step.detail),
    ...guide.pitfalls.map((pitfall) => pitfall.detail),
    ...guide.faq.map((item) => item.a),
  ].join(' ');
  assert.ok(prose.split(/\s+/).length >= 260, guide.slug + ' needs substantive information');
  assert.ok(guide.steps.length >= 4, guide.slug + ' needs practical instructions');
  assert.ok(guide.exampleTasks.length >= 3, guide.slug + ' needs a worked example');
  assert.ok(guide.pitfalls.length >= 3, guide.slug + ' needs pitfalls');
  assert.ok(guide.faq.length >= 2, guide.slug + ' needs user questions');
  assert.ok(!guide.slug.startsWith('en-'), 'Do not auto-publish English-language variants');
}

// Hispanic-market expansion: do not weaken Argentina, rewrite established
// international URLs, or generate 20 thin same-language country clones.
assertIncludesAll('app/es/paises/page.tsx', [
  "const path = '/es/paises'",
  'buildBreadcrumbJsonLd',
  'COUNTRY_NICHE_GUIDES',
  'SPANISH_MARKETS',
  'rest.map(',
  'Ver recursos generales',
  'href="/es/estudiar-pdf-con-ia?source=es-paises"',
]);
assertIncludesAll('app/es/paises/[slug]/page.tsx', [
  'export const dynamicParams = false;',
  'generateStaticParams()',
  'generateMetadata',
  'getCountryNicheGuide(slug)',
  'alternates: {canonical:toAbsoluteUrl(path)}',
  "robots: {index:true,follow:true}",
  "'@type':'Article'",
  'guide.steps.map',
  'guide.pitfalls.map',
  'guide.faq.map',
  'guide.sourceUrl',
  "location:'hispanic_country_guide_after_article'",
  'guide_slug:guide.slug',
]);
assertIncludesAll('app/sitemap.ts', [
  '`${baseUrl}/es/paises`',
  '`${baseUrl}/es/paises/${guide.slug}`',
  'COUNTRY_NICHE_GUIDES',
  '`${baseUrl}/pregunteros`',
]);
assertIncludesAll('components/footer-home.tsx', ['href="/es/paises"']);
assertIncludesAll('components/marketing/international-study-landing.tsx', [
  'href="/es/paises"',
]);
assertIncludesAll('lib/analytics-client.ts', ["return 'seo-international-country-guides';"]);

const countryData = source('lib/es-country-niche-guides.ts');
const countryMatch = countryData.match(/COUNTRY_NICHE_GUIDES: CountryNicheGuide\[\] = (\[[\s\S]*?\]);\nexport function/);
assert.ok(countryMatch, 'Country guides must be a fixed, editorially reviewed list');
const countries = JSON.parse(countryMatch![1]) as Array<{
  slug: string; title: string; sourceUrl: string; officialChecks: string[]; focus: string; example: string;
  steps: Array<[string,string]>; pitfalls: Array<[string,string]>; faq: Array<[string,string]>;
}>;
assert.equal(countries.length, 4, 'Four substantiated niche guides, not 20 thin variants');
assert.equal(new Set(countries.map(g=>g.slug)).size, 4);
for (const guide of countries) {
  assert.ok(guide.sourceUrl.startsWith('https://'));
  assert.equal(guide.officialChecks.length, 2, guide.slug + ' must cite useful source-specific checkpoints');
  assert.ok(guide.officialChecks.every(check => check.length >= 55), 'Checkpoints must provide usable information');
  assert.ok(guide.steps.length>=4 && guide.faq.length>=3 && guide.pitfalls.length>=3);
  const prose = [guide.focus,guide.example,...guide.steps.flat(),...guide.pitfalls.flat(),...guide.faq.flat()].join(' ');
  assert.ok(prose.split(/\s+/).length >= 320, guide.slug + ' must have substantial original text');
}
const countryIndex = source('lib/spanish-markets.ts');
const indexMatch = countryIndex.match(/SPANISH_MARKETS: SpanishMarket\[\] = (\[[\s\S]*?\]);/);
assert.ok(indexMatch, 'Country index must be an editorially controlled list');
const indexMarkets = JSON.parse(indexMatch![1]) as Array<{country:string;code:string;href:string;status:string}>;
assert.equal(indexMarkets.length,22,'Cover 20 sovereign Spanish-speaking countries plus Puerto Rico and US Spanish');
assert.equal(new Set(indexMarkets.map(m=>m.code)).size,22);
assert.ok(indexMarkets.some(m=>m.code==='AR'&&m.href==='/pregunteros'));
for(const m of indexMarkets){
  assert.ok(m.href.startsWith('/'), 'Only internal, known routes in country directory');
  if (m.status==='en investigación') {
    assert.ok(!m.href.startsWith('/es/paises/'), 'Do not invent unsupported country pages');
  }
}
assertIncludesAll('lib/international-study-landings.ts', [
  "'es-MX':", "'es-CO':", "'es-ES':", "'es-AR':", "'x-default':"
]);


// SEO integrity: paginate all catalog relations, prevent incomplete 200-response
// sitemap builds, and only advertise actually indexable academic destinations.
assertIncludesAll('lib/data/catalog.ts', [
  'fetchAllCatalogCareerMaterias',
  ".from('carrera_materias')",
  '.range(from, from + pageSize - 1)',
  'fetchAllCatalogCareerMaterias(client)',
]);
assertIncludesAll('app/sitemap.ts', [
  'export const revalidate = 3600;',
  'fetchAllMaterias()',
  'fetchAllMaterialMateriaIds',
  '.order(\'id\', { ascending: true })',
  '.range(from, from + pageSize - 1)',
  "if (result.status === 'rejected') throw result.reason;",
  'universidad.carrerasCount === 0 || universidad.materiasCount === 0',
  'carrera.materiasCount === 0',
  'carrera.questionMateriasCount > 0',
]);
assertIncludesAll('app/simulador-parcial/[carrera]/page.tsx', [
  "from('preguntas_banco_public')",
  'robots: { index: hasPublicPractice, follow: true }',
]);

// Argentine metadata must not leak to the neutral and regional Spanish pages.
const rootMetadata = source('app/layout.tsx');
assert.ok(!rootMetadata.includes("'geo.region'"), 'AR geo region should be home-only');
assert.ok(!rootMetadata.includes("'geo.placename'"), 'AR geo city should be home-only');
assert.ok(!rootMetadata.includes("locale: 'es_AR'"), 'Root OG should not force Argentina');
assertIncludesAll('app/page.tsx', ["'geo.region': 'AR'", "'geo.placename': 'Argentina'", "languages: { 'es-AR': '/' }"]);
assertIncludesAll('next.config.mjs', [
  "'/es-mx/:path*', 'es-MX'",
  "'/es-co/:path*', 'es-CO'",
  "'/es-es/:path*', 'es-ES'",
  "'/es/:path*', 'es'",
  "'Content-Language'",
]);
assertIncludesAll('app/es/guias/page.tsx', ["locale: 'es'"]);
assertIncludesAll('app/es/paises/page.tsx', ["locale: 'es'"]);

// SSR language is neutral Spanish at the document root, with regional body content.
assertIncludesAll('app/page.tsx', ['lang="es-AR"']);
assertIncludesAll('components/marketing/international-study-landing.tsx', ['lang={copy.htmlLang}']);


// Canonicals must be page-specific; do not accidentally canonicalize unrelated
// public routes and other sections to the homepage.
assert.ok(!source('app/layout.tsx').includes("canonical: '/'"), 'Root layout must not define global homepage canonical');
assertIncludesAll('app/page.tsx', ["canonical: '/'"]);
assertIncludesAll('app/explorar/layout.tsx', ["canonical: '/explorar'"]);

// IndexNow only accepts explicit, validated, changed canonical pages.
// Google Search does not support IndexNow; this supplements XML sitemaps.
assertIncludesAll('scripts/submit-indexnow.mjs', [
  'INDEXNOW_URLS',
  "https://evaluoapp.com",
  'api.indexnow.org/indexnow',
  'urlList: urls',
  'hasNoindex(html)',
  'pageCanonical(html)',
  "sitemapXml.includes('<loc>' + url + '</loc>')",
  'urls.length <= 20',
]);
assertIncludesAll('.github/workflows/indexnow-notify.yml', [
  'workflow_dispatch:',
  'INDEXNOW_URLS:',
  'node scripts/submit-indexnow.mjs',
  'permissions:',
]);


// Editorial trust: no fabricated reviewers, clear sourcing and independent status.
assertIncludesAll('components/seo/editorial-methodology.tsx', [
  'Cómo se preparó esta guía',
  'Publicación educativa de Evaluo',
  'no son preguntas oficiales',
  "kind === 'admissions'",
  'sourceName',
  'sourceUrl',
]);
assertIncludesAll('app/es/guias/[slug]/page.tsx', ['EditorialMethodology kind="study"']);
assertIncludesAll('app/es/paises/[slug]/page.tsx', [
  'EditorialMethodology kind="admissions"',
  'guide.officialChecks.map',
  'Qué comprobar en el organismo responsable',
]);

// Career landing must never promise a public simulator when no public
// questions are published for that career.
assertIncludesAll('app/estudiar/[universidad]/[carrera]/page.tsx', [
  "from('preguntas_banco_public')",
  'const hasPublicPractice =',
  '{hasPublicPractice ? (',
  'Crear práctica desde mi PDF',
  'No hay preguntas públicas verificadas',
]);
