import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const upload = read('components/dashboard/pdf-first-upload-shell.tsx');
const route = read('app/(es)/dashboard/procesando/[id]/page.tsx');
const screen = read('components/pdf-processing/fullscreen-processing.tsx');
const localDemo = read('app/(es)/dashboard/procesando/demo/page.tsx');
const proxy = read('proxy.ts');
const planPage = read('app/(es)/dashboard/plan-de-estudio/preparar/page.tsx');
const plan = read('components/dashboard/study-plan-setup.tsx');
const materials = read('components/dashboard/student-materials-workspace.tsx');
const motion = read('components/pdf-processing/fullscreen-processing.css');
const shell = read('components/ClientLayoutClient.tsx');

assert.match(upload, /router\.push\(`\/dashboard\/procesando\/\$\{result\.materialId\}`\)/,
  'The upload must open the full-page experience, not a blocking processing modal.');
assert.match(route, /getStudentMaterialProcessingStateAction\(id\)/,
  'The processing screen must restore the real material status securely.');
assert.match(route, /await getSessionUser\(\)/);
assert.match(screen, /const SCENE_MS = 6500/);
assert.match(localDemo, /process\.env\.NODE_ENV !== 'development'/,
  'Local demo route must be inaccessible in deployed environments.');
assert.match(proxy, /process\.env\.NODE_ENV === 'development'/,
  'Unauthenticated demo bypass must only exist in local development.');
assert.match(proxy, /pathname === '\/dashboard\/procesando\/demo'/,
  'The exception must match only the exact demo path.');
assert.match(proxy, /pathname\.startsWith\('\/dashboard'\)/,
  'Regular dashboard routes must stay protected.');
assert.match(proxy, /if \(isProtectedRoute && !user\)/,
  'Unauthenticated real processing routes must still redirect to login.');

assert.match(localDemo, /<FullscreenProcessing initialState=\{demoMaterial\} preview/,
  'Demo must reuse the production UI without creating a real PDF.');
assert.doesNotMatch(screen, /data-pdf-preview-only/,
  'The local demo must match the original full-screen designs without manual controls.');
assert.match(screen, /setPreviewScene\(current=>Math\.min\(4,current\+1\)\)/,
  'All five local demo screens must advance automatically.');
assert.match(screen, /\[18,41,68,92,100\]\[previewScene\]/,
  'Local demo uses the reference HTML stages, not an invented progress scale.');
assert.match(shell, /isPdfProcessingRoute \? \(/,
  'The processing route must use a separate fullscreen shell.');
assert.match(shell, /data-processing-standalone-shell/,
  'Do not render the normal app topbar, sidebar, footer or mobile navigation.');
assert.match(screen, /h-dvh min-h-0 .*overflow-hidden/,
  'The processing experience must fill precisely one viewport.');
assert.match(screen, /<ProcessingFit sceneKey=/,
  'Scenes are fitted to the available screen without scrolling or clipping.');
assert.match(screen, /ResizeObserver\(fit\)/,
  'Viewport and visual scene size changes must recalculate fit.');
assert.match(screen, /<header className="grid shrink-0 grid-cols-2.*sm:grid-cols-3/,
  'Header has balanced columns so the document name is centered independent of logo and progress.');
assert.match(screen, /data-processing-file-name className="col-span-2 row-start-2.*sm:col-start-2 sm:row-start-1/,
  'Filename remains centered on desktop and gets a separate centered row on narrow screens.');
assert.match(screen, /title=\{state\.fileName\}.*text-\[11px\].*sm:text-\[12px\]/,
  'Compact filename retains the full name in the tooltip when truncated.');

assert.match(motion, /data-processing-standalone-shell.*dashboard-responsive/s,
  'The dashboard wrapper must not introduce its own scroll.');
assert.match(screen, /evi-procesamiento-listo\.svg/,
  'The final illustration must be the artwork from the supplied HTML.');
assert.match(screen, /if\(preview\|\|ready\|\|failed\)return/,
  'Preview must skip live processing polling and timing.');
assert.match(screen, /if\(preview\|\|initialState\.status!=='uploaded'\)return/,
  'Preview must never launch a server-side PDF processing job.');
assert.match(screen, /if\(preview\|\|retrying\)return/,
  'Preview must never retry a backend processing job.');
assert.match(screen, /onClick=\{preview\?\(event\)=>event\.preventDefault\(\):undefined\}/,
  'Preview final buttons must not navigate using a fake material ID.');

assert.match(screen, /data-processing-scene-motion/, 'Heading and example must transition together.');
assert.match(screen, /data-phase=\{sceneExiting/, 'Outgoing scene must fade before replacement.');
assert.match(screen, /data-processing-layout="organize"/);
assert.match(screen, /data-processing-layout="understand"/);
assert.match(screen, /data-processing-layout="memorize"/);
assert.match(screen, /data-processing-layout="practice"/);
assert.match(motion, /@container processing-scene \(max-width: 719px\)/,
  'The supplied two-column layout must be retained when enough space is available.');
assert.match(motion, /prefers-reduced-motion: reduce/, 'Reduced-motion preference must disable transitions.');
assert.match(motion, /data-processing-scene-stage/, 'The complete scene is measured as one visual unit.');
assert.match(screen, /max-w-\[800px\]/, 'All four processing scenes share a compact desktop width.');
assert.match(screen, /sm:text-\[25px\] lg:text-\[27px\]/, 'Processing scene headings match the compact Evaluo typography.');
assert.match(screen, /min-h-\[165px\]/, 'Document preview is compact without deleting its content.');
assert.match(screen, /min-h-\[205px\]/, 'Flashcard keeps a smaller readable minimum height.');
assert.match(screen, /sm:min-h-\[230px\]/, 'Flashcard preserves a compact desktop minimum height.');
assert.match(motion, /font-size: 22px; line-height: 1\.2;/, 'Small-screen headings do not override compact styles with oversized text.');
assert.match(motion, /font-size: 20px;/, 'Small-screen flashcard text stays proportional.');


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
assert.doesNotMatch(screen, /!ready&&!failed\?<Link href="\/dashboard"/,
  'No unrelated navigation should appear during PDF processing.');
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
