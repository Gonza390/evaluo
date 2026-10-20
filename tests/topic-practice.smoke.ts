import assert from 'node:assert/strict';
import type { StudyQuestion, PedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';
import {
  selectTopicPracticeQuestions,
  getTopicQuestionCounts,
  emptyTopicPracticeContext,
} from '../lib/student-materials/topic-practice.ts';
import { selectDiagnosticQuestions } from '../lib/student-materials/diagnostic-questions.ts';
import {
  getDistinctEligibleExamQuestions,
  resolveExamSizeOptions,
} from '../lib/student-materials/practice-questions.ts';
import {
  practiceBankSignature,
  practiceDraftKey,
  readPracticeDraft,
  type PracticeDraft,
} from '../lib/student-materials/practice-session.ts';
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

// Un tema con 35 preguntas debe dar 20 en la primera tanda y 15 en la segunda.
const largeTopicBank = Array.from({ length: 35 }, (_, index) =>
  question(`large-topic-${index + 1}`, 0)
);
const firstTopicBatch = selectTopicPracticeQuestions({
  questions: largeTopicBank,
  targetCount: 20,
  sections: [sections[0]],
  unansweredOnly: true,
});
assert.equal(firstTopicBatch.length, 20);
const secondTopicBatch = selectTopicPracticeQuestions({
  questions: largeTopicBank,
  targetCount: 20,
  sections: [sections[0]],
  unansweredOnly: true,
  context: {
    ...emptyTopicPracticeContext,
    answeredItemKeys: firstTopicBatch.map((item) => `exercise:${item.id}`),
  },
});
assert.equal(secondTopicBatch.length, 15, 'La segunda tanda no debe rellenarse con preguntas repetidas.');
assert.equal(
  secondTopicBatch.filter((item) => firstTopicBatch.some((previous) => previous.id === item.id)).length,
  0,
  'No mostrar ninguna pregunta ya respondida mientras haya nuevas.'
);
const completedBank = selectTopicPracticeQuestions({
  questions: largeTopicBank,
  targetCount: 20,
  sections: [sections[0]],
  unansweredOnly: true,
  context: {
    ...emptyTopicPracticeContext,
    answeredItemKeys: largeTopicBank.map((item) => `exercise:${item.id}`),
  },
});
assert.equal(completedBank.length, 20, 'Cuando se completa el banco se puede comenzar una nueva vuelta.');
const missingHistory = selectTopicPracticeQuestions({
  questions: largeTopicBank,
  targetCount: 20,
  sections: [sections[0]],
  unansweredOnly: true,
  context: { ...emptyTopicPracticeContext, loadError: true },
});
assert.equal(missingHistory.length, 20, 'Sin historial disponible, la práctica debe seguir funcionando.');

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
// Los tres modos deben escalar con el tamaño del banco, no repetir 12 siempre.
for (const [total, brief, coverage] of [
  [20, 4, 12],
  [40, 8, 16],
  [80, 16, 32],
  [120, 24, 48],
  [200, 30, 80],
] as const) {
  assert.deepEqual(resolveExamSizeOptions(total).map((item) => [item.mode, item.count]), [
    ['brief', brief],
    ['coverage', coverage],
    ['complete', total],
  ]);
}
assert.deepEqual(resolveExamSizeOptions(20).map((item) => item.mode), [
  'brief', 'coverage', 'complete',
]);
assert.deepEqual(resolveExamSizeOptions(3).map((item) => item.count), [1, 2, 3]);
assert.deepEqual(resolveExamSizeOptions(1).map((item) => item.count), [1]);

const eighty = Array.from({ length: 80 }, (_, index) => {
  const section = index % sections.length;
  const entry = question(`bank-${index}`, section, index % 7 === 0 ? 'open' : 'multiple_choice');
  return { ...entry, prompt: `Consigna completa número ${index + 1}` };
});
const eightyUnique = getDistinctEligibleExamQuestions([
  ...eighty,
  { ...eighty[0], id: 'bank-duplicate' },
]);
assert.equal(eightyUnique.length, 80, 'No mostrar duplicados como preguntas disponibles.');

const seededRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const complete = selectTopicPracticeQuestions({
  questions: eightyUnique,
  targetCount: 80,
  complete: true,
  sections,
  random: seededRandom(7),
});
assert.equal(complete.length, 80, 'Completo incluye todo el banco, también las abiertas.');
assert.equal(new Set(complete.map((item) => item.id)).size, 80);
assert.equal(complete.filter((item) => item.type === 'open').length, 12);
assert.deepEqual(
  new Set(complete.map((item) => item.id)),
  new Set(eightyUnique.map((item) => item.id)),
  'Completo no puede perder ni agregar preguntas durante la mezcla.'
);
assert.notDeepEqual(
  complete.map((item) => item.id),
  eightyUnique.map((item) => item.id),
  'Completo no debe conservar el orden de extracción.'
);
const differentAttempt = selectTopicPracticeQuestions({
  questions: eightyUnique,
  targetCount: 80,
  complete: true,
  sections,
  random: seededRandom(21),
});
assert.notDeepEqual(
  complete.map((item) => item.id),
  differentAttempt.map((item) => item.id),
  'Una nueva práctica completa debe poder presentar un orden distinto.'
);
const completeWithoutSections = selectTopicPracticeQuestions({
  questions: eightyUnique,
  targetCount: 80,
  complete: true,
  sections: [],
  random: seededRandom(7),
});
assert.deepEqual(
  complete.map((item) => item.id),
  completeWithoutSections.map((item) => item.id),
  'El orden aleatorio de Completo no debe depender de los capítulos.'
);
const coverage = selectTopicPracticeQuestions({
  questions: eightyUnique,
  targetCount: 32,
  sections,
});
assert.equal(coverage.length, 32, 'Cobertura usa la cantidad elegida.');
assert.deepEqual(
  new Set(coverage.map((item) => item.topic)),
  new Set(sections.map((section) => section.title)),
  'Cobertura incluye todas las secciones evaluables de la muestra.'
);
const originalDraft: PracticeDraft = {
  version: 1,
  materialId: 'test-pdf',
  bankSignature: practiceBankSignature(eightyUnique),
  questionIds: complete.map((item) => item.id),
  selectedSize: 80,
  currentIndex: 37,
  selectedAnswers: { [complete[0]!.id]: complete[0]!.type === 'multiple_choice' ? complete[0]!.options[0]! : 'n/a' },
  openDrafts: { [complete.find((q) => q.type === 'open')!.id]: 'Mi respuesta escrita' },
  revealed: { [complete[0]!.id]: true },
  openAssessments: { [complete.find((q) => q.type === 'open')!.id]: 'review' },
  answerIds: { [complete[0]!.id]: 'record-id-1' },
  contextUnavailable: false,
  savedAt: Date.now(),
};
const restored = readPracticeDraft(JSON.stringify(originalDraft), 'test-pdf', eightyUnique);
assert.ok(restored, 'La práctica guardada debe poder reanudarse tras recargar.');
assert.deepEqual(restored!.questionIds, originalDraft.questionIds,
  'La práctica guardada debe conservar el orden aleatorio original.');
assert.equal(restored!.currentIndex, 37);
assert.deepEqual(restored!.openDrafts, originalDraft.openDrafts);
assert.deepEqual(restored!.openAssessments, originalDraft.openAssessments);
const compatibleRegeneration = [
  ...eightyUnique,
  { ...eightyUnique[0]!, id: 'new-question-introduced-in-v12' },
];
assert.notEqual(practiceBankSignature(compatibleRegeneration), originalDraft.bankSignature);
const upgradedDraft = readPracticeDraft(
  JSON.stringify(originalDraft), 'test-pdf', compatibleRegeneration
);
assert.ok(upgradedDraft, 'Una regeneración debe preservar respuestas si las preguntas de la tanda siguen intactas.');
assert.equal(upgradedDraft!.bankSignature, practiceBankSignature(compatibleRegeneration));
assert.deepEqual(upgradedDraft!.questionIds, originalDraft.questionIds);
assert.deepEqual(upgradedDraft!.selectedAnswers, restored!.selectedAnswers);

assert.equal(practiceDraftKey('test-pdf'), 'evaluo:practice-draft:v1:test-pdf');
assert.equal(readPracticeDraft(JSON.stringify(originalDraft), 'other-pdf', eightyUnique), null);
assert.equal(readPracticeDraft(JSON.stringify(originalDraft), 'test-pdf', eightyUnique.slice(1)), null,
  'Un banco regenerado no puede recuperar una práctica obsoleta.');
assert.equal(readPracticeDraft(JSON.stringify({ ...originalDraft, savedAt: 1 }), 'test-pdf', eightyUnique), null,
  'Los intentos guardados expiran para no acumular datos indefinidamente.');
assert.equal(readPracticeDraft(JSON.stringify({
  ...originalDraft, questionIds: [...originalDraft.questionIds, originalDraft.questionIds[0]],
}), 'test-pdf', eightyUnique), null,
  'No recuperar una práctica con preguntas duplicadas o alteradas.');
console.log('topic-practice.smoke: OK');
