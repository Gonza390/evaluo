import assert from 'node:assert/strict';
import { buildStudentMaterialGlossary } from '../lib/student-materials/glossary.ts';
import type { StudentMaterialSummary } from '../lib/student-materials/types.ts';

const source = `
UNIDAD 1. CONCEPTOS CENTRALES

Definición: Esta etiqueta introduce una explicación extensa pero no es un concepto académico por sí misma.
Bibliografía: Esta etiqueta enumera fuentes consultadas y tampoco debe aparecer como término del glosario.
Índice: Esta etiqueta organiza el documento y no representa contenido conceptual para estudiar.
Organización: Esta etiqueta describe la estructura formal del apunte y no un concepto disciplinar.
Aprendizaje autorregulado: Capacidad del estudiante para planificar, monitorear y ajustar su propio proceso de estudio.
`;

const summary: StudentMaterialSummary = {
  shortSummary: 'Prueba de filtrado de etiquetas con diacríticos.',
  keyPoints: [
    'Aprendizaje autorregulado: El estudiante planifica, monitorea y ajusta su estudio de manera consciente.',
  ],
  sections: [
    {
      title: 'Conceptos centrales',
      body: source,
    },
  ],
  hasContent: true,
  status: 'ready',
  provider: 'test',
  errorMessage: null,
  sourceChunksCount: 1,
};

const glossary = buildStudentMaterialGlossary(source, summary);
const foldedTerms = glossary.map((item) =>
  item.term
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
);

for (const noisyLabel of ['definicion', 'bibliografia', 'indice', 'organizacion']) {
  assert.ok(
    !foldedTerms.includes(noisyLabel),
    `El glosario no debe incluir la etiqueta de formato “${noisyLabel}”, incluso si viene con tilde.`
  );
}

assert.ok(
  foldedTerms.some((term) => term.includes('aprendizaje autorregulado')),
  'El filtro de ruido no debe eliminar conceptos académicos válidos.'
);

console.log('Glossary noise diacritic smoke tests passed.');
