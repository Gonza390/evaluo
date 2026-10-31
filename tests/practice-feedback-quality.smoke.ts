import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 applyVerifiedFeedbackEdits, feedbackSourceFromArtifact, needsPedagogicalFeedback,
} from '../lib/student-materials/practice-feedback-quality.ts';
import {buildPracticeBank,PRACTICE_BANK_VERSION} from '../lib/student-materials/practice-on-demand.ts';
import type {PracticeQuestion} from '../lib/student-materials/practice-modes.ts';
const excerpt='La estandarización busca reducir la dependencia del trabajo respecto a las personas para que los procesos sean repetibles y verificables.';
const question:PracticeQuestion={
 id:'q-1',prompt:'¿Por qué estandarizar las tareas de un emprendimiento?',
 options:[
 'La estandarización reduce la dependencia del trabajo respecto de las personas.',
 'La estandarización aumenta la dependencia del trabajo respecto de las personas.',
 'Un emprendimiento solo puede estandarizar cuando cierra sus operaciones.',
 'La estandarización exige que una sola persona decida cada tarea.',
 ],
 answer:'La estandarización reduce la dependencia del trabajo respecto de las personas.',
 explanation:'La respuesta correcta se define como: la estandarización reduce dependencia.',
 level:'comprender',pageStart:10,chapterTitle:'Gestión',
};
const source={id:question.id,pageStart:10,excerpt,answer:question.answer,options:question.options};
const explanation='La estandarización reduce la dependencia de las personas porque convierte tareas repetidas en procesos transferibles. La alternativa que propone una mayor dependencia confunde documentar un procedimiento con concentrar las decisiones en una sola persona.';
const edited={feedback:[{sourceId:'q-1',explanation,evidence:excerpt.slice(0,90),page:10}]};
assert.equal(needsPedagogicalFeedback(question.explanation),true);
assert.equal(needsPedagogicalFeedback(explanation),false);
const improved=applyVerifiedFeedbackEdits([question],edited,[source]);
assert.equal(improved.length,1);
assert.equal(improved[0]?.explanation,explanation);
assert.equal(improved[0]?.answer,question.answer,'Editor must never change correct answer');
assert.deepEqual(improved[0]?.options,question.options,'Editor must never change distractors');
assert.equal(improved[0]?.pageStart,10,'Editor must never rewrite source page');
assert.equal(applyVerifiedFeedbackEdits([question],{feedback:[{...edited.feedback[0],page:11}]},[source])[0]?.explanation,question.explanation);
assert.equal(applyVerifiedFeedbackEdits([question],{feedback:[{...edited.feedback[0],evidence:'La fuente confirma un concepto falso creado por IA'}]},[source])[0]?.explanation,question.explanation);
assert.equal(applyVerifiedFeedbackEdits([question],{feedback:[{...edited.feedback[0],explanation:'Según el PDF la respuesta correcta es estandarizar las tareas y las demás opciones expresan ideas que no corresponden a la teoría.'}]},[source])[0]?.explanation,question.explanation);
assert.equal(feedbackSourceFromArtifact({
 ...question, reference:{pageStart:10,excerpt}
})?.pageStart,10);
assert.equal(feedbackSourceFromArtifact({
 ...question,reference:{pageStart:null,excerpt}
}),null,'Uncited explanations never edited by AI');
const bankRaw={questions:[{
 ...question,type:'multiple_choice',reference:{pageStart:10,excerpt},
 }]};
const unir=buildPracticeBank(bankRaw,null,[],'unir');
assert.equal(unir.version,PRACTICE_BANK_VERSION);
assert.equal(unir.questions.length,0,'Unir does not duplicate existing MCQ payload');
assert.equal(unir.cases.length,0);
assert.equal(buildPracticeBank(bankRaw,null,[],'completar').questions.length,0);
assert.equal(buildPracticeBank(bankRaw,null,[],'casos').questions.length,0);
assert.equal(buildPracticeBank(bankRaw,null,[],'simulacro').questions.length,1);
assert.equal(buildPracticeBank(bankRaw,null,[],'mixto').questions.length,1);
const read=p=>readFileSync(new URL(p,new URL('../',import.meta.url)),'utf8');
const route=read('app/api/practice/prepare/route.ts');
const page=read('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx');
assert.match(route,/enhanceFeedback/);
assert.match(route,/mode==='mixto'\|\|mode==='simulacro'/);
assert.match(route,/usePedagogicalAiBudget/);
assert.match(route,/PRACTICE_BANK_ENABLED !== '1'/);
assert.ok(route.indexOf("PRACTICE_BANK_ENABLED !== '1'") < route.indexOf(".from('student_materials')"), 'Disabled practice must not hit source database');
assert.match(route,/const needsDetailedSource=mode!=='unir'&&mode!=='completar'/);
assert.match(route,/PRACTICE_PEDAGOGICAL_AI_ENABLED === '1'/);
assert.match(route,/buildPracticeBank\(detailed\?\.pedagogical_artifacts \?\? null,model,enhanced,mode\)/);
assert.match(page,/:editorial:2:ai:/);
assert.match(route,/:editorial:2:ai:/);
console.log('Practice pedagogical feedback integrity and low-cost per-mode banks passed');
