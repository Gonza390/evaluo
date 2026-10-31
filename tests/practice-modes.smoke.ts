import assert from 'node:assert/strict';
import {
  balancedQuestions, buildSourceBackedCases, hasAmbiguousDistractors, isCorrectWrittenAnswer,
  qualifiedQuestions, selectPracticePairs, type PracticeQuestion,
} from '../lib/student-materials/practice-modes.ts';
import type { CanonicalPedagogicalModel } from '../lib/student-materials/types.ts';
import { verifyGeneratedPracticeCases } from '../lib/student-materials/practice-ai-cases.ts';

const pairs = [
  { term: 'Hipótesis fundamental', definition: 'Enunciado general que dirige una investigación y se somete a prueba.', chapterTitle: null },
  { term: 'Hipótesis auxiliar', definition: 'Supuesto complementario necesario para contrastar una hipótesis principal.', chapterTitle: null },
  { term: 'Definición repetida A', definition: 'Definición idéntica que hace imposible evaluar una unión con certeza.', chapterTitle: null },
  { term: 'Definición repetida B', definition: 'Definición idéntica que hace imposible evaluar una unión con certeza.', chapterTitle: null },
];
const noisyPairs = selectPracticePairs([
  {term:'Universidad Siglo 21',definition:'Institución universitaria que imparte la materia.',chapterTitle:null},
  {term:'Carrera de Marketing',definition:'Carrera a la que pertenece el material de estudio.',chapterTitle:null},
  {term:'Estandarización',definition:'La estandarización ayuda a que el proceso se repita de manera consistente.',chapterTitle:null},
  {term:'Hipótesis auxiliar ↔ Consecuencia observacional',definition:'Vínculo que conecta las condiciones del experimento con una observación esperada.',chapterTitle:null},
  {term:'Falsacionismo',definition:'Corriente que exige falsabilidad de los enunciados científicos empíricos.',chapterTitle:null},
]);
assert.equal(noisyPairs.length,1,'No metadata or self-revealing and compound answers in matching or cloze.');
assert.equal(noisyPairs[0]?.term,'Falsacionismo');
const selected = selectPracticePairs(pairs);
assert.equal(selected.length, 2, 'Matching must eliminate ambiguous duplicate definitions.');
assert.equal(isCorrectWrittenAnswer('hipotesis fundamental', 'Hipótesis fundamental'), true);
assert.equal(isCorrectWrittenAnswer('la hipótesis fundamental', 'Hipótesis fundamental'), true);
assert.equal(isCorrectWrittenAnswer('Hipótesis auxiliar', 'Hipótesis fundamental'), false);
const questions: PracticeQuestion[] = Array.from({ length: 9 }, (_, i) => ({
  id: 'question-' + i, prompt: 'Pregunta con explicación suficiente número ' + i + '?',
  options: ['Opción correcta ' + i, 'Otra opción ' + i], answer: 'Opción correcta ' + i,
  explanation: 'La respuesta deriva de una referencia de ejemplo inequívoca.',
  level: 'comprender', pageStart: 1, chapterTitle: 'Tema ' + Math.floor(i / 3),
}));
assert.equal(qualifiedQuestions(questions).length, 9);
const exam = balancedQuestions(questions, 6);
assert.equal(exam.length, 6);
assert.equal(new Set(exam.map(q => q.chapterTitle)).size, 3, 'Exams should cover all chapters.');
const model = {
  classifications: [
    { title: 'Estrategias de la matriz', pageReferences: [7],
      items: [
        'Penetración de mercado: productos existentes en el mercado actual',
        'Desarrollo de mercado: productos existentes en un mercado nuevo',
        'Diversificación: productos nuevos en mercados nuevos',
      ] },
    { title: 'Lista sin criterios explícitos', pageReferences: [2],
      items: ['Teoría A', 'Teoría B', 'Teoría C'] },
  ],
} as unknown as CanonicalPedagogicalModel;
const cases = buildSourceBackedCases(model);
assert.equal(cases.length, 3);
assert.equal(cases[0]?.pageStart, 7);
assert.equal(cases[0]?.level, 'comprender', 'Source matching is not evidence of transfer.');
assert.ok(cases.every(q => q.options.includes(q.answer)));
console.log('Practice modes: pedagogical constraints and matching smoke passed');

const evidence = 'La hipótesis fundamental es un enunciado general que debe ser sometido a prueba.';
const source = [{ pageStart: 3, text: 'Aclaración: ' + evidence + ' Los contrastes requieren hipótesis auxiliares.' }];
const generated = { cases: [{
  scenario: 'Una investigadora presenta una afirmación general que necesita contrastar con datos empíricos obtenidos de un estudio concreto.',
  prompt: '¿Qué tipo de hipótesis representa esta afirmación?',
  options: ['Hipótesis fundamental', 'Hipótesis auxiliar', 'Consecuencia observacional', 'Ley'],
  answer: 'Hipótesis fundamental',
  explanation: 'El material establece que la hipótesis fundamental es un enunciado general sometido a prueba.',
  evidence, page: 3,
}] };
const terms = generated.cases[0]!.options;
assert.equal(verifyGeneratedPracticeCases(generated, source, terms).length, 1);
assert.equal(verifyGeneratedPracticeCases({cases:[{...generated.cases[0],evidence:'Cita inventada que el documento nunca contiene.'}]},source,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...generated.cases[0],page:9}]},source,terms).length,0);
assert.equal(verifyGeneratedPracticeCases({cases:[{...generated.cases[0],scenario:generated.cases[0].scenario+' Se trata de una hipótesis fundamental.'}]},source,terms).length,0,'A scenario cannot reveal its own answer.');
assert.equal(verifyGeneratedPracticeCases({cases:[{...generated.cases[0],prompt:'¿Qué significa una hipótesis fundamental dentro del texto?'}]},source,terms).length,0,'Definition questions are not application cases.');
assert.equal(verifyGeneratedPracticeCases({cases:[{...generated.cases[0],explanation:'Esto se sabe porque la definición propuesta encaja con la pregunta y por tanto es verdadera.'}]},source,terms).length,0,'Feedback must justify the actual correct concept.');
console.log('AI case source-verification smoke passed');

const ambiguous: PracticeQuestion = {
  id: 'ambiguous-distractors',
  prompt: '¿Qué representa una premisa valorativa implícita?',
  options: [
    'Juicio de valor necesario en las premisas para respaldar una conclusión normativa y evitar la falacia naturalista.',
    'Juicio de valor necesario en las premisas para evitar el salto de los hechos a una norma.',
  ],
  answer: 'Juicio de valor necesario en las premisas para respaldar una conclusión normativa y evitar la falacia naturalista.',
  explanation: 'Los dos distractores se parecen demasiado para evaluar con una única respuesta inequívoca.',
  level: 'recordar', pageStart: 2,
};
assert.equal(hasAmbiguousDistractors(ambiguous), true);
assert.equal(qualifiedQuestions([ambiguous]).length, 0);

const realIpcParaphrases: PracticeQuestion[] = [{
  id:'ipc-effect-matilda',
  prompt:'¿Qué significa el efecto Matilda en la ciencia?',
  answer:'Manifestación de omisiones selectivas donde el trabajo de una científica es omitido o atribuido a un varón cercano.',
  options:[
    'Manifestación de omisiones selectivas donde el trabajo de una científica es omitido o atribuido a un varón cercano.',
    'Trabajo de una científica omitido o atribuido a un varón cercano, invisibilizando sus aportes.',
    'Participación de mujeres en áreas interdisciplinarias sin omisiones de atribución.',
  ],
  explanation:'La atribución de descubrimientos debe considerar a quien los produjo.',
  level:'recordar',pageStart:22,
},{
  id:'ipc-explanation',
  prompt:'¿Cuál es la relación entre explicación nomológico-deductiva y leyes universales?',
  answer:'El explanans de una explicación nomológico deductiva debe contener por lo menos una ley universal.',
  options:[
    'El explanans de una explicación nomológico deductiva debe contener por lo menos una ley universal.',
    'El explanans de una explicación nomológico-deductiva debe contener al menos una ley universal.',
    'El explanans puede prescindir completamente de enunciados generales.',
  ],
  explanation:'Una ley universal forma parte de las premisas necesarias en esa explicación.',
  level:'comprender',pageStart:17,
}];
assert.equal(qualifiedQuestions(realIpcParaphrases).length,0,
  'Real IPC near-paraphrases must not grade one of two equivalent answers as wrong');
const negatedButDistinct: PracticeQuestion = {
  ...realIpcParaphrases[1]!,id:'negated-distinction',
  options:[
    realIpcParaphrases[1]!.answer,
    'La explicación nomológico deductiva NO requiere ninguna ley universal, por lo que depende solo de observaciones.',
    'Un conjunto de definiciones nunca puede cumplir funciones explicativas.',
  ],
};
assert.equal(qualifiedQuestions([negatedButDistinct]).length,1,
 'Clearly distinct alternatives must remain available for practice');

const byPage = Array.from({ length: 16 }, (_, i): PracticeQuestion => ({
  ...questions[i % questions.length]!, id: 'pages-' + i,
  prompt: 'Pregunta con fuente y página repartida número ' + i + '?',
  chapterTitle: null, kind: 'concept', pageStart: 1 + i * 3,
}));
const pageExam = balancedQuestions(byPage, 8);
assert.equal(pageExam.length, 8);
assert.ok(new Set(pageExam.map(q => Math.floor(((q.pageStart ?? 1) - 1) / 12))).size >= 3,
  'When chapter tags are missing, sample different document segments.');
const fs = await import('node:fs');
const url = await import('node:url');
const root = new URL('../', import.meta.url);
const sourceFile = (path: string) => fs.readFileSync(new URL(path, root), 'utf8');
const picker = sourceFile('components/dashboard/practice-mode-picker.tsx');
const workspace = sourceFile('components/dashboard/practice-session.tsx');
const route = sourceFile('app/(es)/dashboard/practicar/[id]/[mode]/page.tsx');
const aiRoute = sourceFile('app/api/practice/cases/route.ts');
for (const mode of ['unir','completar','casos','mixto','simulacro']) {
  assert.ok(picker.includes('/dashboard/practicar/${materialId}/'+mode), 'Picker must navigate to '+mode);
  assert.ok(route.includes("'"+mode+"'"), 'Page must accept '+mode);
}
assert.match(picker, /title !== 'Con tus palabras'/);
assert.match(route, /\.eq\('user_id', user\.id\)/, 'Only owners may access practice PDFs');
assert.match(aiRoute, /enforceStrictRateLimit/, 'AI generation must be rate limited');
assert.match(workspace, /Comprobar respuesta/, 'Show feedback for formative practice');
assert.match(workspace, /Entregar examen/, 'Finish exam explicitly');
assert.match(workspace, /setSecondsLeft/, 'Have a working countdown');
assert.match(workspace, /verifiedChapterCount/, 'Do not imply guaranteed topic coverage');
assert.match(workspace, /Vinculado/, 'A linked association must not display a correct check prematurely');
console.log('Practice UX navigation, security and integrity checks passed');
