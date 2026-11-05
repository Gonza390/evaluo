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
assert.match(screen, /entries\.filter\(\(entry\) => !entry\.correct\)/, 'Sólo mostrar respuestas pendientes.');
assert.match(screen, /selectedTopic/, 'Los errores pueden filtrarse por tema.');
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
