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

assert.match(
  materialPageSource,
  /initialRecommendedStudy=\{isFirstReadyMaterial && query\.recorrido === '1'\}/,
  'El recorrido manual solo debe activarse si el material sigue siendo el primer PDF listo.'
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
