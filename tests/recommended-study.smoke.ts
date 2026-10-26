import './summary-topic-association.smoke.ts';
import './material-answer-evidence.smoke.ts';
import './pdf-progress.smoke.ts';
import './topic-practice.smoke.ts';
import './topic-study-resources.smoke.ts';
import './study-flow-recovery.smoke.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSummaryCheckPlan } from '../lib/student-materials/summary-checks.ts';
import { buildPedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';
import { getFirstTopicResourceInfo } from '../lib/student-materials/first-topic-resources.ts';
import type { StudentMaterialSummary, StudyGlossaryItem } from '../lib/student-materials/types.ts';
import { selectDiagnosticQuestions } from '../lib/student-materials/diagnostic-questions.ts';
import { getFirstReadyStudentMaterialId } from '../lib/data/student-materials.ts';
import {
  isAllowedAnalyticsEventName,
  SUMMARY_FLOW_VERSION,
} from '../lib/analytics-events.ts';
import { sanitizeAnalyticsMetadata } from '../lib/analytics-metadata.ts';
import type { PedagogicalArtifacts, StudyQuestion } from '../lib/student-materials/pedagogy.ts';

const question = (id: string, topic: string): StudyQuestion => ({
  id,
  topic,
  type: 'multiple_choice',
  level: 'comprender',
  kind: 'concept',
  prompt: `Pregunta sobre ${topic}`,
  answer: 'Respuesta válida',
  options: ['Respuesta válida', 'Alternativa A', 'Alternativa B'],
  explanation: 'Explicación del PDF',
  reference: { pageStart: 1, pageEnd: 1, sectionTitle: topic, excerpt: 'Fragmento del PDF' },
});
const artifacts = (questions: StudyQuestion[]): PedagogicalArtifacts => ({
  questions,
  flashcards: [],
  miniExamQuestionIds: [],
  coverage: { conceptsUsed: 0, sectionsUsed: 0, referencedItems: 0, totalItems: questions.length },
});

const candidates = [
  question('a', 'Tema A'),
  question('a2', 'Tema A'),
  question('b', 'Tema B'),
  question('c', 'Tema C'),
  question('d', 'Tema D'),
  question('e', 'Tema E'),
  question('f', 'Tema F'),
];
const selected = selectDiagnosticQuestions(artifacts(candidates), 5);
assert.equal(selected.length, 5);
assert.equal(new Set(selected.map((item) => item.topic)).size, 5);
assert.equal(selectDiagnosticQuestions(artifacts(candidates)).length, 6);
assert.equal(selectDiagnosticQuestions(artifacts(candidates.slice(0, 4)), 5).length, 4);
assert.equal(selectDiagnosticQuestions(artifacts(candidates.slice(0, 2)), 5).length, 2);
const invalid = { ...question('invalid', 'Inválido'), answer: 'Respuesta ausente' };
const confusion = { ...question('confusion', 'Confusión'), kind: 'confusion' as const };
const duplicate = { ...question('a', 'Otro tema') };
const eligible = selectDiagnosticQuestions(
  artifacts([invalid, confusion, candidates[0], duplicate]),
  5
);
assert.deepEqual(
  eligible.map((item) => item.id),
  ['a']
);

// La consulta del primer PDF debe restringir dueño y estado, y ordenar de forma estable.
const calls: Array<unknown[]> = [];
const query = {
  select: (value: string) => {
    calls.push(['select', value]);
    return query;
  },
  eq: (column: string, value: string) => {
    calls.push(['eq', column, value]);
    return query;
  },
  order: (column: string, options: unknown) => {
    calls.push(['order', column, options]);
    return query;
  },
  limit: (count: number) => {
    calls.push(['limit', count]);
    return query;
  },
  maybeSingle: async (): Promise<{ data: { id: string } | null; error: null }> => ({
    data: { id: 'first-ready-id' },
    error: null,
  }),
};
const client = {
  from: (table: string) => {
    calls.push(['from', table]);
    return query;
  },
} as unknown as Parameters<typeof getFirstReadyStudentMaterialId>[0];
assert.equal(await getFirstReadyStudentMaterialId(client, 'owner-id'), 'first-ready-id');
assert.deepEqual(calls, [
  ['from', 'student_materials'],
  ['select', 'id'],
  ['eq', 'user_id', 'owner-id'],
  ['eq', 'processing_status', 'ready'],
  ['order', 'created_at', { ascending: true }],
  ['order', 'id', { ascending: true }],
  ['limit', 1],
]);
query.maybeSingle = async () => ({ data: null, error: null });
assert.equal(await getFirstReadyStudentMaterialId(client, 'owner-id'), null);

// Las comprobaciones del lector deben ser respondibles, distintas y respaldadas por el material.
const materialPageSource = readFileSync('app/materiales/[id]/page.tsx', 'utf8');
const materialWorkspaceSource = readFileSync('components/material-study-workspace.tsx', 'utf8');
const demoPageSource = readFileSync('app/demo/material-estudio/page.tsx', 'utf8');
const demoWorkspaceSource = readFileSync('components/demo-four-step-study.tsx', 'utf8');
assert.doesNotMatch(demoPageSource, /start === 'eleccion'|start === 'plan'/,
  'La demo no debe ofrecer etapas de inicio eliminadas.');
assert.match(demoPageSource, /tour !== '0'/,
  'La demo debe conservar el onboarding de cuatro pasos.');
assert.doesNotMatch(demoWorkspaceSource, /initialStudyEntryStage/,
  'La demo no debe recibir estados de la tarjeta de elección.');

const firstGuideSource = readFileSync('components/study/recommended-study-guide.tsx', 'utf8');
const progressPanelSource = readFileSync('components/dashboard/pdf-progress-panel.tsx', 'utf8');
const globalCssSource = readFileSync('app/globals.css', 'utf8');
const previewSource = readFileSync('components/preview/real-pdf-progress-preview.tsx', 'utf8');
const mobileNavigationSource = readFileSync('components/study/pdf-mobile-navigation.tsx', 'utf8');
const examSource = readFileSync('components/student-material-exam.tsx', 'utf8');
const demoFourStepSource = readFileSync('components/demo-four-step-study.tsx', 'utf8');
// El cierre de la práctica de un tema debe usar su pantalla de resultado
// concisa, no sustituirla al instante por el lector largo de Progreso.
assert.ok(examSource.includes("if (topicSectionIndex !== undefined) {"),
  'El resultado diseñado debe aparecer en prácticas reales y en la demo.');
assert.ok(examSource.includes('Detectamos qué necesitás reforzar'),
  'La pantalla final debe presentar el mensaje acordado.');
assert.ok(examSource.includes('Reforzar mis errores') && examSource.includes('Seguir al siguiente tema'),
  'La pantalla final debe ofrecer las acciones de continuidad por tema.');
assert.ok(materialWorkspaceSource.includes('<StudentMaterialExam'),
  'La pantalla real debe conservar el componente con el cierre de práctica.');
assert.doesNotMatch(materialWorkspaceSource, /topicPracticeFinished|data-topic-practice-final/,
  'No se puede reemplazar el cierre por el detalle largo de Progreso.');
assert.ok(materialWorkspaceSource.includes('onStudyNextTopic={') && materialWorkspaceSource.includes('onReturnToTopic={'),
  'Los botones del cierre deben dirigir al detalle de Progreso cuando corresponda.');
assert.ok(demoFourStepSource.includes('practice: demoTopicIndex !== null ? ('),
  'La demo debe mantener la práctica visible hasta mostrar su resultado.');
assert.ok(demoFourStepSource.includes('onTopicFinished={setDemoTopicFinished}'),
  'La demo debe conservar el resultado para la navegación posterior.');
assert.ok(demoFourStepSource.includes('onStudyNextTopic={(index) => {') &&
          demoFourStepSource.includes('onViewAllTopics={() => {'),
  'La demo también debe resolver sus acciones de continuidad.');
assert.ok(demoFourStepSource.includes('lastPracticeOutcome={demoTopicFinished ?? undefined}'),
  'Progreso debe recibir el resultado sólo al navegar hacia él.');

const diagnosticSource = readFileSync('components/student-material-diagnostic.tsx', 'utf8');

assert.ok(firstGuideSource.includes("label: 'Entender'") &&
          firstGuideSource.includes("label: 'Practicar'") &&
          firstGuideSource.includes("label: 'Progreso'") &&
          firstGuideSource.includes("label: 'Reforzar'"),
          'El tutorial debe enseñar los cuatro momentos de Evaluo.');
assert.match(firstGuideSource, /'summary', 'practice', 'progress', 'reinforce'/,
  'Los cuatro pasos deben mantener este orden.');
assert.match(firstGuideSource, /\{number\} de 4/,
  'El indicador debe comunicar cuatro pasos, no tres.');
assert.match(firstGuideSource, /data-first-pdf-guide/,
  'La guía debe enseñar la interfaz real.');
assert.match(firstGuideSource, /Descubrí cómo venís/,
  'El tercer paso debe explicar el seguimiento del estudio.');
assert.match(firstGuideSource, /Aprendé cómo reforzar/,
  'El cuarto paso debe enseñar cómo reforzar un tema.');
assert.match(firstGuideSource, /Después de practicar, vas a ver qué temas reforzar/,
  'Progreso debe conectar la práctica con los temas que requieren repaso.');
assert.match(materialWorkspaceSource, /recommendedTourStep === 'progress' \? 220 : 150/,
  'El paso de Progreso debe mantener una transición suave.');
assert.equal((materialWorkspaceSource.match(/data-onboarding-step=\{recommendedActive \? recommendedTourStep : undefined\}/g) ?? []).length, 2,
  'El énfasis visual debe estar disponible en escritorio y móvil.');
assert.match(globalCssSource, /\[data-onboarding-step='summary'\] \[data-summary-reading-section='0'\]/,
  'Entender debe señalar el primer capítulo.');
assert.match(globalCssSource, /\[data-onboarding-step='practice'\] \[data-onboarding-practice-options\]/,
  'Practicar debe señalar las opciones reales.');
assert.match(globalCssSource, /\[data-onboarding-step='reinforce'\] \[data-onboarding-topic-detail\]/,
  'El cuarto paso debe señalar la vista real del tema.');
assert.doesNotMatch(globalCssSource, /\[data-onboarding-step='progress'\] \[data-recommended-topics\]/,
  'Progreso debe usar el borde original de la tarjeta, sin un segundo resaltado.');
assert.doesNotMatch(globalCssSource, /\[data-onboarding-step='reinforce'\] aside\[aria-label=/,
  'Reforzar no debe sumar otro borde al panel de navegación de temas.');
assert.match(globalCssSource, /\[data-onboarding-step='progress'\] \[data-tour-example-topic\]/,
  'El tercer paso debe presentar los estados ilustrativos con movimiento suave.');
assert.match(globalCssSource, /prefers-reduced-motion: reduce/,
  'Los estados de ejemplo deben respetar movimiento reducido.');
assert.match(firstGuideSource, /Volvé al tema, repasá conceptos y practicá cuando estés listo/,
  'El cuarto paso debe mostrar una acción concreta de refuerzo.');
assert.match(progressPanelSource, /data-onboarding-topic-detail/,
  'El paso 4 debe abrir la vista real de estudio de un tema.');
assert.match(progressPanelSource, /showOnboardingTopic\s*\?\s*topics\[0\]/,
  'El paso 4 debe usar el primer tema real del PDF.');
assert.match(progressPanelSource, /showOnboardingExample\s*\?\s*null/,
  'El paso 3 debe mostrar la lista general de Progreso antes del detalle.');
assert.match(progressPanelSource, /data-tour-example-topic/,
  'El ejemplo visual debe mostrarse en la lista de temas.');
assert.match(progressPanelSource, /Dominado.*Reforzar.*Sin evaluar/s,
  'El ejemplo debe distinguir dominado, reforzar y sin evaluar.');
assert.match(progressPanelSource, /no representan tus resultados/,
  'Los estados ilustrativos no deben atribuirse al estudiante.');
assert.match(progressPanelSource, /topics\.slice\(0, 3\)/,
  'El ejemplo debe usar nombres de temas de ese PDF.');
assert.match(progressPanelSource, /!showOnboardingExample && visibleTopics\.map/,
  'Los resultados reales deben reaparecer al terminar.');
assert.match(progressPanelSource, /const topicId = showOnboardingTopic/,
  'El modo guiado no debe modificar el estado persistente de temas.');
assert.match(materialWorkspaceSource, /showOnboardingTopic = recommendedActive && recommendedTourStep === 'reinforce'/,
  'El detalle guiado solo debe mostrarse en el paso 4.');
assert.match(materialWorkspaceSource, /showOnboardingExample = recommendedActive && recommendedTourStep === 'progress'/,
  'Los estados ilustrativos solo deben mostrarse en el paso 3.');
assert.match(previewSource, /progress: \(\{ showOnboardingExample, showOnboardingTopic \}\) =>/,
  'La preview debe recibir los dos estados de Progreso.');
assert.match(materialWorkspaceSource, /showOnboardingTopic=\{showOnboardingTopic\}/,
  'El PDF real debe usar el mismo estado de estudio por temas.');
assert.match(firstGuideSource, /Empezar a estudiar/,
  'El CTA final debe devolver al primer capítulo.');
assert.doesNotMatch(firstGuideSource, /progressExplained|Ver cómo funciona/,
  'Progreso no debe añadir un quinto clic oculto.');
assert.match(firstGuideSource, /const stackedControls = step === 'progress' \|\| step === 'reinforce'/,
  'Progreso y Reforzar deben apilar los controles para impedir desbordes.');
assert.match(firstGuideSource, /stackedControls[\s\S]*?flex flex-col items-stretch gap-2/,
  'El indicador de pasos debe quedar en una fila propia.');
assert.match(firstGuideSource, /overflow-x-hidden overflow-y-auto/,
  'La guía no debe mostrar una barra horizontal al terminar.');
assert.match(firstGuideSource, /stackedControls \? 'border-transparent shadow-none'/,
  'Los pasos 3 y 4 no deben duplicar el borde del panel de estudio.');
assert.match(firstGuideSource, /cardRef\.current\?\.getBoundingClientRect\(\)\.width/,
  'El centrado debe medir el ancho de la tarjeta.');
assert.match(firstGuideSource, /onBack/,
  'Los pasos deben permitir retroceder.');

assert.match(firstGuideSource, /createPortal/, 'El foco debe renderizarse fuera de los contenedores con overflow.');
assert.match(firstGuideSource, /bg-slate-950\/12 backdrop-blur-\[1px\]/, 'El fondo del tutorial debe ser suave.');
assert.match(firstGuideSource, /radial-gradient\(circle at/, 'Las esquinas internas del foco deben ser realmente redondeadas.');
assert.match(firstGuideSource, /rounded-\[28px\]/, 'El foco y la tarjeta deben usar radios amplios.');
assert.match(firstGuideSource, /getBoundingClientRect\(\)\.height/, 'La posición de la tarjeta debe usar su altura real.');
assert.match(firstGuideSource, /transition-\[top,left,opacity\]/, 'La tarjeta debe deslizarse entre secciones.');
assert.match(materialWorkspaceSource, /duration-\[260ms\]/, 'El panel debe usar transiciones suaves.');
assert.match(materialWorkspaceSource, /opacity-40/, 'El contenido no debe desaparecer bruscamente.');
assert.match(firstGuideSource, /data-onboarding-study-panel/, 'La guía debe enfocar todo el panel y no solo una sección.');
assert.match(materialWorkspaceSource, /data-recommended-practice/, 'La práctica debe exponer un foco real.');
assert.match(firstGuideSource, /aria-modal="true"/, 'La guía debe tener semántica accesible.');
assert.match(firstGuideSource, /Escape/, 'La guía debe poder saltarse con Escape.');
assert.match(firstGuideSource, /studyPanelSelector/, 'El foco debe localizar la carcasa de estudio.');
assert.match(firstGuideSource, /const rect = shellRect/,
  'El lector y la barra de pestañas deben verse juntos en cada paso.');
assert.match(firstGuideSource, /shellRect\.top - cardHeight - 12/,
  'La tarjeta compacta debe estar fuera del área de estudio.');
assert.match(firstGuideSource, /findStudyPanel/, 'Debe seleccionar el panel responsive visible.');
assert.doesNotMatch(firstGuideSource, /maxFocusHeight/, 'No se debe recortar la altura a un fragmento del resumen.');
assert.doesNotMatch(firstGuideSource, /scrollIntoView/, 'El tutorial no debe mover el contenido completo inesperadamente.');
assert.match(materialWorkspaceSource, /data-onboarding-guide-space/, 'La tarjeta debe reservar espacio para no cubrir el lector.');
assert.match(materialWorkspaceSource, /data-summary-reading-section="0"/,
  'El primer paso debe mostrar contenido académico de un capítulo y no solo la introducción.');
assert.match(materialWorkspaceSource, /tourStudySelectors: Record<RecommendedStudyStep, string>/,
  'Los cuatro pasos deben abrir contenido útil de cada pantalla.');
assert.match(materialWorkspaceSource, /reader\.scrollTo\(/,
  'Los desplazamientos deben quedar dentro del lector.');
assert.match(materialWorkspaceSource, /MutationObserver/,
  'Progreso debe poder mostrar sus temas aunque se rendericen después.');
assert.match(materialWorkspaceSource, /setStudyStartGuideOpen\(true\)/,
  'Terminar el onboarding debe abrir la guía de estudio directamente.');
assert.doesNotMatch(materialWorkspaceSource, /studyEntryStage|chooseStudyEntry|data-first-pdf-study-entry|¿Ya estudiaste este material\?/,
  'No deben persistir la tarjeta ni su lógica.');

assert.match(materialWorkspaceSource, /revealTourContent\('summary', true, scrollFirstChapterSmoothlyRef\.current \? 'smooth' : 'instant'\)/,
  'Al finalizar debe mostrarse y enfocarse el primer capítulo real, con scroll suave al elegir estudiar.');
assert.match(materialWorkspaceSource, /tabIndex=\{index === 0 \? -1 : undefined\}/,
  'El capítulo 1 debe admitir el foco programático sin agregarse a la navegación por Tab.');
assert.match(materialWorkspaceSource, /data-onboarding-practice-options/,
  'El segundo paso debe mostrar las opciones normales de práctica sin exigir responder.');
assert.match(examSource, /data-onboarding-practice-options/,
  'Las opciones de práctica deben seguir disponibles, sin modo obligatorio de una pregunta.');
assert.doesNotMatch(materialWorkspaceSource, /guidedFirstQuestion|tourQuestionResult/,
  'El onboarding no debe bloquear su avance exigiendo una evaluación.');
assert.match(materialWorkspaceSource, /data-recommended-topics/,
  'El tercer paso debe dirigir la vista hacia los temas de progreso.');
assert.match(materialWorkspaceSource, /md:h-2/,
  'El tutorial debe dejar disponible la mayor altura posible del lector.');
assert.doesNotMatch(materialWorkspaceSource, /activePanel\?\.scrollTo\(\{ top: 0/,
  'La guía no debe reiniciar todos los pasos a la introducción.');
assert.match(materialWorkspaceSource, /setFocusFirstChapterOnExit\(false\)/,
  'Salir del onboarding no debe saltar al capítulo hasta pulsar Leer el tema 1.');
const studyStartGuideSource = readFileSync('components/study/pdf-study-start-guide.tsx', 'utf8');
const summaryChapterFinishSource = readFileSync('components/study/summary-chapter-finish.tsx', 'utf8');
const flashcardsSource = readFileSync('components/student-material-flashcards.tsx', 'utf8');
assert.match(flashcardsSource, /unknownCount > 0 \? reviewDifficult : onPracticeTopic \?\? onReturnToTopic \?\? finishSession/,
  'Si recuerda todas las flashcards de un tema, el CTA principal debe abrir la práctica.');
assert.match(flashcardsSource, /onPracticeTopic\s*\? 'Comprobar cuánto aprendí'/,
  'El CTA de Flashcards sin pendientes debe anunciar el destino a la práctica.');
assert.match(flashcardsSource, /unknownCount > 0\s*\? 'Repasar lo que me costó'/,
  'Si quedan flashcards pendientes, debe priorizarse reforzar esas tarjetas.');
assert.match(materialWorkspaceSource, /onPracticeTopic=\{[\s\S]*?flashcardTopicIndex !== null && topicQuestionCounts\[flashcardTopicIndex\] > 0[\s\S]*?startChapterEvaluation\(flashcardTopicIndex\)/,
  'Flashcards por tema sólo deben llevar a la práctica filtrada cuando existan preguntas.');
assert.match(flashcardsSource, /onPracticeTopic \?\? onReturnToTopic \?\? finishSession/,
  'Sin preguntas del tema, el CTA debe conservar el regreso a la lectura.');

assert.ok(materialWorkspaceSource.includes('data-summary-chapter-end={index}'),
  'Cada capítulo debe marcar su final para abrir el popup al terminar la lectura.');
assert.ok(materialWorkspaceSource.includes('promptedChapterFinishesRef'),
  'El popup debe abrirse una sola vez por tema durante el recorrido.');
assert.ok(materialWorkspaceSource.includes('chapterFinishNavigationPauseRef'),
  'Al pasar al próximo capítulo no debe dispararse el popup inmediatamente.');
assert.ok(materialWorkspaceSource.includes('visibleEndIndex()'),
  'La apertura debe depender de alcanzar el final del capítulo.');
assert.ok(materialWorkspaceSource.includes('frame = window.requestAnimationFrame(checkReadingPosition)'),
  'Los capítulos cortos deben poder activar la detección sin depender de un scroll.');
assert.ok(materialWorkspaceSource.includes('dwellWithoutScroll'),
  'La evaluación no debe interrumpir instantáneamente una lectura corta sin scroll.');
assert.ok(materialWorkspaceSource.includes('resumeTimer = window.setTimeout(checkReadingPosition, pause + 30)'),
  'El disparador debe volver a comprobar la posición después de la navegación automática.');
assert.doesNotMatch(materialWorkspaceSource, /visibleTop \+ visibleHeight \* 0\.78/,
  'El final del capítulo no debe exigir una ventana estrecha de scroll.');

assert.ok(materialWorkspaceSource.includes('<SummaryChapterFinish'),
  'El popup debe montarse una única vez fuera del resumen.');
assert.ok(summaryChapterFinishSource.includes('<Dialog open={open}'),
  'La invitación debe ser un popup real, no una tarjeta debajo del tema.');
assert.ok(materialWorkspaceSource.includes('getTopicQuestionCounts(studySummary.sections, studyArtifacts.questions)'),
  'El botón principal sólo debe poder evaluar preguntas corregibles del capítulo.');
assert.ok(materialWorkspaceSource.includes('getTopicStudyResources(studySummary.sections, usefulGlossary, studyArtifacts.flashcards, index)'),
  'Flashcards y glosario del capítulo deben tener asociación temática verificable.');
assert.ok(materialWorkspaceSource.includes("handleStudyTabChange('ejercicios', 'summary_chapter')"),
  'El CTA debe abrir la práctica específica del tema y no el banco completo.');
assert.match(summaryChapterFinishSource, /Descubrí qué sabés y qué necesitás reforzar/,
  'El encabezado debe vender el beneficio, sin sobreexplicar la evaluación.');
assert.match(summaryChapterFinishSource, /data-summary-topic-name/,
  'El pop-up debe mostrar el nombre real del tema, no solo su número.');
assert.doesNotMatch(summaryChapterFinishSource, /Tema \\{chapterIndex \\+ 1\\} · Lectura finalizada/,
  'El encabezado no debe volver a usar Tema 1 como identificador principal.');
assert.match(summaryChapterFinishSource, /Comprobar cuánto aprendí/,
  'El CTA debe comunicar el beneficio de la evaluación, no ser una orden genérica.');
assert.doesNotMatch(summaryChapterFinishSource, /Evaluar este tema/,
  'El CTA genérico no debe aparecer en el nuevo pop-up.');

assert.match(summaryChapterFinishSource, /data-summary-topic-evaluate/,
  'La evaluación debe ser la acción principal.');
assert.match(summaryChapterFinishSource, /data-summary-topic-flashcards/,
  'El repaso con flashcards debe estar disponible de manera secundaria.');
assert.match(summaryChapterFinishSource, /data-summary-topic-glossary/,
  'El glosario debe estar disponible de manera secundaria.');
assert.match(summaryChapterFinishSource, /data-summary-topic-continue/,
  'Seguir leyendo debe quedar como una acción discreta.');
assert.doesNotMatch(summaryChapterFinishSource, /preguntas generadas|máximo de 20|Preguntas de recordar/,
  'No mostrar cantidades ni explicaciones largas en la tarjeta.');

const firstUploadSource = readFileSync('components/dashboard/pdf-first-upload-shell.tsx', 'utf8');
const quickUploadSource = readFileSync('components/dashboard/quick-pdf-upload.tsx', 'utf8');

assert.match(materialWorkspaceSource, /<PdfStudyStartGuide/,
  'Resumen debe mostrar directamente la guía de estudio.');
assert.match(materialWorkspaceSource, /studyGuideArrivalHandledRef\.current = materialId/,
  'Cada PDF debe mostrar su guía una sola vez por llegada.');
assert.match(materialWorkspaceSource, /initialStudyStartGuideRequested/,
  'Las cargas posteriores deben poder abrir la guía sin repetir el onboarding.');
assert.match(materialPageSource, /initialStudyStartGuideRequested=\{isOwner/,
  'La ruta debe activar directamente la guía de un nuevo PDF.');
assert.match(materialPageSource, /query\.inicio === '1'/,
  'Solo el enlace posterior a la carga debe solicitar la guía inicial.');
assert.match(firstUploadSource, /\?inicio=1/,
  'La carga normal debe solicitar la guía para el PDF nuevo.');
assert.match(quickUploadSource, /\?inicio=1/,
  'La carga rápida debe solicitar la guía para el PDF nuevo.');
assert.match(materialWorkspaceSource, /if \(demo \|\| isOwner\) \{/,
  'Completar o saltar el recorrido debe abrir la guía directamente.');
assert.doesNotMatch(materialWorkspaceSource, /PdfPriorStudyPopup|priorStudyOpen|choosePriorStudy|savePriorStudyChoice|readPriorStudyChoice|setPriorStudyOpen/,
  'La pregunta de si ya estudió y su almacenamiento no deben continuar en el flujo.');
assert.match(materialWorkspaceSource, /setFocusFirstChapterOnExit\(true\)/,
  'El botón de la guía debe abrir el primer capítulo real en Resumen.');
assert.match(materialWorkspaceSource, /studySummary\.sections\.length > 0 \? summaryChapters\[0\]\?\.displayTitle/,
  'La guía debe utilizar el título real de la primera sección del PDF.');
assert.match(studyStartGuideSource, /data-pdf-study-start-guide/,
  'La guía debe ser un modal sobre el Resumen, no una tarjeta dentro de él.');
assert.match(studyStartGuideSource, /max-w-\[500px\]/,
  'La guía debe ser más angosta que el popup de punto de partida.');
assert.match(studyStartGuideSource, /bg-card text-card-foreground/,
  'La guía debe usar la misma superficie que el popup anterior.');
assert.match(studyStartGuideSource, /bg-slate-950\/45 backdrop-blur-\[2px\]/,
  'La guía debe superponerse al Resumen con el mismo overlay que el popup anterior.');
assert.doesNotMatch(studyStartGuideSource, /!inset-0|!w-screen|!h-dvh|!max-w-none|fixed inset-x-0 bottom-0/,
  'La guía no debe ocupar toda la pantalla ni usar un pie fijo global.');
assert.match(studyStartGuideSource, /¡Vamos a estudiar el tema 1!/,
  'La guía debe presentar de inmediato el primer tema.');
assert.match(studyStartGuideSource, /Empezá leyendo el resumen/,
  'La introducción debe recomendar empezar leyendo.');
assert.match(studyStartGuideSource, /glosario y las flashcards para repasar/,
  'La introducción debe explicar brevemente cómo repasar.');
assert.match(studyStartGuideSource, /practicá para comprobar cuánto aprendiste/,
  'La introducción debe explicar el propósito de la práctica.');
assert.match(studyStartGuideSource, /data-pdf-study-resources/,
  'La guía debe mostrar visualmente los recursos del material.');
assert.match(studyStartGuideSource, /data-pdf-study-flashcards-caption/,
  'La guía debe mostrar la cantidad real de flashcards del PDF.');
assert.match(studyStartGuideSource, /resources\.totalFlashcards/,
  'Debe utilizar el total de flashcards, no una cifra estimada para el tema 1.');
assert.match(studyStartGuideSource, /data-pdf-study-glossary-caption/,
  'La guía debe mostrar la cantidad real de términos del PDF.');
assert.match(studyStartGuideSource, /resources\.totalGlossaryTerms/,
  'Debe utilizar el total de términos, no una cifra estimada para el tema 1.');
assert.match(studyStartGuideSource, /En todo tu PDF tenés:/,
  'El encabezado debe aclarar que las cantidades corresponden al PDF completo.');
assert.match(studyStartGuideSource, /data-pdf-study-first-topic/,
  'La guía debe mostrar el título real del primer tema.');
assert.match(studyStartGuideSource, /data-pdf-study-start-cta/,
  'La guía debe permitir iniciar el tema seleccionado.');
assert.match(studyStartGuideSource, /Leer el tema 1/,
  'El botón debe anticipar que el siguiente paso es leer el primer tema.');
assert.match(materialWorkspaceSource, /resources=\{firstTopicResources\}/,
  'La guía debe recibir los recursos atribuidos al primer tema.');
assert.match(materialWorkspaceSource, /scrollFirstChapterSmoothlyRef\.current = true/,
  'El botón debe preparar el desplazamiento suave hasta el tema 1.');
assert.match(materialWorkspaceSource, /scrollFirstChapterSmoothlyRef\.current \? 'smooth' : 'instant'/,
  'El desplazamiento guiado debe ser suave sin cambiar los saltos del onboarding.');
assert.match(materialWorkspaceSource, /reader\.scrollHeight <= reader\.clientHeight \+ 4/,
  'El CTA debe detectar cuando la vista de demostración no tiene scroll interno.');
assert.match(materialWorkspaceSource, /target\.scrollIntoView\(\{ block: 'start', behavior: scrollBehavior \}\)/,
  'La demo debe llegar al capítulo 1 desplazando la página cuando corresponda.');
assert.match(materialWorkspaceSource, /prefers-reduced-motion: reduce/,
  'El desplazamiento suave debe respetar la preferencia de movimiento reducido.');
assert.match(studyStartGuideSource, /data-pdf-study-start-footer/,
  'La acción para comenzar debe permanecer en el pie del popup, incluso en móvil.');
assert.doesNotMatch(studyStartGuideSource, /Un tema a la vez, a tu ritmo|Cuando estés listo, avanzamos al siguiente/,
  'No debe reaparecer el contenido que el usuario descartó.');

const firstTopicFixture = [{ title: '1. Fundamentos de IA', body: 'Texto' }, { title: '2. Aprendizaje automático', body: 'Texto' }];
const matchingCard = { front: '¿Qué es IA?', back: 'Explicación', level: 'recordar' as const,
  reference: { sectionTitle: 'Fundamentos de IA', pageStart: 1, pageEnd: 1, excerpt: 'Fuente' } };
const unassignedCard = { ...matchingCard, front: 'Otra tarjeta',
  reference: { ...matchingCard.reference, sectionTitle: 'Un capítulo no reconocido' } };
const matchingTerm = { term: 'Inteligencia artificial', definition: 'Explicación larga suficiente',
  context: 'Definiciones', importance: 'alta' as const, chapterTitle: '1. Fundamentos de IA' };
const unassignedTerm = { ...matchingTerm, term: 'Otro concepto', chapterTitle: undefined };
const firstTopicCounts = getFirstTopicResourceInfo(firstTopicFixture, [matchingCard, unassignedCard], [matchingTerm, unassignedTerm]);
assert.equal(firstTopicCounts.flashcardCount, 1, 'Solo se cuentan flashcards asociadas exactamente al primer tema.');
assert.equal(firstTopicCounts.totalFlashcards, 2, 'La guía debe poder mostrar todas las tarjetas reales del PDF.');
assert.equal(firstTopicCounts.glossaryCount, 1, 'Solo se cuentan términos asociados exactamente al primer tema.');
assert.equal(firstTopicCounts.totalGlossaryTerms, 2, 'La guía debe poder mostrar todos los términos del glosario filtrado.');
const missingAssociation = getFirstTopicResourceInfo(firstTopicFixture, [unassignedCard], [unassignedTerm]);
assert.equal(missingAssociation.flashcardCount, null, 'Las tarjetas sin asociación fiable no se presentan como propias del tema.');
assert.equal(missingAssociation.totalFlashcards, 1, 'Los recursos sin tema siguen contando en el total real del PDF.');
assert.equal(missingAssociation.glossaryCount, null, 'Los términos sin asociación fiable no se presentan como propios del tema.');
assert.equal(missingAssociation.totalGlossaryTerms, 1, 'El total del PDF incluye términos sin vínculo fiable a un capítulo.');
assert.equal(missingAssociation.hasFlashcards, true, 'La guía puede mencionar recursos del PDF sin atribuirlos al tema.');
const ambiguousTopic = getFirstTopicResourceInfo([firstTopicFixture[0], { ...firstTopicFixture[0] }], [matchingCard], [matchingTerm]);
assert.equal(ambiguousTopic.flashcardCount, null, 'No se atribuyen tarjetas a capítulos con títulos duplicados.');

assert.doesNotMatch(materialWorkspaceSource, /showStudyChoice|data-first-pdf-study-entry/,
  'La tarjeta anterior no debe reintroducirse.');
assert.equal((materialWorkspaceSource.match(/<div data-onboarding-study-panel/g) ?? []).length, 2,
  'Escritorio y móvil deben ofrecer el panel completo como objetivo.');
assert.match(firstGuideSource, /data-guide-copy/, 'La explicación debe poder animarse sin mover toda la pantalla.');
assert.match(materialWorkspaceSource, /transitionRecommendedTour/, 'La navegación guiada debe transicionar entre las pantallas reales.');
assert.match(materialWorkspaceSource, /prefers-reduced-motion: reduce/, 'La animación debe respetar las preferencias de accesibilidad.');
assert.match(materialWorkspaceSource, /data-onboarding-transitioning/, 'El contenido debe suavizar el cambio de etapa.');
const materialStudyCss = readFileSync('app/materiales/[id]/material-study.css', 'utf8');
assert.match(materialStudyCss, /evaluo-onboarding-copy-appear/, 'El cambio de texto debe ser suave.');
assert.match(materialStudyCss, /260ms cubic-bezier/, 'La copia debe aparecer con una transición suave.');
assert.match(materialStudyCss, /prefers-reduced-motion: reduce/, 'La animación de la guía debe desactivarse cuando corresponda.');
assert.ok(progressPanelSource.includes('data-recommended-topics'), 'Progreso debe exponer la lista de temas.');
assert.ok(mobileNavigationSource.includes("data-recommended-tab={id === 'ejercicios'"), 'La guía debe encontrar Práctica en móvil.');
assert.match(materialWorkspaceSource, /changeRecommendedTab\('ejercicios'\);\s*setRecommendedTourStep\('practice'\)/,
  'La guía debe abrir Práctica para enseñar su contenido real.');
assert.match(materialWorkspaceSource, /setProgressOpen\(true\);\s*setRecommendedTourStep\('progress'\)/,
  'El tercer paso debe abrir la vista ilustrativa de Progreso.');
assert.match(materialWorkspaceSource, /setRecommendedTourStep\('reinforce'\)/,
  'El cuarto paso debe mostrar el detalle del tema para reforzar.');
assert.match(materialWorkspaceSource, /setRecommendedTourStep\('progress'\)/,
  'Desde el cuarto paso se debe poder volver a Progreso.');
assert.doesNotMatch(examSource, /<FirstStudyErrorOnboardingPrompt/, 'La práctica no debe abrir otro onboarding.');
assert.doesNotMatch(diagnosticSource, /<FirstStudyErrorOnboardingPrompt/, 'El diagnóstico no debe abrir otro onboarding.');


// El lector de Progreso tiene que respetar el formato académico real,
// sin mostrar las marcas Markdown como texto plano ni crear objetivos con IA.
const topicReaderSource = readFileSync('components/dashboard/pdf-progress-panel.tsx', 'utf8');
// El refuerzo debe centrarse en la dificultad activa; el índice y el panel
// de aprendizaje sólo se muestran mientras se exploran los temas.
assert.match(topicReaderSource, /data-reinforcement-focus=\{reviewOpen \? 'true' : undefined\}/,
  'La vista de refuerzo debe contar con un modo explícito de concentración.');
assert.match(topicReaderSource, /reviewOpen\s*\?\s*'mx-auto mt-5 w-full max-w-\[980px\] min-w-0'/,
  'El refuerzo debe ocupar un área centrada sin columnas laterales.');
assert.match(topicReaderSource, /\{!reviewOpen && \(\s*<aside\s+className="border-border bg-card hidden/,
  'El índice lateral debe desaparecer al entrar en refuerzo.');
assert.match(topicReaderSource, /\{!reviewOpen && \(\s*<aside\s+className="hidden min-w-0 xl:sticky/,
  'El panel lateral de aprendizaje debe desaparecer durante el refuerzo.');
assert.doesNotMatch(topicReaderSource, />\s*Volver al tema\s*<\/button>/,
  'Eliminar el enlace azul Volver al tema durante el refuerzo.');
assert.match(topicReaderSource, /onFinish=\{\(\) => setReviewOpen\(false\)\}/,
  'Al terminar el refuerzo debe volver a la navegación habitual.');

const richTextSource = readFileSync('components/study-rich-text.tsx', 'utf8');
assert.match(
  topicReaderSource,
  /<StudyRichText body=\{summaryBody\} \/>/,
  'Progreso debe interpretar títulos, listas y negritas con el mismo lector del resumen.'
);
assert.match(
  topicReaderSource,
  /focusConcepts\.map\(/,
  'La guía debe utilizar conceptos del glosario asociados al tema.'
);
assert.match(
  topicReaderSource,
  /getTopicStudyResources\(/,
  'No inventar asociaciones de conceptos ni repartir por posición.'
);
assert.match(richTextSource, /<em key=/, 'Las cursivas del PDF deben mostrarse como énfasis.');
assert.doesNotMatch(
  topicReaderSource,
  /<div className="mt-4 max-w-prose text-base leading-7 whitespace-pre-line">/,
  'El resumen de Progreso no puede volver al texto plano.'
);

assert.match(
  materialPageSource,
  /initialRecommendedStudy=\{shouldShowFirstPdfGuide\}/,
  'El onboarding debe empezar automáticamente para todo usuario nuevo pendiente.'
);
assert.match(materialPageSource, /shouldAutoStartFirstPdfOnboarding\(/,
  'El servidor debe evaluar la elegibilidad por cuenta, no por URL.');
assert.doesNotMatch(materialPageSource, /query\.recorrido === '1'/,
  'El onboarding no puede depender de un parámetro de entrada.');
assert.doesNotMatch(materialPageSource, /isFirstReadyMaterial/,
  'Entrar por otro PDF propio no debe impedir el onboarding.');
assert.match(materialPageSource, /\.eq\('event_name', 'first_pdf_guide_completed'\)/,
  'Una guía terminada previamente debe contar sin importar el material.');
assert.doesNotMatch(materialPageSource, /first_pdf_guide_completed', 'first_pdf_guide_skipped'/,
  'Saltar el recorrido no debe contarse como completarlo.');
assert.match(
  materialWorkspaceSource,
  /summaryActiveReadingSectionRef/,
  'El lector debe mantener una única sección activa para medir tiempo de lectura.'
);
assert.ok(materialWorkspaceSource.includes('activeSummaryChapterIndex'),
  'El índice Contenido debe mantener una sección de lectura activa.');
assert.equal(
  materialWorkspaceSource.split('data-active-chapter={activeSummaryChapterIndex === index || undefined}').length - 1, 2,
  'El tema activo debe distinguirse en los índices móvil y escritorio.'
);
assert.equal(
  materialWorkspaceSource.split("aria-current={activeSummaryChapterIndex === index ? 'location' : undefined}").length - 1, 2,
  'Ambos índices deben exponer el capítulo activo para accesibilidad.'
);
assert.ok(materialWorkspaceSource.includes("region.addEventListener('scroll', scheduleSync"),
  'El índice debe seguir el desplazamiento interno del lector.');
assert.ok(materialWorkspaceSource.includes("window.addEventListener('scroll', scheduleSync"),
  'El índice debe seguir el scroll de página en la demo.');
assert.ok(materialWorkspaceSource.includes('setActiveSummaryChapterIndex(index)'),
  'Seleccionar un tema en Contenido debe resaltarlo de inmediato.');

assert.match(
  materialWorkspaceSource,
  /Solo el tema predominante en pantalla acumula tiempo/,
  'Dos secciones visibles no deben acumular tiempo simultáneamente.'
);

const demoMaterial = JSON.parse(readFileSync('public/material-general-prueba.study.json', 'utf8')) as {
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
};
const demoArtifacts = buildPedagogicalArtifacts(demoMaterial);
const summaryChecks = buildSummaryCheckPlan(demoMaterial.summary.sections, demoArtifacts);
assert.ok(summaryChecks.some(Boolean), 'El material de muestra debe permitir comprobar lo leído.');
for (const plan of summaryChecks) {
  if (!plan) continue;
  assert.equal(plan.questions.length, 2);
  assert.notEqual(plan.questions[0].prompt, plan.questions[1].prompt);
  for (const check of plan.questions) {
    assert.ok(check.options.includes(check.answer), 'La respuesta debe aparecer entre las opciones.');
    assert.ok(check.options.length >= 3);
    assert.equal(new Set(check.options).size, check.options.length);
    assert.ok(check.reference.excerpt?.trim(), 'La comprobación debe conservar su fuente.');
  }
}
assert.deepEqual(buildSummaryCheckPlan([], demoArtifacts), []);
assert.deepEqual(
  buildSummaryCheckPlan([{ title: 'Vacío', body: '' }], artifacts([])),
  [null],
  'Un apartado sin evidencia no debe inventar una comprobación.'
);

const summaryFlowEvents = [
  'summary_reading_started',
  'summary_topic_check_reinforcement_started',
  'summary_topic_check_retried',
  'summary_topic_check_reinforcement_completed',
  'summary_completed',
  'summary_next_step_clicked',
  'student_material_exam_completed',
] as const;
for (const eventName of summaryFlowEvents) {
  assert.equal(
    isAllowedAnalyticsEventName(eventName),
    true,
    `${eventName} debe persistirse en analytics_events.`
  );
}
assert.deepEqual(
  sanitizeAnalyticsMetadata('summary_next_step_clicked', {
    material_id: 'material-1',
    flow_version: SUMMARY_FLOW_VERSION,
    pending_count: 2,
    action: 'errors',
    ignored: 'no',
  }),
  {
    material_id: 'material-1',
    flow_version: SUMMARY_FLOW_VERSION,
    pending_count: 2,
    action: 'errors',
  },
  'La metadata del nuevo funnel debe conservar la versión y la acción.'
);

assert.deepEqual(
  sanitizeAnalyticsMetadata('student_material_exam_completed', {
    material_id: 'material-1',
    question_count: 10,
    correct_count: 8,
    score_pct: 80,
    flow_version: 'material_practice_v2',
    ignored: 'no',
  }),
  {
    material_id: 'material-1',
    question_count: 10,
    correct_count: 8,
    score_pct: 80,
    flow_version: 'material_practice_v2',
  },
  'La práctica completada debe conservar su estado para recomendar el siguiente paso.'
);

const materialWorkspaceAnalyticsSource = readFileSync(
  'components/material-study-workspace.tsx',
  'utf8'
);
assert.match(
  materialWorkspaceAnalyticsSource,
  /trackMarketingEvent\('summary_reading_started'/,
  'Abrir el resumen debe iniciar la medición del nuevo flujo.'
);
assert.match(
  materialWorkspaceAnalyticsSource,
  /trackMarketingEvent\('summary_completed'/,
  'Llegar al final del resumen debe quedar medido.'
);
assert.match(
  materialWorkspaceAnalyticsSource,
  /trackMarketingEvent\('summary_next_step_clicked'/,
  'La decisión posterior al resumen debe quedar medida.'
);

console.log('Recommended study smoke tests passed.');
