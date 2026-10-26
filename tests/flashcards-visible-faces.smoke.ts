import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/student-material-flashcards.tsx', 'utf8');
assert.match(source, /data-flashcard-card/);
assert.match(source, /relative isolate block w-full cursor-pointer/);
assert.equal(source.match(/data-flashcard-content/g)?.length, 2,
  'Frente y dorso deben usar una superficie visible y de alto contraste.');
assert.equal(source.match(/relative z-10 flex h-full w-full flex-col items-center/g)?.length, 2,
  'Las caras deben estar por encima de capas decorativas.');
assert.doesNotMatch(source, /motion-safe:animate-in|motion-safe:fade-in|motion-safe:zoom-in-95/,
  'No debe haber animaciones de entrada que oculten el texto.');
assert.match(source, /border-slate-200 bg-white px-4 py-3 text-center text-slate-950/,
  'La tarjeta debe tener fondo blanco y texto oscuro.');
assert.match(source, /onClick=\{\(\) => setFlipped\(\(value\) => !value\)\}/,
  'Un único control alterna pregunta y respuesta.');
assert.match(source, /\{displayFront\}/);
assert.match(source, /\{currentCard\.back\}/);
console.log('Flashcard visible faces smoke: OK.');
