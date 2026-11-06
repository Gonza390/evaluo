import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('components/dashboard/pdf-progress-panel.tsx', 'utf8');
const data = readFileSync('lib/student-materials/progress.ts', 'utf8');

assert.match(screen, /data-progress-overview/, 'La vista general mantiene la tarjeta de resumen visual.');
assert.match(screen, /data-progress-topic-row/, 'Cada tema tiene una fila compacta con acción.');
assert.match(screen, /data-recommended-topics/, 'El listado de temas sigue dentro de su panel.');
assert.match(screen, /aria-label=(?:"Actividad recomendada"|\{tr\("Actividad recomendada","Recommended activity"\)\})/, 'Se conserva la recomendación de estudio.');
assert.match(screen, /onClick=\{\(\) => openTopic\(recommendedTopic\.id\)\}/, 'La recomendación abre el tema.');
assert.match(screen, /onPracticeTopic\?\.\(questionIndex\)/, 'Comprobar y evaluar pueden ir directo a la práctica.');
assert.match(screen, /else openTopic\(topic\.id\)/, 'La acción vuelve al detalle si la práctica no está disponible.');
assert.match(screen, /getTopicStudyResources/, 'Los recursos de los temas siguen conectados.');
assert.match(screen, /data-tour-example-topic/, 'El onboarding de progreso conserva su ejemplo visual.');
assert.match(screen, /data-tour-progress-disclaimer/, 'Los datos ilustrativos se identifican correctamente.');
assert.match(screen, /unmatched\.length > 0/, 'Los errores sin asociación no desaparecen.');
assert.match(screen, /topicAssessmentCount\(topic\) > 0/, 'La comprobación se basa en preguntas reales.');
assert.match(screen, /selfReported > 0/, 'Se distingue la autoevaluación de una pregunta corregida.');
assert.match(screen, /state === 'reviewed'/, 'Los repasos históricos también cuentan como actividad, sin presentarlos como dominio.');
assert.doesNotMatch(screen, /setFilter\(|aria-label="Filtrar temas"/, 'La nueva vista no incluye los filtros eliminados.');
assert.doesNotMatch(screen, /Compartir/, 'No se añade una acción de compartir sin funcionalidad.');
assert.match(screen, /xl:grid-cols-\[minmax\(0,1fr\)_minmax\(0,300px\)\]/, 'La recomendación queda al lado sólo cuando hay espacio real.');
assert.match(screen, /sm:grid-cols-\[30px_minmax\(0,1fr\)_auto_auto\]/, 'Las filas conservan una distribución legible al ampliar la pantalla.');
assert.match(data, /unmatchedEvidence/, 'No se inventa correspondencia para registros difíciles de clasificar.');
console.log('Progreso rediseñado: datos reales, responsive, acciones y onboarding — OK.');
