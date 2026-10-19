import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  resolveMaterialAnswer,
  type MaterialAnswerInput,
} from '../lib/student-materials/answer-evidence.ts';
import { buildSummaryCheckPlan } from '../lib/student-materials/summary-checks.ts';
import type { PedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';
import type { StudySummarySection } from '../lib/student-materials/types.ts';

const fixture = JSON.parse(
  readFileSync(new URL('../public/material-general-prueba.study.json', import.meta.url), 'utf8')
);
const artifacts = fixture.pedagogicalArtifacts as PedagogicalArtifacts;
const sections = fixture.summary.sections as StudySummarySection[];
const question = artifacts.questions.find((q) => q.type === 'multiple_choice')!;
const base: MaterialAnswerInput = {
  materialId: 'material',
  sourceType: 'diagnostic',
  itemKey: `diagnostic:${question.id}`,
  wasCorrect: false,
  prompt: question.prompt,
  selectedAnswer: question.answer,
  topic: 'Tema inventado',
  correctAnswer: 'Respuesta inventada',
  reference: { sectionTitle: 'Tema inventado' },
};
const answer = resolveMaterialAnswer(base, artifacts, sections)!;

const legacyCard = {
  front: '¿Qué es la corrección formal?',
  back: 'Validez o invalidez de un argumento.',
  level: 'comprender' as const,
  reference: { pageStart: 1, pageEnd: 1, sectionTitle: 'Corrección formal', excerpt: '' },
};
const canonicalCardAnswer = resolveMaterialAnswer(
  {
    ...base,
    sourceType: 'flashcard',
    itemKey: 'flashcard:0',
    prompt: legacyCard.front,
    topic: 'Tema inventado por el cliente',
  },
  { ...artifacts, flashcards: [legacyCard] },
  [
    {
      title: '1. Teoría argumentativa',
      body: '**Corrección formal:** validez o invalidez del argumento.',
    },
    { title: '2. Hipótesis', body: 'Contrastación de las predicciones.' },
  ]
);
assert.equal(
  canonicalCardAnswer?.topic,
  '1. Teoría argumentativa',
  'La próxima respuesta guarda el capítulo del resumen, aunque la tarjeta use un concepto.'
);
assert.equal(
  canonicalCardAnswer?.evidenceKind,
  'self_report',
  'Asociar una tarjeta no transforma la autoevaluación en una respuesta objetiva.'
);
assert.equal(
  answer.wasCorrect,
  true,
  'La corrección usa la respuesta del servidor, no wasCorrect del navegador.'
);
assert.equal(answer.evidenceKind, 'assessed');
assert.notEqual(answer.topic, 'Tema inventado');
assert.equal(answer.correctAnswer, question.answer);
const wrong = question.options.find((option) => option !== question.answer)!;
assert.equal(
  resolveMaterialAnswer({ ...base, wasCorrect: true, selectedAnswer: wrong }, artifacts, sections)
    ?.wasCorrect,
  false
);
assert.equal(
  resolveMaterialAnswer({ ...base, itemKey: 'diagnostic:inventada' }, artifacts, sections),
  null
);
assert.equal(
  resolveMaterialAnswer({ ...base, prompt: 'Una pregunta inventada' }, artifacts, sections),
  null
);
assert.equal(
  resolveMaterialAnswer({ ...base, selectedAnswer: 'Fuera de las opciones' }, artifacts, sections),
  null
);
const card = artifacts.flashcards[0];
assert.equal(
  resolveMaterialAnswer(
    {
      ...base,
      sourceType: 'flashcard',
      itemKey: 'flashcard:0',
      prompt: card.front,
      wasCorrect: true,
    },
    artifacts,
    sections
  )?.evidenceKind,
  'self_report'
);
const open = artifacts.questions.find((q) => q.type === 'open')!;
assert.equal(
  resolveMaterialAnswer(
    {
      ...base,
      sourceType: 'exercise',
      itemKey: `exercise:${open.id}`,
      prompt: open.prompt,
      selectedAnswer: 'Mi respuesta',
      wasCorrect: true,
    },
    artifacts,
    sections
  )?.evidenceKind,
  'self_report'
);
const plans = buildSummaryCheckPlan(sections, artifacts);
for (const plan of plans) {
  if (!plan) continue;
  for (const check of plan.questions) {
    const result = resolveMaterialAnswer(
      {
        ...base,
        sourceType: 'exercise',
        itemKey: `summary-check:${plan.chapterIndex}:${check.id}`,
        prompt: check.prompt,
        selectedAnswer: check.answer,
      },
      artifacts,
      sections
    );
    assert.equal(
      result?.wasCorrect,
      true,
      'Incluye las microprácticas y preguntas del capítulo anterior.'
    );
    assert.equal(result?.topic, check.topic);
  }
}
console.log('material-answer-evidence.smoke: OK');
