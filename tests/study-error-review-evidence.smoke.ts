import assert from 'node:assert/strict';
import { selectReviewCheckEvidence } from '../lib/study-error-review-evidence.ts';

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
console.log('Study error review evidence smoke tests passed.');
