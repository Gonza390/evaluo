import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboard = readFileSync('app/(es)/dashboard/page.tsx', 'utf8');
const shell = readFileSync('components/dashboard/pdf-first-upload-shell.tsx', 'utf8');
const academicAction = readFileSync('app/(es)/dashboard/materiales/academic-options-actions.ts', 'utf8');
const upload = readFileSync('app/(es)/dashboard/materiales/pdf-first-upload-actions.ts', 'utf8');
const workspace = readFileSync('components/dashboard/student-materials-workspace.tsx', 'utf8');
const academicReminderLazy = readFileSync('components/dashboard/lazy-academic-profile-reminder.tsx', 'utf8');

assert.ok(!dashboard.includes(".from('universidades')"), 'Mi espacio no debe buscar universidades en la carga inicial.');
assert.ok(!dashboard.includes(".from('carreras')"), 'Mi espacio no debe buscar carreras en la carga inicial.');
assert.ok(!dashboard.includes(".from('materias')"), 'Mi espacio no debe buscar materias en la carga inicial.');
assert.ok(!dashboard.includes(".from('carrera_materias')"), 'Mi espacio no debe buscar las relaciones académicas en la carga inicial.');
// La pantalla puede consultar solamente el perfil mínimo para el recordatorio opcional.
assert.ok(dashboard.includes("hasReadyMaterial && openUpload !== '1'"), 'Consultar el perfil únicamente si ya hay materiales y no se solicita subida.');
assert.ok(dashboard.includes(".from('profiles')"), 'El recordatorio académico debe usar la información mínima del perfil.');
assert.ok(dashboard.includes('LazyAcademicProfileReminder'), 'El formulario académico opcional se carga de forma diferida.');
assert.ok(academicReminderLazy.includes("import('@/components/dashboard/academic-profile-reminder')"), 'El formulario no se importa en el bundle inicial.');
assert.ok(academicReminderLazy.includes('ssr: false'), 'No renderizar el formulario opcional antes de abrir Mi espacio.');
assert.ok(shell.includes('loadDashboardAcademicOptionsAction()'), 'El selector opcional debe solicitar el catálogo bajo demanda.');
assert.ok(shell.includes("!showReadyContext || academicChoicesStatus !== 'idle'"), 'No ejecutar la consulta si el selector opcional está cerrado.');
assert.ok(academicAction.includes("supabase.auth.getUser()"), 'El catálogo bajo demanda requiere sesión.');
assert.ok(!academicAction.includes('createAdminClient'), 'No debemos exponer un catálogo privado mediante service role.');
assert.ok(academicAction.includes(".from('profiles')"), 'El selector debe recuperar el perfil previamente guardado.');
assert.ok(dashboard.includes('uploadMateriaId'), 'Las landings deben conservar una materia preseleccionada.');
assert.ok(upload.includes('resolveVerifiedMateriaId(admin, user.id, parsed.metadata)'), 'El servidor debe validar la materia, universidad y carrera antes de guardar.');
assert.ok(!workspace.includes("?? 'Universidad'"), 'No mostrar etiqueta universidad si el PDF no tiene ese dato.');
assert.ok(!workspace.includes("?? 'Carrera'"), 'No mostrar etiqueta carrera si el PDF no tiene ese dato.');

console.log('Dashboard academic catalog lazy loading and PDF-first link contract smoke tests passed.');
