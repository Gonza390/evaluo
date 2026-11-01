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
assert.match(cards, /grid w-full grid-cols-3 items-center gap-1/,
  'Los indicadores Mal, Aprendiendo y Bien se distribuyen en tres columnas.');
assert.match(cards, /data-flashcards-bad className="justify-self-start/,
  'Mal se alinea a la izquierda.');
assert.match(cards, /data-flashcards-learning className="justify-self-center/,
  'Aprendiendo se centra.');
assert.match(cards, /data-flashcards-good className="justify-self-end/,
  'Bien se alinea a la derecha.');
assert.match(cards, /topicMode \? 'max-w-\[640px\] space-y-2\.5' : 'max-w-\[720px\] space-y-3'/,
  'No desplazar el contenedor completo de Flashcards.');
assert.equal(cards.match(/topicMode \? "pt-7 pb-3" : "py-3"/g)?.length, 2,
  'Bajar suavemente el contenido dentro de ambas caras de la tarjeta.');

assert.match(cards, /flex w-full items-center justify-between gap-3/,
  'Los botones de calificación se separan a extremos opuestos.');
assert.match(cards, /min-w-\[112px\] shrink-0 rounded-lg border-red-200/,
  'El botón de Mal permanece compacto.');
assert.match(cards, /min-w-\[112px\] shrink-0 rounded-lg border-emerald-200/,
  'El botón de Bien permanece compacto.');
console.log('Flashcards general compact and visible smoke: OK.');
