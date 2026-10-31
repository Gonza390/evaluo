import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  allowedWrittenVariants, balancedQuestions, groundedPracticeContrast,
  groundedPracticeExplanation,
  isCorrectWrittenAnswer, selectMixedQuestions, type PracticePair, type PracticeQuestion,
} from '../lib/student-materials/practice-modes.ts';

const pairs:PracticePair[]=[
 {term:'Hipótesis auxiliar',definition:'Supuesto complementario que acompaña la contrastación de una hipótesis principal.',chapterTitle:'IPC',englishTerm:'Auxiliary hypothesis'},
 {term:'Hipótesis fundamental',definition:'Proposición central que organiza la investigación y se somete a contrastación empírica.',chapterTitle:'IPC'},
 {term:'Responsabilidad social empresaria (RSE)',definition:'Enfoque empresarial que reconoce responsabilidades sociales y ambientales dentro de su gestión.',chapterTitle:'Marketing'},
];
const alias=allowedWrittenVariants(pairs[0]!,pairs);
assert.ok(alias.includes('Auxiliary hypothesis'));
assert.ok(alias.includes('hipotesis auxiliares'),'Unambiguous grammatical plural is allowed');
assert.equal(isCorrectWrittenAnswer('la hipótesis auxiliar',pairs[0]!.term,alias),true);
assert.equal(isCorrectWrittenAnswer('auxiliary hypothesis',pairs[0]!.term,alias),true);
assert.equal(isCorrectWrittenAnswer('hipótesis auxiliares',pairs[0]!.term,alias),true);
assert.equal(isCorrectWrittenAnswer('hipótesis auxiliar',pairs[0]!.term,alias),true);
assert.equal(isCorrectWrittenAnswer('hipótesis secundaria',pairs[0]!.term,alias),false,
  'Do not infer synonyms not documented in the material');
assert.equal(isCorrectWrittenAnswer('hipótesis fundamental',pairs[0]!.term,alias),false,
  'Related concepts cannot accidentally grade as correct');
assert.equal(isCorrectWrittenAnswer('RSE',pairs[2]!.term,allowedWrittenVariants(pairs[2]!,pairs)),true);
assert.equal(isCorrectWrittenAnswer('responsabilidad social empresaria',pairs[2]!.term,
  allowedWrittenVariants(pairs[2]!,pairs)),true);
assert.equal(isCorrectWrittenAnswer('RSE',pairs[2]!.term),false,
  'Abbreviations must be explicitly validated against the glossary');
const duplicates:PracticePair[]=[
  {term:'Planificación',definition:'Construcción de objetivos y actividades para alcanzar un resultado organizacional.',chapterTitle:null,englishTerm:'Planning'},
  {term:'Programación',definition:'Organización temporal de un conjunto de acciones y sus recursos previstos.',chapterTitle:null,englishTerm:'Planning'},
];
assert.ok(!allowedWrittenVariants(duplicates[0]!,duplicates).includes('Planning'),
 'Ambiguous translations cannot grade either concept as correct');
assert.equal(isCorrectWrittenAnswer('Planning',duplicates[0]!.term,
  allowedWrittenVariants(duplicates[0]!,duplicates)),false);
const pluralCollision:PracticePair[]=[
  {term:'Mercado',definition:'Ámbito de encuentro de oferentes y demandantes que intercambian productos y servicios.',chapterTitle:null},
  {term:'Mercados',definition:'Conjunto de espacios o segmentos en los que se organiza la demanda de una actividad.',chapterTitle:null},
];
assert.ok(!allowedWrittenVariants(pluralCollision[0]!,pluralCollision).includes('mercados'),
  'Never grade a plural form if it is another explicit concept in the same glossary');
assert.equal(isCorrectWrittenAnswer('mercados',pluralCollision[0]!.term,
  allowedWrittenVariants(pluralCollision[0]!,pluralCollision)),false);
assert.equal(groundedPracticeContrast(pairs[0]!.term,pairs[1]!.term,pairs)?.includes('Hipótesis fundamental'),true);
assert.equal(groundedPracticeContrast('Una respuesta sin definición comprobada',pairs[1]!.term,pairs),null);
assert.equal(groundedPracticeContrast(pairs[1]!.term,pairs[1]!.term,pairs),null);

const groundedFromRealIpc = groundedPracticeExplanation({
  answer:pairs[0]!.definition,
  options:[pairs[0]!.definition,pairs[1]!.definition],
  explanation:'En el material se define como el concepto principal. Las demás opciones son otros conceptos.',
},pairs);
assert.ok(groundedFromRealIpc.includes('Hipótesis auxiliar'));
assert.ok(groundedFromRealIpc.includes('Hipótesis fundamental'));
assert.ok(!groundedFromRealIpc.includes('Las demás opciones'));
const mustNotInvent=groundedPracticeExplanation({
  answer:'Una afirmación que no existe en el glosario',
  options:['Una afirmación que no existe en el glosario','Otra sin respaldo'],
  explanation:'Las demás opciones no coinciden con el documento.',
},pairs);
assert.equal(mustNotInvent,'Las demás opciones no coinciden con el documento.',
  'When the source does not support a contrast, do not invent a better explanation');
const mk=(id:number,chapter:string,level:string):PracticeQuestion=>({
 id:'p-'+id,prompt:'¿Qué opción caracteriza correctamente la situación académica '+id+'?',
 options:['Opción correcta '+id,'Respuesta equivocada '+id],
 answer:'Opción correcta '+id,
 explanation:'La primera opción refleja la relación conceptual expresada por el material.',
 pageStart:id+1,chapterTitle:chapter,level,
});
const questions=[
 mk(0,'A','recordar'),mk(1,'A','recordar'),mk(2,'A','aplicar'),
 mk(3,'B','comprender'),mk(4,'B','comprender'),mk(5,'B','recordar'),
 mk(6,'C','recordar'),mk(7,'C','aplicar'),mk(8,'C','recordar'),
];
const exam=balancedQuestions(questions,6,0);
assert.equal(exam.length,6);
assert.equal(new Set(exam.map(q=>q.id)).size,6);
assert.equal(new Set(exam.map(q=>q.chapterTitle)).size,3);
assert.ok(new Set(exam.map(q=>q.level)).size>=3,'Cover available cognitive levels, not only recall');
const caseItem={...questions[2]!,id:'case-new',prompt:'¿Cómo aplicarías este criterio a la gestión de una organización desconocida?'} as PracticeQuestion;
const mixed=selectMixedQuestions(questions,[questions[2]!,caseItem],0);
assert.equal(mixed.application?.id,'case-new','A repeated question must not appear twice in Mixto');
assert.equal(new Set([...mixed.questions.map(q=>q.id),mixed.application?.id]).size,mixed.questions.length+1);
assert.equal(mixed.application?.level,'aplicar');
const recognition=selectMixedQuestions(questions.filter(q=>q.level!=='aplicar'),[],0);
assert.equal(recognition.application,null,'Do not fabricate application when none exists');

const root=new URL('../',import.meta.url);
const file=(p:string)=>readFileSync(new URL(p,root),'utf8');
const session=file('components/dashboard/practice-session.tsx');
const page=file('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx');
assert.match(session,/allowedWrittenVariants\(item\.pair,pairs\)/,
  'Written-answer correction must use the glossary context');
assert.match(session,/groundedPracticeContrast\(response, task\.question\.answer, pairs\)/,
  'Show option-specific contrast only when source-backed');
assert.match(session,/selectMixedQuestions\(options, contexts, round\)/,
  'Mixto selection must reject duplicates');
assert.match(page,/englishTerm: item\.englishTerm \?\? null/,
  'Document-specified English equivalents must be passed to the grader');
console.log('Practice pedagogical QA passed: explicit equivalents, fair grading, contrasts, mixed uniqueness and exam levels');
