import assert from 'node:assert/strict';
import { summarizeExtractedText } from '../lib/student-materials/text.ts';
import { buildStudentMaterialGlossary } from '../lib/student-materials/glossary.ts';
import { buildPedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';

function foldNoiseLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

const ues21ChromeText = `
UNIVERSIDAD SIGLO 21
Carrera: Abogacia
Materia: Derecho Civil

UNIDAD 1. CONTRATOS

- Definición: acuerdo de voluntades destinado a crear obligaciones juridicas entre las partes.
- Importante: el consentimiento debe ser libre, espontaneo y no viciado por error o dolo.
- Ejemplo: compraventa de un inmueble urbano con entrega de posesion y precio.
- Clave de estudio: diferenciar oferta, aceptacion y perfeccion del contrato.

Índice
Introducción
Bibliografía
Referencias
`;

const summary = summarizeExtractedText(ues21ChromeText, 'UES21 Derecho Civil');
const glossary = buildStudentMaterialGlossary(ues21ChromeText, {
  ...summary,
  status: 'ready',
  provider: 'test',
  errorMessage: null,
  sourceChunksCount: 1,
});

const noisyAccentLabels = [
  'definición',
  'definicion',
  'importante',
  'ejemplo',
  'clave de estudio',
  'índice',
  'indice',
  'introducción',
  'introduccion',
  'bibliografía',
  'bibliografia',
  'referencias',
];

assert.ok(
  !glossary.some((item) =>
    noisyAccentLabels.some((label) => foldNoiseLabel(item.term) === foldNoiseLabel(label))
  ),
  'Etiquetas UES21 con acentos (Definición, Índice, Introducción) no deben ser terminos del glosario.'
);

const pedagogy = buildPedagogicalArtifacts({
  summary: {
    ...summary,
    status: 'ready',
    provider: 'test',
    errorMessage: null,
    sourceChunksCount: 1,
  },
  glossary,
});

assert.ok(
  !pedagogy.flashcards.some((card) =>
    noisyAccentLabels.some((label) => foldNoiseLabel(card.front) === foldNoiseLabel(label))
  ),
  'Etiquetas de chrome/formato con acentos no deben aparecer como frente de flashcard.'
);

console.log('Glossary noise NFD smoke tests passed.');
