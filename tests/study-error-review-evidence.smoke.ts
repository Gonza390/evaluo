import assert from 'node:assert/strict';
import {
  MIN_REVIEW_EVIDENCE_LENGTH,
  selectBestReviewEvidenceChunk,
} from '../lib/study-error-review-evidence.ts';

function score(chunk: string, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length >= 4);
  const normalized = chunk.toLowerCase();
  return terms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0);
}

const shortSavedExcerpt =
  'La physis es el principio natural del que surge la realidad.';
assert.ok(
  shortSavedExcerpt.length < MIN_REVIEW_EVIDENCE_LENGTH,
  'La referencia del caso debe reproducir el borde inferior a 60 caracteres.'
);

const chunks = [
  {
    chunk_text:
      'Este bloque pertenece a la misma página, pero desarrolla un tema distinto y no explica el concepto que se está repasando.',
    page_start: 11,
    page_end: 11,
    section_title: 'Introducción',
  },
  {
    chunk_text:
      'La physis designa el principio natural y dinámico desde el cual los filósofos presocráticos explican el origen y transformación de la realidad.',
    page_start: 11,
    page_end: 11,
    section_title: 'Physis',
  },
  {
    chunk_text:
      'La physis es un concepto central para comprender el principio natural, el origen y la transformación de todo lo real según los presocráticos.',
    page_start: 22,
    page_end: 22,
    section_title: 'Otra sección',
  },
];

const selected = selectBestReviewEvidenceChunk(
  chunks,
  `Physis principio natural realidad ${shortSavedExcerpt}`,
  { pageStart: 11, pageEnd: 11, sectionTitle: 'Physis' },
  score
);

assert.ok(selected, 'Debe encontrar un chunk alternativo cuando la referencia guardada es corta.');
assert.equal(selected?.page_start, 11, 'Debe priorizar la página original del error.');
assert.equal(selected?.section_title, 'Physis', 'Debe priorizar la sección original cuando existe.');
assert.ok(
  (selected?.text.length ?? 0) >= MIN_REVIEW_EVIDENCE_LENGTH,
  'La evidencia alternativa debe superar el mínimo necesario para comprobar.'
);

const lexicalFallback = selectBestReviewEvidenceChunk(
  [
    {
      chunk_text:
        'El nous organiza y ordena la materia según la explicación de Anaxágoras, funcionando como principio inteligente diferenciador.',
      page_start: 30,
      page_end: 30,
      section_title: 'Anaxágoras',
    },
  ],
  'Anaxágoras nous principio inteligente organiza materia',
  { pageStart: null, pageEnd: null, sectionTitle: null },
  score
);
assert.ok(lexicalFallback, 'Sin página guardada debe mantenerse el fallback por similitud textual.');

const insufficient = selectBestReviewEvidenceChunk(
  [
    {
      chunk_text: 'Fragmento demasiado breve.',
      page_start: 11,
      page_end: 11,
      section_title: 'Physis',
    },
  ],
  'Physis',
  { pageStart: 11, pageEnd: 11, sectionTitle: 'Physis' },
  score
);
assert.equal(
  insufficient,
  null,
  'Si el PDF realmente no ofrece evidencia suficiente, la comprobación debe seguir bloqueándose.'
);

console.log('Study error review evidence smoke tests passed.');
