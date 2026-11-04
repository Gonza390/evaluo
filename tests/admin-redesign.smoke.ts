import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root=source('app/(es)/administrador/page.tsx');
const layout=source('app/(es)/administrador/layout.tsx');
const loading=source('app/(es)/administrador/loading.tsx');
assert.match(root,/redirect\('\/administrador\/'\+selected/);
assert.ok(!layout.includes('fixed right-5 bottom-5'));
assert.ok(loading.includes('className="ehome"'));
assert.ok(source('app/(es)/administrador/resumen/page.tsx').includes('<AdminHome'));
assert.ok(source('app/(es)/administrador/resumen/page.tsx').includes('obtenerTableroGeneral'));
assert.ok(source('app/(es)/administrador/usuarios/page.tsx').includes('<UsersRetentionDashboard'));
assert.ok(source('app/(es)/administrador/usuarios/page.tsx').includes('obtenerUsuariosRetencion'));
assert.ok(source('app/(es)/administrador/adquisicion/page.tsx').includes('<PackedAcquisitionDashboard'));
assert.ok(source('app/(es)/administrador/adquisicion/page.tsx').includes('obtenerDashboardAdquisicion'));
assert.ok(source('app/(es)/administrador/producto/page.tsx').includes('<PackedActivationDashboard'));
assert.ok(source('app/(es)/administrador/producto/page.tsx').includes('obtenerActivacionRecorrido'));
assert.ok(source('app/(es)/administrador/biblioteca/page.tsx').includes('<LearningDashboard'));
assert.ok(source('app/(es)/administrador/biblioteca/page.tsx').includes('obtenerAprendizajePracticas'));
assert.ok(source('app/(es)/administrador/planes/page.tsx').includes('<StudyPlansDashboard'));
assert.ok(source('app/(es)/administrador/planes/page.tsx').includes('obtenerDashboardPlanesEstudio'));
assert.ok(source('app/(es)/administrador/monetizacion/page.tsx').includes('<MonetizationDashboard'));
assert.ok(source('app/(es)/administrador/monetizacion/page.tsx').includes('obtenerDashboardMonetizacion'));
assert.ok(source('app/(es)/administrador/mails/page.tsx').includes('<CommunicationsDashboard'));
assert.ok(source('app/(es)/administrador/mails/page.tsx').includes('obtenerDashboardComunicaciones'));
assert.ok(source('app/(es)/administrador/ia/page.tsx').includes('<SystemAiDashboard'));
assert.ok(source('app/(es)/administrador/ia/page.tsx').includes('obtenerDashboardSistemaIA'));
assert.ok(source('app/(es)/administrador/gestion/page.tsx').includes('<GestionDashboard'));
assert.ok(source('app/(es)/administrador/gestion/page.tsx').includes('obtenerDashboardGestion'));
assert.ok(source('app/(es)/administrador/admin-home.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/users-retention-dashboard.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/acquisition-dashboard.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/activation-dashboard.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/learning-dashboard.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/study-plans-dashboard.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/monetization-dashboard.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/communications-dashboard.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/system-ai-dashboard.tsx').includes('eh-tabs'));
assert.ok(source('app/(es)/administrador/gestion-dashboard.tsx').includes('eh-tabs'));
for(const legacy of ['ia-herramientas','ReferralsPanel','IAPanel','admin-sidebar','admin-theme.css']) assert.ok(!root.includes(legacy));

const fixedPanelRoutes: Array<[string,string]> = [
  ['admin-home.tsx','resumen'],
  ['users-retention-dashboard.tsx','usuarios'],
  ['learning-dashboard.tsx','biblioteca'],
  ['study-plans-dashboard.tsx','planes'],
  ['monetization-dashboard.tsx','monetizacion'],
  ['communications-dashboard.tsx','mails'],
  ['system-ai-dashboard.tsx','ia'],
];
for(const [component, panel] of fixedPanelRoutes){
  const markup=source('app/(es)/administrador/'+component);
  assert.ok(!markup.includes('/administrador?panel='),component+' must not navigate through the legacy query route');
  assert.ok(!markup.includes('action="/administrador"'),component+' must not submit filters to the legacy root');
  assert.ok(!markup.includes("router.push('/administrador?'"),component+' must keep client filters in their panel');
  assert.ok(!markup.includes("router.replace('/administrador?'"),component+' must keep date ranges in their panel');
  if (markup.includes('<form')) {
    assert.ok(markup.includes('action="/administrador/'+panel+'"') || component === 'admin-home.tsx',
      component+' form submissions must target the dedicated panel route');
  }
}

console.log('Redesigned admin: ten isolated routes and old links preserved.');
