import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dashboardSource = readFileSync(resolve('app/dashboard/page.tsx'), 'utf8');
const legacyMaterialsSource = readFileSync(resolve('app/dashboard/materiales/page.tsx'), 'utf8');
const legacyNewSource = readFileSync(resolve('app/dashboard/materiales/nuevo/page.tsx'), 'utf8');
const legacyUploadSource = readFileSync(resolve('app/dashboard/materiales/subir/page.tsx'), 'utf8');
const navbarSource = readFileSync(resolve('components/navbar.tsx'), 'utf8');
const proxySource = readFileSync(resolve('proxy.ts'), 'utf8');

assert.match(dashboardSource, /LazyMaeveStudySpace/);
assert.match(dashboardSource, /source\?: string/);
assert.match(dashboardSource, /dailyMinutes\?: string/);
assert.match(dashboardSource, /requestedUniversidadId/);
assert.match(dashboardSource, /resolvedUniversidadId/);
assert.match(dashboardSource, /preguntero-derecho-sucesorio-p2/);

assert.match(
  legacyMaterialsSource,
  /redirect\(query \? `\/dashboard\?\$\{query\}` : '\/dashboard'\)/,
  'La ruta legacy de materiales debe converger al Mi espacio canónico.'
);
assert.doesNotMatch(legacyMaterialsSource, /StudentMaterialsWorkspace|PdfFirstUploadShell/);
assert.doesNotMatch(legacyMaterialsSource, /fetchStudentMaterialsByUser/);

for (const source of [legacyNewSource, legacyUploadSource]) {
  assert.match(source, /next\.set\('openUpload', '1'\)/);
  assert.match(source, /redirect\(`\/dashboard\?\$\{next\.toString\(\)\}`\)/);
  assert.doesNotMatch(source, /\/dashboard\/materiales\?/);
}

assert.match(navbarSource, /\{ label: 'Mi espacio', href: '\/dashboard', icon: Home \}/);
assert.doesNotMatch(navbarSource, /href: '\/dashboard\/materiales'/);
assert.doesNotMatch(navbarSource, /label: 'Inicio', href: '\/dashboard'/);

assert.match(proxySource, /canonicalizeLegacyMiEspacioPath/);
assert.match(proxySource, /signupUrl\.searchParams\.set\('next', '\/dashboard\?openUpload=1'\)/);
assert.match(proxySource, /loginUrl\.searchParams\.set\('next', canonicalNext\)/);

console.log('Dashboard single Mi espacio smoke tests passed.');
