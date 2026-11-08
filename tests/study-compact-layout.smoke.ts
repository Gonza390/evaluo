import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const richText = readFileSync('components/study-rich-text.tsx', 'utf8');
const styles = readFileSync('components/study/pdf-study-styles.ts', 'utf8');
const appLayout = readFileSync('components/ClientLayoutClient.tsx', 'utf8');
const materialPage = readFileSync('app/(es)/materiales/[id]/page.tsx', 'utf8');
const materialStatus = readFileSync('components/material-study-status-workspace.tsx', 'utf8');

// Header shows only Back, material title and optional Guide, regardless of
// whether carrera/universidad/materia metadata is populated.
assert.doesNotMatch(workspace, /MaterialMetadata|carreraName|universidadName/,
  'Completed PDF header must not show academic metadata.');
assert.doesNotMatch(materialStatus, /MaterialMetadata|carreraName|universidadName|materiaName/,
  'Processing and failed PDF headers must not show academic metadata.');
assert.doesNotMatch(materialPage, /'Sin carrera'|'Sin universidad'|'Sin materia'/,
  'PDF reader must not introduce empty-context labels into any header.');
assert.match(workspace, /data-reopen-first-pdf-guide/,
  'Keep the voluntary Guide button on desktop.');
assert.match(workspace, /data-pdf-mobile-document-header[^\n]+md:hidden/,
  'The mobile PDF header must use the compact three-part design.');
assert.match(workspace, /data-pdf-mobile-title-trigger/,
  'The center pill must allow reading the complete document title.');
// Menú de tres puntos en el teléfono → botones radiales (1461348): PdfMobileToolsMenu.
const mobileTools = readFileSync('components/study/pdf-mobile-tools-menu.tsx', 'utf8');
assert.match(workspace, /<PdfMobileToolsMenu[\s\S]*?canShare=\{shareAvailable && isOwner && !demo\}/,
  'The mobile tools menu receives the same sharing eligibility.');
assert.match(mobileTools, /data-pdf-mobile-more-trigger/,
  'The three-dot control must open a functional menu.');
assert.match(workspace, /data-mobile-summary-active=\{activeTab === 'resumen' && !progressOpen \? 'true' : undefined\}/,
  'The mobile summary state remains scoped to the active tab.');
assert.doesNotMatch(mobileTools, /\bVolver\b/,
  'The three-dot menu must not duplicate the visible Back button.');
assert.match(mobileTools, /Abrir \$\{fileType\} original/,
  'Keep the original PDF action in the overflow menu.');
const globalStyles = readFileSync('app/globals.css', 'utf8');
assert.doesNotMatch(globalStyles, /data-student-material-share-control/,
  'The retired share action must not rely on CSS visibility overrides.');
const shareControl = readFileSync('components/student-material-share-control.tsx', 'utf8');
assert.match(materialPage, /<StudentMaterialShareControl[\s\S]*?mobileMenuOnly[\s\S]*?\/>/,
  'The PDF keeps one share controller for both the mobile overflow and desktop header.');
assert.match(materialPage, /shareAvailable=\{shareAvailable\}/,
  'The mobile reader gets the same sharing eligibility as the share handler.');
assert.match(mobileTools, /canShare \? \[\{[\s\S]*?evaluo:share-material/,
  'The three-dot menu preserves the Share action for the material owner.');
assert.match(materialPage, /const shareAvailable = isOwner;/,
  'The owner can share their PDF even when academic metadata is incomplete.');
const desktopShare = workspace.indexOf('data-pdf-desktop-share-trigger');
const desktopGuide = workspace.indexOf('data-reopen-first-pdf-guide', desktopShare);
assert.ok(desktopShare > 0 && desktopGuide > desktopShare,
  'Share stays immediately beside the Guide action on the desktop PDF header.');
assert.match(workspace, /shareAvailable && isOwner && !demo \? \(\s*<button[\s\S]*?data-pdf-desktop-share-trigger/,
  'The desktop Share action is only available to the material owner.');
assert.match(workspace, /data-pdf-desktop-share-trigger[\s\S]*?onClick=\{\(\) => window\.dispatchEvent\(new CustomEvent\('evaluo:share-material'/,
  'Desktop Share reuses the existing verified privacy and link-sharing flow.');
assert.match(workspace, /data-pdf-desktop-share-trigger[\s\S]*?rounded-full px-2 text-\[12px\] font-medium text-slate-500/,
  'Desktop Share has the same quiet rounded styling as the Pomodoro header control.');
assert.match(workspace, /<Share2 className="size-4" strokeWidth=\{1\.9\} aria-hidden="true" \/>/,
  'The deskop action uses the subtle outline Share icon.');
assert.match(shareControl, /window\.addEventListener\('evaluo:share-material'/,
  'The mobile menu still has a real sharing event handler.');
assert.match(shareControl, /mobileMenuOnly && !confirmOpen \? 'hidden' : 'flex'/,
  'The share controller stays hidden until a privacy confirmation is needed on either viewport.');
assert.match(shareControl, /\{!mobileMenuOnly \? \(/,
  'The floating share button is absent on this reader, including mobile.');
assert.match(workspace, /<DropdownMenuItem key=\{pdf\.id\} asChild>/,
  'Mobile dropdown menus must expose real navigation actions.');
assert.match(workspace, /hidden w-full items-center gap-3[^\n]*md:flex/,
  'The old header and Guide remain desktop-only.');
assert.match(workspace, /fileType=\{isDocx \? 'Word' : 'PDF'\}/,
  'The menu must provide access to the original document.');
assert.match(materialStatus, /\{title\}/,
  'Keep the material title during processing and error states.');


assert.match(appLayout, /isMaterialStudyRoute \? 'hidden md:block' : ''/,
  'On PDF routes the global Evaluo header should disappear only on mobile.');
assert.match(appLayout, /const isMaterialStudyRoute = pathname.startsWith\('\/materiales\/'\)/,
  'The mobile topbar exception must be restricted to PDF study routes.');
assert.match(workspace, /<h1 className="text-foreground min-w-0 truncate/,
  'Keep the primary PDF title in the reader navigation alongside Volver and Ver guía.');
assert.doesNotMatch(workspace, /<h2 className="text-foreground hidden max-w-\[1040px\]/,
  'The PDF title must not appear a second time in the summary on either viewport.');
assert.match(workspace, /data-evaluo-desktop-reader-title/,
  'Desktop reader keeps a compact title, Back action and Guide access in one row.');
assert.match(workspace, /href=\{backHref\}\s+aria-label=\{t\("Volver"\)\}/,
  'Desktop Back is a free icon button (no box) with an accessible name.');
assert.match(workspace, /data-study-summary-intro/,
  'Hiding the duplicate title must not remove the introductory summary.');


assert.match(workspace, /data-study-summary-intro/,
  'El texto introductorio debe estar identificado para medir y controlar su altura.');
assert.match(workspace, /line-clamp-4 sm:line-clamp-none/,
  'La introducción larga sólo debe abreviarse en móvil.');
assert.match(workspace, /aria-expanded=\{summaryIntroExpanded\}/,
  'La descripción debe poder expandirse y contraerse de forma accesible.');
assert.match(workspace, /Leer introducción completa/,
  'El estudiante debe poder acceder a todo el contenido.');
assert.match(workspace, /max-w-\[1040px\] text-\[13px\] leading-\[1\.65\]/,
  'La introducción debe aprovechar más ancho con tipografía compacta.');
assert.match(workspace, /max-w-\[940px\] min-w-0/,
  'El lector de capítulos debe aprovechar el ancho disponible.');
assert.match(workspace, /text-\[16px\] leading-\[1\.4\] font-semibold/,
  'Los títulos de capítulo deben mantener una jerarquía legible sin ocupar demasiado.');
assert.match(workspace, /border-b py-4 first:pt-0/,
  'Se deben reducir los espacios entre capítulos.');
assert.match(richText, /space-y-2\.5 \[&_h4\]:text-\[15px\]/,
  'El contenido largo conserva espaciado compacto y encabezados legibles.');
assert.match(richText, /\[&_p\]:text-\[15px\] \[&_p\]:leading-\[1\.7\]/,
  'El cuerpo de lectura mantiene el tamaño y la altura de línea actuales.');
assert.match(styles, /border-b-2 border-transparent bg-transparent px-0 text-\[14px\]/,
  'Las pestañas del estudio son texto libre con subrayado, sin recuadros.');
assert.doesNotMatch(workspace, /transform:scale\(|zoom:/,
  'No usar zoom que distorsione los popups, controles o interacción.');

// La acción de Práctica debe ir después de las opciones, no taparlas en móvil.
assert.match(styles, /bg-card mt-4 flex justify-end border-t py-3/);
assert.doesNotMatch(styles, /sticky bottom-0/, 'Evitar un CTA flotante sobre las respuestas.');
const exam = readFileSync('components/student-material-exam.tsx', 'utf8');
assert.match(exam, /data-pdf-question-actions/);
assert.match(exam, /text-\[13px\] font-medium">{topicTitle}/);
assert.doesNotMatch(exam, /Práctica basada en este PDF/,
  'La práctica general dentro del PDF no muestra el subtítulo redundante.');
assert.match(exam, /data-onboarding-practice-options className="grid w-full max-w-\[720px\] grid-cols-3/,
  'Los tres tamaños de práctica se muestran en una misma fila desde móvil.');
assert.doesNotMatch(exam, /index === 2 && sizeOptions\.length === 3 && 'col-span-2'/,
  'La última tarjeta no debe ocupar dos columnas ni producir una segunda fila.');
assert.match(exam, /onClick=\{\(\) => \{ setSelectedSize\(option\.count\); void startExam\(option\.count\); \}\}/,
  'Seleccionar cualquier tarjeta conserva la interacción real.');
assert.match(exam, /hidden text-\[11px\] leading-\[1\.4\] opacity-80 sm:block/,
  'Las descripciones largas se ocultan solo en móvil para mantener las tres tarjetas legibles.');

// El índice (móvil y escritorio) y el área de lectura revelan el thumb
// sólo al desplazarse. No alterar el scroll ni introducir un scrollbar global.
assert.equal((workspace.match(/data-pdf-auto-scrollbar/g) ?? []).length, 3,
  'Índice móvil, índice desktop y lector deben tener scrollbars autohide.');
assert.equal((workspace.match(/onScroll=\{showScrollbarWhileScrolling\}/g) ?? []).length, 3,
  'Los tres paneles deben revelar su propia barra cuando reciben scroll.');
assert.match(workspace, /element\.dataset\.pdfScrollbarScrolling = 'true'/,
  'La barra debe aparecer al empezar a desplazarse.');
assert.match(workspace, /delete element\.dataset\.pdfScrollbarScrolling/,
  'La barra debe ocultarse al terminar la interacción.');
assert.match(workspace, /\}, 900\)\)/,
  'El thumb no debe quedar permanentemente visible.');
assert.match(workspace, /window\.clearTimeout\(previous\)/,
  'El timer de ocultación se reinicia durante el scroll continuo.');
assert.match(workspace, /for \(const \[element, timer\] of timers\)/,
  'Los temporizadores de scrollbar se limpian al desmontar el lector.');
assert.match(globalStyles, /\[data-pdf-auto-scrollbar\] \{\s*(?:scrollbar-gutter: stable;\s*)?scrollbar-width: thin;\s*scrollbar-color: transparent transparent;/,
  'La barra inactiva mantiene el scroll y no dibuja un thumb.');
assert.match(globalStyles, /\[data-pdf-auto-scrollbar\]\[data-pdf-scrollbar-scrolling='true'\]/,
  'Los estilos vuelven a mostrar el thumb durante el scroll.');
assert.match(globalStyles, /\[data-pdf-auto-scrollbar\]:focus-visible/,
  'Navegación por teclado mantiene visible la barra al enfocar el lector.');
assert.match(globalStyles, /@supports selector\(::-webkit-scrollbar\)/,
  'Chrome y Safari necesitan reglas separadas de las propiedades estándar.');
assert.match(globalStyles, /\[data-pdf-auto-scrollbar\],\s*\[data-pdf-auto-scrollbar\]\[data-pdf-scrollbar-scrolling='true'\],\s*\[data-pdf-auto-scrollbar\]:focus-visible\s*\{\s*scrollbar-width: auto;\s*scrollbar-color: auto;/,
  'Chromium utiliza los thumb personalizados tanto en reposo como al desplazarse y recibir foco.');
assert.match(globalStyles, /::-webkit-scrollbar-thumb\s*\{\s*border-radius: 999px;\s*background-color: transparent;/,
  'El thumb de Chrome debe permanecer completamente transparente cuando no hay scroll.');
assert.match(globalStyles, /\[data-pdf-auto-scrollbar\]\[data-pdf-scrollbar-scrolling='true'\]::-webkit-scrollbar-thumb/,
  'El thumb de Chrome vuelve a mostrarse al detectar desplazamiento.');
assert.match(globalStyles, /::-webkit-scrollbar-button\s*\{\s*display: none;/,
  'Eliminar las flechas nativas de Windows que seguían visibles en la captura.');
assert.match(globalStyles, /scrollbar-gutter: stable;/,
  'Mostrar y ocultar el thumb sin desplazar el texto.');
assert.doesNotMatch(workspace, /\[scrollbar-width:thin\]|\[scrollbar-gutter:stable\]/,
  'Evitar propiedades Tailwind sobre las reglas personalizadas de Chrome.');
assert.match(globalStyles, /@media \(forced-colors: active\)/,
  'El scrollbar permanece perceptible en modo de alto contraste.');
assert.match(workspace, /min-h-0 flex-1 overflow-y-auto overscroll-contain/,
  'La lectura debe conservar el scroll vertical nativo.');
assert.match(workspace, /min-h-0 overflow-y-auto overscroll-contain pr-2/,
  'El índice desktop debe seguir siendo desplazable.');

console.log('Compact material study layout smoke: OK.');

// LCP del visor (demo/material-estudio en Lighthouse CI, máx. 4200 ms):
// la pestaña inicial no arranca invisible y Supabase no entra en el JS inicial.
assert.match(workspace, /const tabPanelMotion = tabSwitched \? 'animate-tab-panel' : undefined;/);
assert.doesNotMatch(workspace, /className="animate-tab-panel/);
const userHook = readFileSync('hooks/useUser.tsx', 'utf8');
assert.doesNotMatch(userHook, /^import \{ supabase \}/m, 'useUser must not load Supabase before first paint.');
assert.match(userHook, /import\('@\/lib\/supabase-client'\)/);
