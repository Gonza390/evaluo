import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { topicPracticeResultActions } from '../lib/student-materials/topic-practice-result-actions.ts';

// Todas las combinaciones acordadas: con y sin errores, con y sin tema siguiente.
assert.deepEqual(topicPracticeResultActions(true, true), ['reinforce', 'next_topic']);
assert.deepEqual(topicPracticeResultActions(true, false), ['reinforce', 'all_topics']);
assert.deepEqual(topicPracticeResultActions(false, true), ['next_topic', 'retry']);
assert.deepEqual(topicPracticeResultActions(false, false), ['all_topics', 'retry']);

const exam = readFileSync('components/student-material-exam.tsx', 'utf8');
const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const topicStart = exam.indexOf('    if (!isSimulation && topicSectionIndex !== undefined) {', exam.indexOf('  if (finished) {'));
const generalStart = exam.indexOf('    if (!isSimulation && topicSectionIndex === undefined) {', topicStart);
assert.ok(topicStart > 0 && generalStart > topicStart, 'Las pantallas por tema y general deben permanecer separadas.');
const topicResult = exam.slice(topicStart, generalStart);
const generalResult = exam.slice(generalStart, exam.indexOf('    return (\n      <div className="mx-auto max-w-4xl', generalStart));
assert.match(topicResult, /Detectamos qué necesitás reforzar/);
assert.match(topicResult, /Reforzar mis errores/);
assert.match(topicResult, /Seguir al siguiente tema/);
assert.match(topicResult, /Ver todos mis temas/);
assert.match(topicResult, /Practicar de nuevo/);
assert.match(topicResult, /aria-label=\{\`Resultado:/);
assert.doesNotMatch(topicResult, /[Rr]espuestas correctas/);
assert.doesNotMatch(topicResult, /Tu próximo objetivo|Terminar por hoy|Volver al tema|pregunta para revisar/);
assert.doesNotMatch(topicResult, /\['recordar', 'comprender', 'aplicar'\]/);
assert.match(topicResult, /onReturnToTopic\(true, \{/);
assert.match(topicResult, /onStudyNextTopic\(nextTopicIndex\)/);
assert.match(topicResult, /onViewAllTopics\(\)/);
assert.match(topicResult, /onClick=\{\(\) => handleResultAction\(primaryAction\)\}/);
assert.match(topicResult, /onClick=\{\(\) => handleResultAction\(secondaryAction\)\}/);
assert.match(generalResult, /Así te fue por tema/, 'No alterar el resumen del PDF completo.');
assert.match(workspace, /onStudyNextTopic=\{/);
assert.match(workspace, /setTopicReturn\(\{ index, reinforce: false \}\);/);
assert.match(workspace, /onViewAllTopics=\{/);
assert.match(workspace, /setTopicReturn\(null\);/);
