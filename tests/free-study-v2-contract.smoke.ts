import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { FREE_STUDY_V2, isFreeStudyV2Active } from '../lib/free-study-v2.ts';

const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.equal(FREE_STUDY_V2.materialsLifetime,1);
assert.equal(FREE_STUDY_V2.multipleChoice,12);
assert.equal(FREE_STUDY_V2.trueFalse,10);
assert.equal(FREE_STUDY_V2.matchingRounds,1);
assert.equal(FREE_STUDY_V2.matchingPairs,6);
assert.equal(FREE_STUDY_V2.cases,2);
assert.equal(FREE_STUDY_V2.flashcards,25);
assert.equal(FREE_STUDY_V2.simulatorSessions,1);
assert.equal(FREE_STUDY_V2.simulatorQuestions,20);
assert.equal(FREE_STUDY_V2.studyPlans,1);

// El usuario rechazó explícitamente el punto 4: NO limitar 15 explicaciones.
assert.ok(!('incorrectAnswerExplanations' in FREE_STUDY_V2));
const helper=read('lib/free-study-v2-server.ts');
const schema=read('supabase/migrations/20261104180000_free_study_v2_unlocks.sql');
assert.doesNotMatch(helper,/error_explanation|incorrectAnswerExplanations/);
assert.doesNotMatch(schema,/error_explanation/);
assert.ok(!existsSync(new URL('../app/api/free-study-v2/explanation/route.ts',import.meta.url)));

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
assert.match(read('app\/(es)\/dashboard\/materiales\/upload-actions.ts'),/historicalFreeStudyMaterialIds/);
assert.match(read('app\/(es)\/dashboard\/materiales\/pdf-first-upload-actions.ts'),/historicalFreeStudyMaterialIds/);
console.log('Free v2 contract and excluded explanation rule smoke tests passed.');
