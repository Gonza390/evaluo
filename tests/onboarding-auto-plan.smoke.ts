import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPlanSchedule, buildPlanTopics } from '../lib/student-materials/study-plan-builder.ts';

// Onboarding etapa 2: con fecha de examen y apunte listo, el plan se arma solo.
const read = (path: string) => readFileSync(path, 'utf8');

const sections = Array.from({ length: 6 }, (_, index) => ({
  title: `Tema ${index + 1}`,
  body: 'palabra '.repeat(400),
}));
const topics = buildPlanTopics(
  [{ id: 'm1', title: 'Microeconomía' }],
  new Map([['m1', sections]]),
  ['entender', 'practicar'],
  30
);
assert.equal(topics.length, 6);
assert.equal(topics[0]?.title, 'Tema 1');
const { schedule } = buildPlanSchedule(topics, '2027-01-15', 30, ['entender', 'practicar'], new Date(2027, 0, 1, 12));
assert.ok(schedule.length > 0, 'el plan tiene días de estudio');
assert.equal(schedule.reduce((sum, day) => sum + day.topics.length, 0), 6, 'todos los temas quedan en el plan');
assert.ok(schedule.every((day) => day.date < '2027-01-15'), 'nada después del examen');
assert.deepEqual(buildPlanTopics([{ id: 'm1', title: 'x' }], new Map(), ['entender'], 30), [], 'sin temas no hay plan');

const auto = read('lib/student-materials/auto-study-plan.ts');
assert.match(auto, /minutesPerDay: 30/);
assert.match(auto, /preferences: \['entender', 'practicar'\]/);
assert.match(auto, /if \(existing\.data\) return 'plan_exists';/, 'nunca pisa un plan existente');
assert.match(auto, /\.from\('student_personal_study_plans'\)\.insert\(/, 'insert, no upsert: si el usuario armó uno a mano, gana el suyo');
assert.doesNotMatch(auto, /\.upsert\(/);
assert.match(auto, /material\.processing_status !== 'ready'/, 'sin temas todavía no se arma');
assert.match(auto, /save_free_study_v2_plan/, 'Free v2 usa la misma RPC que el plan manual');
assert.match(auto, /eventName: 'study_plan_auto_created'/);

const processing = read('lib/student-materials/processing-service.ts');
assert.match(processing, /ensureAutoStudyPlan\(\{ userId: material\.user_id, materialId: material\.id \}\)/,
  'al terminar el procesamiento se arma el plan si ya había fecha');
const examDate = read('app/(es)/dashboard/materiales/exam-date-prompt-actions.ts');
assert.match(examDate, /ensureAutoStudyPlan\(\{ userId: owned\.user\.id, materialId: input\.materialId \}\)/,
  'al guardar la fecha con el apunte listo se arma el plan');
const state = read('app/(es)/dashboard/materiales/actions.ts');
assert.match(state, /summarizeStudyPlan\(/, 'la pantalla final recibe el resumen del plan');

console.log('[onboarding-etapa2] plan automático: reparto, sin pisar planes y disparadores.');
