import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cards = readFileSync('components/student-material-flashcards.tsx', 'utf8');

assert.match(cards, /max-w-\[640px\] space-y-2\.5/,
  'Las Flashcards deben ser un módulo compacto y centrado.');
assert.equal((cards.match(/topicMode \? 'max-w-\[610px\]' : 'max-w-\[640px\]'/g) ?? []).length, 2,
  'La tarjeta y sus botones deben compartir un ancho de lectura compacto.');
assert.match(cards, /topicMode \? 'h-\[178px\] sm:h-\[190px\]' : 'h-\[168px\] sm:h-\[182px\]'/,
  'Las alturas de los dos modos dejan lugar a los controles sin scroll innecesario.');
assert.doesNotMatch(cards, /Preparando tarjeta…/,
  'La pregunta debe renderizarse desde SSR sin un placeholder que la tape.');
assert.match(cards, /disabled=\{!flipReady\}/,
  'El clic se habilita cuando React conecta los manejadores.');
assert.match(cards, /\{flipped \? \(/);
assert.match(cards, /data-flashcard-face="front"/);
assert.match(cards, /data-flashcard-face="back"/);
assert.match(cards, /\{displayFront\}/);
assert.match(cards, /\{currentCard\.back\}/);
assert.ok(cards.includes('onClick={flipCard}'));
assert.match(cards, /topicMode \? 'max-w-\[610px\]' : 'max-w-\[640px\]'\)\}>\{recallControls\}<\/div>/,
  'Las dos calificaciones permanecen visibles bajo la tarjeta.');
assert.match(cards, /grid w-full grid-cols-3 items-center gap-1/,
  'Los indicadores Mal, Aprendiendo y Bien se distribuyen en tres columnas.');
assert.match(cards, /data-flashcards-bad className="justify-self-start/,
  'Mal se alinea a la izquierda.');
assert.match(cards, /data-flashcards-learning className="justify-self-center/,
  'Aprendiendo se centra.');
assert.match(cards, /data-flashcards-good className="justify-self-end/,
  'Bien se alinea a la derecha.');
assert.equal((cards.match(/topicMode \? "pt-5 pb-3" : "py-3"/g) ?? []).length, 2,
  'El contenido ocupa el centro de ambas caras sin añadir altura extra.');

assert.match(cards, /mx-auto grid w-full max-w-\[400px\] grid-cols-2 gap-3/,
  'Los botones de calificación deben estar cerca y centrados en dos columnas.');
assert.match(cards, /min-h-11 min-w-0 w-full rounded-lg border-red-200/,
  'No lo sabía ocupa sólo su columna y no genera overflow.');
assert.match(cards, /min-h-11 min-w-0 w-full rounded-lg border-emerald-200/,
  'Lo sabía ocupa sólo su columna y no genera overflow.');
assert.match(cards, /cursor-pointer overflow-hidden rounded-xl bg-white/,
  'La tarjeta tiene una sola superficie, sin capas decorativas sobresalientes.');
assert.doesNotMatch(cards, /max-w-\[720px\]|justify-between gap-3/,
  'No regresar a un mazo excesivamente ancho con botones en los extremos.');
assert.match(cards, /disabled=\{!flipped \|\| isFlipping \|\| advancePhase !== 'idle'\}/,
  'Sólo se permite clasificar después de girar la tarjeta.');
assert.match(cards, /onClick=\{\(\) => markRecall\('unknown'\)\}/);
assert.match(cards, /onClick=\{\(\) => markRecall\('known'\)\}/);

console.log('Flashcards general compact and visible smoke: OK.');
