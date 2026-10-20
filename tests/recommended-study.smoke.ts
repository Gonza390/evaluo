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
const firstGuideSource = readFileSync('components/study/recommended-study-guide.tsx', 'utf8');
const progressPanelSource = readFileSync('components/dashboard/pdf-progress-panel.tsx', 'utf8');
const mobileNavigationSource = readFileSync('components/study/pdf-mobile-navigation.tsx', 'utf8');
const examSource = readFileSync('components/student-material-exam.tsx', 'utf8');
const diagnosticSource = readFileSync('components/student-material-diagnostic.tsx', 'utf8');

assert.ok(firstGuideSource.includes("label: 'Entender'") &&
          firstGuideSource.includes("label: 'Practicar'") &&
          firstGuideSource.includes("label: 'Progreso'"),
          'El tutorial debe comunicar únicamente Entender, Practicar y Progreso.');
assert.ok(firstGuideSource.includes('data-first-pdf-guide'), 'La guía debe enseñar la interfaz real.');
assert.match(firstGuideSource, /Dejá de estudiar a ciegas/,
  'Progreso debe comunicar el diferencial de estudiar con resultados.');
assert.match(firstGuideSource, /step === 'errors' && !progressExplained/,
  'El clic adicional debe suceder dentro de Progreso y no abrir otro paso.');
assert.match(firstGuideSource, /setProgressExplained\(true\)/,
  'El primer clic en Progreso debe mostrar cómo funciona.');
assert.match(firstGuideSource, /setProgressExplained\(false\)/,
  'Atrás debe volver al primer mensaje de Progreso.');
assert.match(firstGuideSource, /data-guide-progress-detail/,
  'El detalle debe explicar el ciclo de aprendizaje en la tarjeta existente.');
assert.match(firstGuideSource, /Ver cómo funciona/,
  'El primer CTA de Progreso debe mostrar la explicación.');
assert.match(firstGuideSource, /Empezar a estudiar/,
  'El segundo CTA debe mantener el cierre hacia el resumen.');
assert.match(firstGuideSource, /los resultados mostrados son de ejemplo/,
  'La preview no puede hacer pasar datos simulados por resultados reales.');
assert.match(firstGuideSource, /tus resultados aparecerán acá cuando empieces/,
  'El onboarding no puede inventar dificultades para usuarios sin prácticas.');
assert.match(materialWorkspaceSource, /demoMode=\{Boolean\(demo\)\}/,
  'La guía debe diferenciar la vista previa de un PDF real.');
assert.match(firstGuideSource, /onBack\?\.\(\)/,
  'El retorno de Progreso debe conservar la navegación original.');
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
  'Los tres pasos deben abrir contenido útil de cada pantalla.');
assert.match(materialWorkspaceSource, /reader\.scrollTo\(/,
  'Los desplazamientos deben quedar dentro del lector.');
assert.match(materialWorkspaceSource, /MutationObserver/,
  'Progreso debe poder mostrar sus temas aunque se rendericen después.');
assert.match(materialWorkspaceSource, /setFocusFirstChapterOnExit\(outcome === 'completed'\)/,
  'Al completar la guía debe prepararse la navegación al primer capítulo.');
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
assert.match(materialWorkspaceSource, /setProgressOpen\(true\);\s*setRecommendedTourStep\('errors'\)/,
  'La guía debe abrir Progreso para enseñar los temas reales.');
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
  /initialRecommendedStudy=\{\s*isFirstReadyMaterial && query\.recorrido === '1' && !firstPdfGuideAlreadySeen\s*\}/,
  'El recorrido manual solo debe activarse para el primer PDF listo y si la guía todavía no fue vista.'
);
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
