import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyIndependentTrueFalseReview } from '../lib/student-materials/practice-true-false.ts';
import { applyIndependentCaseReview } from '../lib/student-materials/practice-ai-cases.ts';
import {
  distinctApplicationCases, selectMixedQuestions,
  selectPracticePairs, allowedWrittenVariants, isCorrectWrittenAnswer,
  balancedQuestions, type PracticePair, type PracticeQuestion,
} from '../lib/student-materials/practice-modes.ts';
import { auditPracticeFlashcard } from '../lib/student-materials/practice-card-quality.ts';

const root=new URL('../',import.meta.url);
const read=(path:string)=>readFileSync(new URL(path,root),'utf8');

const source='La estrategia de penetración de mercado mantiene los productos actuales dentro de los mercados actuales y busca mejorar las ventas sin cambiar la oferta.';
const snippet={pageStart:5,sectionTitle:null,text:'Conceptos comerciales. '+source};
const q:PracticeQuestion={
  id:'v1',prompt:source,
  options:['Verdadero','Falso'],answer:'Verdadero',
  explanation:'Esta definición se corresponde con la estrategia documentada.',
  kind:'true-false-source-backed',level:'comprender',pageStart:5,
};
const accepted=applyIndependentTrueFalseReview([q],{judgments:[{
  statement:q.prompt,verdict:'entailed',evidence:source,
  explanation:'El pasaje original enuncia expresamente la misma relación entre los productos actuales y mercados actuales.',
}]},[snippet]);
assert.equal(accepted.length,1);
assert.equal(applyIndependentTrueFalseReview([q],{judgments:[{
  statement:q.prompt,verdict:'uncertain',evidence:source,
  explanation:'La afirmación deja abiertos otros sentidos que el texto del curso no permite excluir con certeza absoluta.',
}]},[snippet]).length,0,'Ambiguous true/false claims fail closed');
assert.equal(applyIndependentTrueFalseReview([q],{judgments:[{
  statement:q.prompt,verdict:'entailed',
  evidence:'Una cita fabricada que no aparece en el documento original de la materia.',
  explanation:'El análisis independiente considera que la frase podría ser verificable pero no aporta evidencia literal.',
}]},[snippet]).length,0,'Second verification also requires real PDF evidence');

const falseQ={...q,id:'f1',prompt:q.prompt.replace('penetración','diversificación'),answer:'Falso'};
assert.equal(applyIndependentTrueFalseReview([falseQ],{judgments:[{
  statement:falseQ.prompt,verdict:'uncertain',evidence:source,
  explanation:'La presencia de otro término no basta para demostrar una contradicción inequívoca entre ambas proposiciones.',
}]},[snippet]).length,0,'No false grading from lexical word changes alone');
assert.equal(applyIndependentTrueFalseReview([falseQ],{judgments:[{
  statement:falseQ.prompt,verdict:'contradicted',evidence:source,
  explanation:'La proposición confunde una estrategia que mantiene oferta y mercados con otra categoría diferente.',
}]},[snippet]).length,1,'A second independent contradiction can qualify.');

const casePrompt='Una librería vende cuadernos en su misma ciudad y organiza un descuento nuevo para aumentar las ventas de los mismos productos sin cambiar de mercado. ¿Qué estrategia representa mejor esa decisión comercial?';
const caseQ:PracticeQuestion={
  id:'ai-case-1-5',prompt:casePrompt,answer:'Penetración de mercado',
  options:['Penetración de mercado','Diversificación','Desarrollo de mercados','Desarrollo de productos'],
  explanation:'La situación corresponde a penetración de mercado porque mantiene la oferta existente dentro de un mercado donde el negocio ya vende.',
  kind:'ai-source-backed',level:'aplicar',pageStart:5,chapterTitle:'Casos',
};
const review={judgments:[{
  id:caseQ.id,verdict:'supported',selectedAnswer:caseQ.answer,evidence:source,
  explanation:'La empresa conserva los productos y el mercado de destino, por lo que mantiene los dos elementos de la penetración de mercado y no cambia de oferta.',
  alternatives:[
    {option:'Diversificación',verdict:'ruled_out',
      reason:'No modifica la oferta ni ingresa a mercados nuevos, mientras que diversificar requiere ambas novedades simultáneamente.'},
    {option:'Desarrollo de mercados',verdict:'ruled_out',
      reason:'La decisión ocurre dentro de la misma ciudad, por lo que no se incorpora un mercado nuevo como exigiría esta estrategia.'},
    {option:'Desarrollo de productos',verdict:'ruled_out',
      reason:'Los cuadernos vendidos siguen siendo los mismos, sin introducir una oferta nueva a los compradores actuales.'},
  ],
}]};
assert.equal(applyIndependentCaseReview([caseQ],review,[snippet]).length,1);
const reviewedCase=applyIndependentCaseReview([caseQ],review,[snippet])[0]!;
for (const alternative of caseQ.options.filter(option=>option!==caseQ.answer)) {
  assert.ok(reviewedCase.explanation.includes(alternative),
    'A case must explain why each named distractor is wrong.');
}
assert.equal(applyIndependentCaseReview([caseQ],{judgments:[{
  ...review.judgments[0],alternatives:review.judgments[0].alternatives!.slice(0,2),
}]},[snippet]).length,0,'Missing alternative adjudication must fail closed');
assert.equal(applyIndependentCaseReview([caseQ],{judgments:[{
  ...review.judgments[0],alternatives:[
    {...review.judgments[0].alternatives![0],verdict:'plausible'},
    ...review.judgments[0].alternatives!.slice(1),
  ],
}]},[snippet]).length,0,'A potentially correct distractor disqualifies single-answer grading');
assert.equal(applyIndependentCaseReview([caseQ],{judgments:[{
  ...review.judgments[0],selectedAnswer:'Diversificación',
}]},[snippet]).length,0,'Disagreement between solvers rejects the generated case.');
assert.equal(applyIndependentCaseReview([caseQ],{judgments:[{
  ...review.judgments[0],verdict:'ambiguous',
}]},[snippet]).length,0,'A scenario with multiple valid options is not graded.');
assert.equal(applyIndependentCaseReview([caseQ],{judgments:[
  review.judgments[0],review.judgments[0],
]},[snippet]).length,0,'Duplicate judging cannot override uncertainty.');

const ansoff:PracticePair[]=[
  {term:'Penetración de mercado',definition:'Aumentar las ventas de los productos existentes dentro de mercados actuales.',chapterTitle:'Marketing'},
  {term:'Diversificación',definition:'Ingresar a mercados nuevos incorporando productos que la organización no comercializaba.',chapterTitle:'Marketing'},
  {term:'Desarrollo de mercados',definition:'Ofrecer productos existentes a clientes de regiones todavía no atendidas por la empresa.',chapterTitle:'Marketing'},
];
assert.equal(selectPracticePairs([{
  term:'Tasa de cambio',
  definition:'La tasa de cambio es una magnitud que compara valores económicos entre períodos.',
  chapterTitle:'Economía',
}]).length,0,'Completar must not reveal its own short target phrase in the definition');
assert.equal(selectPracticePairs([...ansoff,ansoff[0]!]).length,3,
  'An identical model supplement cannot erase a valid glossary concept');
assert.equal(selectPracticePairs([...ansoff,{...ansoff[0]!,definition:'Otra definición que contradice el significado del mismo término académico.'}]).length,2,
  'A true conflicting definition still fails closed');
assert.equal(isCorrectWrittenAnswer('La penetración de mercado',ansoff[0]!.term,
  allowedWrittenVariants(ansoff[0]!,ansoff)),true);
assert.equal(isCorrectWrittenAnswer('Diversificación',ansoff[0]!.term,
  allowedWrittenVariants(ansoff[0]!,ansoff)),false,
  'Related concepts cannot be treated as equivalent open answers.');

const qs:PracticeQuestion[]=Array.from({length:6},(_,i)=>({
  id:'q'+i, prompt:'¿Qué cambio evidencia la decisión de la empresa comercial número '+i+'?',
  options:['Productos actuales','Productos nuevos','Mercados actuales','Mercados nuevos'],
  answer:'Productos actuales',explanation:'La definición distingue la conservación de productos existentes y el cambio en el mercado objetivo.',
  level:i%2?'recordar':'comprender',pageStart:i+1,
}));
const cases=[{...caseQ,prompt:caseQ.prompt+'\n\n¿Es aplicable esta estrategia de crecimiento?'}];
assert.equal(distinctApplicationCases(cases).length,1);
const mixed=selectMixedQuestions(qs,cases);
assert.equal(mixed.questions.length,5);
assert.equal(mixed.application?.id,caseQ.id);
const withoutCase=selectMixedQuestions(qs,[]);
assert.equal(withoutCase.application,null);
assert.equal(balancedQuestions(qs,10).length,6,'Exam never pads with duplicate questions');

const weak={
  front:'¿Qué significa un documento universitario?',
  back:'Carrera a la que pertenece el material de estudio.',
  reference:{pageStart:2,excerpt:'Materia y carrera correspondiente al estudiante durante el curso universitario.'},
};
assert.equal(auditPracticeFlashcard(weak).approved,false);
const good={
  front:'¿Qué estrategia mantiene productos y mercados existentes?',
  back:'La penetración de mercado busca aumentar la venta de productos actuales en el mercado actual.',
  reference:{pageStart:5,excerpt:source},
};
assert.equal(auditPracticeFlashcard(good).approved,true);
const flashWrapper=read('components/dashboard/practice-flashcard-session.tsx');
assert.match(flashWrapper,/auditPracticeFlashcard\(card\)\.approved/);
assert.match(flashWrapper,/persistentCardCount=\{cards\.length\}/);
const flashBase=read('components/student-material-flashcards.tsx');
assert.match(flashBase,/cardIndex < persistenceLimit/);

const session=read('components/dashboard/practice-session.tsx');
assert.match(session,/contexts\.length < 1/);
assert.match(session,/distinctApplicationCases\(contexts\)\.length >= 1/);
assert.match(session,/selectBalancedTrueFalse\(trueFalsePool, reviewLength === 'rapido' \? 6 : 8, round\)/);
assert.match(session,/MIN_CASES_PER_PRACTICE/);
// Cost reductions must preserve the same independent review gates and
// avoid new Gemini requests when canonical Mixto concepts already suffice.
const supplementEndpoint=read('app/api/practice/supplement/route.ts');
assert.match(supplementEndpoint,/body\.mode === 'mixto' \? 2 : 6/);
assert.match(supplementEndpoint,/local\.length >= minimumPairs/);
const cEndpoint=read('app/api/practice/cases/route.ts');
const tfEndpoint=read('app/api/practice/true-false/route.ts');
assert.match(cEndpoint,/applyIndependentCaseReview\(candidates,reviewed,sources\)/);
assert.match(cEndpoint,/const reviewSources = sources\.filter/);
assert.match(cEndpoint,/const reviewSourceInput = reviewSources\.map/);
assert.match(cEndpoint,/'FUENTES: '\+reviewSourceInput/);
assert.match(tfEndpoint,/const adjudicationSources = fragments\.filter/);
assert.match(tfEndpoint,/const adjudicationEvidence = adjudicationSources\.map/);
assert.match(tfEndpoint,/'MATERIAL: '\+adjudicationEvidence/);

assert.match(tfEndpoint,/applyIndependentTrueFalseReview\(candidates,judgments,fragments\)/);
for(const endpoint of [cEndpoint,tfEndpoint]){
  assert.match(endpoint,/responseSchema/);
  assert.match(endpoint,/enforceStrictRateLimit/);
}
console.log('Pedagogical hardening: independent semantic review, mixed application, fair exact-term grading, QA flashcards and 6-item exam passed.');
