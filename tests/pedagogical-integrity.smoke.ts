import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isRecognitionPresentedAsHigherOrder,
  sanitizePedagogicalArtifacts,
  unsafeModelAnswerReason,
  unsafeFlashcardReason,
} from '../lib/student-materials/pedagogical-integrity.ts';
import {
  getTopicStudyResources, tagGlossaryChapters,
} from '../lib/student-materials/topic-study-resources.ts';
import { explainWrongOption } from '../lib/student-materials/answer-evidence.ts';
import type { PedagogicalArtifacts, StudyQuestion } from '../lib/student-materials/pedagogy.ts';

const sections = [
  { title: '1. Epistemología', body: 'La epistemología reflexiona sobre la ciencia. Doxa se distingue de episteme.' },
  { title: '2. Causalidad', body: 'Hume discute causalidad. Una causa común puede provocar dos efectos sin que uno cause al otro. La conjunción constante no es conexión necesaria.' },
];
const ref = { pageStart: 2, pageEnd: 2, sectionTitle: 'Causalidad', excerpt: sections[1]!.body };
function open(overrides: Partial<StudyQuestion>): StudyQuestion {
  return {
    id: 'old',
    type: 'open',
    kind: 'confusion',
    level: 'comprender',
    topic: 'Confusión frecuente',
    prompt: 'Aclará con tus palabras la confusión entre los efectos de una causa común y la causalidad directa.',
    options: [],
    answer: 'La distinción clave es esta: “efectos de una causa común” Conocimiento institucionalizado que cumple los requisitos de una comunidad científica. En cambio, “causalidad directa” Caracteriza a las teorías como conjuntos de enunciados.',
    explanation: 'Explicá la diferencia.',
    reference: ref,
    ...overrides,
  };
}
const wrongCausal = open({});
assert.ok(['contrast_not_in_source', 'contrast_answer_not_grounded'].includes(unsafeModelAnswerReason(wrongCausal, sections) ?? ''));
const repeatedDefinition = open({
  id: 'repeat',
  answer: 'La distinción clave es esta: “validez deductiva” Premisas verdaderas y conclusión falsa no son compatibles. En cambio, “validez inductiva” Premisas verdaderas y conclusión falsa no son compatibles.',
});
assert.equal(unsafeModelAnswerReason(repeatedDefinition, sections), 'contrast_repeats_same_definition');
const foreignSection = open({
  id: 'foreign',
  type: 'open',
  kind: 'section',
  chapterTitle: sections[1]!.title,
  topic: sections[1]!.title,
  answer: 'La idea central es causalidad. Un concepto clave es “Teoría económica”: teoría social.',
});
assert.equal(unsafeModelAnswerReason(foreignSection, sections), 'section_answer_contains_foreign_concepts');
const incorrectCard = {
  front: '¿Cómo distinguís causa común de causalidad directa según el material?',
  back: 'Confundir los efectos de una causa común con causalidad directa.',
  level: 'comprender' as const,
  reference: ref,
};
assert.equal(unsafeFlashcardReason(incorrectCard), 'flashcard_repeats_misconception');
const safeConcept: StudyQuestion = {
  id: 'epistemology',
  type: 'multiple_choice',
  level: 'recordar',
  kind: 'concept',
  topic: 'Epistemología',
  prompt: '¿Qué significa Epistemología?',
  options: ['Reflexión racional y sistemática sobre la ciencia.', 'Conocimiento institucionalizado.', 'Doxa.'],
  answer: 'Reflexión racional y sistemática sobre la ciencia.',
  explanation: 'La epistemología reflexiona sobre la ciencia.',
  reference: { ...ref, pageStart: 1, sectionTitle: sections[0]!.title, excerpt: sections[0]!.body },
};
const distractor: StudyQuestion = {
  ...safeConcept,
  id: 'science',
  topic: 'Ciencia',
  prompt: '¿Qué es Ciencia?',
  answer: 'Conocimiento institucionalizado.',
  options: ['Conocimiento institucionalizado.', 'Doxa.', 'Episteme.'],
};
const artifacts: PedagogicalArtifacts = {
  questions: [wrongCausal, repeatedDefinition, foreignSection, safeConcept, distractor],
  flashcards: [incorrectCard],
  miniExamQuestionIds: ['old', 'repeat', 'foreign', 'epistemology', 'science'],
  coverage: { conceptsUsed: 1, sectionsUsed: 2, referencedItems: 6, totalItems: 6 },
};
const sanitized = sanitizePedagogicalArtifacts(artifacts, sections);
assert.deepEqual(sanitized.questions.map(x => x.id), ['epistemology', 'science']);
assert.equal(sanitized.flashcards.length, 0);
assert.deepEqual(sanitized.miniExamQuestionIds, ['epistemology', 'science']);
assert.equal(sanitized.integrity?.rejectedQuestions, 3);
assert.equal(sanitized.integrity?.rejectedFlashcards, 1);
assert.equal(isRecognitionPresentedAsHigherOrder({ ...safeConcept, level: 'comprender', prompt: '¿Cuál de estas afirmaciones representa mejor Epistemología?' }), true);
assert.equal(isRecognitionPresentedAsHigherOrder(safeConcept), false);
assert.match(
  explainWrongOption(safeConcept, 'Conocimiento institucionalizado.', artifacts),
  /corresponde|definición de “Ciencia”/
);
const glossary = [
  { term: 'Epistemología', definition: 'Reflexión sobre la ciencia', context: 'Concepto del material', importance: 'alta' as const },
  { term: 'Causa común', definition: 'Dos efectos pueden compartir una causa', context: 'Concepto del material', importance: 'alta' as const },
  { term: 'Doxa', definition: 'Conocimiento no fundado', context: 'Concepto del material', importance: 'alta' as const },
];
const tagged = tagGlossaryChapters(glossary, sections);
assert.equal(tagged[0]?.chapterTitle, sections[0]?.title);
assert.equal(tagged[1]?.chapterTitle, sections[1]?.title);
assert.equal(getTopicStudyResources(sections, tagged, [], 0).concepts.some(x => x.term === 'Epistemología'), true);
const qualitySource = readFileSync('lib/student-materials/quality.ts', 'utf8');
assert.match(qualitySource, /unsafe_model_answers_rejected/);
assert.match(qualitySource, /PEDAGOGICAL_QUALITY_REPORT_VERSION = 5/);
console.log('pedagogical-integrity.smoke: OK');
