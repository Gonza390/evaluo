import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const picker = read('components/dashboard/practice-mode-picker.tsx');
const exerciseScreens = read('components/dashboard/practice-visual-screens.tsx');
const practiceSession = read('components/dashboard/practice-session.tsx');
const panel = read('components/dashboard/practice-history-panel.tsx');
const detail = read('components/dashboard/practice-history-detail.tsx');
const page = read('app/(es)/dashboard/practicar/page.tsx');
const history = read('lib/student-materials/practice-history.ts');
const api = read('app/api/practice/session/route.ts');
const migration = read('supabase/migrations/20261101140000_practice_mode_sessions.sql');

assert.match(picker, /lg:grid-cols-\[minmax\(0,1\.22fr\)_minmax\(310px,0\.86fr\)\]/, 'Dos columnas en escritorio');
assert.match(picker, /grid-cols-2 gap-3/, 'Tarjetas de Practicar con el espaciado de main');
assert.match(picker, /sm:min-h-\[142px\] sm:p-4/, 'Tarjetas con altura y padding de main');
assert.match(picker, /bg-\[#FCF2DF\] text-\[#9A712C\]/, 'Color Mixto idéntico a main');
assert.match(picker, /bg-\[#E2F2F7\] text-\[#41839B\]/, 'Color Flashcards idéntico a main');
assert.match(picker, /bg-transparent py-2\.5 pl-10/, 'Selector de PDF sin recuadro');
assert.doesNotMatch(picker, /rounded-xl border border-\[#E2E8F2\] bg-white py-2\.5 pl-10/, 'El selector no vuelve a ser una tarjeta');
assert.doesNotMatch(panel, /materialTitle|Historial de este material/, 'El historial no repite el nombre del PDF');
assert.doesNotMatch(panel, /size-\[17px\] shrink-0 text-\[#71809A\]/, 'Sin ícono de historial en el encabezado');
assert.doesNotMatch(picker, />MATERIAL<\/span>|Conceptos clave y preguntas frecuentes|Más preguntas y práctica en cada modalidad/,
  'El paso Cómo querés repasar no muestra tarjeta de material ni textos redundantes');
assert.match(picker, /≈ 10 min/, 'El repaso rápido sigue mostrando su duración');
assert.match(picker, /≈ 40 min/, 'El repaso completo sigue mostrando su duración');
assert.match(exerciseScreens, /flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end/,
  'Salir y Terminar se ubican en extremos opuestos en móvil');
const caseScreen = exerciseScreens.slice(
  exerciseScreens.indexOf('export function CasesPracticeScreen('),
  exerciseScreens.indexOf('export function CompletePracticeScreen(')
);
assert.match(caseScreen, /mt-4 flex w-full items-center justify-between gap-2/,
  'Anterior permanece en el extremo izquierdo del pie de Casos en móvil');
assert.match(caseScreen, /ml-auto flex shrink-0 items-center gap-1/,
  'Saltar y Confirmar permanecen agrupados a la derecha');
assert.match(caseScreen, /onClick=\{onPrevious\}/);
assert.match(caseScreen, /onClick=\{onSkip\}/);
assert.match(caseScreen, /onClick=\{onNext\}/);
assert.match(caseScreen, /max-w-\[1120px\]/, 'Casos usa un ancho mayor para la corrección.');
assert.match(caseScreen, /data-case-explanation/, 'La explicación ocupa una fila completa bajo ambas columnas.');
assert.match(caseScreen, /!correct && <p className="mt-2 whitespace-pre-line/,
  'Casos no muestra explicaciones cuando la respuesta es correcta.');
assert.match(caseScreen, /!correct && <p className="mt-2 font-medium[^\n]*Respuesta correcta:/,
  'Casos mantiene la respuesta correcta cuando hay un error.');
assert.match(practiceSession, /mode !== 'casos' \|\| !correctAt\(i\)/,
  'Los resultados tampoco explican casos respondidos correctamente.');

assert.match(caseScreen, /scrollIntoView/, 'Al confirmar un error, se desliza hacia la explicación.');
assert.match(caseScreen, /justConfirmedIncorrect/, 'El scroll no se dispara en respuestas correctas.');
assert.match(caseScreen, /prefers-reduced-motion/, 'Respeta la preferencia de movimiento reducido.');



assert.match(exerciseScreens, /onClick=\{\(\)=>setSubmitted\(true\)\}/,
  'Terminar mantiene su acción de comprobación');
assert.match(practiceSession, /mode === 'opciones' \? \(/,
  'Opciones tiene encabezado propio para PDF en la misma línea');
assert.match(practiceSession, /min-w-0 flex-1 truncate text-\[12px\]/,
  'Nombre de PDF truncado en pantallas pequeñas');
assert.match(practiceSession, /mt-5 flex w-full items-center justify-between gap-2/,
  'Anterior y Comprobar quedan uno en cada extremo en Opciones');
assert.match(practiceSession, /mb-2 text-center text-xs font-medium text-slate-500">¿Verdadero o falso\?/, 
  'El rótulo ¿Verdadero o falso? está centrado dentro de la tarjeta');
assert.match(practiceSession, /mode === 'opciones' \? 'text-center ' : 'text-left '/,
  'Verdadero y Falso centrados, sin cambiar las otras modalidades');
assert.match(picker, /data-practice-dual-pane/, 'Practicar identifica su layout de dos paneles');
assert.match(picker, /lg:h-full lg:min-h-0 lg:overflow-hidden/, 'Practicar ocupa la altura real del contenedor, sin estimar la del header');
assert.match(picker, /lg:flex-1 lg:content-start lg:overflow-y-auto/, 'Las modalidades tienen scroll propio en escritorio');
const shell = read('components/ClientLayoutClient.tsx');
const responsiveCss = read('app/(es)/dashboard/dashboard-responsive.css');
assert.match(shell, /const isDesktopPracticeHomeRoute = pathname === '\/dashboard\/practicar'/, 'El bloqueo del viewport se aplica solo a Practicar');
assert.match(shell, /lg:h-dvh lg:min-h-0 lg:overflow-hidden/, 'El shell de Practicar se limita a la altura disponible');
assert.match(responsiveCss, /dashboard-responsive:has\(> \[data-practice-dual-pane\]\)/, 'La altura se propaga al contenido solo en Practicar');
assert.match(panel, /lg:overflow-hidden/, 'El historial queda inmóvil en escritorio');
assert.doesNotMatch(panel, />Historial de prácticas<|>Ver todas las prácticas</, 'El historial no agrega un título o botón visual redundante; conserva la etiqueta accesible');
assert.doesNotMatch(panel, /<Dialog open=\{showAll\}/, 'No debe abrirse un modal para ver prácticas anteriores');
assert.match(picker, /activeHistoryEntry/, 'El panel central usa la práctica elegida');
assert.match(picker, /selectedSession=\{activeHistoryEntry\}/, 'El historial recibe la sesión elegida para mostrar su detalle');
assert.match(panel, /if \(selectedSession && selectedSession\.materialId === materialId\)/, 'El detalle se muestra dentro del panel de historial');
assert.match(picker, /onSelectSession=\{entry => setActiveHistoryId\(entry\.id\)\}/, 'Seleccionar una práctica abre su detalle');
assert.match(panel, /onClick=\{\(\) => onSelectSession\(item\)\}/, 'El historial abre el detalle sin ventanas emergentes');
assert.match(panel, /for \(const entry of sessions\)/, 'Todas las prácticas se muestran en el historial interno');
assert.match(panel, /onClick=\{onBackToHistory\}/, 'El detalle permite regresar al historial');
assert.match(panel, /selectedSession\.answers\?\.length \? selectedSession\.answers\.map/, 'El detalle muestra las respuestas almacenadas');
assert.match(panel, /selectedSession\.answers\?\.length/, 'El detalle contempla sesiones sin respuestas guardadas');
assert.match(picker, /data-practice-columns/, 'Las dos columnas quedan limitadas al viewport.');
assert.match(picker, /data-practice-modes/, 'Solo las tarjetas de modalidades se desplazan al inicio.');
assert.match(panel, /data-practice-history-inline-detail/, 'El resultado se abre dentro del panel derecho.');
assert.match(panel, /data-practice-history-answers/, 'Solo las preguntas y respuestas tienen scroll en el detalle.');
assert.match(responsiveCss, /\[data-practice-history-answers\] \{[\s\S]*?overflow-y: auto;/, 'Las respuestas pueden desplazarse independientemente.');
assert.match(responsiveCss, /\[data-practice-dual-pane\] \{[\s\S]*?overflow: hidden;/, 'La página de Practicar no debe hacer scroll general.');

assert.match(panel, /selectedSession && selectedSession\.materialId === materialId/, 'El detalle se muestra en el panel correspondiente');
assert.match(responsiveCss, /dashboard-responsive:has\(> \[data-practice-dual-pane\]\)/, 'La vista de historial conserva el layout de dos columnas');


assert.match(picker, /aria-label="Modalidades de práctica: desplazate para ver todas"/, 'La zona desplazable es accesible');
assert.match(picker, /scrollbarStyles\.scrollArea/, 'La barra de las modalidades queda oculta sin desactivar scroll');
assert.match(panel, /lg:h-full lg:min-h-0/, 'El historial queda fijo dentro de la columna');
assert.doesNotMatch(panel, /lg:sticky/, 'No depende del scroll general de página');
assert.match(picker, /material && <PracticeHistoryPanel/, 'Sin PDF no se presenta un historial engañoso');
assert.match(picker, /onStartFlashcards=\{\(\) => openReview\('Flashcards'\)\}/,
  'El botón del vacío usa el flujo real de selección de Flashcards');
assert.match(panel, /if \(historyLoadError\)/, 'La falla de lectura no se confunde con una cuenta vacía');
assert.match(panel, /if \(sessions\.length === 0\)/, 'Estado vacío aislado');
assert.match(panel, /\/evi\/evi-animo\.svg/, 'Ilustración Evi real');
assert.match(panel, /Todavía no practicaste/);
assert.match(panel, /Empezar con Flashcards/);
assert.match(panel, /Qué vas a ver acá/);
assert.doesNotMatch(panel, /Evolución|previousFour|Filtrar por modalidad|Ver prácticas con errores/, 
  'Historial simplificado sin tendencia, filtros ni CTA de errores');
assert.match(panel, /groups\.map\(group => \(/, 'Se mantiene la lista de prácticas');
assert.match(panel, /scrollbarStyles\.scrollArea/, 'La lista mantiene scroll con barra invisible');
assert.match(panel, /router\.refresh\(\)/, 'Hay recuperación tras error');
assert.match(panel, /flex-1 overflow-y-auto overscroll-contain border-t/, 'Solo la lista del historial tiene scroll interno');
assert.match(page, /historyLoadError=\{historyLoadError\}/, 'El error llega al panel');
assert.match(history, /throw new Error\('practice_history_unavailable'\)/);
assert.match(history, /history_session_id/, 'Los eventos antiguos y actuales no se duplican por heurística amplia');
assert.match(api, /history_session_id: attemptId/, 'Cada guardado tiene correlación exacta');
assert.match(api, /\.eq\('user_id', user\.id\)/);
assert.match(migration, /enable row level security/);
assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);

const finishedReport = practiceSession.slice(
  practiceSession.indexOf('const fullReport = finished ? ('),
  practiceSession.indexOf('const [revealPractice')
);
assert.doesNotMatch(finishedReport, /\{aiCaseButton\}/,
  'Al finalizar Casos no debe ofrecer generar más casos con IA.');
assert.match(practiceSession, /const aiCaseButton = mode === 'casos' && aiAvailable && !ready && !freeV2 \? \(/,
  'La generación de casos queda disponible únicamente para recuperar una práctica que no pudo iniciar.');
assert.match(finishedReport, /mode === 'casos' \? '\/dashboard\/practicar'/,
  'El enlace final de Casos debe llevar al selector de Practicar.');
assert.match(finishedReport, /mode === 'casos' \? 'Volver a Practicar' : 'Volver al resumen'/,
  'El texto Volver a Practicar se aplica solo a Casos, sin alterar las otras modalidades.');
console.log('Practicar: empty/history screens, routing, metrics, recovery, security — OK');
