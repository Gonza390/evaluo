import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldOfferTopicGlossaryPractice } from '../lib/student-materials/topic-study-resources.ts';

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
assert.match(cards, /onClick=\{onPracticeTopic \?\? onReturnToTopic\}/, 'Priorizar la práctica y permitir regresar si el tema no tiene preguntas.');
assert.match(workspace, /onReturnToTopic=\{/, 'El regreso debe conservar el capítulo seleccionado.');

assert.equal(shouldOfferTopicGlossaryPractice(0, 10, 6), false,
  'Con 10 conceptos no debe agregarse una invitación al final.');
assert.equal(shouldOfferTopicGlossaryPractice(0, 11, 6), true,
  'Con 11 conceptos del mismo tema sí debe aparecer.');
assert.equal(shouldOfferTopicGlossaryPractice(null, 30, 6), false,
  'El glosario general nunca debe añadir la invitación.');
assert.equal(shouldOfferTopicGlossaryPractice(0, 20, 0), false,
  'No ofrecer un enlace a práctica sin preguntas fiables.');
assert.equal(shouldOfferTopicGlossaryPractice(1, 25, 3), true,
  'La decisión aplica a cualquier capítulo, no solo al primero.');
assert.match(workspace, /const showLongTopicGlossaryPracticeCta = shouldOfferTopicGlossaryPractice\(/,
  'La condición por longitud debe controlar el CTA.');
assert.match(workspace, /showLongTopicGlossaryPracticeCta && glossaryTopicIndex !== null/,
  'El footer de práctica requiere el contexto de un tema.');
assert.match(workspace, /data-topic-glossary-practice-cta/,
  'Debe existir un footer accesible de continuación.');
assert.match(workspace, /onClick=\{\(\) => startChapterEvaluation\(glossaryTopicIndex\)\}/,
  'El footer debe abrir la práctica de ese mismo tema.');
const glossaryListPosition = workspace.indexOf('glossaryItemsToShow.map((item)');
const glossaryFooterPosition = workspace.indexOf('data-topic-glossary-practice-cta');
const flashcardsTabPosition = workspace.indexOf('value="tarjetas"', glossaryFooterPosition);
assert.ok(glossaryListPosition >= 0 &&
  glossaryFooterPosition > glossaryListPosition &&
  flashcardsTabPosition > glossaryFooterPosition,
  'La invitación debe aparecer debajo de los términos, sin afectar Flashcards.');


