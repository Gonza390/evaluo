import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dashboardSource = readFileSync(resolve('app/(es)/dashboard/page.tsx'), 'utf8');
const legacyMaterialsSource = readFileSync(resolve('app/(es)/dashboard/materiales/page.tsx'), 'utf8');
const legacyNewSource = readFileSync(resolve('app/(es)/dashboard/materiales/nuevo/page.tsx'), 'utf8');
const legacyUploadSource = readFileSync(resolve('app/(es)/dashboard/materiales/subir/page.tsx'), 'utf8');
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
assert.match(dashboardHeroSource, /text-\[25px\].*sm:text-\[32px\]/);
assert.match(dashboardHeroSource, /h-11.*text-\[14px\]/);
assert.match(dashboardHeroSource, /nextStudyAction\?\.href \?\? primaryMaterialHref/);
assert.match(dashboardHeroSource, /onClick=\{onUploadClick\}/);
assert.match(dashboardChromeSource, /min-w-0 space-y-3 overflow-x-clip/);
assert.match(dashboardMaterialsSource, /sm:\[&_h2\]:text-\[20px\]/);
assert.match(dashboardMaterialsSource, /title="Tus PDFs"\s+visuallyHiddenTitle/,
  'Keep an accessible section label without repeating Tus PDFs visually.');
const appPageHeaderSource = readFileSync(resolve('components/ui/app-page-header.tsx'), 'utf8');
assert.match(appPageHeaderSource, /visuallyHiddenTitle && 'sr-only'/,
  'The section heading must be visually hidden, not left as a blank row.');
assert.match(dashboardMaterialsSource, /text-\[13\.5px\] font-semibold leading-5/);
assert.match(dashboardMaterialsSource, /deleteStudentMaterialAction/);
assert.doesNotMatch(dashboardMaterialsSource, /material\.file_name/,
  'PDF cards should not repeat the uploaded filename below the title.');
assert.doesNotMatch(dashboardMaterialsSource, />Privado<|: 'Privado'/,
  'Private PDFs are the default and should not display a redundant visibility tag.');
assert.match(dashboardMaterialsSource, /\{isShared \? \(/,
  'Shared PDFs should still show their meaningful visibility state.');
assert.match(dashboardMaterialsSource, /\{formatDate\(material\.created_at\)\}/,
  'PDF cards must retain their upload date.');
assert.match(dashboardMaterialsSource, /data-desktop-material-search/,
  'The PDF library should offer desktop search when enough materials exist.');
assert.match(dashboardMaterialsSource, /initialMaterials\.length >= 3/,
  'A single material should not introduce an unnecessary search box.');
assert.match(dashboardMaterialsSource, /Buscar entre tus PDFs/,
  'Search must be accessible by label.');
assert.match(dashboardMaterialsSource, /visibleMaterials\.map\(\(material\)/,
  'The visible PDF cards must respond to the search query.');
assert.match(dashboardMaterialsSource, /xl:grid-cols-2/,
  'Desktop should make use of available width without modifying the mobile layout.');
assert.match(dashboardMaterialsSource, /Mostrar todos/,
  'Empty search results should have a clear recovery action.');
assert.match(navbarSource, /pathname\.startsWith\('\/materiales\/'\)/,
  'Mi espacio remains selected when a student is reading a PDF.');

assert.doesNotMatch(dashboardMaterialsSource, /dashboard_materials_header/,
  'Tus PDFs must not display a redundant upload CTA in the section header.');
assert.match(dashboardMaterialsSource, /primaryActionLabel="Subí tu PDF"/,
  'The empty materials state must keep the PDF upload CTA.');
assert.match(dashboardMaterialsSource, /onPrimaryAction=\{\(\) => openUploadPicker\('dashboard_empty_materials'\)\}/,
  'The empty-state upload CTA must still explicitly open the picker.');
assert.match(dashboardHeroSource, /Subir otro PDF/,
  'The dashboard hero must keep its upload action for students with existing PDFs.');
assert.match(dashboardMaterialsSource, /flex h-10 w-10 shrink-0/);
assert.match(appChromeSource, /const isCompactAppRoute =/);
assert.match(appChromeSource, /Boolean\(user\)/);
assert.match(appChromeSource, /data-app-footer/);
assert.match(appChromeSource, /className=\{isCompactAppRoute \? 'hidden' : undefined\}/,
  'All private pages should omit the public site footer, in mobile and desktop.');
assert.match(appChromeSource, /\{showBottomNav \? <BottomNav \/> : null\}/,
  'Do not remove the useful mobile bottom navigation while hiding the scroll-producing footer.');
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
assert.match(appChromeSource, /stablePrivateHeader\s*\? 'min-h-\[52px\] py-1 sm:min-h-\[52px\] sm:py-1' : 'min-h-18 py-3 sm:min-h-20'/,
  'All authenticated routes share a consistent compact topbar.');
assert.match(appChromeSource, /<Navbar collapsed=\{effectiveSidebarCollapsed\} onToggleCollapsed=\{handleSidebarToggle\} compact=\{isCompactAppRoute\} \/>/);
assert.match(appChromeSource, /effectiveSidebarCollapsed \? 'md:ml-\[56px\]' : 'md:ml-\[176px\]'/);
assert.match(appChromeSource, /effectiveSidebarCollapsed \? 'md:ml-\[76px\]' : 'md:ml-\[248px\]'/);
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
assert.doesNotMatch(appChromeSource, /NotificationBell|notification-bell/,
  'The shared header must not render the notification bell at any viewport size.');
assert.match(appChromeSource, /stablePrivateHeader\s*\? 'min-h-\[52px\] py-1 sm:min-h-\[52px\] sm:py-1' : 'min-h-18 py-3 sm:min-h-20'/,
  'All authenticated mobile routes should share the same topbar height.');
assert.match(appChromeSource, /aria-label="Ir a Mi espacio"/,
  'The Evaluo logo remains an accessible link on mobile.');
assert.match(appChromeSource, /className="hidden min-w-0 md:block"/,
  'The mobile authenticated header must consistently display only the icon.');
assert.doesNotMatch(appChromeSource, /isMobileDashboardRoute/,
  'The topbar should not change its branding between dashboard and other routes.');
assert.doesNotMatch(appChromeSource, /label: 'Perfil', href: '\/configuracion'/,
  'Remove Perfil from the mobile bottom navigation.');
assert.match(appChromeSource, /grid-cols-4/,
  'The current authenticated mobile navigation uses four balanced destinations.');
const bottomNavSource = appChromeSource.split('function BottomNav()')[1]?.split('export default function ClientLayoutClient')[0] ?? '';
assert.match(bottomNavSource, /label: 'Mi espacio', href: '\/dashboard'/,
  'Keep Mi espacio in the bottom navigation.');
assert.match(bottomNavSource, /label: 'Estudiar', href: '\/dashboard\/explicaciones'/,
  'Keep Estudiar in the bottom navigation.');
assert.match(bottomNavSource, /label: 'Practicar', href: '\/dashboard\/practicar'/);
assert.match(bottomNavSource, /label: 'Mi plan', href: '\/dashboard\/plan-de-estudio'/);
assert.doesNotMatch(bottomNavSource, /label: 'Calendario'|label: 'Perfil'/,
  'Move Calendario out of the bottom bar and keep Perfil in the avatar menu.');
assert.match(appChromeSource, /data-mobile-calendar-link/,
  'Calendar belongs in the mobile top bar beside the profile avatar.');
assert.match(appChromeSource, /href="\/calendario"\s+data-mobile-calendar-link/,
  'The top calendar icon must navigate to the actual Calendar route.');
assert.match(appChromeSource, /MobileProfileMenu = dynamic/,
  'The avatar menu must be lazy-loaded to protect the global app performance budget.');
assert.match(appChromeSource, /<MobileProfileMenu/,
  'The profile menu must render beside the calendar in the mobile header.');
const mobileProfileMenuSource = readFileSync(resolve('components/mobile-profile-menu.tsx'), 'utf8');
assert.match(mobileProfileMenuSource, /data-mobile-profile-menu-trigger/,
  'The profile avatar must open a mobile menu instead of immediately navigating.');
assert.match(mobileProfileMenuSource, /data-mobile-profile-menu/,
  'The menu should be identified for responsive verification.');
assert.match(mobileProfileMenuSource, /Ajustes/,
  'The profile menu must offer Ajustes.');
assert.match(mobileProfileMenuSource, /Sugerencias/,
  'The profile menu must offer Sugerencias.');
assert.match(mobileProfileMenuSource, /href="\/configuracion"/,
  'Ajustes must lead to the existing configuration page.');
assert.match(mobileProfileMenuSource, /onSelect=\{\(\) => setFeedbackOpen\(true\)\}/,
  'Sugerencias must open the existing feedback form.');
assert.match(mobileProfileMenuSource, /<FeedbackDialog open=\{feedbackOpen\} onOpenChange=\{setFeedbackOpen\} sourcePath=\{sourcePath\} \/>/,
  'The feedback flow must stay connected to its source path.');
assert.match(appChromeSource, /Ver racha de estudio:/,
  'Keep the streak control independent from the avatar.');

assert.match(notificationSource, /compact = false/);
assert.match(notificationSource, /compact \? "h-9 w-9" : "h-11 w-11"/);
// El modo estándar mantiene los anchos originales y las páginas públicas intactas.
assert.match(navbarSource, /compact \? 'w-\[56px\]' : 'w-\[76px\]'/);
assert.match(navbarSource, /compact \? 'w-\[176px\]' : 'w-\[248px\]'/);

// Decorative Evi SVG animations are allowed to scale within their own graphic.
// This regression guard forbids resizing the overall dashboard layout.
const heroWithoutSvgAnimationStyles = dashboardHeroSource.replace(/<style jsx global>[\s\S]*?<\/style>/g, '');
for (const source of [dashboardSource, heroWithoutSvgAnimationStyles, dashboardMaterialsSource]) {
  assert.doesNotMatch(source, /\bzoom\s*:|transform:\s*scale\(|\bscale-\[/);
}

// Escala privada compartida: todas las vistas autenticadas mantienen el
// mismo shell que Mi espacio, sin convertir las páginas SEO en modo compacto.
assert.match(appChromeSource, /stablePrivateHeader\s*\? 'min-h-\[52px\] py-1 sm:min-h-\[52px\] sm:py-1'/);
assert.match(appChromeSource, /compact=\{isCompactAppRoute\}/);
assert.match(appChromeSource, /effectiveSidebarCollapsed \? 'md:ml-\[56px\]' : 'md:ml-\[176px\]'/);
assert.match(appChromeSource, /bg-white p-0 pb-24 sm:p-0 sm:pb-32 lg:p-0/,
  'The compact route keeps its paddings while allowing the study plan desktop override.');
assert.match(appChromeSource, /isExploreExperienceRoute/);
assert.match(appChromeSource, /<PublicGuestActions trackingLocation="discovery_header" \/>/);
const compactCalendar = readFileSync(resolve('app/(es)/calendario/page.tsx'), 'utf8');
const compactSettings = readFileSync(resolve('app/(es)/configuracion/page.tsx'), 'utf8');
const compactProfile = readFileSync(resolve('components/settings/profile-settings-form.tsx'), 'utf8');
const compactProgress = readFileSync(resolve('components/dashboard/study-errors-client.tsx'), 'utf8');
const compactProgressList = readFileSync(resolve('app/(es)/dashboard/progreso/page.tsx'), 'utf8');
const compactHistory = readFileSync(resolve('components/dashboard/explanations-history-client.tsx'), 'utf8');
const compactReferrals = readFileSync(resolve('app/(es)/referidos/page.tsx'), 'utf8');
const compactHeader = readFileSync(resolve('components/ui/app-page-header.tsx'), 'utf8');
for (const page of [compactCalendar, compactProgressList, compactHistory, compactReferrals]) {
  assert.match(page, /text-\[20px\]|size="compact"/);
}
assert.match(compactSettings, /text-xl font-semibold tracking-tight/,
  'Settings currently uses a compact, regular-weight page heading.');
assert.match(compactCalendar, /max-w-\[1240px\]/);
assert.match(compactSettings, /max-w-\[1240px\]/);
assert.match(compactProgress, /size="compact"/);
assert.match(compactProgress, /grid-cols-\[236px_minmax\(0,1fr\)\]/);
assert.match(compactProfile, /space-y-4 rounded-xl border p-3\.5 sm:p-4/);
assert.match(compactReferrals, /max-w-\[1240px\]/);
assert.match(compactHeader, /size === 'compact' && 'gap-3 pb-3 sm:pb-4'/);
assert.match(compactHeader, /'text-\[20px\] leading-\[1\.3\] sm:text-\[22px\]'/);

// Las microinteracciones no deben romper navegación, contenido o accesibilidad.
const motionStyles = readFileSync(resolve('app/globals.css'), 'utf8');
const dashboardLoadingSource = readFileSync(resolve('app/(es)/dashboard/loading.tsx'), 'utf8');
const calendarLoadingSource = readFileSync(resolve('app/(es)/calendario/loading.tsx'), 'utf8');
const progressLoadingSource = readFileSync(resolve('app/(es)/dashboard/explicaciones/loading.tsx'), 'utf8');
const drawerSource = readFileSync(resolve('components/ui/drawer.tsx'), 'utf8');
const dialogSource = readFileSync(resolve('components/ui/dialog.tsx'), 'utf8');
assert.match(appChromeSource, /data-evaluo-mobile-nav-item="true"/);
assert.match(appChromeSource, /setPendingDestination\(\{ href: item.href, fromPath: pathname \}\)/);
assert.match(appChromeSource, /aria-current=\{isActive \? 'page' : undefined\}/);
assert.match(appChromeSource, /key=\{pathname\} data-evaluo-route-enter/);
assert.match(navbarSource, /data-evaluo-sidebar-indicator/);
assert.match(navbarSource, /new ResizeObserver\(syncPosition\)/);
assert.match(dashboardHeroSource, /data-evaluo-motion-card/);
assert.match(dashboardMaterialsSource, /data-evaluo-motion-card/);
assert.match(motionStyles, /prefers-reduced-motion: reduce/);
assert.match(motionStyles, /\[data-evaluo-route-enter\]/);
assert.match(motionStyles, /\[data-evaluo-motion-card\]/);
assert.match(dialogSource, /backdrop-blur-\[2px\]/);
assert.match(drawerSource, /backdrop-blur-\[2px\]/);
for (const loading of [dashboardLoadingSource, calendarLoadingSource, progressLoadingSource]) {
  assert.match(loading, /Skeleton/, 'Show real layout skeletons during route loading.');
  assert.match(loading, /sr-only/, 'Loading must still have accessible text.');
}
assert.doesNotMatch(appChromeSource, /prefers-reduced-motion.*document.startViewTransition/,
  'Route motion must not rely on a browser-specific View Transitions API.');

console.log('Dashboard single Mi espacio smoke tests passed.');

const studyCardsSource = readFileSync(resolve('components/dashboard/study-reading-cards.tsx'), 'utf8');
const readingProgressSource = readFileSync(resolve('lib/reading-progress.ts'), 'utf8');
const studyPageSource = readFileSync(resolve('app/(es)/dashboard/explicaciones/page.tsx'), 'utf8');
const studyWorkspaceSource = readFileSync(resolve('components/material-study-workspace.tsx'), 'utf8');
assert.match(studyPageSource, /<StudyReadingCards/);
assert.match(studyCardsSource, /grid-cols-2/);
assert.match(studyCardsSource, /role="progressbar"/);
assert.match(studyCardsSource, /readReadingProgress/);
assert.match(studyWorkspaceSource, /saveReadingPosition\(materialId, nextIndex, summaryChapters.length\)/);
assert.match(readingProgressSource, /localStorage.setItem/);
