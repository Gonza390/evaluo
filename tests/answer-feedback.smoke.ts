import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const feedback = read('components/study/answer-feedback.tsx');
const screens = read('components/dashboard/practice-visual-screens.tsx');
const session = read('components/dashboard/practice-session.tsx');
const exam = read('components/student-material-exam.tsx');

// Una sola explicación: lo que eligió, por qué, y la página del apunte.
assert.match(feedback, /No era «\$\{chosenText\}»/, 'El error dice qué eligió el estudiante.');
assert.match(feedback, /de tu apunte/, 'Muestra la página del apunte.');
assert.match(feedback, /Ver en mi PDF/, 'Permite abrir el PDF en esa página.');
assert.match(feedback, /!correct && savedToErrors/, 'Mis errores solo se menciona cuando se guarda de verdad.');
assert.match(feedback, /!correct && text \?/, 'Al acertar no se muestra la explicación larga.');
assert.doesNotMatch(feedback, /fetch\(|Action\(/, 'La corrección no genera texto nuevo con IA.');

// Casos y Mixto usan la misma pieza y marcan rojo/verde en las opciones.
for (const name of ['CasesPracticeScreen', 'MixedPracticeScreen']) {
  const start = screens.indexOf(`export function ${name}(`);
  const end = screens.indexOf('\nexport function ', start + 10);
  const body = screens.slice(start, end === -1 ? undefined : end);
  assert.match(body, /<AnswerFeedback/, `${name} usa la corrección compartida.`);
  assert.match(body, /answeredOptionClass\(state\)/, `${name} marca la opción elegida y la correcta.`);
  assert.match(body, /\{!checked\s*&&\s*<div/, `${name} oculta Anterior/Saltar después de responder.`);
}
assert.match(session, /tab=resumen&page=/, 'El enlace abre el PDF en la página citada.');
assert.match(session, /!isWord \? pdfPageHref/, 'Los Word no muestran enlaces a páginas.');

// Práctica principal: la explicación ya no se repite en 3 bloques.
assert.match(exam, /<AnswerFeedback[\s\S]*explanation=\{groundedMistakeContrast \|\| current\.explanation\}/,
  'La práctica muestra una sola explicación.');
assert.doesNotMatch(exam, /Por qué esa opción no era la correcta/, 'Sin el bloque repetido.');
assert.match(exam, /savedToErrors=\{!isCorrect\}/, 'La práctica guarda errores en Mis errores y lo avisa.');

// Verdadero o falso, resultados de práctica/simulacro y resultados de la práctica del PDF.
const results = read('components/dashboard/practice-results-screen.tsx');
assert.match(feedback, /Era «\$\{correctText\}»/, 'En resultados se muestra la correcta en verde.');
assert.match(session, /current\.type === 'question' && <div role="status" className="mt-4">\s*<AnswerFeedback/,
  'Verdadero o falso usa la corrección compartida.');
assert.match(session, /answeredOptionClass\(normalizedAnswer\(option\)/, 'Verdadero o falso marca rojo y verde.');
assert.match(results, /<AnswerFeedback[\s\S]*correctAnswer=\{entry\.correctAnswer\}/,
  'Los resultados (práctica y simulacro) usan la corrección compartida.');
assert.match(results, /flashcards \?/, 'Flashcards conservan su resultado propio.');
assert.match(exam, /correctAnswer=\{question\.answer\}/, 'El resultado de la práctica del PDF usa la misma pieza.');

console.log('[answer-feedback] una sola explicación en práctica, casos, mixto, verdadero o falso y resultados.');
