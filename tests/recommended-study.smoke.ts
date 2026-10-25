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
assert.match(materialWorkspaceSource, /setFocusFirstChapterOnExit\(outcome === 'completed'\)/,
  'Terminar el onboarding debe abrir Resumen directamente.');
assert.doesNotMatch(materialWorkspaceSource, /studyEntryStage|chooseStudyEntry|data-first-pdf-study-entry|¿Ya estudiaste este material\?/,
  'No deben persistir la tarjeta ni su lógica.');

assert.match(materialWorkspaceSource, /revealTourContent\('summary', true\)/,
  'Al finalizar debe mostrarse y enfocarse el primer capítulo real.');
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
assert.doesNotMatch(materialWorkspaceSource, /setFocusFirstChapterOnExit\(true\)/,
  'Al saltar el tour no hay que forzar la navegación al capítulo 1.');
const priorStudyPopupSource = readFileSync('components/study/pdf-prior-study-popup.tsx', 'utf8');
const priorStudyLogicSource = readFileSync('lib/pdf-prior-study.ts', 'utf8');
const firstUploadSource = readFileSync('components/dashboard/pdf-first-upload-shell.tsx', 'utf8');
const quickUploadSource = readFileSync('components/dashboard/quick-pdf-upload.tsx', 'utf8');
assert.match(materialWorkspaceSource, /<PdfPriorStudyPopup/,
  'Resumen debe renderizar el modal de dos opciones, no una tarjeta.');
assert.match(materialWorkspaceSource, /setPriorStudyOpen\(true\)/,
  'Al terminar el onboarding debe aparecer la pregunta.');
assert.match(materialWorkspaceSource, /savePriorStudyChoice\(materialId, choice\)/,
  'La respuesta debe guardarse por PDF.');
assert.match(materialWorkspaceSource, /initialPriorStudyPopupRequested/,
  'La pregunta debe poder mostrarse tras cargar un PDF nuevo sin repetir el onboarding.');
assert.match(materialPageSource, /query\.inicio === '1'/,
  'Solo el enlace posterior a la carga debe solicitar la pregunta.');
assert.match(firstUploadSource, /\?inicio=1/,
  'La carga normal debe solicitar la pregunta para el PDF nuevo.');
assert.match(quickUploadSource, /\?inicio=1/,
  'La carga rápida debe solicitar la pregunta para el PDF nuevo.');
assert.match(priorStudyPopupSource, /<DialogContent/,
  'La pregunta debe ser un popup modal sobre Resumen.');
assert.match(priorStudyPopupSource, /data-pdf-prior-study-no/,
  'El estudiante debe poder marcar que no estudió.');
assert.match(priorStudyPopupSource, /data-pdf-prior-study-yes/,
  'El estudiante debe poder marcar que sí estudió.');
assert.match(priorStudyPopupSource, /¿Cómo llegás a este material\?/,
  'La pregunta debe conservar el texto del diseño elegido.');
assert.match(priorStudyPopupSource, /Empiezo desde cero/,
  'La primera tarjeta debe presentar el recorrido desde cero.');
assert.match(priorStudyPopupSource, /Ya lo estudié/,
  'La segunda tarjeta debe presentar el recorrido de práctica.');
assert.match(priorStudyPopupSource, /max-w-\\[610px\\]/,
  'El modal debe ser compacto en escritorio.');
assert.match(priorStudyPopupSource, /bg-card text-card-foreground/,
  'El modal debe respetar la paleta visual de Evaluo.');
assert.doesNotMatch(priorStudyPopupSource, /bg-black\/75|bg-\\[\\#080808\\]|max-w-\\[1000px\\]/,
  'No deben quedar el fondo negro ni el ancho del diseño anterior.');
assert.match(priorStudyPopupSource, /grid-cols-1 gap-3 sm:grid-cols-2/,
  'Las opciones deben verse lado a lado en escritorio y apiladas en móvil.');

assert.match(priorStudyPopupSource, /showCloseButton=\{false\}/,
  'La pregunta debe tener un diseño simple, sin tercer botón.');
assert.match(priorStudyLogicSource, /materialId/,
  'El almacenamiento se debe aislar por cada PDF.');
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
