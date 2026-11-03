import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspace = readFileSync('components/dashboard/student-materials-workspace.tsx', 'utf8');
const estudiar = readFileSync('app/(es)/dashboard/estudiar/page.tsx', 'utf8');
const studyCards = readFileSync('components/dashboard/study-reading-cards.tsx', 'utf8');
const practice = readFileSync('components/dashboard/practice-mode-picker.tsx', 'utf8');

// Mi espacio vuelve a ser una biblioteca de PDFs; las herramientas no se duplican acá.
assert.doesNotMatch(workspace, /data-dashboard-study-dual-pane|data-dashboard-study-tools/,
  'El dashboard no debe mostrar el panel de herramientas de estudio.');
assert.match(workspace, /title="Tus PDFs"/);
assert.match(workspace, /visibleMaterials\.map\(\(material\)/);
assert.match(workspace, /getStudentMaterialRoute\(material\.id\)/,
  'Cada PDF debe abrir su propio espacio de lectura.');
assert.match(workspace, /setMaterialToDelete\(material\)/);
assert.match(workspace, /dashboard_empty_materials/);
assert.match(estudiar, /<StudyReadingCards/);
assert.match(studyCards, /<h2 className="mb-2 text-\[12px\] font-medium text-slate-500">Tus archivos<\/h2>/);
assert.ok(studyCards.indexOf('>Tus archivos</h2>') < studyCards.indexOf('{renderMaterial(activeMaterial)}'), 'Tus archivos va antes de la primera tarjeta de PDF.');
assert.match(studyCards, /\{otherMaterials\.map\(renderMaterial\)\}/, 'Los demás PDFs conservan su listado y orden.');
assert.doesNotMatch(estudiar, /<StudyPlanSetup|<PracticeModePicker/);
assert.match(practice, /data-practice-dual-pane/,
  'Practicar conserva sus modalidades y su historial.');
console.log('Dashboard original y navegación de estudio OK.');
