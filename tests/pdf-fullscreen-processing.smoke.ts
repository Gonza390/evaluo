import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const upload = read('components/dashboard/pdf-first-upload-shell.tsx');
const route = read('app/(es)/dashboard/procesando/[id]/page.tsx');
const screen = read('components/pdf-processing/fullscreen-processing.tsx');
const planPage = read('app/(es)/dashboard/plan-de-estudio/preparar/page.tsx');
const plan = read('components/dashboard/study-plan-setup.tsx');
const materials = read('components/dashboard/student-materials-workspace.tsx');
const motion = read('components/pdf-processing/fullscreen-processing.css');

assert.match(upload, /router\.push\(`\/dashboard\/procesando\/\$\{result\.materialId\}`\)/,
  'The upload must open the full-page experience, not a blocking processing modal.');
assert.match(route, /getStudentMaterialProcessingStateAction\(id\)/,
  'The processing screen must restore the real material status securely.');
assert.match(route, /auth\.getUser\(\)/);
assert.match(screen, /const SCENE_MS = 6500/);
assert.match(screen, /data-processing-scene-motion/, 'Heading and example must transition together.');
assert.match(screen, /data-phase=\{sceneExiting/, 'Outgoing scene must fade before replacement.');
assert.match(screen, /data-processing-layout="organize"/);
assert.match(screen, /data-processing-layout="understand"/);
assert.match(screen, /data-processing-layout="memorize"/);
assert.match(screen, /data-processing-layout="practice"/);
assert.match(motion, /@container processing-scene \(max-width: 879px\)/,
  'Columns must respond to available app width, not browser width.');
assert.match(motion, /prefers-reduced-motion: reduce/, 'Reduced-motion preference must disable transitions.');
assert.match(motion, /data-processing-scene-stage/, 'Stable scene area reduces page jumps.');

for (const heading of [
  'Estamos organizando tu material',
  'Primero, entendé lo importante',
  'Recordá lo que aprendiste',
  'Practicá y descubrí qué reforzar',
  'Tu material está listo para estudiar',
]) assert.ok(screen.includes(heading), 'All five user-provided scenes must be preserved: '+heading);
for (const example of [
  'Elasticidad precio de la demanda',
  'Oferta y demanda',
  'Costos de producción',
  'Bien sustituto',
  'Se mantiene igual',
  'Casi. Así se razona esta pregunta',
]) assert.ok(screen.includes(example), 'Preserve the original academic example: '+example);
assert.match(screen, /Math\.min\(96,Math\.max\(0,state\.progress\)\)/,
  'Never fake 100% before actual ready state.');
assert.match(screen, /state\.status==='ready'/);
assert.match(screen, /fetchStudentMaterialProcessingState\(materialId\)/);
assert.match(screen, /processStudentMaterialAction\(materialId\)/);
assert.match(screen, /Volver a Mi espacio/);
assert.match(screen, /Reintentar/);
assert.match(screen, /Empezar a estudiar/);
assert.match(screen, /Preparar mi plan de estudios/);
assert.match(screen, /\/dashboard\/plan-de-estudio\/preparar\?material=/,
  'Plan action must open the wizard, not the plan landing.');
assert.match(planPage, /initialMaterialId=/);
assert.match(planPage, /initialExamDate=/, 'The exam date given at upload must follow into plan setup.');
assert.match(plan, /initialMaterialId && materials\.some/,
  'Plan wizard must preselect the processed material.');
assert.match(materials, /dashboard\/procesando\/\$\{material\.id\}/,
  'In-progress materials must return to the same processing route.');
console.log('PDF fullscreen processing smoke checks passed.');
