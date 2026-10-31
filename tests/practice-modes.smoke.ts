import assert from 'node:assert/strict';
import {
  balancedQuestions, buildSourceBackedCases, isCorrectWrittenAnswer,
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
console.log('AI case source-verification smoke passed');
