import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const flashcards = readFileSync('components/student-material-flashcards.tsx','utf8');
const css = readFileSync('app/globals.css','utf8');

assert.match(flashcards,/data-flashcard-flipping=\{isFlipping\}/);
assert.match(flashcards,/isFlipping && 'animate-flashcard-turn'/);
assert.match(flashcards,/onClick=\{flipCard\}/);
assert.match(flashcards,/window\.setTimeout\(\(\) => setFlipped\(\(current\) => !current\), 210\)/);
assert.match(flashcards,/window\.setTimeout\(\(\) => setIsFlipping\(false\), 440\)/);
assert.match(flashcards,/window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
assert.match(css,/@keyframes evaluo-flashcard-turn/);
assert.match(css,/49\.9% \{ transform: perspective\(1100px\) rotateY\(90deg\); \}/);
assert.match(css,/50% \{ transform: perspective\(1100px\) rotateY\(-90deg\); \}/);
assert.match(css,/animation: evaluo-flashcard-turn 420ms/);
assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
assert.match(flashcards,/data-flashcard-face="front"/);
assert.match(flashcards,/data-flashcard-face="back"/);
assert.doesNotMatch(flashcards,/motion-safe:animate-in|motion-safe:fade-in|motion-safe:zoom-in-95/,
  'El giro no debe reintroducir capas de entrada que oculten el texto.');
assert.equal(flashcards.match(/data-flashcard-content/g)?.length,2,
  'Frente y dorso se generan alternativamente desde un solo panel.');
console.log('Single-surface 3D Flashcards flip regression: OK.');
