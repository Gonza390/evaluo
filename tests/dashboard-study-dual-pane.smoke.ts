import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspace = readFileSync('components/dashboard/student-materials-workspace.tsx', 'utf8');
const practice = readFileSync('components/dashboard/practice-mode-picker.tsx', 'utf8');
const viewer = readFileSync('app/(es)/materiales/[id]/page.tsx', 'utf8');

assert.match(practice, /data-practice-dual-pane/, 'Practicar es la referencia de diseño.');
assert.match(workspace, /data-dashboard-study-dual-pane/, 'Mi espacio debe usar el layout en dos columnas.');
assert.match(workspace, /lg:grid-cols-\[minmax\(0,1\.22fr\)_minmax\(310px,0\.86fr\)\]/,
  'En escritorio se usan proporciones equivalentes a Practicar.');
assert.match(workspace, /order-2 min-w-0 lg:order-1/, 'Las herramientas van a la izquierda en desktop.');
assert.match(workspace, /order-1 min-w-0 lg:order-2/, 'El selector de materiales se ubica primero en móvil.');
assert.match(workspace, /setSelectedMaterialId\(material\.id\)/,
  'Seleccionar otro material debe actualizar el destino de herramientas.');
assert.match(workspace, /getStudentMaterialRoute\(selectedMaterial\.id\)/,
  'Las herramientas deben apuntar al material seleccionado.');
for (const tab of ['resumen', 'tarjetas', 'glosario', 'mapa', 'progreso']) {
  assert.match(workspace, new RegExp(`id: '${tab}'`));
}
assert.match(workspace, /processing_status === 'ready'/,
  'No permitir abrir herramientas sobre archivos sin procesar.');
assert.match(viewer, /query\.tab === 'progreso'/, 'Progreso acepta su parámetro.');
assert.match(viewer, /query\.tab === 'mapa'/, 'Mapa mental acepta su parámetro.');
assert.match(workspace, /setMaterialToDelete\(material\)/, 'Mantener eliminación de material.');
assert.match(workspace, /openUploadPicker\('dashboard_materials'\)/,
  'Mantener subida desde la lista de materiales.');
console.log('Dashboard dual-pane smoke tests passed.');
