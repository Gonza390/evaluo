import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const popup = readFileSync('components/study/summary-chapter-finish.tsx', 'utf8');
const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const flashcards = readFileSync('components/student-material-flashcards.tsx', 'utf8');

assert.match(popup, /onClick=\{\(\) => onOpenResource\('tarjetas'\)\}/,
  'Flashcards del popup deben navegar a su apartado.');
assert.match(popup, /onClick=\{\(\) => onOpenResource\('glosario'\)\}/,
  'Glosario del popup debe navegar a su apartado.');
assert.doesNotMatch(popup, /Tarjeta \{cardIndex \+ 1\} de/,
  'El popup no debe contener un segundo visor de flashcards.');
assert.doesNotMatch(popup, /reviewMode === 'glossary'/,
  'El popup no debe mostrar el glosario en línea.');

assert.match(workspace, /getTopicStudyResources\(studySummary\.sections, usefulGlossary, studyArtifacts\.flashcards, index\)/,
  'El filtrado debe usar asociaciones verificables de cada capítulo.');
assert.match(workspace, /setTopicResource\(\{ index, tab \}\)/,
  'Debe retener el capítulo mientras se utiliza el apartado de repaso.');
assert.match(workspace, /setTopicResource\(null\);/,
  'Al entrar por una pestaña normal se debe desactivar el filtro.');
assert.match(workspace, /onOpenResource=\{\(tab\) => openTopicResource\(chapterFinishIndex, tab\)\}/);
assert.match(workspace, /data-topic-resource-context=\{tab\}/);
assert.match(workspace, /renderTopicResourceHeader\('tarjetas'\)/);
assert.match(workspace, /renderTopicResourceHeader\('glosario'\)/);
assert.match(workspace, /glossaryItemsToShow\.map\(\(item\)/);
assert.match(workspace, /matching\.has\(card\) \? \[index\] : \[\]/,
  'La sesión filtrada debe pasar índices originales en lugar de reenumerar tarjetas.');
assert.match(workspace, /cardIndexes=\{topicCardIndexes\}/);
assert.match(workspace, /onClick=\{\(\) => returnToSummaryTopic\(index\)\}/);
assert.match(workspace, /onClick=\{\(\) => startChapterEvaluation\(index\)\}/);
assert.match(workspace, /setSummaryReturnIndex\(index\)/,
  'Volver al tema debe restaurar el capítulo leído.');

assert.match(flashcards, /cardIndexes\?: number\[\]/);
assert.match(flashcards, /const \[started, setStarted\] = useState\(demoMode \|\| cardIndexes !== undefined\)/,
  'Al llegar desde un tema se deben mostrar las tarjetas sin un segundo inicio.');
assert.match(flashcards, /buildSessionOrder\(recallByCard, eligibleIndexes\)/);
assert.match(flashcards, /const eligible = new Set\(eligibleIndexes\)/,
  'El repaso posterior no debe introducir tarjetas de otros temas.');
assert.match(flashcards, /itemKey: `flashcard:\$\{currentCardIndex\}`/,
  'Persistencia: conservar el índice global al guardar respuestas.');
assert.match(flashcards, /const storageKey = `evaluo:flashcards:\$\{materialId\}`/,
  'El repaso por tema y el general deben compartir el estado del PDF.');
assert.match(flashcards, /if \(allReviewed\)/,
  'No cambiar aún la pantalla final de flashcards.');
