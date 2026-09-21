import type {
  CanonicalPedagogicalModel,
  CanonicalPedagogicalSourceKind,
  StudyGlossaryItem,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';

export const PEDAGOGICAL_ARTIFACTS_VERSION = 3;

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
const CAUSAL_SIGNAL_PATTERN =
  /aument|dismin|reduce|libera|consume|provoca|produce|favorece|impide|evita|acelera|retarda|rompe|activa|inhibe|requiere|determina|permite|consecuencia|resultado/i;
const COMPARISON_SIGNAL_PATTERN = /diferenc|compar|frente\s+a|versus|contrasta?/i;
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
  'reaccion',
  'reacciones',
  'proceso',
  'procesos',
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
  kind?:
    | 'concept'
    | 'relationship'
    | 'classification'
    | 'process'
    | 'formula'
    | 'confusion'
    | 'section';
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

function referenceFromBinding(
  model: CanonicalPedagogicalModel,
  kind: CanonicalPedagogicalSourceKind,
  key: string,
  sectionTitle: string | null,
  chunks: PedagogicalChunk[],
  fallbackExcerpt: string
) {
  const normalizedKey = normalizeForDedupe(key);
  const binding = model.sourceBindings?.find(
    (item) => item.kind === kind && normalizeForDedupe(item.key) === normalizedKey
  );

  if (!binding || binding.references.length === 0) {
    return findReference(key, chunks, emptyReference(sectionTitle, fallbackExcerpt));
  }

  const pageStarts = binding.references
    .map((reference) => reference.pageStart)
    .filter((page): page is number => page !== null && page > 0);
  const pageEnds = binding.references
    .map((reference) => reference.pageEnd ?? reference.pageStart)
    .filter((page): page is number => page !== null && page > 0);
  const bestExcerpt = binding.references
    .map((reference) => cleanLine(reference.excerpt))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)[0];

  return {
    pageStart: pageStarts.length > 0 ? Math.min(...pageStarts) : null,
    pageEnd: pageEnds.length > 0 ? Math.max(...pageEnds) : null,
    sectionTitle,
    excerpt: truncateAtWord(bestExcerpt || fallbackExcerpt, 300),
  } satisfies PedagogicalReference;
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

function pageAffinity(leftPages: number[] | undefined, rightPages: number[] | undefined) {
  const left = (leftPages ?? []).filter((page) => page > 0);
  const right = (rightPages ?? []).filter((page) => page > 0);
  if (left.length === 0 || right.length === 0) return 0;
  if (left.some((page) => right.includes(page))) return 8;

  let distance = Number.POSITIVE_INFINITY;
  for (const leftPage of left) {
    for (const rightPage of right) {
      distance = Math.min(distance, Math.abs(leftPage - rightPage));
    }
  }

  if (distance === 1) return 5;
  if (distance <= 2) return 3;
  if (distance <= 4) return 1;
  return 0;
}

function semanticScore(
  targetText: string,
  targetPages: number[] | undefined,
  candidateText: string,
  candidatePages: number[] | undefined
) {
  const targetWords = getContextWords(targetText);
  const candidateWords = getContextWords(candidateText);
  const sharedWords = countSharedWords(targetWords, candidateWords);
  const pageScore = pageAffinity(targetPages, candidatePages);
  const targetNormalized = normalizeForDedupe(targetText);
  const candidateNormalized = normalizeForDedupe(candidateText);
  const phraseBonus =
    targetNormalized.length >= 6 && candidateNormalized.includes(targetNormalized) ? 5 : 0;

  return sharedWords * 5 + pageScore + phraseBonus;
}

function rankSemanticItems<T>(
  targetText: string,
  targetPages: number[] | undefined,
  candidates: T[],
  toText: (candidate: T) => string,
  toPages: (candidate: T) => number[] | undefined,
  limit: number
) {
  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: semanticScore(targetText, targetPages, toText(candidate), toPages(candidate)),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function selectDistributedByPages<T>(
  items: T[],
  limit: number,
  getPages: (item: T) => number[] | undefined
) {
  if (limit <= 0 || items.length === 0) return [];

  const annotated = items.map((item, index) => ({
    item,
    index,
    page: (getPages(item) ?? [])
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b)[0] ?? null,
  }));
  const pageRepresentatives = Array.from(
    annotated.reduce((map, entry) => {
      if (entry.page !== null && !map.has(entry.page)) {
        map.set(entry.page, entry);
      }
      return map;
    }, new Map<number, (typeof annotated)[number]>()).values()
  ).sort((left, right) => (left.page ?? 0) - (right.page ?? 0));

  const selectedIndexes = new Set<number>();
  const selected: T[] = [];
  const targetRepresentatives = Math.min(limit, pageRepresentatives.length);

  for (let slot = 0; slot < targetRepresentatives; slot += 1) {
    const position =
      targetRepresentatives === 1
        ? 0
        : Math.round(
            (slot * (pageRepresentatives.length - 1)) /
              (targetRepresentatives - 1)
          );
    const candidate = pageRepresentatives[position];
    if (!candidate || selectedIndexes.has(candidate.index)) continue;
    selected.push(candidate.item);
    selectedIndexes.add(candidate.index);
  }

  if (selected.length < limit) {
    const remaining = annotated.filter(
      (entry) => !selectedIndexes.has(entry.index)
    );
    const needed = Math.min(limit - selected.length, remaining.length);

    for (let slot = 0; slot < needed; slot += 1) {
      const position =
        needed === 1
          ? 0
          : Math.round((slot * (remaining.length - 1)) / (needed - 1));
      const candidate = remaining[position];
      if (!candidate || selectedIndexes.has(candidate.index)) continue;
      selected.push(candidate.item);
      selectedIndexes.add(candidate.index);
    }
  }

  return selected.slice(0, limit);
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
  return level === 'recordar'
    ? `¿Qué significa “${term}” según el material?`
    : `¿Cómo explicarías “${term}” con tus palabras según el material?`;
}

function isCleanAcademicLabel(value: string) {
  const text = cleanLine(value);
  if (text.length < 3 || text.length > 120) return false;
  if (/\|/.test(text)) return false;
  if (/^[#*•|]/u.test(text)) return false;
  if (/^¿|\?$/.test(text)) return false;
  if (text.split(/\s+/).length > 16) return false;
  return true;
}

function buildCanonicalFlashcards(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[],
  limit = 12
) {
  const cards: StudyFlashcard[] = [];
  const push = (card: StudyFlashcard) => {
    if (!cleanLine(card.front) || !cleanLine(card.back)) return;
    if (
      cards.some(
        (existing) =>
          normalizeForDedupe(existing.front) === normalizeForDedupe(card.front)
      )
    ) {
      return;
    }
    cards.push(card);
  };

  const concepts = selectDistributedByPages(
    model.concepts.filter(
      (concept) =>
        isCleanAcademicLabel(concept.term) &&
        cleanLine(concept.detail).length >= 20
    ),
    6,
    (concept) => concept.pageReferences
  );

  concepts.forEach((concept, index) => {
    const level: StudyFlashcard['level'] =
      index < 2 ? 'recordar' : 'comprender';
    push({
      front:
        level === 'recordar'
          ? `¿Qué describe “${concept.term}” según el PDF?`
          : `¿Cómo explicarías “${concept.term}” con tus palabras?`,
      back: truncateAtWord(concept.detail, 420),
      level,
      reference: referenceFromPages(
        concept.pageReferences,
        concept.term,
        concept.detail,
        chunks
      ),
    });
  });

  selectDistributedByPages(
    model.classifications.filter(
      (item) =>
        isCleanAcademicLabel(item.title) &&
        item.items.length >= 2 &&
        item.items.length <= 10
    ),
    2,
    (item) => item.pageReferences
  ).forEach((classification) => {
    push({
      front: `¿Cómo se clasifica “${classification.title}” según el PDF?`,
      back: classification.items.map((item) => `• ${cleanLine(item)}`).join('\n'),
      level: 'comprender',
      reference: referenceFromPages(
        classification.pageReferences,
        classification.title,
        classification.items.join(', '),
        chunks
      ),
    });
  });

  selectDistributedByPages(
    model.processes.filter(
      (item) => isCleanAcademicLabel(item.title) && item.steps.length >= 2
    ),
    2,
    (item) => item.pageReferences
  ).forEach((process) => {
    push({
      front: `¿Cuáles son los pasos de “${process.title}”?`,
      back: process.steps.map((step, index) => `${index + 1}. ${cleanLine(step)}`).join('\n'),
      level: 'comprender',
      reference: referenceFromPages(
        process.pageReferences,
        process.title,
        process.steps.join(' → '),
        chunks
      ),
    });
  });

  model.formulas
    .filter(
      (formula) =>
        isCleanAcademicLabel(formula.expression) &&
        cleanLine(formula.description).length >= 12
    )
    .slice(0, 1)
    .forEach((formula) => {
      push({
        front: `¿Qué representa o para qué se usa “${formula.expression}”?`,
        back: truncateAtWord(formula.description, 420),
        level: 'comprender',
        reference: referenceFromPages(
          formula.pageReferences,
          formula.expression,
          formula.description,
          chunks
        ),
      });
    });

  selectDistributedByPages(
    model.relationships.filter(
      (item) =>
        isCleanAcademicLabel(item.source) &&
        isCleanAcademicLabel(item.target) &&
        cleanLine(item.description).length >= 20
    ),
    2,
    (item) => item.pageReferences
  ).forEach((relationship) => {
    push({
      front: `¿Qué relación establece el PDF entre “${relationship.source}” y “${relationship.target}”?`,
      back: truncateAtWord(relationship.description, 420),
      level: 'comprender',
      reference: referenceFromPages(
        relationship.pageReferences,
        `${relationship.source} → ${relationship.target}`,
        relationship.description,
        chunks
      ),
    });
  });

  return cards.slice(0, limit);
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

  return truncateAtWord(dedupeStrings(units).slice(0, 4).join(' ') || cleanStudyUnit(body), 480);
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
      const options = placeCorrectOption(correctAnswer, distractors, index % 4).slice(0, 4);
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
  const selected = selectDistributedByPages(concepts, 10, (concept) => concept.pageReferences);

  return selected
    .map((concept, index): StudyQuestion => {
      const correct = truncateAtWord(concept.detail, 210);
      const candidates = concepts.filter((candidate) => candidate.term !== concept.term);
      const distractors = rankSemanticItems(
        `${concept.term} ${concept.detail}`,
        concept.pageReferences,
        candidates,
        (candidate) => `${candidate.term} ${candidate.detail}`,
        (candidate) => candidate.pageReferences,
        3
      ).map((candidate) => truncateAtWord(candidate.detail, 210));
      const options = placeCorrectOption(correct, distractors, index % 4).slice(0, 4);
      const level: StudyQuestion['level'] = index < 2 ? 'recordar' : 'comprender';

      return {
        id: `model-concept-${index + 1}`,
        type: 'multiple_choice',
        level,
        kind: 'concept',
        topic: concept.term,
        prompt:
          level === 'recordar'
            ? `Según el PDF, ¿qué describe correctamente “${concept.term}”?`
            : `¿Cuál de estas afirmaciones representa mejor “${concept.term}” según el material?`,
        options,
        answer: correct,
        explanation: `La respuesta conserva la descripción que el PDF asigna a “${concept.term}”. Los distractores provienen de conceptos cercanos del mismo material.`,
        reference: referenceFromPages(
          concept.pageReferences,
          concept.term,
          concept.detail,
          chunks
        ),
      };
    })
    .filter((question) => question.options.length >= 3);
}

function buildCanonicalRelationshipQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const relationships = model.relationships.filter(
    (item) => cleanLine(item.description).length >= 16
  );
  const selected = selectDistributedByPages(relationships, 9, (item) => item.pageReferences);

  return selected
    .map((item, index): StudyQuestion => {
      const correct = truncateAtWord(item.description, 190);
      const candidates = relationships.filter((candidate) => candidate !== item);
      const distractors = rankSemanticItems(
        `${item.source} ${item.target} ${item.description}`,
        item.pageReferences,
        candidates,
        (candidate) => `${candidate.source} ${candidate.target} ${candidate.description}`,
        (candidate) => candidate.pageReferences,
        3
      ).map((candidate) => truncateAtWord(candidate.description, 190));
      const options = placeCorrectOption(correct, distractors, (index + 1) % 4).slice(0, 4);
      const isCausal = CAUSAL_SIGNAL_PATTERN.test(item.description);

      return {
        id: `model-relationship-${index + 1}`,
        type: 'multiple_choice',
        level: isCausal ? 'aplicar' : 'comprender',
        kind: 'relationship',
        topic: `${item.source} ↔ ${item.target}`,
        prompt: isCausal
          ? `En una situación donde interviene “${item.source}”, ¿qué consecuencia o vínculo con “${item.target}” coincide con lo explicado en el PDF?`
          : `¿Qué relación establece el material entre “${item.source}” y “${item.target}”?`,
        options,
        answer: correct,
        explanation: `El PDF vincula explícitamente “${item.source}” con “${item.target}” de esta manera.`,
        reference: referenceFromPages(
          item.pageReferences,
          `${item.source} ${item.target}`,
          item.description,
          chunks
        ),
      };
    })
    .filter((question) => question.options.length >= 3);
}

function splitClassificationItem(value: string) {
  const cleaned = cleanLine(value);
  const separator = cleaned.indexOf(':');
  if (separator > 0 && separator < 80) {
    const label = cleanLine(cleaned.slice(0, separator));
    const detail = cleanLine(cleaned.slice(separator + 1));
    if (label && detail.length >= 8) return { label, detail };
  }
  return { label: cleaned, detail: '' };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractClassificationItemDetail(
  label: string,
  pages: number[] | undefined,
  chunks: PedagogicalChunk[]
) {
  const pageSet = new Set((pages ?? []).filter((page) => page > 0));
  const candidates = chunks.filter(
    (chunk) =>
      pageSet.size === 0 ||
      (chunk.pageStart !== null && pageSet.has(chunk.pageStart)) ||
      (chunk.pageEnd !== null && pageSet.has(chunk.pageEnd))
  );
  const pattern = new RegExp(`${escapeRegExp(label)}\\s*[:–—-]\\s*([^\\n•|]{12,260})`, 'i');

  for (const chunk of candidates) {
    const match = chunk.text.match(pattern);
    const detail = cleanLine(match?.[1] ?? '').split(/(?<=[.!?])\s+/)[0] ?? '';
    if (detail.length >= 12) return truncateAtWord(detail, 190);
  }

  return '';
}

function buildCanonicalClassificationQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const eligible = model.classifications.filter((classification) => classification.items.length >= 3);
  const selected = selectDistributedByPages(eligible, 10, (classification) => classification.pageReferences);

  return selected
    .map((classification, index): StudyQuestion | null => {
      const entries = classification.items
        .map(splitClassificationItem)
        .map((entry) => ({
          ...entry,
          detail:
            entry.detail ||
            extractClassificationItemDetail(entry.label, classification.pageReferences, chunks),
        }));
      const withEvidence = entries.filter(
        (entry) => entry.label.length >= 2 && entry.detail.length >= 12
      );
      if (withEvidence.length === 0) return null;

      const correct = withEvidence[index % withEvidence.length];
      const labels = dedupeStrings(entries.map((entry) => entry.label));
      const distractors = labels.filter(
        (label) => normalizeForDedupe(label) !== normalizeForDedupe(correct.label)
      );
      const options = placeCorrectOption(correct.label, distractors, (index + 2) % 4).slice(0, 4);
      if (options.length < 3) return null;

      return {
        id: `model-classification-${index + 1}`,
        type: 'multiple_choice',
        level: 'aplicar',
        kind: 'classification',
        topic: classification.title,
        prompt: `Un caso del material se describe así: “${truncateAtWord(correct.detail, 175)}”. Dentro de “${classification.title}”, ¿a qué categoría corresponde?`,
        options,
        answer: correct.label,
        explanation: `La descripción corresponde a “${correct.label}” dentro de la clasificación “${classification.title}”. Las alternativas pertenecen a esa misma clasificación.`,
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

function processScenarioSteps(title: string, steps: string[]) {
  const titleWords = getContextWords(title);
  const cueFree = steps
    .map(cleanLine)
    .filter((step) => step.length >= 12)
    .filter((step) => countSharedWords(titleWords, getContextWords(step)) === 0);

  return cueFree.length >= 2 ? cueFree.slice(0, 3) : [];
}

function buildCanonicalProcessQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const eligible = model.processes.filter((process) => process.steps.length >= 2);
  const selected = selectDistributedByPages(eligible, 8, (process) => process.pageReferences);

  return selected
    .map((process, index): StudyQuestion | null => {
      const scenarioSteps = processScenarioSteps(process.title, process.steps);
      if (scenarioSteps.length < 2) return null;

      const candidates = eligible.filter((candidate) => candidate !== process);
      const distractors = rankSemanticItems(
        `${process.title} ${process.steps.join(' ')}`,
        process.pageReferences,
        candidates,
        (candidate) => `${candidate.title} ${candidate.steps.join(' ')}`,
        (candidate) => candidate.pageReferences,
        3
      ).map((candidate) => candidate.title);
      const options = placeCorrectOption(process.title, distractors, index % 4).slice(0, 4);
      if (options.length < 3) return null;

      return {
        id: `model-process-${index + 1}`,
        type: 'multiple_choice',
        level: 'aplicar',
        kind: 'process',
        topic: process.title,
        prompt: `En una situación se observan estas acciones: ${scenarioSteps
          .map((step) => `“${truncateAtWord(step, 105)}”`)
          .join(' → ')}. ¿Qué proceso del PDF describe mejor el caso?`,
        options,
        answer: process.title,
        explanation: `Las acciones forman parte del proceso “${process.title}” tal como está organizado en el material.`,
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

function isPhFormula(expression: string) {
  const normalized = normalizeForDedupe(expression);
  return normalized.includes('ph') && normalized.includes('log');
}

function buildCanonicalFormulaQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  return model.formulas
    .slice(0, 5)
    .map((formula, index): StudyQuestion | null => {
      if (isPhFormula(formula.expression)) {
        const exponent = 5;
        const correct = String(exponent);
        const distractors = ['3', '7', '10'];
        return {
          id: `model-formula-${index + 1}`,
          type: 'multiple_choice',
          level: 'aplicar',
          kind: 'formula',
          topic: formula.expression,
          prompt: `Una solución tiene [H+] = 10⁻${exponent}. Aplicando “${formula.expression}”, ¿qué valor de pH corresponde?`,
          options: placeCorrectOption(correct, distractors, (index + 1) % 4),
          answer: correct,
          explanation: `La expresión del PDF define el pH como el logaritmo negativo de la concentración de H+. Para 10⁻${exponent}, el resultado es ${exponent}.`,
          reference: referenceFromPages(
            formula.pageReferences,
            formula.expression,
            formula.description,
            chunks
          ),
        };
      }

      if (
        normalizeForDedupe(formula.description).includes(normalizeForDedupe(formula.expression))
      ) {
        return null;
      }

      const distractors = model.formulas
        .filter((candidate) => candidate !== formula)
        .map((candidate) => candidate.expression);
      const options = placeCorrectOption(formula.expression, distractors, (index + 1) % 4).slice(0, 4);
      if (options.length < 3) return null;

      return {
        id: `model-formula-${index + 1}`,
        type: 'multiple_choice',
        level: 'comprender',
        kind: 'formula',
        topic: formula.expression,
        prompt: `El material describe: “${truncateAtWord(formula.description, 170)}”. ¿Qué expresión o magnitud corresponde?`,
        options,
        answer: formula.expression,
        explanation: `La descripción es la que el PDF asocia con “${formula.expression}”.`,
        reference: referenceFromPages(
          formula.pageReferences,
          formula.expression,
          formula.description,
          chunks
        ),
      };
    })
    .filter((question): question is StudyQuestion => Boolean(question));
}

function comparisonSubject(claim: string) {
  return cleanLine(claim)
    .replace(/^diferencias?\s+(?:funcionales?\s+y\s+estructurales?\s+)?entre\s+/i, '')
    .replace(/^diferencias?\s+entre\s+/i, '')
    .replace(/[.]$/, '');
}

function buildCanonicalComparisonQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
) {
  const claims = model.examRelevantClaims.filter((claim) => COMPARISON_SIGNAL_PATTERN.test(claim));

  return claims.slice(0, 4).map((claim, index): StudyQuestion => {
    const reference = referenceFromBinding(
      model,
      'exam_relevant_claim',
      claim,
      'Comparación',
      chunks,
      claim
    );
    const subject = comparisonSubject(claim);

    return {
      id: `model-comparison-${index + 1}`,
      type: 'open',
      level: 'comprender',
      kind: 'relationship',
      topic: truncateAtWord(subject || claim, 100),
      prompt: `Compará ${subject || 'los elementos señalados'} según el PDF. Explicá qué los distingue usando los criterios que presenta el material.`,
      options: [],
      answer: truncateAtWord(reference.excerpt || claim, 480),
      explanation:
        'Una respuesta sólida debe establecer diferencias concretas respaldadas por el PDF, no limitarse a nombrar las alternativas.',
      reference,
    };
  });
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
    prompt: `Aclará con tus palabras esta confusión que el material considera importante: “${truncateAtWord(confusion, 180)}”`,
    options: [],
    answer: truncateAtWord(confusion, 420),
    explanation:
      'Una respuesta sólida debe distinguir con precisión los conceptos que el PDF señala como fáciles de confundir.',
    reference: referenceFromBinding(
      model,
      'confusion',
      confusion,
      'Confusión frecuente',
      chunks,
      confusion
    ),
  }));
}

function buildOpenSectionQuestions(
  summary: StudentMaterialSummary,
  chunks: PedagogicalChunk[]
) {
  return summary.sections.slice(0, 4).map((section, index): StudyQuestion => ({
    id: `section-open-${index + 1}`,
    type: 'open',
    level: 'comprender',
    kind: 'section',
    topic: section.title,
    prompt: `Explicá con tus palabras la idea central de “${section.title}” y relacioná al menos dos conceptos del material.`,
    options: [],
    answer: buildExpectedSectionAnswer(section.body),
    explanation:
      'Una respuesta sólida debe explicar la idea central y conectar conceptos del material, no limitarse a copiar frases aisladas.',
    reference: findReference(section.title, chunks, emptyReference(section.title, section.body)),
  }));
}

function selectMiniExamQuestions(questions: StudyQuestion[], limit = 8) {
  const selected: StudyQuestion[] = [];
  const selectedIds = new Set<string>();
  const selectedTopics = new Set<string>();
  const selectedPages = new Set<number>();
  const selectedKinds = new Set<StudyQuestion['kind']>();

  const quotaRecordar = Math.max(1, Math.round(limit * 0.25));
  const quotaAplicar = Math.max(1, Math.round(limit * 0.375));
  const quotaComprender = Math.max(0, limit - quotaRecordar - quotaAplicar);

  const kindPriority: Record<StudyQuestion['level'], Array<StudyQuestion['kind']>> = {
    recordar: ['concept', 'classification', 'formula'],
    comprender: ['relationship', 'formula', 'classification', 'confusion', 'section', 'concept'],
    aplicar: ['classification', 'process', 'relationship', 'formula', 'concept'],
  };

  const scoreCandidate = (question: StudyQuestion) => {
    let score = question.type === 'multiple_choice' ? 5 : 1;
    if (question.topic && !selectedTopics.has(normalizeForDedupe(question.topic))) score += 5;
    if (question.reference.pageStart && !selectedPages.has(question.reference.pageStart)) score += 4;
    if (question.kind && !selectedKinds.has(question.kind)) score += 2;
    if (question.kind === 'confusion' && selected.some((item) => item.kind === 'confusion')) score -= 30;
    if (question.type === 'open' && selected.filter((item) => item.type === 'open').length >= 2) score -= 20;
    return score;
  };

  const pushBest = (level: StudyQuestion['level'], target: number) => {
    for (let count = 0; count < target && selected.length < limit; count += 1) {
      const candidates = questions
        .filter((question) => question.level === level && !selectedIds.has(question.id))
        .map((question, index) => ({
          question,
          index,
          kindRank: Math.max(0, kindPriority[level].indexOf(question.kind)),
          score: scoreCandidate(question),
        }))
        .sort(
          (left, right) =>
            right.score - left.score || left.kindRank - right.kindRank || left.index - right.index
        );
      const match = candidates[0]?.question;
      if (!match) break;
      selected.push(match);
      selectedIds.add(match.id);
      if (match.topic) selectedTopics.add(normalizeForDedupe(match.topic));
      if (match.reference.pageStart) selectedPages.add(match.reference.pageStart);
      if (match.kind) selectedKinds.add(match.kind);
    }
  };

  pushBest('recordar', quotaRecordar);
  pushBest('comprender', quotaComprender);
  pushBest('aplicar', quotaAplicar);

  while (selected.length < limit) {
    const remaining = questions
      .filter((question) => !selectedIds.has(question.id))
      .map((question, index) => ({ question, index, score: scoreCandidate(question) }))
      .sort((left, right) => right.score - left.score || left.index - right.index);
    const match = remaining[0]?.question;
    if (!match) break;
    selected.push(match);
    selectedIds.add(match.id);
    if (match.topic) selectedTopics.add(normalizeForDedupe(match.topic));
    if (match.reference.pageStart) selectedPages.add(match.reference.pageStart);
    if (match.kind) selectedKinds.add(match.kind);
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
  const fallbackFlashcards = concepts.slice(0, 12).map(
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

  const model = input.canonicalModel;
  const canonicalFlashcards = model
    ? buildCanonicalFlashcards(model, chunks, 12)
    : [];
  const flashcards = [
    ...canonicalFlashcards,
    ...fallbackFlashcards.filter(
      (candidate) =>
        !canonicalFlashcards.some(
          (card) =>
            normalizeForDedupe(card.front) === normalizeForDedupe(candidate.front)
        )
    ),
  ].slice(0, 12);

  const modelQuestions = model
    ? [
        ...buildCanonicalConceptQuestions(model, chunks),
        ...buildCanonicalRelationshipQuestions(model, chunks),
        ...buildCanonicalClassificationQuestions(model, chunks),
        ...buildCanonicalProcessQuestions(model, chunks),
        ...buildCanonicalFormulaQuestions(model, chunks),
        ...buildCanonicalComparisonQuestions(model, chunks),
        ...buildCanonicalConfusionQuestions(model, chunks),
      ]
    : [];

  const fallbackQuestions = [
    ...(modelQuestions.length < 12
      ? buildFallbackMultipleChoice(concepts, chunks, sectionTitles)
      : []),
    ...buildOpenSectionQuestions(input.summary, chunks),
  ];

  const questions = dedupeQuestions([...modelQuestions, ...fallbackQuestions]);
  const miniExam = selectMiniExamQuestions(questions, 8);
  const allItems = [...flashcards, ...questions];

  return {
    flashcards,
    questions,
    miniExamQuestionIds: miniExam.map((question) => question.id),
    coverage: {
      conceptsUsed: model?.concepts.length ?? concepts.length,
      sectionsUsed: Math.min(4, input.summary.sections.length),
      referencedItems: allItems.filter((item) => item.reference.excerpt.length > 0).length,
      totalItems: allItems.length,
    },
  };
}
