import assert from 'node:assert/strict';
import { buildPdfProgress } from '../lib/student-materials/progress.ts';
import type { StudyErrorView } from '../lib/study-errors.ts';

const error = (
  id: string,
  topic: string,
  status: 'pending' | 'resolved' = 'pending',
  sectionTitle: string | null = null
): StudyErrorView => ({
  id,
  topic,
  status,
  materiaId: null,
  parcial: null,
  materiaNombre: null,
  sourceType: 'exercise',
  sourceKey: id,
  questionId: null,
  prompt: 'Pregunta',
  explanation: null,
  correctAnswer: null,
  selectedAnswer: null,
  failureCount: 1,
  lastFailedAt: '2026-10-10T10:00:00Z',
  lastReviewedAt: null,
  resolvedAt: status === 'resolved' ? '2026-10-10T11:00:00Z' : null,
  recommendation: sectionTitle
    ? {
        materialId: 'material',
        materialTitle: 'PDF',
        pageStart: null,
        pageEnd: null,
        sectionTitle,
        excerpt: null,
        relation: 'origin',
      }
    : null,
  alternatives: [],
});

const sections = [{ title: '1. Obligaciones' }, { title: 'Prescripción' }, { title: 'Contratos' }];
const fresh = buildPdfProgress(sections, []);
assert.equal(fresh.tracked, 0, 'Un tema generado no es evidencia de práctica ni de dominio.');
const progress = buildPdfProgress(sections, [
  error('one', 'obligaciones'),
  error('two', 'Obligaciones', 'resolved'),
  error('three', 'PRESCRIPCION', 'resolved'),
  error('four', 'Otro concepto'),
]);
assert.equal(progress.tracked, 2);
assert.deepEqual(
  progress.topics[0].errors.map((item) => item.status),
  ['pending', 'resolved'],
  'Un acierto anterior no debe ocultar errores pendientes del mismo tema.'
);
assert.equal(progress.topics[2].errors.length, 0);
assert.equal(progress.unmatched.length, 1, 'No inventar una asociación para registros históricos.');
assert.equal(
  progress.topics.reduce((total, topic) => total + topic.errors.length, progress.unmatched.length),
  4,
  'Cada registro debe contarse una sola vez.'
);
assert.equal(
  buildPdfProgress(
    [{ title: 'Obligaciones' }, { title: '1. Obligaciones' }],
    [error('duplicate', 'Obligaciones')]
  ).unmatched.length,
  1,
  'Un título duplicado no permite identificar un tema.'
);
assert.equal(
  buildPdfProgress(sections, [error('conflict', 'Contratos', 'pending', 'Obligaciones')]).unmatched
    .length,
  1,
  'Referencias contradictorias no deben dar falsa precisión.'
);
assert.equal(buildPdfProgress(null, [error('missing', 'Contratos')]).unmatched.length, 1);
assert.equal(buildPdfProgress([null, {}, { title: ' ' }, { title: 2 }], []).topics.length, 0);

const evidence = (topic: string, correct = 1, incorrect = 0, selfReported = 0) => ({
  topic,
  sectionTitle: topic,
  correct,
  incorrect,
  selfReported,
  lastAnsweredAt: '2026-10-10T12:00:00Z',
});
const firstTry = buildPdfProgress(sections, [], [evidence('Contratos')]);
assert.equal(
  firstTry.evaluated,
  1,
  'Un acierto desde el primer intento cuenta sin inventar un error.'
);
assert.equal(firstTry.topics[2].errors.length, 0);
assert.equal(
  buildPdfProgress(sections, [], [evidence('Contratos', 0, 1)]).evaluated,
  1,
  'Una respuesta incorrecta también evalúa el tema; cobertura no significa dominio.'
);
assert.equal(
  buildPdfProgress(sections, [], [evidence('Contratos', 0, 0, 4)]).evaluated,
  0,
  'Las flashcards y respuestas abiertas autoevaluadas no prueban evaluación objetiva.'
);
assert.equal(
  buildPdfProgress(sections, [error('old', 'Contratos')]).evaluated,
  0,
  'No convertir el historial de errores en respuestas que nunca se guardaron.'
);
assert.equal(
  buildPdfProgress(sections, [], [evidence('Contratos'), evidence('Contratos', 2)]).evaluated,
  1,
  'Varias respuestas del mismo tema no inflan la cobertura.'
);
assert.equal(buildPdfProgress(sections, [], [evidence('Otro')]).unmatchedEvidence.length, 1);
assert.equal(
  buildPdfProgress(sections, [], [{ ...evidence('Contratos'), sectionTitle: 'Prescripción' }])
    .evaluated,
  0,
  'La evidencia ambigua se conserva fuera del contador.'
);
console.log('pdf-progress.smoke: OK');

const historicalSections = [
  {
    title: '1. Conocimiento científico',
    body: '### Epistemología y ciencia\nEstudio de los fundamentos del conocimiento.',
  },
  {
    title: '2. Teoría argumentativa',
    body: '**Argumento deductivo:** la conclusión se deriva necesariamente.\n**Corrección formal:** validez o invalidez del argumento.',
  },
  {
    title: '3. Lenguaje de las teorías',
    body: '### Tipos de objetos\nObjetos lingüísticos, objetos concretos y objetos abstractos.',
  },
];
const historical = (id: string, topic: string, answer: string) => ({
  ...error(id, topic, 'pending', topic),
  correctAnswer: answer,
});
const historicalProgress = buildPdfProgress(historicalSections, [
  {
    ...historical('card', 'Epistemología y ciencia', 'Estudio del conocimiento'),
    sourceType: 'flashcard',
  },
  historical('deduction', 'Argumentos deductivos', 'Conclusión necesaria'),
  historical('short', 'Clasificación del lenguaje', 'Objetos lingüísticos'),
  // El índice antiguo no prueba la relación: esta pregunta pertenece al tercer tema.
  {
    ...historical('moved', 'Tipos de objetos', 'Objetos lingüísticos'),
    sourceKey: 'pdf:summary-check:0:artifact:old',
  },
  historical('general', 'Introducción al curso', 'Universidad de ejemplo'),
]);
assert.deepEqual(
  historicalProgress.topics.map((topic) => topic.errors.length),
  [1, 1, 2]
);
assert.equal(historicalProgress.unmatched.length, 1);
assert.equal(
  historicalProgress.evaluated,
  0,
  'Asociar errores históricos no inventa eventos corregidos.'
);
assert.equal(
  buildPdfProgress(
    [
      { title: 'Uno', body: '### Tipos de objetos\nObjetos lingüísticos.' },
      { title: 'Dos', body: '### Tipos de objetos\nObjetos lingüísticos.' },
    ],
    [historical('ambiguous', 'Tipos de objetos', 'Objetos lingüísticos')]
  ).unmatched.length,
  1
);
assert.equal(
  buildPdfProgress(historicalSections, [
    {
      ...historical('simulator', 'Tipos de objetos', 'Objetos lingüísticos'),
      sourceType: 'simulator',
    },
  ]).tracked,
  0,
  'Una recomendación del simulador no se transforma en evidencia del PDF.'
);
