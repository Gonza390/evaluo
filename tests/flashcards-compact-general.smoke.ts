import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cards = readFileSync('components/student-material-flashcards.tsx', 'utf8');

assert.match(cards, /max-w-\[720px\] space-y-3/,
  'Las Flashcards generales deben ser un módulo compacto y centrado.');
assert.match(cards, /topicMode \? 'max-w-\[610px\]' : 'max-w-\[720px\]'/,
  'La tarjeta general no debe expandirse hasta los bordes del lector.');
assert.match(cards, /topicMode \? 'h-\[190px\] sm:h-\[205px\]' : 'h-\[188px\] sm:h-\[210px\]'/,
  'Las alturas de ambos modos deben ser compactas.');
assert.doesNotMatch(cards, /Preparando tarjeta…/,
  'La pregunta debe renderizarse desde SSR sin quedar tapada por un placeholder.');
assert.match(cards, /disabled=\{!flipReady\}/,
  'El clic se habilita cuando React conecta los manejadores.');
assert.match(cards, /\{flipped \? \(/);
assert.match(cards, /data-flashcard-face="front"/);
assert.match(cards, /data-flashcard-face="back"/);
assert.match(cards, /\{displayFront\}/);
assert.match(cards, /\{currentCard\.back\}/);
assert.ok(cards.includes('onClick={flipCard}'));
assert.match(cards, /topicMode \? 'max-w-\[610px\]' : 'max-w-\[720px\]'\)\}>\{recallControls\}<\/div>/,
  'Las dos calificaciones deben mantenerse visibles bajo la tarjeta.');
console.log('Flashcards general compact and visible smoke: OK.');
