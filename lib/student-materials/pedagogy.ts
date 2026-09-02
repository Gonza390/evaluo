import type {
  CanonicalPedagogicalModel,
  StudyGlossaryItem,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeForDedupe(value: string) {
  return cleanLine(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function dedupeStrings(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeForDedupe(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeQuestions(items: StudyQuestion[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeForDedupe(item.prompt);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function truncateAtWord(text: string, limit: number) {
  const cleaned = cleanLine(text);
  if (cleaned.length <= limit) return cleaned;
  const partial = cleaned.slice(0, limit);
  return `${partial.slice(0, Math.max(1, partial.lastIndexOf(' '))).trim()}...`;
}

const GENERIC_TERM_PATTERN =
  /^(?:idea general|buena pr[aá]ctica|comprender qu[eé]|definir el problema|desplegar|evaluar|generaci[oó]n|hogar|industria|educaci[oó]n|ciudades|arquitectura|agricultura)$/i;
const FOUNDATIONAL_CONTEXT_PATTERN =
  /fundamentos?|conceptos?|definici[oó]n|principios?|bases?\b|marco\b|teor[ií]a|modelos?|elementos?|componentes?|caracter[ií]sticas?/i;
const UNDERSTANDING_SIGNAL_PATTERN =
  /clasificaci[oó]n|tipos?\b|incluye|se compone|relaci[oó]n|diferenc|compar|proceso|etapas?|fases?|pasos?|ventajas?|limitaciones?|criterios?|riesgos?/i;
const APPLICATION_SIGNAL_PATTERN =
  /ejempl|caso|situaci[oó]n|aplic|estrateg|proceso|pasos?|etapas?|fases?|criterios?|decisi[oó]n|procedimiento|riesgos?|medidas?|consecuencias?|resolver|implement|utiliza|uso\b/i;
const CONTEXT_STOP_WORDS = new Set([
  'para',
  'como',
  'esta',
  'este',
  'estas',
  'estos',
  'desde',
  'sobre',
  'entre',
  'segun',
  'material',
  'pagina',
  'paginas',
  'seccion',
]);

export function isPedagogicalGlossaryItem(item: StudyGlossaryItem) {
  const term = cleanLine(item.term);
  const definition = cleanLine(item.definition);
  if (term.length < 4 || term.length > 58 || definition.length < 30) return false;
  if (GENERIC_TERM_PATTERN.test(term)) return false;
  if (/p[aá]gina\s+\d+|objetivo del tema|material de estudio/i.test(term)) return false;
  if (/^(?:en|estas|elegir|comprender)\b/i.test(term)) return false;
  if (term.split(/\s+/).length > 6) return false;
  return true;
}

function conceptCentrality(item: StudyGlossaryItem, glossary: StudyGlossaryItem[]) {
  const needle = normalizeForDedupe(item.term);
  if (needle.length < 4) return 0;

  let mentions = 0;
  for (const candidate of glossary) {
    if (candidate === item) continue;
    const relatedText = normalizeForDedupe(`${candidate.definition} ${candidate.context}`);
    if (relatedText.includes(needle)) mentions += 1;
  }

  return Math.min(3, mentions);
}

function conceptScore(item: StudyGlossaryItem, glossary: StudyGlossaryItem[]) {
  let score = item.importance === 'alta' ? 6 : item.importance === 'media' ? 3 : 1;
  const pedagogicalText = `${item.term} ${item.definition} ${item.context}`;

  if (FOUNDATIONAL_CONTEXT_PATTERN.test(item.context)) score += 2;
  if (UNDERSTANDING_SIGNAL_PATTERN.test(pedagogicalText)) score += 1;
  score += conceptCentrality(item, glossary);

  return score;
}

export function selectPedagogicalConcepts(glossary: StudyGlossaryItem[], limit = 12) {
  return glossary
    .filter(isPedagogicalGlossaryItem)
    .map((item, index) => ({ item, index, score: conceptScore(item, glossary) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

export type PedagogicalReference = {
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
  excerpt: string;
};
export type PedagogicalChunk = PedagogicalReference & { text: string };
export type StudyFlashcard = {
  front: string;
  back: string;
  level: 'recordar' | 'comprender';
  reference: PedagogicalReference;
};
export type StudyQuestion = {
  id: string;
  type: 'multiple_choice' | 'open';
  level: 'recordar' | 'comprender' | 'aplicar';
  kind?: 'concept' | 'relationship' | 'classification' | 'process' | 'formula' | 'confusion' | 'section';
  topic?: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  reference: PedagogicalReference;
};
export type PedagogicalArtifacts = {
  flashcards: StudyFlashcard[];
  questions: StudyQuestion[];
  miniExamQuestionIds: string[];
  coverage: {
    conceptsUsed: number;
    sectionsUsed: number;
    referencedItems: number;
    totalItems: number;
  };
};

function emptyReference(sectionTitle: string | null, excerpt: string): PedagogicalReference {
  return { pageStart: null, pageEnd: null, sectionTitle, excerpt: truncateAtWord(excerpt, 220) };
}

function referenceFromPages(
  pages: number[] | undefined,
  sectionTitle: string | null,
  excerpt: string,
  chunks: PedagogicalChunk[]
) {
  const pageNumbers = (pages ?? []).filter((page) => Number.isFinite(page) && page > 0);
  if (pageNumbers.length > 0) {
    return {
      pageStart: Math.min(...pageNumbers),
      pageEnd: Math.max(...pageNumbers),
      sectionTitle,
      excerpt: truncateAtWord(excerpt, 220),
    } satisfies PedagogicalReference;
  }

  return findReference(sectionTitle ?? excerpt, chunks, emptyReference(sectionTitle, excerpt));
}

function findReference(term: string, chunks: PedagogicalChunk[], fallback: PedagogicalReference) {
  const needle = normalizeForDedupe(term);
  const words = needle.split(/\s+/).filter((word) => word.length >= 4);
  const match = chunks.find((chunk) => {
    const haystack = normalizeForDedupe(chunk.text);
    return (
      haystack.includes(needle) ||
      (words.length > 0 && words.every((word) => haystack.includes(word)))
    );
  });
  return match
    ? {
        pageStart: match.pageStart,
        pageEnd: match.pageEnd,
        sectionTitle: match.sectionTitle,
        excerpt: truncateAtWord(match.text, 220),
      }
    : fallback;
}

function getContextWords(value: string) {
  return new Set(
    normalizeForDedupe(value)
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !CONTEXT_STOP_WORDS.has(word))
  );
}

function countSharedWords(left: Set<string>, right: Set<string>) {
  let count = 0;
  for (const word of left) {
    if (right.has(word)) count += 1;
  }
  return count;
}

function selectDistractorDefinitions(
  concept: StudyGlossaryItem,
  concepts: StudyGlossaryItem[],
  limit = 3
) {
  const targetContext = getContextWords(concept.context);
  const targetDefinition = normalizeForDedupe(concept.definition);

  return dedupeStrings(
    concepts
      .filter((candidate) => candidate.term !== concept.term)
      .filter((candidate) => normalizeForDedupe(candidate.definition) !== targetDefinition)
      .map((candidate, index) => {
        const sharedContextWords = countSharedWords(
          targetContext,
          getContextWords(candidate.context)
        );
        const lengthDifference = Math.abs(
          cleanLine(candidate.definition).length - cleanLine(concept.definition).length
        );
        const lengthSimilarity = Math.max(0, 3 - Math.floor(lengthDifference / 70));
        const sameImportance = candidate.importance === concept.importance ? 2 : 0;

        return {
          definition: candidate.definition,
          score: sharedContextWords * 4 + lengthSimilarity + sameImportance,
          index,
        };
      })
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .map(({ definition }) => definition)
  ).slice(0, limit);
}

function placeCorrectOption(
  correctAnswer: string,
  distractors: string[],
  preferredPosition: number
) {
  const cleanDistractors = dedupeStrings(distractors).filter(
    (distractor) => normalizeForDedupe(distractor) !== normalizeForDedupe(correctAnswer)
  );
  const optionCount = cleanDistractors.length + 1;
  const position = Math.min(Math.max(0, preferredPosition), optionCount - 1);

  return [
    ...cleanDistractors.slice(0, position),
    correctAnswer,
    ...cleanDistractors.slice(position),
  ];
}

function resolveFlashcardLevel(concept: StudyGlossaryItem): StudyFlashcard['level'] {
  return UNDERSTANDING_SIGNAL_PATTERN.test(
    `${concept.term} ${concept.definition} ${concept.context}`
  )
    ? 'comprender'
    : 'recordar';
}

function buildFlashcardFront(concept: StudyGlossaryItem, level: StudyFlashcard['level']) {
  const term = cleanLine(concept.term);

  if (level === 'recordar') {
    return `¿Qué significa “${term}” según el material?`;
  }

  return `¿Cómo explicarías “${term}” con tus palabras según el material?`;
}

function sectionSupportsApplication(body: string) {
  return APPLICATION_SIGNAL_PATTERN.test(body);
}

function cleanStudyUnit(value: string) {
  return cleanLine(
    value
      .replace(/^#{1,6}\s+/g, '')
      .replace(/^[-*•]\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\|/g, ' ')
  );
}

function buildExpectedSectionAnswer(body: string) {
  const rawUnits = body
    .split(/\n+/)
    .map(cleanStudyUnit)
    .filter(Boolean)
    .filter((unit) => !/^ver en pdf\b/i.test(unit))
    .filter((unit) => !/^[-:|\s]+$/.test(unit));

  const units = rawUnits.flatMap((unit) => {
    if (unit.length <= 240) return [unit];
    return unit
      .split(/(?<=[.!?])\s+/)
      .map(cleanLine)
      .filter(Boolean);
  });
  const selected = dedupeStrings(units).slice(0, 4);
  const answer = selected.join(' ');

  return truncateAtWord(answer || cleanStudyUnit(body), 480);
}

function buildFallbackMultipleChoice(
  concepts: StudyGlossaryItem[],
  chunks: PedagogicalChunk[],
  sectionTitles: string[]
) {
  return concepts
    .slice(0, 5)
    .map((concept, index): StudyQuestion => {
      const correctAnswer = truncateAtWord(concept.definition, 220);
      const distractors = selectDistractorDefinitions(concept, concepts, 3).map((item) =>
        truncateAtWord(item, 220)
      );
      const options = placeCorrectOption(
        correctAnswer,
        distractors,
        index % Math.max(1, distractors.length + 1)
      ).slice(0, 4);
      const level = index < 2 ? 'recordar' : 'comprender';

      return {
        id: `fallback-concept-${index + 1}`,
        type: 'multiple_choice',
        level,
        kind: 'concept',
        topic: concept.term,
        prompt:
          level === 'recordar'
            ? `¿Cuál es la definición correcta de “${concept.term}” según el material?`
            : `¿Cuál opción explica mejor “${concept.term}” según el material?`,
        options,
        answer: correctAnswer,
        explanation:
          level === 'recordar'
            ? `La opción correcta conserva la definición que el PDF asigna a ${concept.term}.`
            : `La opción correcta mantiene la idea central y el contexto con el que el PDF explica ${concept.term}.`,
        reference: findReference(
          concept.term,
          chunks,
          emptyReference(sectionTitles[index] ?? null, concept.context || concept.definition)
        ),
      };
    })
    .filter((question) => question.options.length >= 3);
}

function buildCanonicalConceptQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const concepts = model.concepts.filter(
    (concept) => cleanLine(concept.term).length >= 3 && cleanLine(concept.detail).length >= 12
  );

  return concepts.slice(0, 8).map((concept, index): StudyQuestion => {
    const correct = truncateAtWord(concept.detail, 210);
    const distractors = concepts
      .filter((candidate) => candidate.term !== concept.term)
      .map((candidate) => truncateAtWord(candidate.detail, 210));
    const options = placeCorrectOption(correct, distractors, index % 4).slice(0, 4);

    return {
      id: `model-concept-${index + 1}`,
      type: 'multiple_choice',
      level: index < 2 ? 'recordar' : 'comprender',
      kind: 'concept',
      topic: concept.term,
      prompt:
        index < 2
          ? `Según el PDF, ¿qué describe correctamente “${concept.term}”?`
          : `¿Cuál de estas afirmaciones representa mejor “${concept.term}” según el material?`,
      options,
      answer: correct,
      explanation: `La respuesta se apoya en la descripción de “${concept.term}” recuperada del PDF.`,
      reference: referenceFromPages(
        concept.pageReferences,
        concept.term,
        concept.detail,
        chunks
      ),
    };
  }).filter((question) => question.options.length >= 3);
}

function buildCanonicalRelationshipQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const relationships = model.relationships.filter(
    (item) => cleanLine(item.description).length >= 16
  );

  return relationships.slice(0, 6).map((item, index): StudyQuestion => {
    const correct = truncateAtWord(item.description, 190);
    const distractors = relationships
      .filter((candidate) => candidate !== item)
      .map((candidate) => truncateAtWord(candidate.description, 190));
    const options = placeCorrectOption(correct, distractors, (index + 1) % 4).slice(0, 4);

    return {
      id: `model-relationship-${index + 1}`,
      type: 'multiple_choice',
      level: 'comprender',
      kind: 'relationship',
      topic: `${item.source} ↔ ${item.target}`,
      prompt: `¿Qué relación establece el material entre “${item.source}” y “${item.target}”?`,
      options,
      answer: correct,
      explanation: `El PDF vincula explícitamente ${item.source} con ${item.target} de esta manera.`,
      reference: referenceFromPages(
        item.pageReferences,
        `${item.source} ${item.target}`,
        item.description,
        chunks
      ),
    };
  }).filter((question) => question.options.length >= 3);
}

function buildCanonicalClassificationQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const allItems = dedupeStrings(model.classifications.flatMap((item) => item.items));

  return model.classifications
    .filter((classification) => classification.items.length >= 2)
    .slice(0, 6)
    .map((classification, index): StudyQuestion | null => {
      const correct = cleanLine(classification.items[index % classification.items.length] ?? '');
      if (!correct) return null;

      const ownItems = new Set(classification.items.map(normalizeForDedupe));
      const distractors = allItems.filter((item) => !ownItems.has(normalizeForDedupe(item)));
      const options = placeCorrectOption(correct, distractors, (index + 2) % 4).slice(0, 4);
      if (options.length < 3) return null;

      return {
        id: `model-classification-${index + 1}`,
        type: 'multiple_choice',
        level: 'comprender',
        kind: 'classification',
        topic: classification.title,
        prompt: `¿Cuál de estos elementos pertenece a “${classification.title}” según el PDF?`,
        options,
        answer: correct,
        explanation: `“${correct}” aparece incluido en la clasificación “${classification.title}” del material.`,
        reference: referenceFromPages(
          classification.pageReferences,
          classification.title,
          `${classification.title}: ${classification.items.join(', ')}`,
          chunks
        ),
      };
    })
    .filter((question): question is StudyQuestion => Boolean(question));
}

function buildCanonicalProcessQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const allSteps = dedupeStrings(model.processes.flatMap((process) => process.steps));

  return model.processes
    .filter((process) => process.steps.length >= 2)
    .slice(0, 5)
    .map((process, index): StudyQuestion | null => {
      const correct = cleanLine(process.steps[index % process.steps.length] ?? '');
      if (!correct) return null;
      const processSteps = new Set(process.steps.map(normalizeForDedupe));
      const distractors = allSteps.filter((step) => !processSteps.has(normalizeForDedupe(step)));
      const options = placeCorrectOption(correct, distractors, index % 4).slice(0, 4);
      if (options.length < 3) return null;

      return {
        id: `model-process-${index + 1}`,
        type: 'multiple_choice',
        level: 'aplicar',
        kind: 'process',
        topic: process.title,
        prompt: `¿Cuál de estas acciones forma parte del proceso “${process.title}” descrito en el PDF?`,
        options,
        answer: correct,
        explanation: `El material incluye “${correct}” como parte del proceso “${process.title}”.`,
        reference: referenceFromPages(
          process.pageReferences,
          process.title,
          `${process.title}: ${process.steps.join(' → ')}`,
          chunks
        ),
      };
    })
    .filter((question): question is StudyQuestion => Boolean(question));
}

function buildCanonicalFormulaQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const fallbackDistractors = [
    ...model.relationships.map((item) => item.description),
    ...model.concepts.map((item) => item.detail),
  ];

  return model.formulas.slice(0, 4).map((formula, index): StudyQuestion => {
    const correct = truncateAtWord(formula.description, 190);
    const distractors = [
      ...model.formulas.filter((candidate) => candidate !== formula).map((candidate) => candidate.description),
      ...fallbackDistractors,
    ].map((item) => truncateAtWord(item, 190));
    const options = placeCorrectOption(correct, distractors, (index + 1) % 4).slice(0, 4);

    return {
      id: `model-formula-${index + 1}`,
      type: 'multiple_choice',
      level: 'aplicar',
      kind: 'formula',
      topic: formula.expression,
      prompt: `¿Qué representa o describe la expresión “${formula.expression}” en este material?`,
      options,
      answer: correct,
      explanation: `La interpretación correcta es la que el PDF asocia con la fórmula “${formula.expression}”.`,
      reference: referenceFromPages(
        formula.pageReferences,
        formula.expression,
        formula.description,
        chunks
      ),
    };
  }).filter((question) => question.options.length >= 3);
}

function buildCanonicalConfusionQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  return model.confusions.slice(0, 3).map((confusion, index): StudyQuestion => ({
    id: `model-confusion-${index + 1}`,
    type: 'open',
    level: 'comprender',
    kind: 'confusion',
    topic: 'Confusión frecuente',
    prompt: `Aclar á con tus palabras esta confusión que el material considera importante: “${truncateAtWord(confusion, 180)}”`,
    options: [],
    answer: truncateAtWord(confusion, 420),
    explanation:
      'Una respuesta sólida debe distinguir con precisión los conceptos que el PDF señala como fáciles de confundir.',
    reference: findReference(
      confusion,
      chunks,
      emptyReference('Confusión frecuente', confusion)
    ),
  }));
}

function buildOpenSectionQuestions(
  summary: StudentMaterialSummary,
  chunks: PedagogicalChunk[]
) {
  return summary.sections.slice(0, 5).map((section, index): StudyQuestion => {
    const canApply = index > 0 && sectionSupportsApplication(section.body);
    const level: StudyQuestion['level'] = canApply ? 'aplicar' : 'comprender';

    return {
      id: `section-open-${index + 1}`,
      type: 'open',
      level,
      kind: 'section',
      topic: section.title,
      prompt: canApply
        ? `Usando únicamente lo explicado en “${section.title}”, planteá cómo aplicarías esas ideas a una situación concreta y justificá tu decisión.`
        : `Explicá con tus palabras la idea central de “${section.title}” y relacioná al menos dos conceptos del material.`,
      options: [],
      answer: buildExpectedSectionAnswer(section.body),
      explanation: canApply
        ? 'Una respuesta sólida debe aplicar criterios explícitos del PDF al caso y justificar por qué corresponden.'
        : 'Una respuesta sólida debe explicar la idea central y conectar conceptos del material, no limitarse a copiar frases aisladas.',
      reference: findReference(section.title, chunks, emptyReference(section.title, section.body)),
    };
  });
}

function selectMiniExamQuestions(questions: StudyQuestion[], limit = 8) {
  const selected: StudyQuestion[] = [];
  const pushFirst = (predicate: (question: StudyQuestion) => boolean) => {
    const match = questions.find(
      (question) => predicate(question) && !selected.some((item) => item.id === question.id)
    );
    if (match) selected.push(match);
  };

  pushFirst((q) => q.kind === 'concept' && q.level === 'recordar');
  pushFirst((q) => q.kind === 'relationship');
  pushFirst((q) => q.kind === 'classification');
  pushFirst((q) => q.kind === 'process');
  pushFirst((q) => q.kind === 'formula');
  pushFirst((q) => q.kind === 'confusion');
  pushFirst((q) => q.type === 'open' && q.level === 'comprender');
  pushFirst((q) => q.type === 'open' && q.level === 'aplicar');

  for (const question of questions) {
    if (selected.length >= limit) break;
    if (!selected.some((item) => item.id === question.id)) selected.push(question);
  }

  return selected.slice(0, limit);
}

export function buildPedagogicalArtifacts(input: {
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  chunks?: PedagogicalChunk[];
  canonicalModel?: CanonicalPedagogicalModel | null;
}): PedagogicalArtifacts {
  const chunks = input.chunks ?? [];
  const concepts = selectPedagogicalConcepts(input.glossary, 12);
  const sectionTitles = dedupeStrings(input.summary.sections.map((section) => section.title));
  const flashcards = concepts.slice(0, 12).map(
    (concept, index): StudyFlashcard => {
      const level = resolveFlashcardLevel(concept);
      return {
        front: buildFlashcardFront(concept, level),
        back: concept.definition,
        level,
        reference: findReference(
          concept.term,
          chunks,
          emptyReference(
            sectionTitles[index % Math.max(1, sectionTitles.length)] ?? null,
            concept.context || concept.definition
          )
        ),
      };
    }
  );

  const fallbackQuestions = [
    ...buildFallbackMultipleChoice(concepts, chunks, sectionTitles),
    ...buildOpenSectionQuestions(input.summary, chunks),
  ];

  const model = input.canonicalModel;
  const modelQuestions = model
    ? [
        ...buildCanonicalConceptQuestions(model, chunks),
        ...buildCanonicalRelationshipQuestions(model, chunks),
        ...buildCanonicalClassificationQuestions(model, chunks),
        ...buildCanonicalProcessQuestions(model, chunks),
        ...buildCanonicalFormulaQuestions(model, chunks),
        ...buildCanonicalConfusionQuestions(model, chunks),
      ]
    : [];

  const questions = dedupeQuestions([
    ...modelQuestions,
    ...fallbackQuestions,
  ]);
  const miniExam = selectMiniExamQuestions(questions, 8);
  const allItems = [...flashcards, ...questions];

  return {
    flashcards,
    questions,
    miniExamQuestionIds: miniExam.map((question) => question.id),
    coverage: {
      conceptsUsed: model?.concepts.length ?? concepts.length,
      sectionsUsed: Math.min(5, input.summary.sections.length),
      referencedItems: allItems.filter((item) => item.reference.excerpt.length > 0).length,
      totalItems: allItems.length,
    },
  };
}
