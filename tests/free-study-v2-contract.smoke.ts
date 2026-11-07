import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { FREE_STUDY_V2, isFreeStudyV2Active } from '../lib/free-study-v2.ts';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.equal(FREE_STUDY_V2.materialsPerMonth,1);
assert.equal(FREE_STUDY_V2.multipleChoice,12);
assert.equal(FREE_STUDY_V2.trueFalse,10);
assert.equal(FREE_STUDY_V2.matchingRounds,1);
assert.equal(FREE_STUDY_V2.matchingPairs,6);
assert.equal(FREE_STUDY_V2.cases,2);
assert.equal(FREE_STUDY_V2.flashcards,25);
assert.equal(FREE_STUDY_V2.simulatorSessions,1);
assert.equal(FREE_STUDY_V2.simulatorQuestions,20);
assert.equal(FREE_STUDY_V2.studyPlans,1);

// Punto 4 rechazado: no limitar las explicaciones cuando el estudiante se equivoca.
assert.ok(!('incorrectAnswerExplanations' in FREE_STUDY_V2));
const helper=read('lib/free-study-v2-server.ts');
const schema=read('supabase/migrations/20261104180000_free_study_v2_unlocks.sql');
assert.doesNotMatch(helper,/error_explanation|incorrectAnswerExplanations/);
assert.doesNotMatch(schema,/error_explanation/);
assert.match(schema,/remember_free_study_v2_upload\(\)[\s\S]*?as \$\$[\s\S]*?end;\s*\$\$/);
assert.ok(!existsSync(new URL('../app/api/free-study-v2/explanation/route.ts',import.meta.url)));
const pdfExam=read('components/student-material-exam.tsx');
assert.doesNotMatch(pdfExam,/\/api\/free-study-v2\/explanation/);
assert.match(pdfExam,/\{current\.explanation\}/);
assert.match(pdfExam,/itemKey: current\.id/);
assert.doesNotMatch(pdfExam,/const grants:StudyQuestion\[\] = \[\]/);
assert.match(schema,/guard_free_study_v2_material_insert/);

assert.ok(schema.includes("or mode ~ '^topic:[0-9]{1,3}:round:[0-4]$'"),
  'The topic-bank constraint must retain the complete regular expression');
for (const declaration of [
  /create table if not exists public\.free_study_v2_banks \(/g,
  /create or replace function public\.free_study_v2_is_premium_account\(/g,
  /create or replace function public\.guard_free_study_v2_material_insert\(/g,
  /create or replace function public\.guard_free_study_v2_failed_material_retry\(/g,
]) assert.equal((schema.match(declaration) ?? []).length,1,
  'Migration must not contain duplicate SQL declarations');
assert.doesNotMatch(schema,/execute function public\.guard_free_study_v2_failed_material_retry\(\);\s*\),/,
  'A trigger statement must not be followed by an incomplete table fragment');
assert.match(schema,/guard_free_study_v2_failed_material_retry/);
assert.match(schema,/pg_catalog\.pg_advisory_xact_lock/);
assert.match(schema,/free_study_v2_is_premium_account/);
assert.match(schema,/created_at := pg_catalog\.now\(\)/);
assert.match(schema,/study_material_v2_upload_ledger/);
assert.match(schema,/remember_study_material_v2_upload/);
assert.match(schema,/from public\.study_material_v2_upload_ledger l/);

assert.match(read('app/(es)/materiales/[id]/page.tsx'),/clientPedagogicalArtifacts/);
// No introducir diseños/upsells mientras el usuario diseña esas pantallas.
assert.doesNotMatch(read('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx'),/href="\/pricing"/);

// Los previews de master nunca pueden cobrar cupos v2 por error.
const oldEnvironment=process.env.VERCEL_ENV;
const oldEnabled=process.env.FREE_STUDY_V2_ENABLED;
try {
  process.env.VERCEL_ENV='preview';
  process.env.FREE_STUDY_V2_ENABLED='1';
  assert.equal(isFreeStudyV2Active(),false);
  process.env.VERCEL_ENV='production';
  process.env.FREE_STUDY_V2_ENABLED='0';
  assert.equal(isFreeStudyV2Active(),false);
  process.env.FREE_STUDY_V2_ENABLED='1';
  assert.equal(isFreeStudyV2Active(),true);
} finally {
  if(oldEnvironment===undefined)delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV=oldEnvironment;
  if(oldEnabled===undefined)delete process.env.FREE_STUDY_V2_ENABLED;
  else process.env.FREE_STUDY_V2_ENABLED=oldEnabled;
}
assert.match(schema,/free_study_v2_upload_claims/);
assert.match(schema,/remember_free_study_v2_upload/);
assert.match(schema,/claim_free_study_v2_unlock/);
assert.match(read('app/api/study-plans/route.ts'),/save_free_study_v2_plan/);
assert.match(read('app\/(es)\/dashboard\/materiales\/upload-actions.ts'),/freeStudyMaterialIdsThisMonth/);
assert.match(read('app\/(es)\/dashboard\/materiales\/pdf-first-upload-actions.ts'),/freeStudyMaterialIdsThisMonth/);

// Nuevo lanzamiento: jamás consumir cupos por PDFs/planes anteriores.
assert.doesNotMatch(schema, /select distinct on \(m\.user_id\)/,
  'Free V2 must not backfill lifetime grants from old PDFs.');
assert.doesNotMatch(schema, /select id,user_id,created_at from public\.student_materials/,
  'Premium daily ledger must not import previous uploads.');
assert.match(schema, /if not public\.is_free_study_v2_rollout_enabled\(\) then return new; end if;/);
for (const path of [
  'app/(es)/dashboard/materiales/upload-actions.ts',
  'app/(es)/dashboard/materiales/pdf-first-upload-actions.ts',
]) {
  const upload=read(path);
  assert.match(upload, /\? monthIds\.length/,
    'Legacy PDFs must not consume the new Free slot in either upload flow.');
  assert.doesNotMatch(upload, /new Set\(\[\.\.\.(?:activeIds|countedMaterials)/,
    'Old uploads cannot be merged into Free V2 claim count.');
  assert.match(upload, /from\('study_material_v2_upload_ledger' as never\)/,
    'Premium daily limit must use only post-launch ledger rows.');
}

const planSql=read('supabase/migrations/20261104183000_free_study_v2_plan_claim.sql');
assert.match(schema,/create table if not exists public\.free_study_v2_rollout/);
assert.match(schema,/is_free_study_v2_rollout_enabled/);
assert.doesNotMatch(planSql, /select user_id from public\.student_personal_study_plans/,
  'Prelaunch study plans cannot consume the new Free plan grant.');
assert.match(planSql,/as restrictive for insert to authenticated/);
assert.match(planSql,/as restrictive for update to authenticated/);
assert.match(planSql,/as restrictive for delete to authenticated/);
assert.doesNotMatch(planSql,/revoke insert, update, delete on public\.student_personal_study_plans/);
assert.match(read('app/api/study-plans/route.ts'),/createAdminClient\(\)\.from\('student_personal_study_plans'/);

// Todo banco generado o cacheado debe aplicar cupos por cuenta.
for (const path of ['app/api/practice/true-false/route.ts', 'app/api/practice/cases/route.ts']) {
  const route=read(path);
  assert.match(route,/claimVerifiedFreeStudySample/);
}
assert.match(helper,/export async function claimVerifiedFreeStudySample/);
assert.match(helper,/export async function claimFreeStudyPairSample/);
// El backend debe filtrar tarjetas que el frontend no mostraría, antes de
// registrar el cupo irreversible. El índice original identifica al banco.
assert.match(helper,/auditPracticeFlashcard\(/);
assert.match(helper,/!review\.approved \|\| seenPrompts\.has\(prompt\) \|\| seenAnswers\.has\(answer\)/);
assert.ok(helper.indexOf('const review = auditPracticeFlashcard') <
  helper.indexOf('kind:\'flashcard\', itemKey:input.materialId + \':supplement-flashcard:\''),
  'Supplementary flashcards must pass quality control before the Free claim.');

const supplement=read('app/api/practice/supplement/route.ts');
assert.match(supplement,/claimFreeStudyPairSample/);
assert.match(supplement,/free_study_sample_unavailable/);
const topicApi=read('app/api/practice/topic-supplement/route.ts');
assert.match(topicApi,/saveFirstFreeStudyBank/);
assert.match(topicApi,/verified_topic_cached/);
const claimApi=read('app/api/free-study-v2/claim/route.ts');
assert.match(claimApi,/\.like\('mode','topic:%'\)/);
assert.match(schema,/topic:\[0-9\]\{1,3\}:round:\[0-4\]/);


const modes=read('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx');
assert.match(modes,/if \(mode === 'flashcards'\) \{/);
console.log('Free v2 quotas, database protections and unrestricted corrections smoke passed.');

// Free: 1 apunte por mes calendario en hora de Argentina (UTC-3).
{
  const { freeUploadPeriod, nextFreeUploadAt } = await import('../lib/free-study-v2.ts');
  assert.equal(freeUploadPeriod(new Date('2026-11-30T23:30:00-03:00')), '2026-11-01');
  assert.equal(freeUploadPeriod(new Date('2026-12-01T00:30:00-03:00')), '2026-12-01');
  assert.equal(nextFreeUploadAt(new Date('2026-11-07T16:00:00-03:00')).toISOString(), '2026-12-01T03:00:00.000Z');
  assert.equal(nextFreeUploadAt(new Date('2026-12-15T10:00:00-03:00')).toISOString(), '2027-01-01T03:00:00.000Z');
  const monthly = read('supabase/migrations/20261107200000_free_study_v2_monthly_upload.sql');
  assert.match(monthly, /primary key \(user_id, period\)/);
  assert.match(monthly, /c\.period = public\.free_study_v2_upload_period\(\)/);
  assert.match(monthly, /'America\/Argentina\/Buenos_Aires'/);
  const shell = read('components/dashboard/pdf-first-upload-shell.tsx');
  assert.match(shell, /upgrade\?\.reason !== 'material_upload'/,
    'El límite de apuntes muestra la pantalla Premium, no un error genérico.');
  assert.match(shell, /<FreeUploadLimitScreen/);
}
