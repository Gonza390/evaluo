import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  chooseDocumentedDistractors, explainDocumentedOptions,
  mayBeEquivalentOptions,
} from '../lib/student-materials/practice-option-evidence.ts';
import {
  groundedPracticeExplanation, hasAmbiguousDistractors,
  qualifiedQuestions, type PracticePair, type PracticeQuestion,
} from '../lib/student-materials/practice-modes.ts';

const correct={option:'La penetración de mercado conserva los productos existentes y los mercados actuales.',
 label:'Penetración de mercado',
 evidence:'La penetración de mercado conserva los productos existentes y los mercados actuales.'};
const candidates=[
 {option:'La diversificación introduce productos nuevos para mercados nuevos.',
  label:'Diversificación',evidence:'La diversificación introduce productos nuevos para mercados nuevos.'},
 {option:'El desarrollo de productos incorpora productos nuevos en los mercados actuales.',
  label:'Desarrollo de productos',evidence:'El desarrollo de productos incorpora productos nuevos en los mercados actuales.'},
 {option:'El desarrollo de mercados lleva los productos existentes hacia mercados nuevos.',
  label:'Desarrollo de mercados',evidence:'El desarrollo de mercados lleva los productos existentes hacia mercados nuevos.'},
];
assert.equal(mayBeEquivalentOptions(correct.option,correct.option),true);
assert.equal(mayBeEquivalentOptions(correct.option,correct.option+' Es una práctica comercial.'),true);
assert.equal(mayBeEquivalentOptions(correct.option,candidates[0]!.option),false);
assert.deepEqual(chooseDocumentedDistractors(correct,candidates).map(x=>x.label),
  ['Diversificación','Desarrollo de productos','Desarrollo de mercados']);
assert.equal(chooseDocumentedDistractors(correct,[{...correct,label:'Opción duplicada'},
  {option:'   ',label:'Desconocida',evidence:'Otro tema diferente pero sin una opción.'}]).length,0,
  'Do not pad exercises with unverifiable or duplicate options');
const equivalent=[
 {option:correct.option+' En este mismo período.',label:'La misma definición',
  evidence:correct.evidence+' En este mismo período.'},
 ...candidates,
];
assert.equal(chooseDocumentedDistractors(correct,equivalent)[0]!.label,'Diversificación');
const explanations=explainDocumentedOptions('Penetración de mercado',correct,candidates);
for(const label of candidates.map(c=>c.label))
 assert.ok(explanations.includes('«'+label+'»'),'Every wrong choice must be explained: '+label);
assert.ok(explanations.includes('mercados actuales'));
assert.ok(explanations.includes('mercados nuevos'));

const pairs:PracticePair[]=[
 {term:correct.label,definition:correct.option,chapterTitle:'Marketing'},
 ...candidates.map(q=>({term:q.label,definition:q.option,chapterTitle:'Marketing'})),
];
const question:PracticeQuestion={
 id:'source-example',prompt:'¿Qué significa «Penetración de mercado»?',
 options:[correct.option,...candidates.map(x=>x.option)],
 answer:correct.option,
 explanation:'La penetración se caracteriza por la misma definición del texto.',
 level:'recordar',kind:'concept',
};
assert.equal(hasAmbiguousDistractors(question),false);
assert.equal(qualifiedQuestions([question]).length,1);
const improved=groundedPracticeExplanation(question,pairs);
for(const {label} of candidates)
 assert.ok(improved.includes('«'+label+'»'),'Historical distractor needs grounded feedback: '+label);
const noMap=groundedPracticeExplanation(question,pairs.slice(0,3));
assert.equal(noMap,question.explanation,'Missing source meaning cannot be invented');
const ambiguous=[...candidates,{option:correct.option,label:'Otro nombre',evidence:correct.evidence}];
assert.equal(chooseDocumentedDistractors(correct,ambiguous).length,3);

const pedagogy=readFileSync(new URL('../lib/student-materials/pedagogy.ts',import.meta.url),'utf8');
const matches=pedagogy.match(/chooseDocumentedDistractors\(/g)??[];
assert.ok(matches.length>=6,'Use document-backed options across multiple generator types');
assert.match(pedagogy,/explainDocumentedOptions\(concept\.term,correctEvidence,distractors\)/);
assert.match(pedagogy,/explainDocumentedOptions\(classification\.title,correctEvidence,distractors\)/);
assert.match(pedagogy,/explainDocumentedOptions\(process\.title,correctEvidence,distractors\)/);
console.log('MCQ quality: source-supported distractors, no equivalents, individual explanations, legacy fallback passed.');
