import assert from 'node:assert/strict';
import {
  buildPracticeTopicResults,
  visiblePracticeTopicResults,
} from '../lib/student-materials/practice-result-topics.ts';

const questions = [
  { id: 'q1', topic: 'Metodología', type: 'multiple_choice' },
  { id: 'q2', topic: 'Metodología', type: 'multiple_choice' },
  { id: 'q3', topic: 'Epistemología', type: 'multiple_choice' },
  { id: 'q4', topic: 'Estructura conceptual', type: 'multiple_choice' },
  { id: 'q5', topic: 'Ciencia y tecnología', type: 'open' },
];
const correctIds = new Set(['q5']);
const scores = buildPracticeTopicResults(
  questions,
  (question) => question.topic,
  (question) => correctIds.has(question.id),
  new Map([['Metodología', 6], ['Ciencia y tecnología', 4]])
);

assert.equal(scores.length, 4, 'La práctica evalúa cuatro temas.');
assert.equal(scores.reduce((total, topic) => total + topic.total, 0), 5);
assert.equal(
  scores.reduce((correct, topic) => correct + topic.correct, 0),
  1,
  'El resumen por tema debe coincidir con el resultado general 1/5, incluso con preguntas abiertas.'
);
assert.equal(scores[3]?.title, 'Ciencia y tecnología', 'El tema acertado puede quedar último tras ordenar por dificultad.');
assert.deepEqual(
  visiblePracticeTopicResults(scores).map((topic) => topic.correct),
  [0, 0, 0, 1],
  'La pantalla debe mostrar el único acierto aunque haya más de tres temas.'
);
const many = [
  ...Array.from({ length: 6 }, (_, index) => ({
    title: `Pendiente ${index}`, total: 2, correct: 0, bankSize: 3,
  })),
  { title: 'Ya acertado', total: 1, correct: 1, bankSize: 4 },
];
const visible = visiblePracticeTopicResults(many);
assert.equal(visible.length, 5);
assert.ok(visible.some((topic) => topic.title === 'Ya acertado'),
  'Cuando hay más de cinco temas, el bloque debe mostrar también el mejor.');
assert.equal(visiblePracticeTopicResults(many, 5).length, 5);
assert.equal(visiblePracticeTopicResults(many.slice(0, 4), 5).length, 4);

