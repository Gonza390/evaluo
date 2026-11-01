import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MIN_CASES_PER_PRACTICE, balancedQuestions, qualifiedQuestions,
  selectPracticePairs, type PracticePair, type PracticeQuestion,
} from '../lib/student-materials/practice-modes.ts';

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

const session = read('components/dashboard/practice-session.tsx');
assert.match(session,/rotate\(pairs, round \* 6\)\.slice\(0, 6\)/,
  'Matching must show six pairs, not the old five.');
assert.match(session,/mode === 'unir' \? exercisePairs\.length >= MIN_CASES_PER_PRACTICE/);
assert.match(session,/mode === 'completar' \? tasks\.length >= MIN_CASES_PER_PRACTICE/);
assert.match(session,/mode === 'mixto' \? tasks\.length >= MIN_CASES_PER_PRACTICE/);
assert.match(session,/mode === 'opciones'/);
assert.match(session,/balancedQuestions\(options, 8, round\)/);
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
