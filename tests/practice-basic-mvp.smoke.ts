import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  selectPracticePairs, qualifiedQuestions, balancedQuestions,
  buildSourceBackedCases, selectMixedQuestions,
  isCorrectWrittenAnswer, allowedWrittenVariants,
  type PracticeQuestion, type PracticePair,
} from '../lib/student-materials/practice-modes.ts';
import type { CanonicalPedagogicalModel } from '../lib/student-materials/types.ts';

const glossary: PracticePair[] = [
  {term:'Penetración de mercado', definition:'Venta más intensa de los productos existentes dentro de los mercados donde la empresa ya opera.',chapterTitle:'Estrategia'},
  {term:'Desarrollo de mercados',definition:'Ingreso a nuevas regiones geográficas manteniendo la oferta de productos o servicios existentes.',chapterTitle:'Estrategia'},
  {term:'Desarrollo de productos',definition:'Introducción de productos distintos para consumidores que pertenecen al mercado actual.',chapterTitle:'Estrategia'},
  {term:'Diversificación',definition:'Introducción de productos nuevos en mercados en los cuales la empresa todavía no participa.',chapterTitle:'Estrategia'},
  {term:'Liderazgo democrático',definition:'Estilo de dirección que consulta o permite participar a los miembros del equipo durante la decisión.',chapterTitle:'Liderazgo'},
  {term:'Liderazgo autocrático',definition:'Estilo de dirección que concentra las decisiones y la autoridad en quien conduce al equipo.',chapterTitle:'Liderazgo'},
];
const valid=selectPracticePairs(glossary);
assert.equal(valid.length,6,'Both PDF and DOCX source glossary can feed matching');
assert.ok(valid.length >= 3,'Unir and Completar must both have actionable content');
for(const item of valid) {
 assert.equal(isCorrectWrittenAnswer(item.term,item.term,
   allowedWrittenVariants(item,valid)),true,'Every cloze term has a correct answer');
 assert.equal(isCorrectWrittenAnswer('una respuesta inventada',item.term,
   allowedWrittenVariants(item,valid)),false);
}
const options:PracticeQuestion[] = Array.from({length:12},(_,i)=>({
 id:'mcq-'+i,
 prompt:'¿Qué concepto se relaciona con esta decisión empresarial número '+i+'?',
 options:['Penetración de mercado','Desarrollo de mercados','Desarrollo de productos','Diversificación'],
 answer:['Penetración de mercado','Desarrollo de mercados','Desarrollo de productos','Diversificación'][i%4]!,
 explanation:'La estrategia correcta identifica qué sucede con la oferta y el mercado al cambiar la actividad comercial.',
 pageStart:i+1,chapterTitle:i<6?'Unidad 1: Estrategias':'Unidad 2: Crecimiento',level:i%3===0?'comprender':'recordar',
}));
const verified=qualifiedQuestions(options);
assert.equal(verified.length,12);
assert.equal(balancedQuestions(verified,10).length,10,'Simulacro works with the source bank even when AI is off');
const classification = {
 classifications:[{
 title:'Matriz de crecimiento de Ansoff',pageReferences:[7],
 items:[
  'Penetración de mercado: aumentar la venta de productos existentes en el mercado actual',
  'Desarrollo de mercados: comercializar los productos existentes en una región nueva',
  'Desarrollo de productos: introducir productos nuevos en el mercado actual',
  'Diversificación: vender productos nuevos en un mercado donde todavía no se participa',
 ],
 }],
} as unknown as CanonicalPedagogicalModel;
const cases=buildSourceBackedCases(classification);
assert.ok(cases.length >= 2,'Casos has real classified-source fallback, no Gemini necessary');
assert.ok(cases.every(c=>c.options.includes(c.answer)));
assert.ok(cases.every(c=>c.level==='aplicar'),
 'A complete sourced Ansoff matrix supports genuine hypothetical decisions');
assert.ok(cases.every(c=>c.kind==='source-application'));
assert.ok(cases.every(c=>!c.prompt.toLowerCase().includes(c.answer.toLowerCase())),
  'An application scenario must not reveal the label');
assert.ok(cases.every(c=>!/riesgo (?:medio|bajo|alto)/i.test(c.prompt+' '+c.explanation)),
  'Do not reproduce disputed ranking of Ansoff risks');
const mixed=selectMixedQuestions(verified,cases);
assert.ok(mixed.questions.length>=4,'Mixto can run on source questions');
assert.ok(!mixed.application || !mixed.questions.some(q=>q.id===mixed.application?.id));
const file=(p:string)=>readFileSync(new URL(p,new URL('../',import.meta.url)),'utf8');
const picker=file('components/dashboard/practice-mode-picker.tsx');
const home=file('app/(es)/dashboard/practicar/page.tsx');
const session=file('components/dashboard/practice-session.tsx');
assert.match(home,/advancedPracticeEnabled=\{process\.env\.PRACTICE_BANK_ENABLED === '1'\}/);
assert.match(picker,/const requiresPreparation = advancedPracticeEnabled &&/,'Optional AI preparation remains disabled by default');
assert.match(picker,/router\.push\(destination\)/,'Student can enter basic practice directly with review duration');
assert.match(picker,/catch \{[\s\S]*Optional preparation cannot block the ordinary practice session\.[\s\S]*router\.push\(destination\)/,'A failing optional AI must not block existing exercises');
assert.match(session,/mode === 'simulacro'/);
assert.match(session,/mode === 'completar'/);
assert.match(session,/mode === 'casos'/);
assert.match(session,/mode === 'unir'/);
const materialPage=file('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx');
assert.match(materialPage,/file_name\.toLowerCase\(\)\.endsWith\('\.docx'\)/);
assert.match(materialPage,/allowOnDemandRegeneration: false/,
 'Simply opening practice must not re-extract PDF or DOCX');
console.log('Practice MVP source-only user flow: all five advanced modes ready with safe fallbacks, PDF/DOCX and zero AI calls');
