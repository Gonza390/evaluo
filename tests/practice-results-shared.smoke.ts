import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const screen = read('components/dashboard/practice-results-screen.tsx');
const practice = read('components/dashboard/practice-session.tsx');
const cards = read('components/student-material-flashcards.tsx');
const gallery = read('components/dashboard/practice-results-demo.tsx');
const preview = read('app/(es)/dashboard/practicar/resultados-demo/page.tsx');

assert.match(screen, /data-practice-results-screen/);
assert.match(screen, /font-sans/, 'El resultado usa la fuente Inter del sistema Evaluo.');
assert.match(screen, /bg-transparent font-sans/, 'La pantalla comparte el fondo blanco nativo, sin tarjeta exterior.');
assert.doesNotMatch(screen, /border-b border-\[#E7EBF4\]/, 'No hay divisor de cabecera a ancho completo.');
assert.match(screen, /text-\[21px\].*sm:text-\[24px\]/, 'El título mantiene la misma escala que las pantallas de práctica.');
assert.match(screen, /sm:text-\[14px\]/, 'Las preguntas mantienen el tamaño habitual de Evaluo.');
assert.match(screen, /entries\.filter\(\(entry\) => !entry\.correct\)/, 'Las respuestas incorrectas siguen visibles primero.');
assert.match(screen, /entries\.filter\(\(entry\) => entry\.correct\)/, 'Las respuestas correctas también se conservan.');
assert.match(screen, /data-practice-correct-results/, 'Hay una sección visible para respuestas correctas.');
assert.match(screen, /Respuestas correctas/, 'Las preguntas acertadas aparecen al pie del resultado.');
assert.ok(screen.indexOf('data-practice-correct-results') > screen.indexOf('mistakes.map'), 'Las correctas van después de los errores.');
assert.ok(screen.indexOf('data-practice-correct-results') < screen.indexOf('<ResultButton action={primaryAction}'), 'Las correctas van antes de las acciones finales.');
assert.doesNotMatch(screen, /Estas son las preguntas que fallaste/, 'Sin descripción redundante de los errores.');
assert.doesNotMatch(screen, /respuestas? para repasar/, 'Sin contador redundante.');
assert.doesNotMatch(screen, /· Vista previa|Vista previa: resultados ficticios/, 'Sin referencias a preview dentro del resultado.');
assert.doesNotMatch(screen, /selectedTopic|setSelectedTopic|Filtrar por tema|Todos \(\{mistakes\.length\}\)/, 'Las pantallas finales no presentan filtros por tema.');
assert.match(screen, /mistakes\.map/, 'Todas las respuestas incorrectas siguen visibles, sin filtros.');
assert.match(screen, /<details/, 'Cada error conserva un detalle expandible.');
assert.match(screen, /TU RESPUESTA/);
assert.match(screen, /RESPUESTA CORRECTA/);
assert.match(screen, /CONCEPTO A RECORDAR/, 'Flashcards usa terminología de autoevaluación.');
assert.match(screen, /Repasar el resumen del tema/);
assert.match(screen, /documentLabel/, 'El enlace al material permite PDF y DOCX.');
assert.match(practice, /<PracticeResultsScreen/);
assert.match(practice, /if \(ready && finished && fullReport\) return fullReport/);
assert.match(practice, /saveCompletedSession\(\)/, 'El guardado real no se altera.');
assert.doesNotMatch(practice, /Este resultado es orientativo y todavía no modifica tu progreso de aprendizaje/, 'No mostrar una aclaración engañosa después de guardar una práctica.');
assert.match(cards, /<PracticeResultsScreen/);
assert.match(cards, /onClick: onPracticeTopic \?\? onReturnToTopic/);
assert.match(cards, /onClick: reviewDifficult/);
assert.match(cards, /onClick: scheduleTomorrowReminder/);

for (const mode of ['opciones', 'unir', 'casos', 'completar', 'mixto', 'simulacro', 'flashcards', 'flashcards_tema']) {
  assert.ok(gallery.includes("type: '" + mode + "'"), 'Falta vista previa de ' + mode);
}
assert.match(preview, /NODE_ENV !== 'development'/, 'Las vistas previas nunca se sirven en producción.');
assert.match(gallery, /previewResult=\{DEMO_SCORE\}/, 'Los resultados de práctica usan muestra sin guardado.');
assert.match(gallery, /min-h-full bg-white/, 'La galería conserva el fondo blanco habitual de Practicar.');
assert.doesNotMatch(gallery, /min-h-screen bg-\[#F5F7FB\]/, 'No debe reintroducirse el fondo gris en una página blanca.');
assert.match(gallery, /demoMode\s+previewFinished/, 'Flashcards muestra cierre ficticio sin persistencia.');

console.log('Resultados compactos compartidos: formatos, tipografía, navegación y preview — OK.');
