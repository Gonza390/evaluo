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
import { buildGroundedErrorContrast } from '../lib/student-materials/error-contrast.ts';
import type { PedagogicalArtifacts, StudyQuestion } from '../lib/student-materials/pedagogy.ts';
import { buildPedagogicalArtifacts } from '../lib/student-materials/pedagogy-v2.ts';
import type { StudentMaterialSummary } from '../lib/student-materials/types.ts';

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
const wrongComparison = open({
  id: 'level-comparison',
  kind: 'relationship',
  topic: 'niveles de enunciados',
  prompt: 'Compará el nivel 1 con el nivel 3 de enunciados.',
  answer: '“nivel 1” se caracteriza en el material por: Observaciones empíricas particulares. En cambio, “nivel 3” se caracteriza por: Es un acto de habla con entonación propia.',
});
assert.equal(unsafeModelAnswerReason(wrongComparison, sections), 'comparison_not_supported_by_source');
// Segunda auditoría real: Administración, módulos 3 y 4 (v5).
const legacyConfusion = open({
  id: 'admin-confusion',
  kind: 'confusion',
  prompt: 'Aclará con tus palabras esta confusión: “Confundir vender mas con crecer saludablemente, ignorando la capacidad estructural y de respuesta.”',
  answer: 'Confundir vender mas con crecer saludablemente, ignorando la capacidad estructural y de respuesta.',
});
assert.equal(
  unsafeModelAnswerReason(legacyConfusion, sections),
  'confusion_answer_repeats_misconception'
);
const excerptCopied = '●Abrirse a la posibilidad de explorar nuevos mercados o lanzar nuevos productos o servicios para captar oportunidades de crecimiento.';
const legacyComparison = open({
  id: 'admin-comparison',
  kind: 'relationship',
  prompt: 'Compará las estrategias de crecimiento e integración según el material.',
  answer: excerptCopied,
  reference: { ...ref, excerpt: excerptCopied },
});
assert.equal(
  unsafeModelAnswerReason(legacyComparison, sections),
  'comparison_copies_source_without_contrast'
);
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
assert.match(
  buildGroundedErrorContrast(
    'Conocimiento institucionalizado.',
    'Reflexión racional y sistemática sobre la ciencia.',
    [
      { term: 'Ciencia', definition: 'Conocimiento institucionalizado.', context: '', importance: 'alta' },
      { term: 'Epistemología', definition: 'Reflexión racional y sistemática sobre la ciencia.', context: '', importance: 'alta' },
    ]
  ) ?? '',
  /definición de “Ciencia”.*corresponde a “Epistemología”/u
);
assert.equal(buildGroundedErrorContrast('Conocimiento institucionalizado.', 'Desconocido', glossary), null);
const tagged = tagGlossaryChapters(glossary, sections);
assert.equal(tagged[0]?.chapterTitle, sections[0]?.title);
assert.equal(tagged[1]?.chapterTitle, sections[1]?.title);
assert.equal(getTopicStudyResources(sections, tagged, [], 0).concepts.some(x => x.term === 'Epistemología'), true);
// Contraprueba: una pregunta abierta válida debe sobrevivir. Las respuestas
// proceden del mismo párrafo, sin interpolar teorías de páginas cercanas.
const sectionSummary: StudentMaterialSummary = {
  shortSummary: 'Síntesis conceptual de ciencias y argumentación',
  keyPoints: ['Las hipótesis pueden contrastarse', 'Distinguir un argumento de su evidencia'],
  status: 'ready',
  hasContent: true,
  provider: 'test',
  errorMessage: null,
  sourceChunksCount: 2,
  sections: [
    { title: '1. Argumentación científica', body: '### 1.1 Premisas y conclusiones\nLas premisas son proposiciones ofrecidas en apoyo de una conclusión. Para comprender un argumento es necesario identificar qué se sostiene y qué razones se ofrecen. Una conclusión no queda automáticamente demostrada por el mero hecho de estar enunciada.\n\n### 1.2 Objeciones\nSe pueden examinar las premisas de un argumento para detectar dificultades.' },
    { title: '2. Contrastación empírica', body: '### 2.1 Hipótesis y predicción\nLa contrastación empírica requiere formular predicciones derivadas de una hipótesis y contrastarlas con observaciones. Si la predicción falla deben examinarse la hipótesis y los supuestos auxiliares antes de explicar la evidencia observada.\n\n### 2.2 Supuestos\nLos supuestos auxiliares condicionan lo que la hipótesis permite anticipar.' },
  ],
};
const sectionChunks = sectionSummary.sections.map((section, i) => ({
  text: section.body,
  pageStart: i + 1,
  pageEnd: i + 1,
  sectionTitle: section.title,
  excerpt: '',
}));
const candidateBank = buildPedagogicalArtifacts({
  summary: sectionSummary, glossary: [], chunks: sectionChunks,
});
const openStudyQuestions = candidateBank.questions.filter(q => q.type === 'open');
assert.equal(openStudyQuestions.length, 2, 'Debe conservar preguntas abiertas fundamentadas.');
assert.ok(openStudyQuestions.every(q => unsafeModelAnswerReason(q, sectionSummary.sections) === null));
assert.ok(openStudyQuestions.every(q => q.reference.pageStart !== null));
assert.equal(new Set(openStudyQuestions.map(q => q.prompt)).size, 2);
assert.ok(openStudyQuestions.every(q => !/Un concepto clave es/.test(q.answer)));

const pageMappedSections = [
  { title: 'Epistemología', body: 'La epistemología reflexiona sobre el conocimiento.\nVer en PDF · páginas 1, 2, 3' },
  { title: 'Argumentación', body: 'Los argumentos necesitan premisas y conclusiones.\nVer en PDF · páginas 4, 5' },
];
const pageMappedGlossary = tagGlossaryChapters([
  { term: 'Conocimiento como producto', definition: 'Los resultados del conocimiento', context: 'Ver en PDF · página 1', importance: 'alta' },
  { term: 'Concepto compartido', definition: 'Un término usado en varios capítulos', context: 'Ver en PDF · página 4', importance: 'media' },
], pageMappedSections);
assert.equal(pageMappedGlossary[0]?.chapterTitle, 'Epistemología');
assert.equal(pageMappedGlossary[1]?.chapterTitle, 'Argumentación');
const ambiguousCitations = [
  { title: 'Bloque A', body: 'Material de estudio.\nVer en PDF · páginas 1, 2' },
  { title: 'Bloque B', body: 'Otro contenido.\nVer en PDF · páginas 2, 3' },
];
const unresolved = tagGlossaryChapters([
  { term: 'Concepto compartido', definition: 'No hay un título inequívoco', context: 'Ver en PDF · página 2', importance: 'media' },
], ambiguousCitations);
assert.equal(unresolved[0]?.chapterTitle, null, 'No asignar páginas compartidas a un capítulo arbitrario.');

const qualitySource = readFileSync('lib/student-materials/quality.ts', 'utf8');
assert.match(qualitySource, /unsafe_model_answers_rejected/);
assert.match(qualitySource, /PEDAGOGICAL_QUALITY_REPORT_VERSION = 5/);
const cachedQualitySource = readFileSync('lib/data/student-material-pedagogical-cache.ts', 'utf8');
assert.match(cachedQualitySource, /semantic_reaudit_pending/);
assert.match(cachedQualitySource, /requiresSemanticReaudit/);
console.log('pedagogical-integrity.smoke: OK');
