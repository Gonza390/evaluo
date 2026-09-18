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
  'Cómo estudiar para el Curso de Ingreso UNLaM 2027',
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
  source('app/sitemap.ts').includes('/como-estudiar-ingreso-unlam'),
  'UNLaM ingreso guide must be included in sitemap'
);
assert.ok(
  source('components/footer-home.tsx').includes('href="/como-estudiar-ingreso-unlam"'),
  'UNLaM ingreso guide must receive a crawlable internal link'
);

console.log('UNLaM SEO landing smoke tests passed.');
