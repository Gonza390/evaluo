import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regresión: la práctica de UN tema debe cerrar igual que la práctica general,
// sin alterar el diseño de los resultados aprobado.
const exam = readFileSync('components/student-material-exam.tsx', 'utf8');
const completion = exam.slice(exam.indexOf('  const advanceExam = () => {'));
const finishedResult = exam.slice(exam.indexOf('  if (finished) {'), exam.indexOf('  const advanceExam = () => {'));

assert.match(completion, /if \(!isSimulation\) persistNextObjective\(\);/,
  'Se debe intentar guardar el próximo objetivo tanto para un tema como para todo el PDF.');
assert.doesNotMatch(completion, /if \(topicSectionIndex === undefined\) persistNextObjective\(\);/,
  'No debe volver la condición que omite guardar el objetivo tras la práctica por tema.');

assert.match(finishedResult, /<Link\s+href="\/dashboard"\s+className=/,
  'Terminar por hoy tiene que navegar siempre, incluso si el objetivo está pendiente.');
assert.match(finishedResult, />\s*Terminar por hoy\s*<\/Link>/,
  'Se preserva el texto de la pantalla actual.');
assert.doesNotMatch(finishedResult, /href="\/dashboard"[^>]*onClick=\{/s,
  'No puede bloquearse la salida por estado saving/idle.');
assert.doesNotMatch(finishedResult, /aria-disabled=\{objectiveStatus === 'saving'/,
  'El botón de salida nunca queda deshabilitado por el próximo objetivo.');

assert.match(exam, /Promise\.race\(\[/,
  'El guardado de un objetivo debe tener un tiempo de espera acotado.');
assert.match(exam, /window\.setTimeout\(\(\) => resolve\(\{ success: false \}\), 15_000\)/,
  'Tras 15 segundos un objetivo pendiente pasa a error reintentable.');
assert.match(exam, /objectiveRequestRef\.current !== requestId/,
  'El resultado de un guardado antiguo no debe reemplazar uno nuevo.');
assert.match(exam, /setObjectiveStatus\('error'\)/,
  'El error de guardado debe ser recuperable.');
assert.match(finishedResult, /Reintentar guardar objetivo/,
  'Mantener la opción de reintento si falló el guardado.');
assert.match(finishedResult, /onReturnToTopic\(result\.wrong\.length > 0/,
  'La navegación para entender errores debe seguir funcionando.');
