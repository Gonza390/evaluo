import assert from 'node:assert/strict';
import { buildTopicFlashcards } from '../lib/student-materials/topic-flashcards.ts';

const concept = (term: string, definition: string) =>
  ({ term, definition, context: '', importance: 'alta' }) as never;
const card = (front: string, back: string) =>
  ({ front, back, level: 'recordar', reference: { pageStart: 2, excerpt: 'x' } }) as never;

const concepts = [concept('Empuje', 'Etapa A'), concept('Competencia indirecta', 'Etapa B'),
  concept('Segmentación', 'Etapa C'), concept('Extra', 'Etapa D')];
const cards = [card('f1', 'b1'), card('f2', 'b2'), card('f3', 'b3')];

const deck = buildTopicFlashcards(concepts, cards);
assert.equal(deck.length, 5, 'completa 5 tarjetas');
assert.deepEqual(deck.map(c => c.origin), ['glossary', 'glossary', 'glossary', 'material', 'material']);
assert.match(deck[0]!.front, /Empuje/);

// No duplica una definición ya cubierta por una tarjeta real.
const dup = buildTopicFlashcards([concept('Empuje', 'b1')], cards);
assert.equal(dup.filter(c => c.origin === 'glossary').length, 0);
assert.equal(dup.length, 3);

// Sin conceptos, usa sólo las del material; sin nada, mazo vacío.
assert.equal(buildTopicFlashcards([], cards).length, 3);
assert.equal(buildTopicFlashcards([], []).length, 0);
// Inglés.
assert.match(buildTopicFlashcards([{ ...(concept('Empuje', 'd') as object), englishTerm: 'Push' } as never], [], true)[0]!.front, /Push/);
console.log('topic-flashcards.smoke: OK');
