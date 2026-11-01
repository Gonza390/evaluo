import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MIN_CASES_PER_PRACTICE, balancedQuestions, qualifiedQuestions,
  selectPracticePairs, type PracticePair, type PracticeQuestion,
} from '../lib/student-materials/practice-modes.ts';
import { sourceVerifiedPairs } from '../lib/student-materials/practice-source-pairs.ts';

const read = (path: string) =>
  readFileSync(new URL('../' + path, import.meta.url), 'utf8');

assert.equal(MIN_CASES_PER_PRACTICE, 6);
const pairs:PracticePair[] = Array.from({length:6},(_,i)=>({
  term:'Término académico '+(i+1),
  definition:['Identifica la secuencia de observaciones y permite clasificar tareas.',
    'Relaciona las variables de una hipótesis con su registro empírico.',
    'Contrasta resultados medidos con los objetivos establecidos inicialmente.',
    'Interpreta las restricciones de recursos de una organización educativa.',
    'Describe la distribución de responsabilidades entre distintas áreas.',
    'Evalúa la correspondencia entre los hallazgos y las conclusiones.'][i]!,
  chapterTitle:'Unidad A',
}));
assert.equal(selectPracticePairs(pairs).length,6,
  'Six independent verified glossary pairs must remain available for matching and fill-in.');
const questions:PracticeQuestion[] = Array.from({length:6},(_,i)=>({
  id:'q-'+i,
  prompt:'¿Qué alternativa explica correctamente el criterio académico número '+i+'?',
  options:['Criterio principal '+i,'Alternativa incorrecta '+i,'Otro criterio '+i],
  answer:'Criterio principal '+i,
  explanation:'La primera alternativa aplica el criterio de la unidad correspondiente de forma precisa.',
  level:'comprender',kind:'concept',pageStart:i+1,chapterTitle:'Unidad B',
}));
assert.equal(qualifiedQuestions(questions).length,6);
assert.equal(balancedQuestions(questions,8).length,6);
assert.equal(balancedQuestions(questions,10).length,6);

const quote='Hipótesis auxiliar: Supuesto adicional que acompaña la contrastación de una hipótesis principal para derivar predicciones observables.';
const term={term:'Hipótesis auxiliar',
  definition:'Supuesto adicional que acompaña la contrastación de una hipótesis principal para derivar predicciones observables.',
  evidence:quote,page:12};
assert.equal(sourceVerifiedPairs([term],[{
  text:quote+' En el programa se distingue de la hipótesis principal.',
  pageStart:12,sectionTitle:null,
}]).length,1,'A literal and correctly located PDF definition is accepted.');
assert.equal(sourceVerifiedPairs([{...term,page:11}],[{
  text:quote,pageStart:12,sectionTitle:null,
}]).length,0,'A false PDF page must be rejected.');
assert.equal(sourceVerifiedPairs([{...term,evidence:'Una cita que no existe en el archivo.'}],[{
  text:quote,pageStart:12,sectionTitle:null,
}]).length,0,'Unsourced definitions must be rejected.');
assert.equal(sourceVerifiedPairs([{...term,page:undefined,sectionTitle:'Unidad 2'}],[{
  text:quote,pageStart:null,sectionTitle:'Unidad 2',
}]).length,1,'DOCX uses the exact section rather than a fabricated page.');
assert.equal(sourceVerifiedPairs([{...term,page:undefined,sectionTitle:'Unidad 1'}],[{
  text:quote,pageStart:null,sectionTitle:'Unidad 2',
}]).length,0,'Unrelated DOCX headings cannot support answers.');

const session = read('components/dashboard/practice-session.tsx');
assert.match(session,/rotate\(pairs, round \* 6\)\.slice\(0, 6\)/,
  'Matching must show six pairs, not the old five.');
assert.match(session,/mode === 'unir' \? exercisePairs\.length >= MIN_CASES_PER_PRACTICE/);
assert.match(session,/mode === 'completar' \? tasks\.length >= MIN_CASES_PER_PRACTICE/);
assert.match(session,/mode === 'mixto' \? tasks\.length >= MIN_CASES_PER_PRACTICE/);
assert.match(session,/mode === 'opciones'/);
assert.match(session,/balancedQuestions\(trueFalsePool, 8, round\)/);
assert.match(session,/sufficientTrueFalse\(trueFalsePool, MIN_CASES_PER_PRACTICE\)/);
assert.match(session,/balancedQuestions\(options, 10, round\)/);
assert.match(session,/fetch\('\/api\/practice\/supplement'/);
assert.match(session,/fetch\('\/api\/practice\/cases'/);
assert.match(session,/contexts\.length >= MIN_CASES_PER_PRACTICE/);
const flashcards=read('components/dashboard/practice-flashcard-session.tsx');
assert.match(flashcards,/combined\.length < MIN_CASES_PER_PRACTICE/);
assert.match(flashcards,/StudentMaterialFlashcards/);

const picker=read('components/dashboard/practice-mode-picker.tsx');
assert.match(picker,/\/dashboard\/practicar\/\$\{materialId\}\/flashcards/);
assert.match(picker,/\/dashboard\/practicar\/\$\{materialId\}\/opciones/);
const page=read('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx');
assert.match(page,/mode === 'flashcards'/);
assert.match(page,/allowOnDemandRegeneration: false/);
const supplement=read('app/api/practice/supplement/route.ts');
assert.match(supplement,/export async function POST\(/);
assert.match(supplement,/\.eq\('user_id', user\.id\)/);
assert.match(supplement,/enforceStrictRateLimit\(/);
assert.doesNotMatch(supplement,/from\('student_material_practice_banks'\)/);
const cases=read('app/api/practice/cases/route.ts');
assert.match(cases,/verifyGeneratedPracticeCases\(/);
assert.match(cases,/enforceStrictRateLimit\(/);
assert.match(read('app/api/practice/session/route.ts'),/'opciones'/);
const processing=read('lib/student-materials/processing-service.ts');
assert.doesNotMatch(processing,/\/api\/practice\/supplement|\/api\/practice\/cases|\/api\/practice\/prepare/,
  'Upload / first PDF or DOCX ingestion must never initiate extra practice generation.');
console.log('All seven available Practicar cards enforce six source-backed exercises on explicit start; no upload AI fanout.');
