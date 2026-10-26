import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const popup = readFileSync('components/study/summary-chapter-finish.tsx', 'utf8');
const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const cards = readFileSync('components/student-material-flashcards.tsx', 'utf8');

assert.match(popup, /onClick=\{onFlashcards\}/);
assert.match(popup, /onClick=\{onGlossary\}/);
assert.doesNotMatch(popup, /reviewMode === 'glossary'/,
  'No debe repetirse el glosario dentro del popup.');
assert.match(workspace, /getTopicStudyResources\(studySummary\.sections, usefulGlossary, studyArtifacts\.flashcards, index\)/,
  'Los recursos deben pertenecer al tema con evidencia verificable.');
assert.match(workspace, /setFlashcardTopicIndex\(index\)/);
assert.match(workspace, /setGlossaryTopicIndex\(index\)/);
assert.match(workspace, /handleStudyTabChange\('tarjetas', 'summary_chapter'\)/);
assert.match(workspace, /handleStudyTabChange\('glosario', 'summary_chapter'\)/);
assert.match(workspace, /glossaryItemsToShow\.map\(\(item\)/);
assert.doesNotMatch(workspace, /renderTopicResourceHeader\('tarjetas'\)/, 'No mostrar encabezado duplicado en Flashcards por tema.');
assert.match(workspace, /renderTopicResourceHeader\('glosario'\)/);
assert.match(workspace, /onClick=\{\(\) => returnToSummaryTopic\(index\)\}/);
assert.match(workspace, /onClick=\{\(\) => startChapterEvaluation\(index\)\}/);
assert.match(workspace, /setSummaryReturnIndex\(index\)/);
assert.match(workspace, /if \(value === 'tarjetas' && entry !== 'summary_chapter'\) setFlashcardTopicIndex\(null\)/,
  'Entrar a Flashcards por pestaña debe mostrar todo el PDF.');
assert.match(workspace, /if \(value === 'glosario' && entry !== 'summary_chapter'\) setGlossaryTopicIndex\(null\)/,
  'Entrar al Glosario por pestaña debe mostrar todo el PDF.');
assert.match(workspace, /allowedCardIndices=\{flashcardTopicIndices\}/,
  'Filtrar tarjetas por índices globales, sin mezclar progreso guardado.');
assert.match(cards, /useState\(demoMode \|\| allowedCardIndices !== undefined\)/,
  'El recorrido desde un tema debe mostrar directamente las tarjetas.');
assert.match(cards, /const allowed = new Set\(scopedIndices\)/);
assert.match(cards, /itemKey: `flashcard:\$\{currentCardIndex\}`/,
  'Guardar con índices originales del PDF.');
assert.match(cards, /if \(allReviewed\)/,
  'El resultado final queda para un rediseño posterior.');

assert.match(cards, /data-flashcard-topic/, 'El tema aparece dentro de la tarjeta.');
assert.match(cards, /data-flashcards-bad/);
assert.match(cards, /data-flashcards-learning/);
assert.match(cards, /data-flashcards-good/);
assert.doesNotMatch(cards, /data-flashcard-grade="learning"/, 'Aprendiendo es el estado de la tarjeta actual, no un botón de calificación.');
assert.match(cards, /data-flashcard-card/, 'Toda la tarjeta debe ser clicable.');
assert.match(cards, /data-flashcard-ready=\{flipReady\}/, 'La tarjeta sólo se habilita después de hidratar sus eventos.');
assert.match(cards, /disabled=\{!flipReady\}/, 'Mientras React hidrata, no debe parecer interactiva.');
assert.doesNotMatch(cards, /Preparando tarjeta…/, 'La pregunta no debe quedar tapada por una pantalla de carga.');
assert.match(cards, /\{flipped \? \(/, 'La pregunta debe renderizarse desde el inicio.');
assert.ok(cards.includes('onClick={flipCard}'), 'Un único manejador alterna las dos caras.');
assert.match(cards, /data-flashcard-face="front"/);
assert.match(cards, /data-flashcard-face="back"/);
assert.match(cards, /const learningCount = allowedCardIndices !== undefined/, 'Aprendiendo debe representar la tarjeta actual.');
assert.match(cards, /topicMode \? 'max-w-\[610px\]' : 'max-w-\[720px\]'/, 'Las calificaciones se mantienen centradas en ambos modos y en móvil.');
assert.match(cards, /data-topic-flashcards-review/);
assert.match(cards, /data-topic-flashcards-primary/);
assert.doesNotMatch(cards, /onReturnToTopic/, 'El cierre no regresa al Resumen.');
