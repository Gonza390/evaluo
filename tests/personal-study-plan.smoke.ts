import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { completeStudySchedule, distributeStudyTopics, estimateTopicSessionMinutes, recommendTopicActivities } from '../lib/student-materials/study-plan-distribution.ts';

const code=(path:string)=>readFileSync(path,'utf8');
const practice=code('components/dashboard/practice-mode-picker.tsx');
const empty=code('components/dashboard/empty-study-plan.tsx');
const filled=code('app/(es)/dashboard/plan-de-estudio/page.tsx');
const card=code('components/dashboard/study-plan-exam-card.tsx');
const setup=code('components/dashboard/study-plan-setup.tsx');
const savedRoadmap=code('components/dashboard/saved-study-plan-roadmap.tsx');
const savedSchedule=code('components/dashboard/saved-study-plan-schedule.tsx');
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
assert.match(api,/method:'PATCH'|export async function PATCH/, 'La API conserva la posibilidad de registrar lectura.');
assert.match(filled,/if \(hasSavedPlan\)/, 'El nuevo recorrido exige un plan guardado.');
assert.match(setup,/savedPlan && <SavedStudyPlanRoadmap/, 'El recorrido solo aparece en la vista del plan persistido.');
assert.match(setup,/<SavedStudyPlanSchedule days=\{days\}/, 'La vista guardada utiliza días reales del plan.');
assert.match(savedSchedule,/Tu plan de estudios/, 'Se utiliza el título solicitado.');
assert.match(savedSchedule,/scheduled\.slice\(0,3\)/, 'Se muestran inicialmente tres fechas.');
assert.match(savedSchedule,/recommendTopicActivities\(topic,preferences,dailyMinutes\)/, 'Cada día muestra actividades reales del generador.');
assert.match(savedSchedule,/examDateLabel\(examDate\)/, 'El examen es el hito final de la lista.');
assert.doesNotMatch(setup,/Los días que quedan|TU PRÓXIMA SESIÓN/, 'No duplicar bloques diarios anteriores.');
assert.match(savedRoadmap,/data-saved-roadmap-scroll/, 'Solo la fila central de temas tiene scroll horizontal.');
assert.match(savedRoadmap,/topics\.map\(\(topic, index\)/, 'Todos los temas se recorren horizontalmente sin paginación.');
assert.match(savedRoadmap,/examLabel\(examDate\)/, 'El examen permanece como hito final.');
assert.match(savedRoadmap,/completed\.has\(topic\.key\)/, 'Se respeta el avance real de lectura.');
assert.doesNotMatch(savedRoadmap,/setWindowStart|Anterior|Siguiente/, 'El recorrido no muestra controles de paginación.');
assert.match(savedRoadmap,/overflow-x-auto/, 'Se conserva el desplazamiento horizontal interno.');

assert.match(setup,/data-study-plan-time-options/, 'La etapa de tiempo debe tener opciones identificables.');
assert.match(setup,/sm:grid-cols-4/, 'Las cuatro duraciones van en una fila en escritorio.');
assert.match(setup,/grid-cols-2 gap-2\.5 sm:grid-cols-4/, 'En móvil se mantienen dos columnas.');
assert.match(setup,/\[15,30,45,60\]\.map\(value=>/, 'Conservar las duraciones originales.');
assert.match(setup,/minutes===value\?'border-\[#2563EB\] bg-\[#EEF2FF\]/,
  'La opción elegida conserva el azul de Evaluo.');
assert.match(setup,/data-study-plan-time-actions/, 'Acciones debajo de las opciones.');
assert.match(setup,/onClick=\{\(\)=>setStep\(1\)\}/, 'Atrás retorna a selección de materiales.');
assert.match(setup,/onClick=\{\(\)=>setStep\(3\)\}/, 'Continuar conserva preferencias como cuarto paso.');
assert.match(setup,/step===3\?void savePlan\(\):setStep\(s=>s\+1\)/,
  'Solo se guarda el plan después de escoger preferencias.');

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
const full=completeStudySchedule(sample,'2027-01-02',30,new Date(2027,0,1));
assert.equal(full.days.flatMap(day=>day.topics).length,sample.length,
  'Even with insufficient time, the complete study plan must show every topic.');
assert.equal(full.overloadedTopics,2,'Overflow is reported rather than silently discarded.');
assert.ok(full.days.some(day=>day.estimatedMinutes>30),
  'An overloaded day must be detectable for the small warning.');
const normal=completeStudySchedule(sample,'2027-01-04',30,new Date(2027,0,1));
assert.equal(normal.overloadedTopics,0);
assert.ok(normal.days.every(day=>day.estimatedMinutes<=30));
const combined=['entender','memorizar','practicar','casos'];
const seen=new Set<string>();
for(let i=0;i<24;i++) {
  const steps=recommendTopicActivities({...sample[0]!,topicIndex:i},combined,60);
  assert.equal(steps[0]?.id,'resumen','Every session starts with the topic summary.');
  assert.equal(steps.length,3,'Long sessions recommend exactly two distinct practice activities.');
  assert.equal(new Set(steps.map(step=>step.id)).size,steps.length);
  assert.ok(steps.every(step=>step.href.includes('a')));
  assert.deepEqual(steps,recommendTopicActivities({...sample[0]!,topicIndex:i},combined,60),
    'Reloading a study plan must keep recommendations stable.');
  steps.slice(1).forEach(step=>seen.add(step.id));
}
assert.deepEqual(seen,new Set(['flashcards','unir','completar','opciones','mixto','casos','simulacro']),
  'Preferences must vary across all available practice modalities.');
const quick=recommendTopicActivities(sample[0]!,['practicar'],15);
assert.equal(quick.length,2,'A 15-minute session must not add extra practice activities.');
assert.ok(quick.every(step=>!['casos','flashcards','simulacro'].includes(step.id)),
  'Unselected specialties and long simulations should not be forced on short sessions.');
const casesOnly=Array.from({length:9},(_,i)=>recommendTopicActivities({...sample[0]!,topicIndex:i},['casos'],30)[1]!.id);
assert.ok(casesOnly.includes('casos')&&casesOnly.includes('opciones')&&casesOnly.includes('mixto'),
  'A cases preference must sometimes show cases and sometimes another exercise.');
assert.equal(estimateTopicSessionMinutes(10,['entender'],15),10,
  'Reading-only plans must not invent practice time.');
assert.equal(estimateTopicSessionMinutes(10,['entender','practicar'],15),16,
  'Short plans must include one practice in the capacity estimate.');
assert.equal(estimateTopicSessionMinutes(10,['casos'],60),22,
  'Long plans must budget the second recommended practice.');
assert.match(api,/estimateTopicSessionMinutes\(/);
assert.match(setup,/estimateTopicSessionMinutes\(/);
assert.match(setup,/data-study-plan-time-warning/);
assert.match(savedSchedule,/recommendTopicActivities\(topic,preferences,dailyMinutes\)/);
assert.match(api,/completeStudySchedule\(topics,examDate,minutes,start\)/);
console.log('Personal plan persistence, empty states and topic distribution OK');
