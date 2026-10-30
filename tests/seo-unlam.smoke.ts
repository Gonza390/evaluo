import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function requireAll(path: string, tokens: string[]) {
  const contents = source(path);
  for (const token of tokens) assert.ok(contents.includes(token), `${path} must include ${token}`);
}

const landingPath = 'app/(es)/como-estudiar-ingreso-unlam/page.tsx';
const landing = source('components/marketing/unlam-editorial-guide.tsx');
const admission = source('components/marketing/unlam-admission-guide.tsx');
const combined = landing + '\n' + source(landingPath);
const lower = combined.toLowerCase();

requireAll(landingPath, [
  "const path = '/como-estudiar-ingreso-unlam'",
  'canonical: toAbsoluteUrl(path)',
  'index: true',
  'follow: true',
  'Curso de Ingreso UNLaM 2027: materias, fechas y cómo estudiar',
]);
requireAll('components/marketing/unlam-editorial-guide.tsx', [
  'linear-gradient(145deg,#0D2F82_0%,#174BBD_52%,#2563EB_100%)',
  'font-black leading-[1.07]',
  'Calendario oficial',
  'UnlamUnifiedPractice',
  'UnlamAdmissionGuide',
  'UnlamIngresoToolkit',
  'UnlamExamModels',
  '/estudiar-pdf-con-ia?source=ingreso-unlam-2027',
  '28 sep. – 26 oct. 2026',
  '1 feb. – 6 mar. 2027',
  '8 – 12 mar. 2027',
  'Preguntas frecuentes del ingreso UNLaM 2027',
  'https://ingresantes.unlam.edu.ar/',
  'https://www.unlam.edu.ar/curso-de-ingreso/',
  'https://www.unlam.edu.ar/calendario-academico/',
  'Evaluo no está afiliado a UNLaM',
  '<h1',
]);
for (const unsupportedClaim of ['100% preciso', 'garantizado', 'preguntas reales', 'examen real', 'aprobá seguro']) {
  assert.ok(!lower.includes(unsupportedClaim), `UNLaM landing must not claim ${unsupportedClaim}`);
}
assert.ok(
  landing.indexOf('<UnlamUnifiedPractice />') < landing.indexOf('<UnlamExamModels />'),
  'The free practice must be visible before external historical exam references',
);
assert.ok(
  landing.indexOf('<UnlamUnifiedPractice />') < landing.indexOf('<UnlamIngresoToolkit />'),
  'The free practice must precede long study content',
);
assert.equal(
  (landing.match(/<UnlamUnifiedPractice\s*\/>/g) || []).length,
  1,
  'Landing must show one unified practice entry point',
);
assert.ok(!landing.includes('id="metodo"'), 'Landing must not keep duplicate long-form method blocks');
assert.ok(!landing.includes('<aside className="hidden border-r'), 'Long sidebar TOC should be removed');

requireAll('components/marketing/unlam-unified-practice.tsx', [
  'id="practica-ingreso"',
  'UnlamExamFormatSample',
  'UnlamIngresoPractice',
  'seo_unlam_practice_mode_selected',
  'Modelo guiado: Seminario',
  'Ejercicios por materia',
]);

for (const term of [
  '70', '100', '55', '105', '150',
  'sin ausentes', 'no tener aplazos ni ausentes',
  'https://www.unlam.edu.ar/curso-de-ingreso/'
]) {
  assert.ok(admission.includes(term), `UNLaM requirements missing ${term}`);
}
requireAll('components/marketing/unlam-ingreso-toolkit.tsx', [
  'Materias por carrera',
  'Profesorado en Educación Física',
  'Fundamentos de la Educación Física',
  'ficha médica',
  'evaluación teórica escrita',
  'Educación Médica',
  'Introducción al conocimiento proyectual',
  'Biociencias',
  'Elementos de lógica matemática',
  'https://www.unlam.edu.ar/curso-de-ingreso/',
]);
requireAll('components/marketing/unlam-exam-models.tsx', [
  'Modelos de examen de ingreso UNLaM',
  'Manual del Curso de Ingreso UNLaM 2022',
  'mielingreso.unlam.edu.ar/data4/data/ingreso/contenido/',
  'Modelo de examen de Matemática, ingreso 2026',
  'Modelo de examen de Contabilidad del ingreso',
  'No representa una filtración',
]);
assert.ok(
  !source('components/marketing/unlam-exam-models.tsx').includes('UnlamExamFormatSample'),
  'Historical source section must not create a second practice entry point',
);
requireAll('components/marketing/unlam-exam-format-sample.tsx', [
  'Tus respuestas escritas',
  'no las envía ni las califica automáticamente',
  'Comparar con los criterios de revisión',
  'selected === null || !justification.trim() || !report.trim()',
  'seo_unlam_practice_completed',
]);
requireAll('components/marketing/unlam-ingreso-practice.tsx', [
  'Dominio de expresiones logarítmicas',
  'id="ejercicios-por-materia-unlam"',
  'seo_unlam_practice_started',
  'seo_unlam_practice_answered',
  'seo_unlam_practice_completed',
]);
requireAll('lib/analytics-events.ts', [
  'seo_unlam_practice_started',
  'seo_unlam_practice_answered',
  'seo_unlam_practice_completed',
  'seo_unlam_practice_mode_selected',
  'pdf_selected',
  'signup_completed',
]);
requireAll('lib/analytics-metadata.ts', [
  'seo_unlam_practice_mode_selected',
  'seo_unlam_practice_completed',
]);
requireAll('app/(es)/administrador/unlam-funnel-actions.ts', [
  'getAdminAccessContext',
  'listAdminUserIds',
  "eq('path', PATH)",
  'seo_unlam_practice_started',
  'seo_unlam_practice_completed',
  'pdf_selected',
  'signup_completed',
]);
requireAll('app/(es)/administrador/unlam-funnel-panel.tsx', [
  'Ingreso UNLaM · Embudo de adquisición',
  'stats.steps.map',
  'Search Console',
]);
requireAll('app/(es)/administrador/page.tsx', [
  'obtenerEmbudoUnlamAdministrador(activePeriod)',
  'UnlamFunnelPanel',
]);
assert.ok(source('app/sitemap.ts').includes('/como-estudiar-ingreso-unlam'), 'Landing must be in sitemap');
assert.ok(source('components/footer-home.tsx').includes('href="/como-estudiar-ingreso-unlam"'), 'Landing needs an internal link');
console.log('UNLaM SEO, content and funnel smoke tests passed.');
