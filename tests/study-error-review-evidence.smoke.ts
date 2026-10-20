import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { selectReviewCheckEvidence } from '../lib/study-error-review-evidence.ts';
import { isDistinctReviewQuestion, validateReviewQuestion } from '../lib/study-error-review-contract.ts';

const original =
  'Su aplicación sobre enunciados empíricos de primer nivel permite obtener una generalización empírica.';
const relevant =
  'ENUNCIADOS: La aplicación del método inductivo sobre enunciados empíricos de primer nivel permite obtener una generalización empírica sobre esos hechos. El material diferencia los enunciados empíricos básicos, empíricos generales y teóricos.';
const unrelated =
  'La evaluación docente analiza los horarios administrativos y la asistencia durante el ciclo lectivo, sin estudiar los argumentos del alumno.';
const question =
  '¿Qué relación establece el material entre Método inductivo y Generalización empírica?';

const found = selectReviewCheckEvidence({
  originalExcerpt: original,
  topic: 'Método inductivo ↔ Generalización empírica',
  question,
  correctAnswer: original,
  page: 4,
  chunks: [
    { chunk_index: 4, chunk_text: unrelated, page_start: 3, page_end: 3 },
    { chunk_index: 7, chunk_text: relevant, page_start: 4, page_end: 4 },
  ],
});
assert.equal(found.mode, 'source_chunks');
assert.equal(found.chunkCount, 1);
assert.ok(found.excerpt?.includes('La aplicación del método inductivo'));
assert.ok(found.excerpt!.length > original.length);

const noMatch = selectReviewCheckEvidence({
  originalExcerpt: original,
  topic: 'Método inductivo ↔ Generalización empírica',
  question,
  correctAnswer: original,
  page: 4,
  chunks: [{ chunk_index: 4, chunk_text: unrelated, page_start: 4, page_end: 4 }],
});
assert.equal(noMatch.mode, 'original_reference');
assert.equal(noMatch.excerpt, original);

const missing = selectReviewCheckEvidence({
  originalExcerpt: null,
  topic: null,
  question: '¿Qué aprendimos?',
  correctAnswer: null,
  page: null,
  chunks: [],
});
assert.equal(missing.mode, 'missing');
assert.equal(missing.excerpt, null);

// Evitar que un PDF grande infle el prompt o use material de páginas ajenas.
const longText = relevant.repeat(40);
const bounded = selectReviewCheckEvidence({
  originalExcerpt: original,
  topic: 'Método inductivo',
  question,
  correctAnswer: original,
  page: 4,
  chunks: [{ chunk_index: 7, chunk_text: longText, page_start: 4, page_end: 4 }],
});
assert.ok((bounded.excerpt?.length ?? 0) <= 2900);
// El refuerzo tiene que evaluar el mismo concepto con una tarea diferente,
// no permitir respuestas repetidas o la misma pregunta con sinónimos.
assert.equal(
  isDistinctReviewQuestion(
    '¿Cuál de las siguientes definiciones describe correctamente la epistemología?',
    'Según el PDF, ¿qué describe correctamente Epistemología?'
  ),
  false
);
assert.equal(
  isDistinctReviewQuestion(
    'Una alumna analiza cómo se fundamentan y justifican los conocimientos de la ciencia. ¿Qué campo estudia esa tarea?',
    'Según el PDF, ¿qué describe correctamente Epistemología?'
  ),
  true
);
const sourceExcerpt =
  'La epistemología es una reflexión racional, ordenada y sistemática acerca de la ciencia y su objetivo.';
const answerCandidate = {
  supported: true as const,
  question: 'Una alumna analiza cómo se fundamentan y justifican los conocimientos de la ciencia. ¿Qué campo estudia esa tarea?',
  options: [
    'La epistemología, porque reflexiona sobre los fundamentos del conocimiento científico.',
    'La tecnología, porque convierte los descubrimientos en productos.',
    'La estadística, porque calcula la frecuencia de fenómenos.',
  ],
  correctIndex: 0,
  feedback: 'La epistemología analiza racionalmente los fundamentos de la ciencia.',
  evidenceQuote: sourceExcerpt,
};
assert.ok(
  validateReviewQuestion(
    answerCandidate,
    sourceExcerpt,
    'Según el PDF, ¿qué describe correctamente Epistemología?'
  )
);
assert.equal(
  validateReviewQuestion(
    { ...answerCandidate, question: '¿Cuál de las siguientes definiciones describe correctamente la epistemología?' },
    sourceExcerpt,
    'Según el PDF, ¿qué describe correctamente Epistemología?'
  ),
  null
);
const panelSource = readFileSync('components/dashboard/pdf-progress-panel.tsx', 'utf8');
const detailSource = readFileSync('components/dashboard/study-error-detail.tsx', 'utf8');
assert.doesNotMatch(panelSource, /Cambiar pregunta de repaso/);
assert.doesNotMatch(detailSource, /Pasos para reforzar una dificultad/);
assert.match(detailSource, /Comprobar lo aprendido/);
console.log('Study error review evidence smoke tests passed.');
