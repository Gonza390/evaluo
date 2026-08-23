import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-materials/types';

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

function truncateAtWord(text: string, limit: number) {
  if (text.length <= limit) return text;
  const partial = text.slice(0, limit);
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

export function buildPedagogicalArtifacts(input: {
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  chunks?: PedagogicalChunk[];
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
  const multipleChoice = concepts
    .slice(0, 5)
    .map((concept, index): StudyQuestion => {
      const distractors = selectDistractorDefinitions(concept, concepts, 3);
      const options = placeCorrectOption(
        concept.definition,
        distractors,
        index % Math.max(1, distractors.length + 1)
      ).slice(0, 4);
      const level = index < 2 ? 'recordar' : 'comprender';

      return {
        id: `mc-${index + 1}`,
        type: 'multiple_choice',
        level,
        prompt:
          level === 'recordar'
            ? `¿Cuál es la definición correcta de “${concept.term}” según el material?`
            : `¿Cuál opción explica mejor “${concept.term}” según el material?`,
        options,
        answer: concept.definition,
        explanation:
          level === 'recordar'
            ? `La respuesta reproduce la definición que el material asigna a ${concept.term}.`
            : `La respuesta conserva la idea central y el contexto con el que el material explica ${concept.term}.`,
        reference: findReference(
          concept.term,
          chunks,
          emptyReference(sectionTitles[index] ?? null, concept.context || concept.definition)
        ),
      };
    })
    .filter((question) => question.options.length >= 3);
  const openQuestions = input.summary.sections.slice(0, 5).map((section, index): StudyQuestion => {
    const canApply = index > 0 && sectionSupportsApplication(section.body);
    const level: StudyQuestion['level'] = canApply ? 'aplicar' : 'comprender';

    return {
      id: `open-${index + 1}`,
      type: 'open',
      level,
      prompt: canApply
        ? `Planteá una situación concreta donde se puedan aplicar las ideas de “${section.title}” y justificá qué conceptos o criterios del material usarías.`
        : `Explicá con tus palabras la idea central de “${section.title}” y relacioná al menos dos conceptos o ideas clave del material.`,
      options: [],
      answer: buildExpectedSectionAnswer(section.body),
      explanation: canApply
        ? 'Una respuesta sólida debe aplicar criterios explícitos del material al caso, justificar por qué corresponden y evitar agregar supuestos innecesarios.'
        : 'Una respuesta sólida debe explicar la idea central, conectar conceptos del material y evitar limitarse a copiar frases sin relación entre sí.',
      reference: findReference(section.title, chunks, emptyReference(section.title, section.body)),
    };
  });
  const questions = [...multipleChoice, ...openQuestions];
  const progressive = [
    questions.find((q) => q.level === 'recordar'),
    questions.find((q) => q.level === 'comprender' && q.type === 'multiple_choice'),
    questions.find((q) => q.level === 'comprender' && q.type === 'open'),
    questions.find((q) => q.level === 'aplicar'),
  ].filter((question): question is StudyQuestion => Boolean(question));
  const allItems = [...flashcards, ...questions];
  return {
    flashcards,
    questions,
    miniExamQuestionIds: dedupeStrings(progressive.map((question) => question.id)),
    coverage: {
      conceptsUsed: concepts.length,
      sectionsUsed: Math.min(5, input.summary.sections.length),
      referencedItems: allItems.filter((item) => item.reference.excerpt.length > 0).length,
      totalItems: allItems.length,
    },
  };
}
