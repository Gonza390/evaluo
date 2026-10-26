import assert from 'node:assert/strict';
import './study-error-navigation.smoke.ts';
import './study-error-review-prompt.smoke.ts';
import {
  buildSimulatorLandingHref,
  parseSimulatorLandingEntry,
  preferSimulatorQuestion,
  getLandingOptionIndex,
} from '../lib/simulator-landing-entry.ts';
import {
  validateReviewQuestion,
  publicReviewQuestion,
  isCompleteReviewHelp,
} from '../lib/study-error-review-contract.ts';
import { existsSync, readFileSync } from 'node:fs';
import {
  MAX_TOPIC_PRACTICE_QUESTIONS,
  topicPracticeQuestionCount,
  selectTopicPracticeQuestions,
} from '../lib/student-materials/topic-practice.ts';
import type { StudyQuestion } from '../lib/student-materials/pedagogy.ts';

assert.ok(
  isCompleteReviewHelp(
    'La práctica consiste en recordar sin mirar y luego comparar con la fuente.',
    'stop'
  )
);
assert.equal(isCompleteReviewHelp('La práctica consiste en recordar sin mirar y, si'), false);
assert.equal(
  isCompleteReviewHelp(
    'Una respuesta que parece terminada pero quedó limitada por el proveedor.',
    'length'
  ),
  false
);
assert.equal(
  isCompleteReviewHelp(
    'Una respuesta que parece terminada pero quedó limitada por el proveedor.',
    'MAX_TOKENS'
  ),
  false
);
import { resolve } from 'node:path';
import {
  addMonths,
  buildEventPayload,
  DEFAULT_CALENDAR_FORM_STATE,
  examInstanceLabel,
  formatStorageDate,
  getCalendarGrid,
} from '../lib/calendar-utils.ts';
import {
  buildResumenKey,
  formatResumenModulesLabel,
  getModuleNumber,
} from '../app/explorar/materia/[id]/materia-content.helpers.ts';
import { resolveProfileSettingsState } from '../lib/profile-settings.ts';
import {
  getAcademicProfileActiveSubjectIds,
  hasCompleteAcademicProfile,
} from '../lib/profile-completion.ts';
import { isAllowedAnalyticsEventName } from '../lib/analytics-events.ts';
import { sanitizeAnalyticsMetadata } from '../lib/analytics-metadata.ts';
import {
  createFirstPdfDemoTracker,
  hasSeenFirstPdfDemoErrors,
  rememberFirstPdfDemoErrorsViewed,
  rememberFirstPdfDemoUpload,
  consumeFirstPdfDemoUpload,
  FIRST_PDF_DEMO_SOURCE,
} from '../lib/first-pdf-demo-analytics.ts';
import {
  hasPremiumSubscriptionAccess,
  isPremiumSubscriptionStatus,
  subscriptionStatusForPayment,
} from '../lib/payments/status.ts';
import {
  dedupeOptionsForView,
  isMultiAnswer,
  normalizeForCompare,
  parseCorrectAnswers,
} from '../lib/simulator-core.ts';

assert.equal(formatStorageDate(new Date(2026, 5, 17)), '2026-06-17');
assert.equal(addMonths(new Date(2026, 5, 1), 1).getMonth(), 6);
assert.equal(getCalendarGrid(new Date(2026, 5, 1)).length, 42);
assert.equal(examInstanceLabel('integrador'), 'Integrador');

const examPayload = buildEventPayload({
  formState: {
    ...DEFAULT_CALENDAR_FORM_STATE,
    subjectName: 'Derecho Constitucional',
    examInstance: '2',
  },
  careerId: 'car-1',
  careerName: 'Abogacía',
  selectedMateria: { id: 'mat-1', nombre: 'Derecho Constitucional' },
});

assert.equal(examPayload?.title, 'Derecho Constitucional - Parcial 2');
assert.equal(examPayload?.materiaId, 'mat-1');

const profileState = resolveProfileSettingsState({
  profile: { nombre: '', universidad_id: 'uni-1', carrera_id: 'car-1' },
  userMetadata: { full_name: 'Ada Lovelace', country: 'AR' },
  fallbackName: 'Usuario',
});

assert.equal(profileState.nombre, 'Ada Lovelace');
assert.equal(profileState.pais, 'AR');
assert.equal(profileState.universidadId, 'uni-1');

const activeSubjectsFixture = [
  { id: 'mat-1', name: 'Derecho Constitucional' },
  { id: 'mat-2', name: 'Derecho Civil' },
];
assert.deepEqual(getAcademicProfileActiveSubjectIds(activeSubjectsFixture), ['mat-1', 'mat-2']);
assert.equal(
  hasCompleteAcademicProfile({
    universidadId: 'uni-1',
    carreraId: 'car-1',
    activeSubjects: activeSubjectsFixture,
  }),
  true
);
assert.equal(
  hasCompleteAcademicProfile({
    universidadId: 'uni-1',
    carreraId: 'car-1',
    activeSubjects: [],
  }),
  true
);
assert.equal(
  hasCompleteAcademicProfile({
    universidadId: 'uni-1',
    carreraId: '',
    activeSubjects: activeSubjectsFixture,
  }),
  false
);

assert.deepEqual(dedupeOptionsForView([' A ', 'a', 'B', 'B  ', '']), ['A', 'B']);
assert.deepEqual(parseCorrectAnswers('Uno | Dos; Tres'), ['Uno', 'Dos', 'Tres']);
assert.equal(isMultiAnswer('Uno | Dos'), true);
assert.equal(normalizeForCompare('  Hola   Mundo '), 'hola mundo');
assert.equal(isPremiumSubscriptionStatus('active'), true);
assert.equal(isPremiumSubscriptionStatus('past_due'), false);
assert.equal(subscriptionStatusForPayment('approved'), 'active');
assert.equal(subscriptionStatusForPayment('rejected'), 'past_due');
assert.equal(subscriptionStatusForPayment('pending'), null);
assert.equal(
  hasPremiumSubscriptionAccess('canceled', '2026-07-01T00:00:00.000Z', Date.UTC(2026, 5, 1)),
  true
);
assert.equal(
  hasPremiumSubscriptionAccess('canceled', '2026-05-01T00:00:00.000Z', Date.UTC(2026, 5, 1)),
  false
);

assert.equal(isAllowedAnalyticsEventName('simulator_ready'), true);
assert.equal(isAllowedAnalyticsEventName('simulator_progress_checkpoint'), true);
assert.equal(isAllowedAnalyticsEventName('simulator_needs_feedback'), true);
assert.equal(isAllowedAnalyticsEventName('preguntero_shared'), true);
assert.equal(isAllowedAnalyticsEventName('premium_gate_viewed'), true);
assert.equal(isAllowedAnalyticsEventName('premium_checkout_clicked'), true);
assert.deepEqual(
  sanitizeAnalyticsMetadata('premium_checkout_clicked', {
    source: 'simulator_explanations',
    materia_id: 'mat-1',
    plan_context: 'premium_founders',
    provider_secret: 'must-not-be-stored',
  }),
  {
    source: 'simulator_explanations',
    materia_id: 'mat-1',
    plan_context: 'premium_founders',
  }
);
assert.deepEqual(
  sanitizeAnalyticsMetadata('simulator_progress_checkpoint', {
    materia_id: 'mat-1',
    checkpoint: 5,
    correct_count: 3,
    raw_answer: 'must-not-be-stored',
  }),
  { materia_id: 'mat-1', checkpoint: 5, correct_count: 3 }
);
assert.deepEqual(
  sanitizeAnalyticsMetadata('preguntero_shared', {
    materia_id: 'mat-1',
    parcial: 1,
    share_id: 'share-1',
    share_method: 'copy_link',
    share_kind: 'preguntero',
    destination: '/pregunteros/materia--mat-1/parcial/1',
    email: 'must-not-be-stored@example.com',
  }),
  {
    materia_id: 'mat-1',
    parcial: 1,
    share_id: 'share-1',
    share_method: 'copy_link',
    share_kind: 'preguntero',
    destination: '/pregunteros/materia--mat-1/parcial/1',
  }
);
assert.deepEqual(
  sanitizeAnalyticsMetadata('simulator_needs_feedback', {
    materia_id: 'mat-1',
    parcial: 1,
    reason: 'better_explanations',
    phase: 'finished',
    comment: 'free text must not be stored',
  }),
  { materia_id: 'mat-1', parcial: 1, reason: 'better_explanations', phase: 'finished' }
);

assert.equal(getModuleNumber('Resumen Modulo 3'), 3);
assert.equal(formatResumenModulesLabel([2, 1, 2]), 'Corresponde a los módulos 1 y 2.');
assert.equal(
  buildResumenKey({
    id: '1',
    title: 'Resumen Derecho',
    author_name: null,
    file_url: null,
    module_id: 2,
    score: null,
    created_at: null,
  }),
  'resumen derecho::2'
);

const demoMaterialSource = readFileSync(resolve('app/demo/material-estudio/page.tsx'), 'utf8');
const demoFourStepSource = readFileSync(resolve('components/demo-four-step-study.tsx'), 'utf8');
// El único demo de material usa el recorrido público de cuatro pasos, sin permisos ni escrituras.
assert.match(demoMaterialSource, /DemoFourStepStudy/);
assert.doesNotMatch(demoMaterialSource, /DemoMaterialGuidedTourV6|hasPremiumAccess/);
assert.match(demoFourStepSource, /isOwner=\{false\}/);
assert.match(demoFourStepSource, /materialId=(?:"demo-material"|\{DEMO_MATERIAL_ID\})/);
assert.match(demoFourStepSource, /buildPedagogicalArtifacts/);
assert.match(demoFourStepSource, /demo=\{\{/);

const subscriptionSettingsSource = readFileSync(
  resolve('components/pricing/SubscriptionSettings.tsx'),
  'utf8'
);
assert.match(
  subscriptionSettingsSource,
  /\/pricing\?source=configuracion#elegir-plan/,
  'Configuración debe llevar de forma directa al checkout de Premium.'
);
assert.match(
  subscriptionSettingsSource,
  /Suscribirme a Premium/,
  'La configuración del plan Free debe mostrar un CTA explícito de suscripción.'
);

const tourCardSource = readFileSync(resolve('components/ui/tour-card.tsx'), 'utf8');
assert.match(
  tourCardSource,
  /backdrop-filter: none !important/,
  'El tour no debe desenfocar el contenido que está explicando.'
);

const materialProcessingSource = readFileSync(
  resolve('lib/student-materials/processing-service.ts'),
  'utf8'
);
assert.doesNotMatch(
  materialProcessingSource,
  /generate(?:StudentMaterial)?MindMap|mind_map|mindMap|mapaMental/,
  'Subir un PDF no debe ejecutar una generación dedicada de mapa mental.'
);

const simulatorLayoutSource = readFileSync(resolve('app/simulador/layout.tsx'), 'utf8');
const examFocusSource = readFileSync(resolve('components/simulador/ExamFocusControls.tsx'), 'utf8');
const examModeCss = readFileSync(resolve('app/simulador/exam-mode.css'), 'utf8');
const simulatorBridgeSource = readFileSync(
  resolve('components/simulador/SimuladorExamen.tsx'),
  'utf8'
);
const simulatorUiSource = readFileSync(
  resolve('components/simulador/SimuladorExamenLegacy.tsx'),
  'utf8'
);
const questionOptionSource = readFileSync(
  resolve('components/simulador/QuestionOptionButton.tsx'),
  'utf8'
);

assert.match(simulatorLayoutSource, /id="evaluo-simulator-shell"/);
assert.match(simulatorLayoutSource, /<ExamFocusControls \/>/);
assert.match(examFocusSource, /requestFullscreen/);
assert.match(examFocusSource, /webkitRequestFullscreen/);
assert.match(examFocusSource, /setShellImmersive\(true\)/);
assert.match(examModeCss, /data-exam-immersive='true'/);
assert.match(questionOptionSource, /aria-pressed=\{selected\}/);
assert.match(questionOptionSource, /bg-emerald-100/);
assert.match(examModeCss, /@media \(max-width: 639px\)/);
assert.match(examModeCss, /@media \(max-width: 1023px\)/);
assert.match(simulatorBridgeSource, /LegacySimuladorExamen/);
assert.match(simulatorUiSource, /Pregunta \{currentQuestionIndex \+ 1\}/);
assert.match(simulatorUiSource, /onClick=\{goPrevious\}/);
assert.match(simulatorUiSource, /isLastQuestion \? requestFinalizar\(\) : goNext\(\)/);

// La muestra mide comprensión sin guardar respuestas ni inventar errores del alumno.
const demoEvents: { event: string; metadata: Record<string, unknown> }[] = [];
const demoRunId = 'f4b6c5d8-7d21-40a2-89b0-60bd2ea16f56';
const demoTracker = createFirstPdfDemoTracker({
  runId: demoRunId,
  environment: 'development',
  emit: (event, metadata) => demoEvents.push({ event, metadata }),
});
demoTracker.track('demo_material_tour_started', {}, 'started');
demoTracker.track('demo_material_tour_started', {}, 'started');
assert.equal(demoEvents.length, 1, 'Strict Mode y volver a un paso no duplican impresiones.');
demoTracker.checkpoint('errors_viewed', { error_kind: 'illustrative' });
demoTracker.checkpoint('check_answered', { correct: false, attempt: 1 });
demoTracker.checkpoint('check_answered', { correct: true, attempt: 2 });
for (const { event, metadata } of demoEvents) {
  assert.equal(isAllowedAnalyticsEventName(event), true);
  assert.deepEqual(sanitizeAnalyticsMetadata(event, metadata), metadata);
}
assert.equal(demoEvents[1].metadata.error_kind, 'illustrative');
assert.equal(demoEvents[3].metadata.attempt, 2);
assert.deepEqual(
  sanitizeAnalyticsMetadata('demo_checkpoint_reached', {
    stage: 'practice_answered',
    correct: false,
    question_text: 'Contenido privado',
    answer: 'Privada',
  }),
  { stage: 'practice_answered', correct: false }
);
assert.doesNotThrow(() =>
  createFirstPdfDemoTracker({
    runId: demoRunId,
    environment: 'development',
    emit: () => {
      throw new Error('Offline');
    },
  }).checkpoint('practice_started')
);

const demoStorageMap = new Map<string, string>();
const demoStorage = {
  getItem: (key: string) => demoStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    demoStorageMap.set(key, value);
  },
  removeItem: (key: string) => {
    demoStorageMap.delete(key);
  },
};
assert.equal(hasSeenFirstPdfDemoErrors(demoStorage), false);
rememberFirstPdfDemoErrorsViewed(demoStorage);
assert.equal(
  hasSeenFirstPdfDemoErrors(demoStorage),
  true,
  'Quien ya vio Mis errores en la muestra no debe recibir el onboarding del primer error real.'
);
const demoNow = Date.UTC(2026, 9, 2);
assert.deepEqual(consumeFirstPdfDemoUpload(FIRST_PDF_DEMO_SOURCE, demoStorage, demoNow), {});
rememberFirstPdfDemoUpload(demoRunId, demoStorage, demoNow);
assert.deepEqual(consumeFirstPdfDemoUpload('dashboard', demoStorage, demoNow), {});
assert.deepEqual(consumeFirstPdfDemoUpload(FIRST_PDF_DEMO_SOURCE, demoStorage, demoNow + 1000), {
  demo_run_id: demoRunId,
  demo_version: 'guided-pdf-v1',
});
assert.deepEqual(
  consumeFirstPdfDemoUpload(FIRST_PDF_DEMO_SOURCE, demoStorage, demoNow + 1000),
  {},
  'No se atribuye una segunda carga a la misma corrida.'
);
rememberFirstPdfDemoUpload(demoRunId, demoStorage, demoNow);
assert.deepEqual(
  consumeFirstPdfDemoUpload(FIRST_PDF_DEMO_SOURCE, demoStorage, demoNow + 8 * 86400000),
  {},
  'La atribución vence.'
);
rememberFirstPdfDemoUpload(demoRunId, demoStorage, demoNow + 1000);
assert.deepEqual(consumeFirstPdfDemoUpload(FIRST_PDF_DEMO_SOURCE, demoStorage, demoNow), {});
rememberFirstPdfDemoUpload('contenido-no-valido', demoStorage, demoNow);
assert.deepEqual(consumeFirstPdfDemoUpload(FIRST_PDF_DEMO_SOURCE, demoStorage, demoNow), {});
const deniedDemoStorage = {
  getItem: () => {
    throw new Error('Storage bloqueado');
  },
  setItem: () => {
    throw new Error('Storage bloqueado');
  },
  removeItem: () => {
    throw new Error('Storage bloqueado');
  },
};
assert.deepEqual(
  consumeFirstPdfDemoUpload(
    FIRST_PDF_DEMO_SOURCE,
    {
      ...demoStorage,
      getItem: () => '{json incompleto',
    },
    demoNow
  ),
  {}
);
assert.deepEqual(
  consumeFirstPdfDemoUpload(
    FIRST_PDF_DEMO_SOURCE,
    {
      ...demoStorage,
      getItem: () =>
        JSON.stringify({ run_id: demoRunId, created_at: demoNow, version: 'otra-version' }),
    },
    demoNow
  ),
  {}
);
assert.doesNotThrow(() => rememberFirstPdfDemoUpload(demoRunId, deniedDemoStorage, demoNow));
assert.deepEqual(consumeFirstPdfDemoUpload(FIRST_PDF_DEMO_SOURCE, deniedDemoStorage, demoNow), {});
assert.equal(isAllowedAnalyticsEventName('pdf_uploaded'), true);
assert.deepEqual(
  sanitizeAnalyticsMetadata('pdf_uploaded', {
    source: FIRST_PDF_DEMO_SOURCE,
    material_id: 'material-propio',
    demo_run_id: demoRunId,
    file_name: 'Apunte privado.pdf',
    file_content: 'Privado',
  }),
  { source: FIRST_PDF_DEMO_SOURCE, material_id: 'material-propio', demo_run_id: demoRunId }
);

const activationUploadSource = readFileSync(
  resolve('components/dashboard/pdf-first-upload-shell.tsx'),
  'utf8'
);
assert.match(
  activationUploadSource,
  /initialSource\.startsWith\('home-pdf-first-'\)/,
  'El PDF elegido en Home debe retomarse automáticamente después del registro.'
);
assert.match(
  activationUploadSource,
  /draft\.source !== initialSource/,
  'No se debe recuperar un borrador de PDF que pertenezca a otro origen.'
);

for (const eventName of [
  'mis_errores_viewed',
  'study_error_viewed',
  'study_error_created',
  'study_error_reviewed',
  'study_error_explanation_reviewed',
  'study_error_pdf_review_started',
  'study_error_repractice_started',
  'study_error_resolved',
  'study_error_returned',
  'study_error_onboarding_prompted',
  'study_error_onboarding_started',
  'study_error_onboarding_completed',
  'study_error_onboarding_skipped',
] as const) {
  assert.equal(
    isAllowedAnalyticsEventName(eventName),
    true,
    `${eventName} debe ser aceptado por analytics.`
  );
}

assert.deepEqual(
  sanitizeAnalyticsMetadata('study_error_pdf_review_started', {
    study_error_id: 'error-1',
    source_type: 'simulator',
    materia_id: 'mat-1',
    material_id: 'material-1',
    has_page_reference: true,
    prompt: 'contenido privado que no debe persistirse',
  }),
  {
    study_error_id: 'error-1',
    source_type: 'simulator',
    materia_id: 'mat-1',
    material_id: 'material-1',
    has_page_reference: true,
  }
);

assert.deepEqual(
  sanitizeAnalyticsMetadata('study_error_onboarding_started', {
    study_error_id: 'error-1',
    location: 'student_material_practice',
    prompt: 'contenido privado',
  }),
  {
    study_error_id: 'error-1',
    location: 'student_material_practice',
  }
);

const dashboardMaterialsSource = readFileSync(
  resolve('components/dashboard/student-materials-workspace.tsx'),
  'utf8'
);
assert.match(
  dashboardMaterialsSource,
  /initialMaterials\.length === 0[\s\S]*Ver cómo funciona con un PDF de ejemplo/,
  'La muestra completa debe ofrecerse sólo en el estado sin PDFs.'
);
assert.match(
  dashboardMaterialsSource,
  /secondaryActionHref="\/preview\/primer-pdf\?source=dashboard_empty"/
);

const homeHeroSource = readFileSync(resolve('components/marketing/home-redesign.tsx'), 'utf8');
assert.match(homeHeroSource, /HomePdfPickerButton/);
assert.match(homeHeroSource, /Subir mis apuntes/);
assert.match(homeHeroSource, /href="#demo"/);
for (const anchor of ['producto', 'como-funciona', 'faq']) {
  assert.ok(
    homeHeroSource.includes(`id="${anchor}"`),
    `Se conserva el destino del footer: ${anchor}.`
  );
}
const homePageSource = readFileSync(resolve('app/page.tsx'), 'utf8');
assert.match(
  homePageSource,
  /<FooterHome \/>/,
  'La landing mantiene el footer completo existente.'
);
assert.match(homePageSource, /canonical: '\/'/);

const studyErrorsSource = readFileSync(
  resolve('components/dashboard/study-errors-client.tsx'),
  'utf8'
);
const studyErrorDetailSource = readFileSync(
  resolve('components/dashboard/study-error-detail.tsx'),
  'utf8'
);
for (const target of ['error', 'understand', 'source', 'practice']) {
  assert.match(
    studyErrorsSource + studyErrorDetailSource,
    new RegExp(`data-study-error-tour=["']${target}["']`),
    `El onboarding de Mis errores debe destacar ${target}.`
  );
}
assert.doesNotMatch(studyErrorsSource, /finishStudyErrorOnboardingAction|FirstErrorOnboardingPrompt/);

const reviewSource =
  'La memoria de trabajo permite mantener y manipular información durante una tarea.';
const reviewPayload = {
  supported: true,
  question:
    'Mientras hacés un cálculo mental mantenés varios números disponibles. ¿Qué proceso permite esa tarea?',
  options: [
    'Mantener y manipular información temporalmente.',
    'Almacenar recuerdos autobiográficos.',
    'Reconocer una cara vista hace años.',
  ],
  correctIndex: 0,
  feedback:
    'La fuente describe el mantenimiento y la manipulación de información durante una tarea.',
  evidenceQuote: 'permite mantener y manipular información durante una tarea',
};
assert.ok(validateReviewQuestion(reviewPayload, reviewSource, '¿Qué es la memoria de trabajo?'));
assert.equal(
  validateReviewQuestion(
    { ...reviewPayload, evidenceQuote: 'Una afirmación inventada que no aparece en el material.' },
    reviewSource,
    'Original'
  ),
  null
);
assert.equal(
  validateReviewQuestion({ ...reviewPayload, correctIndex: 3 }, reviewSource, 'Original'),
  null
);
assert.equal(
  validateReviewQuestion(
    { ...reviewPayload, options: ['Iguales', ' iguales ', 'Otra'] },
    reviewSource,
    'Original'
  ),
  null
);
assert.equal(
  validateReviewQuestion(
    { ...reviewPayload, question: '¿Qué es la memoria de trabajo?' },
    reviewSource,
    '¿Qué es la memoria de trabajo?'
  ),
  null
);
assert.equal(validateReviewQuestion({ supported: false }, reviewSource, 'Original'), null);
assert.deepEqual(publicReviewQuestion({ id: 'check-1', ...reviewPayload }), {
  id: 'check-1',
  question: reviewPayload.question,
  options: reviewPayload.options,
});
assert.ok(!('correctIndex' in publicReviewQuestion({ id: 'check-1', ...reviewPayload })));

const entryId = '0eb4946c-227e-4a21-8d2a-72496cb00eca';
const otherEntryId = '555d3d0a-206e-42e2-adf8-08f1063448e6';
const entryUrl = new URL(
  buildSimulatorLandingHref(
    '/simulador/materia/2?utm_source=google',
    entryId,
    'Texto & acentos: sí.'
  ),
  'https://evaluo.com.ar'
);
assert.equal(entryUrl.searchParams.get('utm_source'), 'google');
assert.deepEqual(parseSimulatorLandingEntry(entryUrl.searchParams), {
  questionId: entryId,
  option: 'Texto & acentos: sí.',
});
assert.equal(
  parseSimulatorLandingEntry(new URLSearchParams('entry_question=invalid&entry_option=A')),
  null
);
assert.equal(
  parseSimulatorLandingEntry(
    new URLSearchParams({ entry_question: entryId, entry_option: 'x'.repeat(2001) })
  ),
  null
);
const entryPool = [{ id: entryId }, { id: otherEntryId }];
assert.equal(getLandingOptionIndex(['Constante.', ' Firme.  ', 'Duradero.'], 'firme.'), 1);
assert.equal(getLandingOptionIndex(['A', 'B'], 'Opción que ya no existe'), -1);
assert.deepEqual(preferSimulatorQuestion([entryPool[1]], entryPool, entryId, 1), [entryPool[0]]);
assert.deepEqual(preferSimulatorQuestion([entryPool[1]], [entryPool[1]], entryId, 1), [
  entryPool[1],
]);
assert.deepEqual(preferSimulatorQuestion(entryPool, entryPool, entryId, 2), entryPool);
// Práctica por tema: sin selector, se muestran todas las preguntas verificables hasta 20.
assert.equal(MAX_TOPIC_PRACTICE_QUESTIONS, 20);
assert.equal(topicPracticeQuestionCount(0), 0);
assert.equal(topicPracticeQuestionCount(7), 7);
assert.equal(topicPracticeQuestionCount(31), 20);
const syntheticTopic = 'Tema sintético de evaluación';
const topicQuestionBank: StudyQuestion[] = Array.from({ length: 31 }, (_, index) => ({
  id: `topic-qa-${index}`,
  type: 'multiple_choice',
  kind: 'concept',
  level: 'comprender',
  chapterTitle: syntheticTopic,
  topic: syntheticTopic,
  prompt: `¿Qué respuesta describe el caso ${index + 1} en esta unidad de estudio?`,
  answer: `Interpretación correcta del caso ${index + 1}`,
  options: [
    `Interpretación correcta del caso ${index + 1}`,
    'Una alternativa incorrecta',
    'Otra alternativa incorrecta',
  ],
  explanation: 'Explicación sustentada en el contenido de esta sección.',
  reference: {
    sectionTitle: syntheticTopic,
    pageStart: 1,
    pageEnd: 1,
    excerpt: 'Explicación sustentada en el contenido de esta sección.',
  },
}));
for (const count of [7, 31]) {
  const selected = selectTopicPracticeQuestions({
    questions: topicQuestionBank.slice(0, count),
    targetCount: topicPracticeQuestionCount(count),
    sections: [{ title: syntheticTopic, body: 'Material de estudio para la evaluación.' }],
  });
  assert.equal(selected.length, Math.min(count, 20), 'La tanda debe respetar el máximo.');
  assert.equal(new Set(selected.map((item) => item.id)).size, selected.length, 'Sin repetidos.');
}

// El detalle de Progreso concentra el estudio sin duplicar la lista lateral.
// Conservar la rama de refuerzo y el panel derecho mientras se elimina el índice.
const pdfProgressDetail = readFileSync('components/dashboard/pdf-progress-panel.tsx', 'utf8');
assert.doesNotMatch(pdfProgressDetail, /Navegación entre temas del PDF|Temas del PDF/);
assert.match(pdfProgressDetail, /xl:grid-cols-\[minmax\(0,1fr\)_260px\]/);
assert.match(pdfProgressDetail, /data-reinforcement-focus=\{reviewOpen/);
assert.match(pdfProgressDetail, /Aprendizaje y próxima actividad del tema/);
assert.match(pdfProgressDetail, /Volver a los temas/);

// Las mejoras posteriores de main no se reemplazan por versiones de master:
// índice del resumen con seguimiento del scroll y compartir oculto en Progreso.
const pdfStudyWorkspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
assert.match(pdfStudyWorkspace, /region\.addEventListener\('scroll', scheduleSync/);
assert.match(pdfStudyWorkspace, /aria-current=\{activeSummaryChapterIndex === index \? 'location' : undefined\}/);
assert.match(pdfStudyWorkspace, /data-active-chapter=\{activeSummaryChapterIndex === index/);
// Glosario comparte con Resumen la anchura, jerarquía y tamaño de lectura.
// El filtro por tema conserva el vínculo con el capítulo activo.
assert.match(pdfStudyWorkspace, /data-study-glossary className="mx-auto w-full max-w-\[1240px\]/);
assert.match(pdfStudyWorkspace, /<div className="w-full max-w-\[1040px\]">/);
assert.match(pdfStudyWorkspace, /text-\[19px\].*sm:text-\[20px\]/);
assert.match(pdfStudyWorkspace, /text-\[14px\] leading-5 font-semibold/);
assert.match(pdfStudyWorkspace, /text-\[13px\] leading-\[1\.65\] sm:text-\[13\.5px\]/);
assert.match(pdfStudyWorkspace, /glossaryTopicIndex === null \?/);
assert.match(pdfStudyWorkspace, /renderTopicResourceHeader\('glosario'\)/);
assert.match(pdfStudyWorkspace, /getTopicStudyResources\(studySummary\.sections, usefulGlossary, studyArtifacts\.flashcards, index\)/);
assert.match(pdfStudyWorkspace, /className="min-h-10 rounded-lg text-\[13px\]"/);

const appStyles = readFileSync('app/globals.css', 'utf8');
assert.match(appStyles, /body:has\(\[data-progress-open='true'\]\) \[data-student-material-share-control\]/);


// Portabilidad master → main: la imagen de vista previa real desplaza al OG anterior.
const homepageShareMeta = readFileSync('app/page.tsx', 'utf8');
const layoutShareMeta = readFileSync('app/layout.tsx', 'utf8');
assert.ok(homepageShareMeta.includes('/evaluo-whatsapp-progreso.png'));
assert.ok(layoutShareMeta.includes('/evaluo-whatsapp-progreso.png'));
assert.ok(homepageShareMeta.includes('No estudies todo por igual'));
assert.equal(existsSync('app/opengraph-image.tsx'), false);
const shareImage = readFileSync('public/evaluo-whatsapp-progreso.png');
assert.equal(shareImage.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(shareImage.readUInt32BE(16), 1200);
assert.equal(shareImage.readUInt32BE(20), 630);

// El desplegable conserva las salvaguardas de eliminación y el flujo de Mercado Pago.
const privacyControls = readFileSync('components/settings/delete-account-section.tsx', 'utf8');
for (const snippet of ['<details', '<summary', 'Privacidad y cuenta', 'Eliminar mi cuenta', 'Ver detalles', "fetch('/api/account/delete'", "confirmation.trim().toUpperCase() !== 'ELIMINAR'", 'role="alert"', 'subscription_provider_error', 'storage_cleanup_failed']) {
  assert.ok(privacyControls.includes(snippet), 'Falta protección o navegación de privacidad: ' + snippet);
}
assert.equal(privacyControls.includes('Zona sensible'), false);

console.log('Flow smoke tests passed.');
