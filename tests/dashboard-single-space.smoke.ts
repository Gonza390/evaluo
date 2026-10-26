import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dashboardSource = readFileSync(resolve('app/dashboard/page.tsx'), 'utf8');
const legacyMaterialsSource = readFileSync(resolve('app/dashboard/materiales/page.tsx'), 'utf8');
const legacyNewSource = readFileSync(resolve('app/dashboard/materiales/nuevo/page.tsx'), 'utf8');
const legacyUploadSource = readFileSync(resolve('app/dashboard/materiales/subir/page.tsx'), 'utf8');
const navbarSource = readFileSync(resolve('components/navbar.tsx'), 'utf8');
const proxySource = readFileSync(resolve('proxy.ts'), 'utf8');
const dashboardHeroSource = readFileSync(resolve('components/dashboard/maeve-study-hero.tsx'), 'utf8');
const nextActionSource = readFileSync(resolve('lib/dashboard-next-study-action.ts'), 'utf8');

assert.match(dashboardSource, /LazyMaeveStudySpace/);
assert.match(dashboardSource, /source\?: string/);
assert.match(dashboardSource, /dailyMinutes\?: string/);
assert.match(dashboardSource, /isUuid\(universidadId\)/);
assert.match(dashboardSource, /resolvedUniversidadId/);
assert.match(dashboardSource, /preguntero-derecho-sucesorio-p2/);
assert.match(dashboardSource, /getDashboardNextStudyAction/);
assert.match(dashboardSource, /nextStudyAction=\{nextStudyAction\}/);

assert.match(dashboardHeroSource, /dashboard_next_action/);
assert.match(dashboardHeroSource, /nextStudyAction\?\.cta/);
assert.match(nextActionSource, /kind: 'reinforce'/);
assert.match(nextActionSource, /kind: 'resume_practice'/);
assert.match(nextActionSource, /kind: 'start_practice'/);
assert.match(nextActionSource, /kind: 'continue_summary'/);

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

// Ajuste visual específico de Mi espacio: tamaños reales, sin zoom global ni
// cambios sobre la landing, el lector del PDF ni otras rutas internas.
const dashboardChromeSource = readFileSync(resolve('components/dashboard/maeve-dashboard-chrome.tsx'), 'utf8');
const dashboardMaterialsSource = readFileSync(resolve('components/dashboard/student-materials-workspace.tsx'), 'utf8');
const appChromeSource = readFileSync(resolve('components/ClientLayoutClient.tsx'), 'utf8');

assert.match(dashboardSource, /max-w-\[1240px\]/);
assert.match(dashboardSource, /px-3 py-3 sm:px-4 sm:py-4/);
assert.match(dashboardHeroSource, /text-\[20px\].*sm:text-\[22px\]/);
assert.match(dashboardHeroSource, /h-11 min-h-11.*text-\[13px\]/);
assert.match(dashboardHeroSource, /nextStudyAction\?\.href \?\? primaryMaterialHref/);
assert.match(dashboardHeroSource, /onClick=\{onUploadClick\}/);
assert.match(dashboardChromeSource, /min-w-0 space-y-3 overflow-x-clip/);
assert.match(dashboardMaterialsSource, /sm:\[&_h2\]:text-\[20px\]/);
assert.match(dashboardMaterialsSource, /text-\[13\.5px\] font-semibold leading-5/);
assert.match(dashboardMaterialsSource, /deleteStudentMaterialAction/);
assert.match(dashboardMaterialsSource, /min-h-10 min-w-10/);
assert.match(appChromeSource, /const isCompactAppRoute =/);
assert.match(appChromeSource, /Boolean\(user\)/);
for (const privatePath of ['/dashboard/', '/calendario', '/configuracion', '/referidos', '/materiales/']) {
  assert.ok(appChromeSource.includes(privatePath), 'La escala interna debe incluir '+privatePath);
}
assert.match(appChromeSource, /data-private-compact=\{isCompactAppRoute \? 'true' : undefined\}/);
assert.match(appChromeSource, /<PublicBrandLink \/>/);
assert.match(appChromeSource, /isExploreExperienceRoute/);
assert.match(appChromeSource, /<EstimatedStudyActivity compact=\{isCompactAppRoute\} \/>/);
const activitySource = readFileSync(resolve('components/estimated-study-activity.tsx'), 'utf8');
assert.match(activitySource, /compact = false/);
assert.match(activitySource, /compact \? 'h-9 px-3 text-\[12px\]' : 'h-10 px-3\.5 text-sm'/);
assert.match(appChromeSource, /isCompactAppRoute \? 'min-h-\[52px\] py-1 sm:min-h-\[52px\] sm:py-1' : 'min-h-18 py-3 sm:min-h-20'/);
assert.match(appChromeSource, /<Navbar collapsed=\{sidebarCollapsed\} onToggleCollapsed=\{handleSidebarToggle\} compact=\{isCompactAppRoute\} \/>/);
assert.match(appChromeSource, /sidebarCollapsed \? 'md:ml-\[56px\]' : 'md:ml-\[176px\]'/);
assert.match(appChromeSource, /sidebarCollapsed \? 'md:ml-\[76px\]' : 'md:ml-\[248px\]'/);
assert.match(navbarSource, /compact \? 'md:top-\[52px\]' : 'md:top-\[81px\]'/);
assert.match(navbarSource, /compact \? 'w-\[56px\]' : 'w-\[76px\]'/);
assert.match(navbarSource, /compact \? 'w-\[176px\]' : 'w-\[248px\]'/);
assert.match(navbarSource, /compact \? 'min-h-10 gap-2 px-2\.5 py-2' : 'gap-2\.5 px-3 py-2\.5'/);

// El botón de plegado comparte la fila superior, sin separar "Mi espacio"
// ni comprimir su área de navegación. El enlace opcional sigue la misma escala.
assert.match(navbarSource, /compact \? 'grid-cols-\[minmax\(0,1fr\)_32px\]' : 'grid-cols-\[minmax\(0,1fr\)_40px\]'/);
assert.match(navbarSource, /compact \? 'gap-1' : 'gap-2'/);
// El grupo superior se separa 16 px más del encabezado solo en Mi espacio.
assert.match(navbarSource, /compact \? "pt-5" : "pt-2"/);
assert.match(navbarSource, /compact \? 'w-8' : 'w-10'/);
assert.match(navbarSource, /<ReferralPortalNavLink collapsed=\{collapsed\} pathname=\{pathname\} compact=\{compact\} \/>/);
const referralNavSource = readFileSync(resolve('components/referrals/ReferralPortalNavLink.tsx'), 'utf8');
assert.match(referralNavSource, /compact = false/);
assert.match(referralNavSource, /compact \? 'min-h-10 gap-2 px-2\.5 py-2' : 'gap-2\.5 px-3 py-2\.5'/);

const notificationSource = readFileSync(resolve('components/notifications/notification-bell.tsx'), 'utf8');
assert.match(appChromeSource, /<NotificationBell compact=\{isCompactAppRoute\} \/>/);
assert.match(notificationSource, /compact = false/);
assert.match(notificationSource, /compact \? "h-9 w-9" : "h-11 w-11"/);
// El modo estándar mantiene los anchos originales y las páginas públicas intactas.
assert.match(navbarSource, /compact \? 'w-\[56px\]' : 'w-\[76px\]'/);
assert.match(navbarSource, /compact \? 'w-\[176px\]' : 'w-\[248px\]'/);

for (const source of [dashboardSource, dashboardHeroSource, dashboardMaterialsSource]) {
  assert.doesNotMatch(source, /\bzoom\s*:|transform:\s*scale\(|\bscale-\[/);
}

// Escala privada compartida: todas las vistas autenticadas mantienen el
// mismo shell que Mi espacio, sin convertir las páginas SEO en modo compacto.
assert.match(appChromeSource, /isCompactAppRoute \? 'min-h-\[52px\] py-1 sm:min-h-\[52px\] sm:py-1'/);
assert.match(appChromeSource, /compact=\{isCompactAppRoute\}/);
assert.match(appChromeSource, /sidebarCollapsed \? 'md:ml-\[56px\]' : 'md:ml-\[176px\]'/);
assert.match(appChromeSource, /isCompactAppRoute\s*\?\s*'bg-white p-0 pb-24 sm:p-0 sm:pb-32 lg:p-0'/);
assert.match(appChromeSource, /isExploreExperienceRoute/);
assert.match(appChromeSource, /<PublicGuestActions trackingLocation="discovery_header" \/>/);
const compactCalendar = readFileSync(resolve('app/calendario/page.tsx'), 'utf8');
const compactSettings = readFileSync(resolve('app/configuracion/page.tsx'), 'utf8');
const compactProfile = readFileSync(resolve('components/settings/profile-settings-form.tsx'), 'utf8');
const compactProgress = readFileSync(resolve('components/dashboard/study-errors-client.tsx'), 'utf8');
const compactProgressList = readFileSync(resolve('app/dashboard/progreso/page.tsx'), 'utf8');
const compactHistory = readFileSync(resolve('components/dashboard/explanations-history-client.tsx'), 'utf8');
const compactReferrals = readFileSync(resolve('app/referidos/page.tsx'), 'utf8');
const compactHeader = readFileSync(resolve('components/ui/app-page-header.tsx'), 'utf8');
for (const page of [compactCalendar, compactSettings, compactProgressList, compactHistory, compactReferrals]) {
  assert.match(page, /text-\[20px\]|size="compact"/);
}
assert.match(compactCalendar, /max-w-\[1240px\]/);
assert.match(compactSettings, /max-w-\[1240px\]/);
assert.match(compactProgress, /size="compact"/);
assert.match(compactProgress, /grid-cols-\[236px_minmax\(0,1fr\)\]/);
assert.match(compactProfile, /space-y-4 rounded-xl border p-3\.5 sm:p-4/);
assert.match(compactReferrals, /max-w-\[1240px\]/);
assert.match(compactHeader, /size === 'compact' && 'gap-3 pb-3 sm:pb-4'/);
assert.match(compactHeader, /'text-\[20px\] leading-\[1\.3\] sm:text-\[22px\]'/);

console.log('Dashboard single Mi espacio smoke tests passed.');
