import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { distributeStudyTopics } from '../lib/student-materials/study-plan-distribution.ts';

const code=(path:string)=>readFileSync(path,'utf8');
const practice=code('components/dashboard/practice-mode-picker.tsx');
const empty=code('components/dashboard/empty-study-plan.tsx');
const filled=code('app/(es)/dashboard/plan-de-estudio/page.tsx');
const card=code('components/dashboard/study-plan-exam-card.tsx');
const setup=code('components/dashboard/study-plan-setup.tsx');
const api=code('app/api/study-plans/route.ts');
const sql=code('supabase/migrations/20261102205803_student_personal_study_plans.sql');
const demo=code('components/demo-four-step-study.tsx');
const demoPage=code('app/(es)/demo/material-estudio/page.tsx');

assert.equal((practice.match(/modes\.map/g)??[]).length,1,'Una misma grilla de tarjetas para ambas situaciones');
assert.doesNotMatch(practice,/empty-practice-title|Sin material/);
assert.match(empty,/<StudyPlanExamCard hasMaterials=\{false\}/);
assert.match(filled,/<StudyPlanExamCard hasMaterials hasSavedPlan/);
assert.match(card,/Continuar mi plan/);
assert.doesNotMatch(empty,/empty-plan-exam-date|disabled placeholder="dd\/mm\/aaaa"/);
assert.match(setup,/fetch\('\/api\/study-plans'/);
assert.match(setup,/method:'PATCH'/);
assert.match(setup,/Marcar leído/);
assert.match(api,/export async function GET/);
assert.match(api,/export async function POST/);
assert.match(api,/export async function PATCH/);
assert.match(api,/\.eq\('user_id',user.id\)/);
assert.match(api,/ignoreDuplicates:true/);
assert.match(sql,/enable row level security/i);
assert.match(sql,/Study plans select own/);
assert.match(sql,/Study plans insert own/);
assert.match(sql,/Study plans update own/);
assert.match(demoPage,/const PRACTICE_ARTIFACTS = buildPedagogicalArtifacts/);
assert.doesNotMatch(demo,/\(\) => buildPedagogicalArtifacts/);

const sample=[
 {materialId:'a',materialTitle:'Uno',topicIndex:0,title:'Tema A',estimatedMinutes:20},
 {materialId:'a',materialTitle:'Uno',topicIndex:1,title:'Tema B',estimatedMinutes:20},
 {materialId:'a',materialTitle:'Uno',topicIndex:2,title:'Tema C',estimatedMinutes:20}
];
const result=distributeStudyTopics(sample,'2027-01-04',30,new Date(2027,0,1));
assert.equal(result.days.length,3);
assert.deepEqual(result.days.map(day=>day.topics.length),[1,1,1]);
assert.equal(result.unassigned.length,0);
const insufficient=distributeStudyTopics(sample,'2027-01-02',30,new Date(2027,0,1));
assert.equal(insufficient.unassigned.length,2);
console.log('Personal plan persistence, empty states and topic distribution OK');
