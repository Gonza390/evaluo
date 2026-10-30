import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isRecognitionPresentedAsHigherOrder,
  sanitizePedagogicalArtifacts,
  unsafeModelAnswerReason,
  incompleteOpenAnswerReason,
  unsafeFlashcardReason,
  accurateFlashcardLevel,
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
const sectionHeadingOnly = open({
  id: 'admin-heading-only',
  kind: 'section',
  topic: sections[1]!.title,
  chapterTitle: sections[1]!.title,
  prompt: 'Explicá la aplicación práctica y resolución organizacional.',
  answer: '3.1 Análisis de la situación problemática en empresas de alimentos y catering',
});
assert.equal(
  unsafeModelAnswerReason(sectionHeadingOnly, sections),
  'section_answer_is_heading_not_explanation',
  'Un título de subsección nunca debe pasar como respuesta modelo.'
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
// Regresión real de Marketing: un proceso de varias etapas no puede
// quedar respondido únicamente por la etapa "Generación de ideas".
const processSection = {
  title: '3. Desarrollo de Nuevos Productos y Comercialización',
  body: [
    '### 3.1 Categorías y Proceso de Desarrollo',
    'El proceso estructurado comprende las siguientes etapas:',
    '1. **Generación de ideas:** Búsqueda de oportunidades en necesidades insatisfechas.',
    '2. **Análisis de ideas y evaluación:** Clasificación técnica y comercial de las propuestas.',
    '3. **Desarrollo y test de concepto:** Transformación de la idea y validación con usuarios.',
    '4. **Diseño y análisis económico:** Plan comercial y proyecciones de rentabilidad.',
    '5. **Desarrollo del producto:** Elaboración de prototipos para evaluar costos.',
  ].join('\n'),
};
const partialProcess = open({
  id: 'marketing-partial-process',
  kind: 'section',
  topic: processSection.title,
  chapterTitle: processSection.title,
  prompt: '¿Qué sostiene el material sobre “Categorías y Proceso de Desarrollo”? Desarrollá la idea usando sus conceptos principales.',
  answer: 'El proceso estructurado comprende varias etapas. Generación de ideas: búsqueda de oportunidades en necesidades insatisfechas.',
  reference: { pageStart: 1, pageEnd: 1, sectionTitle: processSection.title, excerpt: processSection.body },
});
assert.equal(
  incompleteOpenAnswerReason(partialProcess, [processSection]),
  'section_process_missing_stages'
);
assert.equal(
  unsafeModelAnswerReason(partialProcess, [processSection]),
  'section_process_missing_stages',
  'La respuesta parcial no debe llegar a la práctica aunque supere la validación por longitud y palabras.'
);
const completeProcess = {
  ...partialProcess,
  answer: 'El desarrollo comienza con Generación de ideas. Continúa con Análisis de ideas y evaluación, Desarrollo y test de concepto, Diseño y análisis económico, y Desarrollo del producto. Estos pasos permiten validar una propuesta antes de comercializarla.',
};
assert.equal(incompleteOpenAnswerReason(completeProcess, [processSection]), null,
  'No rechazar una respuesta que cubre todas las etapas del proceso.');

const otherSection = {
  ...processSection,
  body: [
    '### 3.1 Categorías y Proceso de Desarrollo',
    'La primera sección presenta una explicación de conceptos generales.',
    '### 3.2 Procedimiento de Lanzamiento',
    '1. **Planificación inicial:** Definir el alcance.',
    '2. **Investigación de mercado:** Validar requisitos.',
    '3. **Lanzamiento final:** Publicar la oferta.',
  ].join('\n'),
};
const unconnectedProcess = { ...partialProcess, answer: 'Las categorías de desarrollo describen familias de productos y se organizan para entender qué necesidades atiende cada alternativa en el mercado. El texto resume sus diferencias.' };
assert.equal(incompleteOpenAnswerReason(unconnectedProcess, [otherSection]), null,
  'No exigir etapas de otro subtítulo del mismo capítulo.');

const comparisonReference = { ...ref, excerpt: 'La teoría A enfatiza relaciones observables. La teoría B se centra en explicaciones causales.' };
const incompleteComparison = open({
  id: 'comparison-incomplete',
  kind: 'relationship',
  prompt: 'Compará “Teoría A” con “Teoría B” según el PDF.',
  answer: 'La Teoría A enfatiza relaciones observables y sirve para examinar antecedentes conocidos.',
  reference: comparisonReference,
});
assert.equal(incompleteOpenAnswerReason(incompleteComparison, sections), 'comparison_answer_omits_entity');
assert.equal(
  incompleteOpenAnswerReason({
    ...incompleteComparison,
    answer: 'La Teoría A enfatiza relaciones observables. La Teoría B se centra en explicaciones causales.',
  }, sections),
  'comparison_answer_lacks_contrast'
);
assert.equal(incompleteOpenAnswerReason({
  ...incompleteComparison,
  answer: 'La Teoría A enfatiza relaciones observables; en cambio, la Teoría B se centra en explicaciones causales.',
}, sections), null);

const incorrectCard = {
  front: '¿Cómo distinguís causa común de causalidad directa según el material?',
  back: 'Confundir los efectos de una causa común con causalidad directa.',
  level: 'comprender' as const,
  reference: ref,
};
assert.equal(unsafeFlashcardReason(incorrectCard), 'flashcard_repeats_misconception');
assert.equal(
  unsafeFlashcardReason({
    ...incorrectCard,
    front: '¿Qué problema conceptual señala el material cuando plantea una creencia equivocada?',
    back: 'Creer que aumentar las ventas equivale a crecer de manera sostenible.',
  }),
  'flashcard_repeats_false_belief'
);
assert.equal(
  unsafeFlashcardReason({
    ...incorrectCard,
    front: '¿Cómo distinguís la formalización de la burocratización excesiva?',
    back: 'Confundir la formalización con la burocratización excesiva.',
  }),
  'flashcard_repeats_misconception'
);
assert.equal(
  unsafeFlashcardReason({
    ...incorrectCard,
    front: '¿Cómo distinguís formalización de burocratización?',
    back: 'La formalización define responsabilidades; la burocratización excesiva introduce controles rígidos.',
    kind: 'relationship',
  }),
  null,
  'No rechazar un contraste genuino y fundamentado.'
);
assert.equal(
  accurateFlashcardLevel({
    ...incorrectCard, kind: 'concept',
    front: '¿Cómo explicarías “Etermax” sin mirar el PDF?',
    back: 'Compañía creadora de un juego.',
  }), 'recordar',
  'Una definición no se convierte en comprensión por cambiar el verbo.'
);
assert.equal(accurateFlashcardLevel({
  ...incorrectCard, kind: 'relationship',
  front: '¿Cómo se relacionan dos conceptos?',
  back: 'Su relación se explica con una consecuencia justificada.',
}), 'comprender');
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
const sanitizedLevels = sanitizePedagogicalArtifacts({
  ...artifacts,
  questions: [{
    ...safeConcept,
    id: 'classification-example',
    level: 'aplicar',
    kind: 'classification',
    prompt: 'Un caso del material se describe así: “problema de gestión”. ¿Qué categoría corresponde?',
  }],
  flashcards: [{
    ...incorrectCard,
    front: '¿Cómo explicarías “Etermax” sin mirar el PDF?',
    back: 'Compañía de software especializada en juegos.',
    kind: 'concept',
  }],
  miniExamQuestionIds: ['classification-example'],
}, sections);
assert.equal(sanitizedLevels.questions[0]?.level, 'recordar');
assert.equal(sanitizedLevels.flashcards[0]?.level, 'recordar');
assert.equal(sanitizedLevels.flashcards.length, 1);
assert.equal(isRecognitionPresentedAsHigherOrder({ ...safeConcept, level: 'comprender', prompt: '¿Cuál de estas afirmaciones representa mejor Epistemología?' }), true);
assert.equal(isRecognitionPresentedAsHigherOrder(safeConcept), false);
assert.equal(isRecognitionPresentedAsHigherOrder({ ...safeConcept, level: 'comprender', prompt: '¿Qué caracteriza mejor a “Epistemología”?' }), true,
  'Variar la redacción no debe elevar una pregunta de reconocimiento a comprensión.');
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

// Una pregunta abierta necesita dos oraciones del mismo subtítulo.
// No debe unir dos definiciones de apartados distintos ni usar un título.
const separatedSubsections: StudentMaterialSummary = {
  ...sectionSummary,
  sections: [{
    title: '3. Dos temas independientes',
    body: '### 3.1 Primer tema\\nLa primera noción se define mediante múltiples argumentos que permiten entender su alcance dentro de un modelo académico.\\n### 3.2 Segundo tema\\nLa segunda noción se describe como un fenómeno separado que requiere otra categoría de análisis en esta materia.',
  }],
};
const separatedBank = buildPedagogicalArtifacts({
  summary: separatedSubsections, glossary: [], chunks: [{
    text: separatedSubsections.sections[0]!.body,
    pageStart: 1, pageEnd: 1, sectionTitle: separatedSubsections.sections[0]!.title, excerpt: '',
  }],
});
assert.equal(separatedBank.questions.filter(q => q.kind === 'section' && q.type === 'open').length, 0,
  'No inventar una explicación uniendo frases de subapartados diferentes.');
assert.ok(openStudyQuestions.every(q =>
  q.answer.split(/[.!?]+/u).filter(part => part.trim().length >= 55).length >= 2
), 'Cada respuesta abierta debe aportar idea y desarrollo en el mismo apartado.');

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

const generator = readFileSync('lib/student-materials/pedagogy-v2.ts', 'utf8');
const fallbackGenerator = readFileSync('lib/student-materials/pedagogy.ts', 'utf8');
assert.doesNotMatch(generator, /model\.confusions\.forEach/, 'No generar tarjetas que sólo repiten errores.');
assert.match(generator, /items\.length > 6/, 'Evitar listas de memorización excesivamente largas.');
assert.match(generator, /steps\.length > 6/, 'Evitar procesos de más de seis pasos en una tarjeta.');
assert.ok(fallbackGenerator.includes("return value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');"), 'Restaurar el escape seguro de los caracteres regex.');
const processingService = readFileSync('lib/student-materials/processing-service.ts', 'utf8');
assert.match(
  processingService,
  /import \{ buildPedagogicalArtifacts \} from '@\/lib\/student-materials\/pedagogy-v2'/,
  'El procesamiento inicial debe ejecutar los controles de calidad de v12 antes de persistir.'
);
const processingPage = readFileSync('app/(es)/materiales/[id]/page.tsx', 'utf8');
assert.ok(
  processingPage.indexOf('if (user?.id === material.user_id') >= 0 &&
  processingPage.indexOf('if (user?.id === material.user_id') < processingPage.indexOf('recoverStaleStudentMaterialJobs(admin, materialId)'),
  'La recuperación de un material atascado debe exigir que el solicitante sea su propietario.'
);
const qualitySource = readFileSync('lib/student-materials/quality.ts', 'utf8');
assert.match(qualitySource, /unsafe_model_answers_rejected/);
assert.match(qualitySource, /PEDAGOGICAL_QUALITY_REPORT_VERSION = 6/);
const cachedQualitySource = readFileSync('lib/data/student-material-pedagogical-cache.ts', 'utf8');
assert.match(cachedQualitySource, /semantic_reaudit_pending/);
assert.match(cachedQualitySource, /requiresSemanticReaudit/);
assert.match(
  cachedQualitySource,
  /cachedRow\?\.pedagogical_artifacts_version \?\? 0/,
  'No conservar como 100/100 el score de un banco v12 anterior al generador corregido.'
);
console.log('pedagogical-integrity.smoke: OK');
