import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  false
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
assert.match(
  demoMaterialSource,
  /hasPremiumAccess\(user\.id\)/,
  'El PDF demo debe resolver Premium desde el servidor y no simular acceso Premium.'
);
assert.match(
  demoMaterialSource,
  /isPremium=\{isPremium\}/,
  'El workspace demo debe recibir el entitlement Premium real.'
);
assert.match(
  demoMaterialSource,
  /backHref=\{user \? '\/dashboard\/materiales' : '\/'\}/,
  'Un usuario autenticado debe volver desde el PDF demo a sus materiales.'
);
assert.doesNotMatch(
  demoMaterialSource,
  /GENERAL_PEDAGOGICAL_ARTIFACTS|pedagogicalArtifacts=/,
  'El PDF demo no debe reutilizar artefactos pedagógicos persistidos de una versión anterior.'
);

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
] as const) {
  assert.equal(isAllowedAnalyticsEventName(eventName), true, `${eventName} debe ser aceptado por analytics.`);
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

console.log('Flow smoke tests passed.');
