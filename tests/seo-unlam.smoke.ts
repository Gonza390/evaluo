import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const pagePath = 'app/como-estudiar-ingreso-unlam/page.tsx';
const componentPath = 'components/marketing/unlam-editorial-guide.tsx';
const page = source(pagePath);
const component = source(componentPath);
const combined = `${page}\n${component}`;
const lower = combined.toLowerCase();

for (const token of [
  "const path = '/como-estudiar-ingreso-unlam'",
  'canonical: toAbsoluteUrl(path)',
  'index: true',
  'follow: true',
  'Curso de Ingreso UNLaM 2027: materias, fechas y cómo estudiar',
  '28 sep. – 26 oct. 2026',
  '1 feb. – 6 mar. 2027',
  '8 – 12 mar. 2027',
  'Manual del Curso de Ingreso',
  '/demo/material-estudio',
  '/estudiar-pdf-con-ia',
  '/funciones/resumir-pdf-con-ia',
  '/funciones/crear-flashcards-desde-pdf',
  'https://ingresantes.unlam.edu.ar/',
  'https://www.unlam.edu.ar/curso-de-ingreso/',
  'https://www.unlam.edu.ar/calendario-academico/',
  'Evaluo no está afiliado a UNLaM',
  '<h1',
  'En esta guía',
  'No reemplaza el manual',
  'UnlamIngresoToolkit',
]) {
  assert.ok(combined.includes(token), `UNLaM guide must include ${token}`);
}

for (const unsupportedClaim of [
  '100% preciso',
  'garantizado',
  'preguntas reales',
  'examen real',
  'aprobá seguro',
]) {
  assert.ok(!lower.includes(unsupportedClaim), `UNLaM guide must not claim ${unsupportedClaim}`);
}

assert.ok(
  component.includes('UnlamExamModels'),
  'UNLaM guide must show the verified historical formats and source references',
);
assert.ok(
  component.indexOf('<UnlamExamModels />') < component.indexOf('<UnlamIngresoToolkit />'),
  'Documented examination formats should be shown before general exercises',
);
for (const token of [
  'Modelos de examen de ingreso UNLaM',
  'Manual del Curso de Ingreso UNLaM 2022',
  'mielingreso.unlam.edu.ar/data4/data/ingreso/contenido/',
  'Modelo de examen de Matemática, ingreso 2026',
  'Modelo de examen de Contabilidad del ingreso',
  'UnlamExamFormatSample',
  'No representa una filtración',
]) {
  assert.ok(source('components/marketing/unlam-exam-models.tsx').includes(token), 'Documentary exam section missing ' + token);
}
for (const token of [
  'Tus respuestas escritas',
  'no las envía ni las califica automáticamente',
  'Comparar con los criterios de revisión',
  'seo_unlam_practice_completed',
]) {
  assert.ok(source('components/marketing/unlam-exam-format-sample.tsx').includes(token), 'Exam sample missing ' + token);
}
assert.ok(
  source('components/marketing/unlam-ingreso-practice.tsx').includes('Dominio de expresiones logarítmicas'),
  'Math quick practice should reflect the kinds of documented examination problems',
);

assert.ok(
  source('components/marketing/unlam-ingreso-toolkit.tsx').includes('UnlamIngresoPractice'),
  'UNLaM page must offer free study practice',
);
assert.ok(
  source('components/marketing/unlam-ingreso-practice.tsx').includes('seo_unlam_practice_completed'),
  'UNLaM practice must track completions',
);
assert.ok(
  source('app/sitemap.ts').includes('/como-estudiar-ingreso-unlam'),
  'UNLaM ingreso guide must be included in sitemap'
);
assert.ok(
  source('components/footer-home.tsx').includes('href="/como-estudiar-ingreso-unlam"'),
  'UNLaM ingreso guide must receive a crawlable internal link'
);

console.log('UNLaM SEO landing smoke tests passed.');
