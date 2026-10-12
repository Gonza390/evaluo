import assert from 'node:assert/strict';
import type { StudyQuestion, PedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';
import {
  selectTopicPracticeQuestions,
  getTopicQuestionCounts,
  emptyTopicPracticeContext,
} from '../lib/student-materials/topic-practice.ts';
import { selectDiagnosticQuestions } from '../lib/student-materials/diagnostic-questions.ts';
import {
  selectDelayedReviewQuestion,
  REVIEW_DELAY_MS,
} from '../lib/student-materials/delayed-review.ts';

const sections = ['Contratos', 'Obligaciones', 'Prescripción', 'Responsabilidad'].map((title) => ({
  title,
  body: '',
}));
const question = (
  id: string,
  index: number,
  type: StudyQuestion['type'] = 'multiple_choice'
): StudyQuestion => ({
  id,
  type,
  level: 'comprender',
  kind: 'concept',
  topic: sections[index].title,
  prompt: `Consigna ${id}`,
  answer: `Respuesta ${id}`,
  options:
    type === 'multiple_choice'
      ? [`Respuesta ${id}`, 'Otra alternativa', 'Tercera alternativa']
      : [],
  explanation: 'Explicación respaldada por el PDF.',
  reference: {
    sectionTitle: sections[index].title,
    excerpt: 'Fuente del material',
    pageStart: index + 1,
    pageEnd: index + 1,
  },
});
const questions = [
  question('a1', 0),
  question('a2', 0),
  question('a3', 0),
  question('b1', 1),
  question('b2', 1),
  question('c1', 2),
  question('c2', 2),
];
const fresh = selectTopicPracticeQuestions({ questions, targetCount: 3, sections });
assert.deepEqual(
  new Set(fresh.map((item) => item.topic)),
  new Set(sections.slice(0, 3).map((item) => item.title)),
  'La primera tanda debe repartir oportunidades antes de repetir un tema.'
);
assert.deepEqual(
  getTopicQuestionCounts(sections, questions),
  [3, 2, 2, 0],
  'Un tema sin banco debe quedar identificado, no inventar preguntas.'
);

const evidence = (index: number, correct: number, incorrect = 0, selfReported = 0) => ({
  topic: sections[index].title,
  sectionTitle: sections[index].title,
  correct,
  incorrect,
  selfReported,
  lastAnsweredAt: '2026-10-10T12:00:00Z',
});
const context = {
  ...emptyTopicPracticeContext,
  evidence: [evidence(0, 2)],
  answeredItemKeys: ['diagnostic:a1', 'exercise:a2'],
};
const next = selectTopicPracticeQuestions({ questions, targetCount: 2, sections, context });
assert.deepEqual(
  next.map((item) => item.topic),
  [sections[1].title, sections[2].title],
  'La siguiente práctica prioriza temas que todavía no recibieron evaluación.'
);
const later = selectTopicPracticeQuestions({ questions, targetCount: 3, sections, context });
assert.equal(
  later.find((item) => item.topic === sections[0].title)?.id,
  'a3',
  'No repetir lo respondido cuando hay otra pregunta disponible.'
);

const pending = selectTopicPracticeQuestions({
  questions,
  targetCount: 2,
  sections,
  context: {
    ...emptyTopicPracticeContext,
    evidence: [evidence(0, 3), evidence(1, 1, 1), evidence(2, 1)],
    pendingTopics: [sections[1].title],
  },
});
assert.equal(
  pending[0].topic,
  sections[1].title,
  'Una vez evaluados, priorizar dificultades pendientes.'
);
const selfReport = selectTopicPracticeQuestions({
  questions,
  targetCount: 1,
  sections,
  context: {
    ...emptyTopicPracticeContext,
    evidence: [evidence(0, 0, 0, 20), evidence(1, 1), evidence(2, 1)],
  },
});
assert.equal(
  selfReport[0].topic,
  sections[0].title,
  'Las flashcards autoevaluadas no reemplazan una respuesta corregida.'
);
const openOnly = question('d-open', 3, 'open');
assert.equal(getTopicQuestionCounts(sections, [openOnly])[3], 0);
assert.equal(
  selectTopicPracticeQuestions({ questions: [openOnly], targetCount: 1, sections })[0].type,
  'open',
  'Conservar práctica abierta sin contarla como evaluación corregida.'
);
const ambiguous = {
  ...question('ambiguous', 0),
  topic: sections[0].title,
  reference: { ...question('ambiguous', 0).reference, sectionTitle: sections[1].title },
};
assert.deepEqual(
  getTopicQuestionCounts(sections, [ambiguous]),
  [0, 0, 0, 0],
  'Una referencia contradictoria no cubre ningún tema.'
);
const duplicate = { ...questions[0], id: 'duplicate' };
const unique = selectTopicPracticeQuestions({
  questions: [...questions, duplicate],
  targetCount: 20,
  sections,
});
assert.equal(
  unique.length,
  questions.length,
  'No llenar una tanda con duplicados de la misma pregunta.'
);
const artifacts = { questions, miniExamQuestionIds: ['a1', 'a2', 'a3'] } as PedagogicalArtifacts;
assert.equal(
  new Set(selectDiagnosticQuestions(artifacts, 3, sections).map((item) => item.topic)).size,
  3,
  'El diagnóstico inicial también debe usar los temas del resumen.'
);
// Volver a comprobar el concepto después del refuerzo, con otro caso y sin repetir consignas.
const reinforcedAt = '2026-10-10T12:00:00Z';
const due = Date.parse(reinforcedAt) + REVIEW_DELAY_MS;
const followup = {
  errorId: 'error-a',
  topic: sections[0].title,
  correctAnswer: 'Contrato bilateral',
  originalPrompt: '¿Cómo se denomina un contrato con obligaciones recíprocas?',
  reviewPrompt: 'Ana y Pedro asumen obligaciones mutuas. ¿Qué contrato celebraron?',
  reinforcedAt,
};
const transfer = {
  ...question('transfer', 0),
  level: 'aplicar' as const,
  prompt: 'Una persona entrega un bien y otra se obliga a pagar. ¿Qué clase de contrato es?',
  answer: followup.correctAnswer,
  options: [followup.correctAnswer, 'Contrato unilateral', 'Acto sin obligaciones'],
};
const choose = (overrides: Partial<Parameters<typeof selectDelayedReviewQuestion>[0]> = {}) =>
  selectDelayedReviewQuestion({
    questions: [transfer],
    sections,
    followups: [followup],
    answers: [],
    answeredIds: new Set(),
    now: due,
    ...overrides,
  });
assert.equal(
  choose({ now: due - 1 }),
  undefined,
  'El acierto inmediato no habilita otro repaso inmediato.'
);
assert.equal(
  choose()?.id,
  transfer.id,
  'Desde las 24 horas se puede comprobar otro caso del concepto.'
);
assert.equal(
  choose({
    questions: [
      {
        ...transfer,
        topic: sections[1].title,
        reference: { ...transfer.reference, sectionTitle: sections[1].title },
      },
    ],
  }),
  undefined,
  'Compartir la respuesta no alcanza si pertenece a otro tema.'
);
assert.equal(
  choose({ questions: [{ ...transfer, answer: 'Contrato unilateral' }] }),
  undefined,
  'Una pregunta diferente del tema no prueba necesariamente el concepto reforzado.'
);
for (const prompt of [followup.originalPrompt, followup.reviewPrompt]) {
  assert.equal(
    choose({ questions: [{ ...transfer, prompt }] }),
    undefined,
    'No reutilizar la pregunta fallada ni la comprobación inmediata del refuerzo.'
  );
}
assert.equal(
  choose({ answeredIds: new Set([transfer.id]) }),
  undefined,
  'No presentar como transferencia una pregunta ya vista.'
);
assert.equal(
  choose({
    answers: [{ itemKey: `exercise:${transfer.id}`, answeredAt: new Date(due).toISOString() }],
  }),
  undefined,
  'Una respuesta independiente posterior, correcta o incorrecta, cierra esta oportunidad.'
);
assert.equal(
  choose({ answers: [{ itemKey: `exercise:${transfer.id}`, answeredAt: reinforcedAt }] })?.id,
  transfer.id,
  'Una respuesta inmediata no cuenta como recuperación posterior.'
);
assert.equal(
  choose({
    answers: [{ itemKey: `diagnostic:${transfer.id}`, answeredAt: new Date(due).toISOString() }],
  })?.id,
  transfer.id,
  'El diagnóstico guiado no reemplaza la práctica independiente.'
);
assert.equal(choose({ followups: [{ ...followup, reinforcedAt: 'invalid' }] }), undefined);
assert.equal(
  choose({
    followups: [{ ...followup, correctAnswer: 'Verdadero' }],
    questions: [{ ...transfer, answer: 'Verdadero' }],
  }),
  undefined,
  'Una respuesta genérica no identifica un concepto.'
);
assert.equal(choose({ questions: [] }), undefined, 'Sin banco no se inventa cobertura.');
const mixed = selectTopicPracticeQuestions({
  questions: [...questions, transfer],
  targetCount: 3,
  sections,
  now: due,
  context: { ...emptyTopicPracticeContext, reviewFollowups: [followup] },
});
assert.equal(mixed.length, 3, 'El repaso posterior no aumenta el tamaño del intento.');
assert.equal(mixed.filter((item) => item.id === transfer.id).length, 1);
assert.ok(
  mixed.some((item) => item.topic !== followup.topic),
  'La comprobación se mezcla con otros temas.'
);
const unavailable = selectTopicPracticeQuestions({
  questions: [...questions, transfer],
  targetCount: 1,
  sections,
  now: due,
  context: { ...emptyTopicPracticeContext, reviewFollowups: [followup], loadError: true },
});
assert.notEqual(
  unavailable[0]?.id,
  transfer.id,
  'Si falla el historial, usar el reparto inicial seguro.'
);
console.log('topic-practice.smoke: OK');
