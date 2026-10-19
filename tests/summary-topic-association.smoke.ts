import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSummaryCheckPlan } from '../lib/student-materials/summary-checks.ts';
import type { PedagogicalArtifacts, StudyQuestion } from '../lib/student-materials/pedagogy.ts';

const question = (id: string, topic: string): StudyQuestion => ({
  id,
  topic,
  type: 'multiple_choice',
  level: 'comprender',
  kind: 'concept',
  prompt: `Pregunta sobre ${topic}`,
  answer: 'Respuesta válida',
  options: [
    'Respuesta válida',
    'Siempre se exige escritura pública',
    'Nunca se permite representación',
  ],
  explanation: 'Explicación del PDF',
  reference: { pageStart: 1, pageEnd: 1, sectionTitle: topic, excerpt: 'Fragmento del PDF' },
});
const artifacts = (questions: StudyQuestion[]): PedagogicalArtifacts => ({
  questions,
  flashcards: [],
  miniExamQuestionIds: [],
  coverage: { conceptsUsed: 0, sectionsUsed: 0, referencedItems: 0, totalItems: questions.length },
});

// Reproducir el material guardado que asociaba ciberseguridad y cuántica a IA.
const storedDemo = JSON.parse(readFileSync('public/material-general-prueba.study.json', 'utf8'));
const storedPlans = buildSummaryCheckPlan(
  storedDemo.summary.sections,
  storedDemo.pedagogicalArtifacts
);
assert.ok(storedPlans[0], 'El primer capítulo conserva sus comprobaciones propias.');
assert.ok(
  storedPlans[0].questions.every((check) => !['artifact:mc-3', 'artifact:mc-4'].includes(check.id)),
  'Preguntas de ciberseguridad y cuántica no deben evaluar fundamentos de IA.'
);
assert.ok(
  storedPlans.every((plan) => !plan || plan.questions[0].topic === plan.chapterTitle),
  'Los errores de la pregunta actual deben usar el nombre del tema del resumen.'
);

const unrelated = {
  ...question('unrelated', 'Computación cuántica'),
  level: 'aplicar' as const,
  kind: 'relationship' as const,
  // Un excerpt genérico coincidente no acredita la pertenencia de la pregunta.
  reference: { ...question('x', '').reference, excerpt: 'Fundamentos de inteligencia artificial' },
};
assert.deepEqual(
  buildSummaryCheckPlan(
    [{ title: 'Fundamentos de inteligencia artificial', body: '' }],
    artifacts([unrelated])
  ),
  [null],
  'La calidad pedagógica y una referencia genérica no reemplazan la pertinencia al tema.'
);
const contractQuestions = [
  question('contract-a', 'Contratos'),
  {
    ...question('contract-b', 'Contratos'),
    prompt: 'Otra comprobación de contratos',
    answer: 'Otra respuesta válida',
    options: [
      'Otra respuesta válida',
      'El acuerdo carece de efectos',
      'La voluntad es irrelevante',
    ],
  },
];
const contractPlan = buildSummaryCheckPlan(
  [{ title: '1. Contratos', body: '' }],
  artifacts(contractQuestions)
)[0];
assert.ok(contractPlan);
assert.ok(contractPlan.questions.every((check) => check.topic === '1. Contratos'));
assert.ok(contractPlan.questions.every((check) => check.id.startsWith('artifact:')));

assert.deepEqual(
  buildSummaryCheckPlan(
    [
      { title: 'Contratos', body: '' },
      { title: 'Contratos', body: '' },
    ],
    artifacts(contractQuestions)
  ),
  [null, null],
  'Una atribución ambigua no debe convertirse en evidencia de progreso.'
);

for (const plan of storedPlans) {
  if (!plan) continue;
  if (plan.chapterIndex > 0)
    assert.equal(plan.questions[1].topic, storedDemo.summary.sections[plan.chapterIndex - 1].title);
}
console.log('Summary topic association smoke tests passed.');
