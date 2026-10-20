import { hasSourceContradictedCausalDirection } from '@/lib/student-materials/answer-integrity';
import type {
  CanonicalPedagogicalModel,
  CanonicalPedagogicalSourceKind,
  StudyGlossaryItem,
  StudentMaterialSummary,
  StudySummarySection,
} from '@/lib/student-materials/types';
import {
  resolveQuestionBankTarget,
  resolveQuestionCategoryFactor,
  selectBalancedQuestionBank,
  selectSourceDistributedItems,
} from '@/lib/student-materials/question-bank';

export const PEDAGOGICAL_ARTIFACTS_VERSION = 12;

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

/**
 * El número de posición (model-concept-1) podía referirse a otra pregunta al
 * regenerar un PDF. Identificadores ligados al contenido preservan los
 * intentos sólo cuando la pregunta y respuesta realmente siguen iguales.
 * El prefijo v11 separa los registros de las versiones previas.
 */
function contentStableQuestionId(question: StudyQuestion) {
  const content = [
    question.kind,
    question.type,
    question.topic ?? '',
    question.prompt,
    question.answer,
    question.reference.pageStart ?? '',
  ].map(String).map(normalizeForDedupe).join('|');
  let hash = 2166136261;
  let second = 16777619;
  for (let index = 0; index < content.length; index += 1) {
    hash = Math.imul(hash ^ content.charCodeAt(index), 16777619) >>> 0;
    second = Math.imul(second + content.charCodeAt(index), 2246822519) >>> 0;
  }
  return `q-v11-${question.kind}-${hash.toString(36)}-${second.toString(36)}`;
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
const COMPARISON_SIGNAL_PATTERN = /\b(?:diferencias?|compar(?:a|á|ar|ación|acion)|frente\s+a|versus|vs\.?|contrastar?)\b/i;
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
  kind?: 'concept' | 'classification' | 'process' | 'formula' | 'relationship';
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
  // Asociación verificada con un capítulo concreto del resumen, distinta
  // del concepto específico que sigue figurando en "topic".
  chapterTitle?: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  reference: PedagogicalReference;
};
export type PedagogicalArtifacts = {
  integrity?: { rejectedQuestions: number; rejectedFlashcards: number; rejectedReasons: string[] };
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

/**
 * Encuentra un pasaje LITERAL de la misma página que reúna términos del
 * concepto y la respuesta. Nunca fabrica una cita desde la paráfrasis.
 * Devolver null si no hay suficiente coincidencia: no es un verificador
 * semántico, solamente una pista de procedencia verificable.
 */
export function findGroundedSourceExcerpt(
  chunks: PedagogicalChunk[],
  pageReferences: number[],
  subject: string,
  description: string
): PedagogicalReference | null {
  const pages = new Set(pageReferences.filter((page) => Number.isInteger(page) && page > 0));
  if (pages.size === 0) return null;
  const stop = new Set([
    'material', 'pagina', 'segun', 'sobre', 'entre', 'desde', 'hasta',
    'puede', 'pueden', 'porque', 'tambien', 'donde', 'cuando', 'todos',
    'todas', 'otros', 'otras', 'parte', 'forma', 'mismo', 'misma',
    'dentro', 'deben', 'deber', 'para', 'como', 'este', 'esta', 'estos',
    'estas', 'seran', 'tiene', 'tienen', 'realizar', 'relacion', 'acuerdo'
  ]);
  const keywords = (value: string) => [...new Set(
    normalizeForDedupe(value).split(/\s+/)
      .filter((word) => word.length >= 5 && !stop.has(word))
  )];
  const topic = keywords(subject);
  const answer = keywords(description).slice(0, 32);
  let found: PedagogicalChunk | null = null;
  let foundScore = -1;
  let anchorWord = '';

  for (const chunk of chunks) {
    if (chunk.pageStart === null || !pages.has(chunk.pageStart)) continue;
    const normalized = normalizeForDedupe(chunk.text);
    const topicHits = topic.filter((word) => normalized.includes(word));
    const answerHits = answer.filter((word) => normalized.includes(word));
    const matches = new Set([...topicHits, ...answerHits]);
    if (matches.size < 2 || (topicHits.length === 0 && answerHits.length < 3)) continue;
    const score = topicHits.length * 4 + answerHits.length +
      Math.min(1, chunk.text.length / 1000);
    if (score <= foundScore) continue;
    found = chunk;
    foundScore = score;
    anchorWord = topicHits[0] ?? answerHits[0] ?? '';
  }
  if (!found) return null;
  const near = normalizeForDedupe(found.text).indexOf(anchorWord);
  // El offset normalizado es aproximado con acentos, pero el slice se toma
  // directamente del texto original y sigue siendo una cita literal.
  const start = Math.max(0, near - 60);
  const original = found.text.slice(start, start + 260);
  return {
    pageStart: found.pageStart,
    pageEnd: found.pageEnd ?? found.pageStart,
    sectionTitle: found.sectionTitle,
    excerpt: truncateAtWord(original, 220),
  };
}

function referenceFromPages(
  pages: number[] | undefined,
  sectionTitle: string | null,
  excerpt: string,
  chunks: PedagogicalChunk[]
) {
  const pageNumbers = (pages ?? []).filter((page) => Number.isFinite(page) && page > 0);
  if (pageNumbers.length > 0) {
    const grounded = findGroundedSourceExcerpt(
      chunks, pageNumbers, sectionTitle ?? '', excerpt
    );
    if (grounded) return grounded;
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
  return selectSourceDistributedItems(items, limit, getPages);
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

function isAdministrativeCanonicalConcept(
  model: CanonicalPedagogicalModel,
  concept: CanonicalPedagogicalModel['concepts'][number]
) {
  const term = normalizeForDedupe(concept.term);
  const modelTitle = normalizeForDedupe(model.title);
  const detail = normalizeForDedupe(concept.detail);

  if (term && modelTitle && (term === modelTitle || modelTitle.includes(term))) {
    return true;
  }

  return /^(?:asignatura|materia|titulo|autor|documento)\b/u.test(detail) ||
    /(?:asignatura|materia) correspondiente al material de estudio/u.test(detail);
}

const MIN_FLASHCARD_TARGET = 12;
const MAX_FLASHCARD_TARGET = 80;

export function resolveFlashcardLimit(input: {
  canonicalModel?: CanonicalPedagogicalModel | null;
  glossary: StudyGlossaryItem[];
}) {
  const model = input.canonicalModel;

  if (!model) {
    const glossaryItems = input.glossary.filter(isPedagogicalGlossaryItem).length;
    if (glossaryItems <= 12) return MIN_FLASHCARD_TARGET;
    if (glossaryItems <= 24) return 16;
    if (glossaryItems <= 40) return 20;
    if (glossaryItems <= 60) return 24;
    return MAX_FLASHCARD_TARGET;
  }

  const concepts = model.concepts.filter(
    (concept) =>
      !isAdministrativeCanonicalConcept(model, concept) &&
      isCleanAcademicLabel(concept.term) &&
      cleanLine(concept.detail).length >= 20
  ).length;
  const classifications = model.classifications.filter(
    (item) =>
      isCleanAcademicLabel(item.title) &&
      item.items.length >= 2 &&
      item.items.length <= 10
  ).length;
  const processes = model.processes.filter(
    (item) => isCleanAcademicLabel(item.title) && item.steps.length >= 2
  ).length;
  const formulas = model.formulas.filter(
    (item) =>
      isCleanAcademicLabel(item.expression) &&
      cleanLine(item.description).length >= 12
  ).length;
  const relationships = model.relationships.filter(
    (item) =>
      isCleanAcademicLabel(item.source) &&
      isCleanAcademicLabel(item.target) &&
      cleanLine(item.description).length >= 20
  ).length;

  // No usamos páginas como proxy directo: la cantidad depende de unidades
  // académicas utilizables. Estructuras y procesos pesan más porque suelen
  // necesitar recuperación activa propia; relaciones se amortiguan para no
  // inflar PDFs con muchos vínculos redundantes.
  const academicDensity =
    concepts +
    classifications * 2 +
    processes * 2 +
    formulas +
    Math.min(relationships, Math.max(concepts, 12)) * 0.5;

  if (academicDensity <= 30) return MIN_FLASHCARD_TARGET;
  if (academicDensity <= 60) return 16;
  if (academicDensity <= 100) return 20;
  if (academicDensity <= 160) return 24;
  if (academicDensity <= 240) return 45;
  if (academicDensity <= 360) return 60;
  return MAX_FLASHCARD_TARGET;
}

function flashcardSubjectKey(card: StudyFlashcard) {
  const quoted = card.front.match(/[“"]([^”"]+)[”"]/u)?.[1];
  return normalizeForDedupe(quoted || card.front);
}

function selectBalancedFlashcards(cards: StudyFlashcard[], limit: number) {
  const kinds: Array<NonNullable<StudyFlashcard['kind']>> = [
    'concept',
    'classification',
    'process',
    'formula',
    'relationship',
  ];
  const byKind = new Map(
    kinds.map((kind) => [kind, cards.filter((card) => card.kind === kind)] as const)
  );
  const cursors = new Map<NonNullable<StudyFlashcard['kind']>, number>(
    kinds.map((kind) => [kind, 0])
  );
  const selected: StudyFlashcard[] = [];
  const cadence: Array<NonNullable<StudyFlashcard['kind']>> = [
    'concept',
    'concept',
    'classification',
    'process',
    'relationship',
    'formula',
  ];

  while (selected.length < limit) {
    let added = false;

    for (const kind of cadence) {
      if (selected.length >= limit) break;
      const group = byKind.get(kind) ?? [];
      const cursor = cursors.get(kind) ?? 0;
      const card = group[cursor];
      if (!card) continue;

      selected.push(card);
      cursors.set(kind, cursor + 1);
      added = true;
    }

    if (!added) break;
  }

  return selected;
}

function buildCanonicalFlashcards(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[],
  limit = MIN_FLASHCARD_TARGET
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
        !isAdministrativeCanonicalConcept(model, concept) &&
        isCleanAcademicLabel(concept.term) &&
        cleanLine(concept.detail).length >= 20
    ),
    limit,
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
      kind: 'concept',
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
    limit,
    (item) => item.pageReferences
  ).forEach((classification) => {
    push({
      front: `¿Cómo se clasifica “${classification.title}” según el PDF?`,
      back: classification.items.map((item) => `• ${cleanLine(item)}`).join('\n'),
      level: 'comprender',
      kind: 'classification',
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
    limit,
    (item) => item.pageReferences
  ).forEach((process) => {
    push({
      front: `¿Cuáles son los pasos de “${process.title}”?`,
      back: process.steps.map((step, index) => `${index + 1}. ${cleanLine(step)}`).join('\n'),
      level: 'comprender',
      kind: 'process',
      reference: referenceFromPages(
        process.pageReferences,
        process.title,
        process.steps.join(' → '),
        chunks
      ),
    });
  });

  selectDistributedByPages(
    model.formulas.filter(
      (formula) =>
        isCleanAcademicLabel(formula.expression) &&
        cleanLine(formula.description).length >= 12
    ),
    limit,
    (formula) => formula.pageReferences
  ).forEach((formula) => {
      push({
        front: `¿Qué representa o para qué se usa “${formula.expression}”?`,
        back: truncateAtWord(formula.description, 420),
        level: 'comprender',
        kind: 'formula',
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
        cleanLine(item.description).length >= 20 &&
        !hasSourceContradictedCausalDirection(item, chunks)
    ),
    limit,
    (item) => item.pageReferences
  ).forEach((relationship) => {
    push({
      front: `¿Qué relación establece el PDF entre “${relationship.source}” y “${relationship.target}”?`,
      back: truncateAtWord(relationship.description, 420),
      level: 'comprender',
      kind: 'relationship',
      reference: referenceFromPages(
        relationship.pageReferences,
        `${relationship.source} → ${relationship.target}`,
        relationship.description,
        chunks
      ),
    });
  });

  return selectBalancedFlashcards(cards, limit);
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

type CanonicalEvidence = {
  label: string;
  detail: string;
  score: number;
};

function significantTerms(value: string) {
  return normalizeForDedupe(value)
    .split(/\s+/)
    .filter(
      (term) =>
        term.length >= 3 &&
        !CONTEXT_STOP_WORDS.has(term)
    );
}

function canonicalEvidenceCandidates(model: CanonicalPedagogicalModel) {
  return [
    ...model.topics.map((topic) => ({
      label: topic.title,
      detail: topic.description,
    })),
    ...model.concepts.map((concept) => ({
      label: concept.term,
      detail: concept.detail,
    })),
    ...model.relationships.flatMap((relationship) => [
      {
        label: relationship.source,
        detail: relationship.description,
      },
      {
        label: relationship.target,
        detail: relationship.description,
      },
    ]),
    ...model.classifications.map((classification) => ({
      label: classification.title,
      detail: `Incluye ${classification.items.join(', ')}.`,
    })),
    ...model.processes.map((process) => ({
      label: process.title,
      detail: `Se desarrolla en esta secuencia: ${process.steps.join(' → ')}.`,
    })),
    ...model.formulas.map((formula) => ({
      label: formula.expression,
      detail: formula.description,
    })),
  ].filter(
    (candidate) =>
      cleanLine(candidate.label).length >= 2 &&
      cleanLine(candidate.detail).length >= 8
  );
}

function findExactCanonicalEvidence(
  model: CanonicalPedagogicalModel,
  query: string
): CanonicalEvidence | null {
  const needle = normalizeForDedupe(query);
  // Aclaraciones entre paréntesis no forman parte del nombre del concepto:
  // "doxa (conocimiento vulgar)" debe poder encontrar "Doxa".
  // No se hacen coincidencias parciales ni de similitud: podrían asignar
  // una definición de otro concepto al alumno.
  const withoutClarification = normalizeForDedupe(
    query.replace(/\([^)]*\)/g, ' ')
  );
  const aliases = new Set([needle, withoutClarification].filter(Boolean));
  const candidate = canonicalEvidenceCandidates(model).find(
    (item) => aliases.has(normalizeForDedupe(item.label))
  );
  return candidate ? { ...candidate, score: 100 } : null;
}

function findCanonicalEvidence(
  model: CanonicalPedagogicalModel,
  query: string
): CanonicalEvidence | null {
  const normalizedQuery = normalizeForDedupe(query);
  const queryTerms = significantTerms(query);
  if (!normalizedQuery || queryTerms.length === 0) return null;

  const ranked = canonicalEvidenceCandidates(model)
    .map((candidate) => {
      const normalizedLabel = normalizeForDedupe(candidate.label);
      const normalizedText = normalizeForDedupe(
        `${candidate.label} ${candidate.detail}`
      );
      const overlap = queryTerms.filter((term) =>
        normalizedText.includes(term)
      ).length;
      let score = overlap * 2;

      if (
        normalizedLabel &&
        (normalizedQuery.includes(normalizedLabel) ||
          normalizedLabel.includes(normalizedQuery))
      ) {
        score += 8;
      }

      if (overlap === queryTerms.length) score += 3;

      return { ...candidate, score };
    })
    .sort((left, right) => right.score - left.score);

  return ranked[0] && ranked[0].score >= 3 ? ranked[0] : null;
}

function cleanComparisonEntity(value: string) {
  return cleanLine(value)
    .replace(/[.;,:]+$/u, '')
    .replace(
      /\s+(?:respecto\s+a|seg[uú]n|en\s+relaci[oó]n\s+con)\s+.+$/iu,
      ''
    )
    .trim();
}

type ComparisonPair = {
  left: string;
  right: string;
};

function isUsableComparisonEntity(value: string) {
  const cleaned = cleanComparisonEntity(value);
  const words = cleaned.split(/\s+/).filter(Boolean);
  return cleaned.length >= 3 && cleaned.length <= 120 && words.length <= 16;
}

function extractComparisonPair(claim: string): ComparisonPair | null {
  const cleaned = cleanLine(claim)
    .replace(/^pregunta\s+t[ií]pica\s+de\s+examen:\s*/iu, '')
    .replace(/[.]$/u, '');

  const patterns = [
    /^diferencias?\s+(?:[^,]{0,60}\s+)?entre\s+(.+?)\s+(?:y|e|versus|vs\.?|frente\s+a)\s+(.+)$/iu,
    /^diferencias?\s+(.+?)\s+(?:y|e|versus|vs\.?|frente\s+a)\s+(.+)$/iu,
    /^compar(?:a|á|ar|ación|acion)(?:\s+de|\s+entre)?\s+(.+?)\s+(?:y|e|versus|vs\.?|frente\s+a)\s+(.+)$/iu,
    /^(.+?)\s+(?:versus|vs\.?|frente\s+a)\s+(.+)$/iu,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    const left = cleanComparisonEntity(match?.[1] ?? '');
    const right = cleanComparisonEntity(match?.[2] ?? '');
    if (
      left &&
      right &&
      normalizeForDedupe(left) !== normalizeForDedupe(right) &&
      isUsableComparisonEntity(left) &&
      isUsableComparisonEntity(right)
    ) {
      return { left, right };
    }
  }

  return null;
}

function entitySupportedByReference(
  entity: string,
  reference: PedagogicalReference
) {
  const terms = significantTerms(entity);
  if (terms.length === 0) return false;
  const evidence = normalizeForDedupe(reference.excerpt);
  const matched = terms.filter((term) => evidence.includes(term)).length;
  return matched >= Math.max(1, Math.ceil(terms.length / 2));
}

function comparisonEntitySupported(
  model: CanonicalPedagogicalModel,
  entity: string,
  reference: PedagogicalReference
) {
  return Boolean(
    findCanonicalEvidence(model, entity) ||
      entitySupportedByReference(entity, reference)
  );
}

function buildExpectedComparisonAnswer(
  model: CanonicalPedagogicalModel,
  pair: ComparisonPair
): string | null {
  // No se deben construir respuestas modelo mezclando conceptos elegidos por
  // parecido de palabras. Una comparación exige evidencia distinta para ambos.
  const left = findExactCanonicalEvidence(model, pair.left);
  const right = findExactCanonicalEvidence(model, pair.right);
  if (!left || !right || normalizeForDedupe(left.detail) === normalizeForDedupe(right.detail)) {
    return null;
  }
  return truncateAtWord(
    `“${pair.left}” se caracteriza en el material por: ${left.detail} En cambio, “${pair.right}” se caracteriza por: ${right.detail}`,
    480
  );
}

function extractConfusionPair(confusion: string): ComparisonPair | null {
  const match = cleanLine(confusion).match(
    /^(?:no\s+)?confundir\s+(.+?)\s+con\s+(.+?)(?:[.;,]|$)/iu
  );
  if (!match?.[1] || !match[2]) return null;

  const left = cleanComparisonEntity(match[1]);
  const right = cleanComparisonEntity(match[2]);
  if (
    !isUsableComparisonEntity(left) ||
    !isUsableComparisonEntity(right) ||
    normalizeForDedupe(left) === normalizeForDedupe(right)
  ) {
    return null;
  }

  return { left, right };
}

function buildExpectedConfusionAnswer(
  model: CanonicalPedagogicalModel,
  confusion: string,
  _reference: PedagogicalReference
) {
  const pair = extractConfusionPair(confusion);
  if (pair) {
    const left = findExactCanonicalEvidence(model, pair.left);
    const right = findExactCanonicalEvidence(model, pair.right);

    // Si no se pueden contrastar dos conceptos distintos, omitir la respuesta:
    // una definición repetida para ambos enseña justamente la confusión.
    if (!left || !right || normalizeForDedupe(left.detail) === normalizeForDedupe(right.detail)) {
      return null;
    }
    return truncateAtWord(
      `La distinción clave es esta: “${pair.left}” ${left.detail} En cambio, “${pair.right}” ${right.detail}`,
      480
    );
  }

  const misconception = cleanLine(confusion).match(
    /^creer\s+que\s+(.+?)(?:,?\s+(?:cuando|pero|aunque|porque|ya\s+que)\s+)(.+)$/iu
  );
  if (misconception?.[1] && misconception[2]) {
    return truncateAtWord(
      `La confusión está en asumir que ${misconception[1]}. El material aclara que ${misconception[2]}.`,
      480
    );
  }

  // Si no hay respaldo verificable, omitir en vez de enseñar una definición ajena.
  return null;
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
      const level = 'recordar' as const;

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
  chunks: PedagogicalChunk[],
  limit = 10
) {
  const concepts = model.concepts.filter(
    (concept) => cleanLine(concept.term).length >= 3 && cleanLine(concept.detail).length >= 12
  );
  const selected = selectDistributedByPages(concepts, limit, (concept) => concept.pageReferences);

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
      const level: StudyQuestion['level'] = 'recordar';

      return {
        id: `model-concept-${index + 1}`,
        type: 'multiple_choice',
        level,
        kind: 'concept',
        topic: concept.term,
        prompt:
          index % 3 === 0
            ? `¿Qué significa “${concept.term}” en este material?`
            : index % 3 === 1
              ? `¿Con qué descripción se corresponde “${concept.term}” en tus apuntes?`
              : `Al estudiar “${concept.term}”, ¿qué característica permite reconocerlo?`,
        options,
        answer: correct,
        explanation: `En el material, “${concept.term}” se define como: ${correct}. Las demás opciones expresan definiciones de otros conceptos, no de éste.`,
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
  chunks: PedagogicalChunk[],
  limit = 9
) {
  const relationships = model.relationships.filter(
    (item) =>
      cleanLine(item.description).length >= 16 &&
      !hasSourceContradictedCausalDirection(item, chunks)
  );
  const selected = selectDistributedByPages(relationships, limit, (item) => item.pageReferences);

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
      // Reconocer una relación no demuestra transferencia a un caso nuevo.
      // Reservar "aplicar" para consignas con una tarea contextual verificable.
      const isCausal = CAUSAL_SIGNAL_PATTERN.test(item.description);

      return {
        id: `model-relationship-${index + 1}`,
        type: 'multiple_choice',
        level: 'comprender',
        kind: 'relationship',
        topic: `${item.source} ↔ ${item.target}`,
        prompt: isCausal
          ? `Si se considera “${item.source}”, ¿qué consecuencia para “${item.target}” sostiene el material?`
          : index % 3 === 0
            ? `¿Qué vínculo entre “${item.source}” y “${item.target}” permite explicar el PDF?`
            : index % 3 === 1
              ? `¿Por qué se relacionan “${item.source}” y “${item.target}” en este tema?`
              : `¿Qué sucede con “${item.target}” cuando se considera “${item.source}” según estos apuntes?`,
        options,
        answer: correct,
        explanation: `La relación presentada en el PDF es: ${correct}. Se vincula específicamente “${item.source}” con “${item.target}”.`,
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
  chunks: PedagogicalChunk[],
  limit = 10
) {
  const eligible = model.classifications.filter((classification) => classification.items.length >= 3);
  const selected = selectDistributedByPages(eligible, limit, (classification) => classification.pageReferences);

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
      // No convertir una lista de bullets pegados en un supuesto caso académico.
      const caseText = cleanLine(correct.detail.split(/[●★➔⇒]|\s{2,}(?=[A-ZÁÉÍÓÚ]{4,}\s*:)/u)[0] ?? '');
      if (caseText.length < 15 || caseText.length > 240) return null;
      const labels = dedupeStrings(entries.map((entry) => entry.label));
      const distractors = labels.filter(
        (label) => normalizeForDedupe(label) !== normalizeForDedupe(correct.label)
      );
      const options = placeCorrectOption(correct.label, distractors, (index + 2) % 4).slice(0, 4);
      if (options.length < 3) return null;

      return {
        id: `model-classification-${index + 1}`,
        type: 'multiple_choice',
        level: 'recordar',
        kind: 'classification',
        topic: classification.title,
        prompt: index % 2 === 0
          ? `¿Qué categoría de “${classification.title}” corresponde al criterio “${truncateAtWord(caseText, 130)}”?`
          : `En el tema “${classification.title}”, ¿qué nombre recibe la categoría caracterizada por “${truncateAtWord(caseText, 130)}”?`,
        options,
        answer: correct.label,
        explanation: `La característica “${truncateAtWord(caseText, 130)}” corresponde a “${correct.label}”. Para distinguir las demás categorías, compará los criterios originales de la clasificación.`,
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
  chunks: PedagogicalChunk[],
  limit = 8
) {
  const eligible = model.processes.filter((process) => process.steps.length >= 2);
  const selected = selectDistributedByPages(eligible, limit, (process) => process.pageReferences);

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
        // Identificar un proceso a partir de sus pasos comprueba
        // interpretación, no transferencia independiente a un caso nuevo.
        level: 'comprender',
        kind: 'process',
        topic: process.title,
        prompt: `En el material se organizan estos pasos: ${scenarioSteps
          .map((step) => `“${truncateAtWord(step, 105)}”`)
          .join(' → ')}. ¿Qué proceso explican en conjunto?`,
        options,
        answer: process.title,
        explanation: `La secuencia de acciones identifica “${process.title}”. El material lo organiza en estos pasos: ${truncateAtWord(process.steps.join(' → '), 260)}.`,
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
  chunks: PedagogicalChunk[],
  limit = 5
) {
  return model.formulas
    .slice(0, limit)
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

function buildCanonicalComparisonQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[],
  limit = 4
) {
  const questions = model.examRelevantClaims
    .filter((claim) => COMPARISON_SIGNAL_PATTERN.test(claim))
    .map((claim, index): StudyQuestion | null => {
      const pair = extractComparisonPair(claim);
      if (!pair) return null;

      const reference = referenceFromBinding(
        model,
        'exam_relevant_claim',
        claim,
        'Comparación',
        chunks,
        claim
      );

      if (
        !comparisonEntitySupported(model, pair.left, reference) ||
        !comparisonEntitySupported(model, pair.right, reference)
      ) {
        return null;
      }

      const answer = buildExpectedComparisonAnswer(model, pair);
      if (!answer) return null;

      return {
        id: `model-comparison-${index + 1}`,
        type: 'open',
        level: 'comprender',
        kind: 'relationship',
        topic: truncateAtWord(`${pair.left} ↔ ${pair.right}`, 100),
        prompt: `Compará “${pair.left}” con “${pair.right}” según el PDF. Explicá al menos una diferencia concreta usando los criterios del material.`,
        options: [],
        answer,
        explanation:
          'Una respuesta sólida debe definir ambos elementos, marcar una diferencia concreta y respaldarla con el criterio presentado en el PDF.',
        reference,
      };
    })
    .filter((question): question is StudyQuestion => Boolean(question));

  return questions.slice(0, limit);
}

function buildCanonicalConfusionQuestions(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[],
  limit = 3
) {
  return model.confusions.slice(0, limit).map((confusion, index): StudyQuestion | null => {
    const reference = referenceFromBinding(
      model,
      'confusion',
      confusion,
      'Confusión frecuente',
      chunks,
      confusion
    );
    const answer = buildExpectedConfusionAnswer(model, confusion, reference);
    if (!answer) return null;

    return {
      id: `model-confusion-${index + 1}`,
      type: 'open',
      level: 'comprender',
      kind: 'confusion',
      topic: 'Confusión frecuente',
      prompt: `Aclará con tus palabras esta confusión que el material considera importante: “${truncateAtWord(confusion, 180)}”`,
      options: [],
      answer,
      explanation:
        'Una respuesta sólida debe identificar qué interpretación es incorrecta y explicar la distinción correcta con apoyo en el PDF.',
      reference,
    };
  }).filter((question): question is StudyQuestion => Boolean(question));
}

function buildGroundedSectionQuestion(section: StudySummarySection, chunks: PedagogicalChunk[], index: number): StudyQuestion | null {
  // Respuesta extraída del MISMO apartado del capítulo. No usar palabras
  // parecidas o la página más próxima para traer definiciones externas.
  const lines = section.body.split(/\n+/).map(cleanStudyUnit).filter(Boolean);
  const opening = lines.findIndex(line =>
    !/^(?:ver en pdf|ideas clave|contenido complementario)/iu.test(line) &&
    line.length >= 65 && !/^#{1,6}\s/u.test(line)
  );
  if (opening < 0) return null;
  const anchor = lines.slice(0, opening).find(line =>
    /\d+(?:\.\d+)*\s+/.test(line) && line.length <= 130
  );
  const focus = anchor ? anchor.replace(/^\d+(?:\.\d+)*\s+/u, '') : section.title;
  const answer = truncateAtWord(lines[opening] ?? '', 460);
  if (answer.length < 65) return null;
  const reference = findReference(focus, chunks, emptyReference(section.title, answer));
  const prompts = [
    `Explicá con tus palabras qué plantea el apartado “${focus}”. ¿Qué idea central deberías recordar?`,
    `¿Qué sostiene el material sobre “${focus}”? Desarrollá la idea usando sus conceptos principales.`,
    `Si tuvieras que explicar “${focus}” a otro estudiante, ¿qué indicarías como fundamento principal?`,
    `¿Cómo presentarías el concepto central de “${focus}” sin repetir el texto de memoria?`,
  ];
  return {
    id: `section-open-${index + 1}`,
    type: 'open',
    level: 'comprender',
    kind: 'section',
    topic: section.title,
    // No afirmar una vinculación a capítulo como cita física si falta página.
    chapterTitle: reference.pageStart !== null ? section.title : undefined,
    prompt: prompts[index % prompts.length]!,
    options: [],
    answer,
    explanation: 'La respuesta modelo recupera el contenido del mismo apartado del PDF. Se espera una reformulación fiel a sus ideas, no una copia literal.',
    reference,
  };
}
function buildOpenSectionQuestions(
  summary: StudentMaterialSummary,
  chunks: PedagogicalChunk[],
  _model?: CanonicalPedagogicalModel | null,
  limit = 4
) {
  return summary.sections.slice(0, limit)
    .map((section, index) => buildGroundedSectionQuestion(section, chunks, index))
    .filter((question): question is StudyQuestion => Boolean(question));
}

/**
 * Reservar una pregunta corregible por capítulo siempre que un concepto
 * canónico esté presente de forma inequívoca en ese capítulo del resumen.
 *
 * La pertenencia sólo se asigna con coincidencia explícita y única del término
 * en el resumen; si el PDF no permite hacerlo con seguridad, el capítulo
 * permanece sin cobertura automática y así se informa en quality.
 */
function anchorAndCompleteChapterQuestions(
  questions: StudyQuestion[],
  summary: StudentMaterialSummary,
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
): StudyQuestion[] {
  const chapters = summary.sections;
  if (chapters.length === 0) return questions;
  const chapterTexts = chapters.map((section) =>
    ` ${normalizeForDedupe(section.body)} `
  );
  const uniqueChapterForConcept = (term: string) => {
    const normalized = normalizeForDedupe(term);
    if (normalized.length < 7 || normalized.split(/\\s+/).length > 7) return -1;
    const matches = chapterTexts.flatMap((body, index) =>
      body.includes(` ${normalized} `) ? [index] : []
    );
    return matches.length === 1 ? matches[0] : -1;
  };
  const usedPrompts = new Set(questions.map((question) => normalizeForDedupe(question.prompt)));
  const anchored = questions.map((question) => {
    if (question.kind !== 'concept' || question.type !== 'multiple_choice' || !question.topic)
      return question;
    const index = uniqueChapterForConcept(question.topic);
    return index < 0 ? question : { ...question, chapterTitle: chapters[index]!.title };
  });
  const covered = new Set(
    anchored.filter((item) => item.chapterTitle && item.type === 'multiple_choice')
      .map((item) => item.chapterTitle)
  );

  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index]!;
    if (covered.has(chapter.title)) continue;
    const candidates = model.concepts.filter((concept) =>
      cleanLine(concept.term).length >= 7 &&
      cleanLine(concept.detail).length >= 30 &&
      (concept.pageReferences ?? []).some((page) => Number.isInteger(page) && page > 0) &&
      uniqueChapterForConcept(concept.term) === index
    );

    for (const concept of candidates) {
      const correct = truncateAtWord(concept.detail, 210);
      const distractors = rankSemanticItems(
        `${concept.term} ${concept.detail}`,
        concept.pageReferences,
        model.concepts.filter((item) => item !== concept),
        (item) => `${item.term} ${item.detail}`,
        (item) => item.pageReferences,
        3
      ).map((item) => truncateAtWord(item.detail, 210));
      const options = placeCorrectOption(correct, distractors, index % 4).slice(0, 4);
      if (options.length < 3) continue;
      const prompt = `¿Qué explica el PDF sobre “${concept.term}”?`;
      if (usedPrompts.has(normalizeForDedupe(prompt))) continue;

      // También la pregunta de cobertura hereda una referencia verificable.
      const reference = referenceFromPages(
        concept.pageReferences, concept.term, concept.detail, chunks
      );
      if (reference.pageStart === null) continue;
      anchored.push({
        id: `chapter-concept-${index + 1}`,
        type: 'multiple_choice',
        level: 'recordar',
        kind: 'concept',
        topic: concept.term,
        chapterTitle: chapter.title,
        prompt,
        options,
        answer: correct,
        explanation: `Según el PDF, “${concept.term}” significa: ${correct}. Las demás opciones describen otros conceptos del material.`,
        reference,
      });
      usedPrompts.add(normalizeForDedupe(prompt));
      covered.add(chapter.title);
      break;
    }
  }
  return anchored;
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
  pageCount?: number | null;
}): PedagogicalArtifacts {
  const chunks = input.chunks ?? [];
  const model = input.canonicalModel;
  const flashcardLimit = resolveFlashcardLimit({
    canonicalModel: model,
    glossary: input.glossary,
  });
  const concepts = selectPedagogicalConcepts(input.glossary, flashcardLimit);
  const sectionTitles = dedupeStrings(input.summary.sections.map((section) => section.title));
  const fallbackFlashcards = concepts.map(
    (concept, index): StudyFlashcard => {
      const level = resolveFlashcardLevel(concept);
      return {
        front: buildFlashcardFront(concept, level),
        back: concept.definition,
        level,
        kind: 'concept',
        reference: findReference(
          concept.term,
          chunks,
          emptyReference(
            sectionTitles.find((title) =>
              concept.chapterTitle &&
              normalizeForDedupe(title) === normalizeForDedupe(concept.chapterTitle)
            ) ?? null,
            concept.context || concept.definition
          )
        ),
      };
    }
  );

  const canonicalFlashcards = model
    ? buildCanonicalFlashcards(model, chunks, flashcardLimit)
    : [];
  const canonicalSubjects = new Set(
    canonicalFlashcards.map((card) => flashcardSubjectKey(card)).filter(Boolean)
  );
  const flashcards = [
    ...canonicalFlashcards,
    ...fallbackFlashcards.filter(
      (candidate) => !canonicalSubjects.has(flashcardSubjectKey(candidate))
    ),
  ].slice(0, flashcardLimit);

  const topicCount = model?.topics.length ?? sectionTitles.length;
  const categoryFactor = resolveQuestionCategoryFactor({
    pageCount: input.pageCount,
    topicCount,
  });
  const questionBankTarget = resolveQuestionBankTarget({
    pageCount: input.pageCount,
    topicCount,
  });
  const sectionQuestionLimit = Math.min(input.summary.sections.length, 4 * categoryFactor);
  const modelQuestions = model
    ? [
        ...buildCanonicalConceptQuestions(model, chunks, 10 * categoryFactor),
        ...buildCanonicalRelationshipQuestions(model, chunks, 9 * categoryFactor),
        ...buildCanonicalClassificationQuestions(model, chunks, 10 * categoryFactor),
        ...buildCanonicalProcessQuestions(model, chunks, 8 * categoryFactor),
        ...buildCanonicalFormulaQuestions(model, chunks, 5 * categoryFactor),
        ...buildCanonicalComparisonQuestions(model, chunks, 4 * categoryFactor),
        ...buildCanonicalConfusionQuestions(model, chunks, 3 * categoryFactor),
      ]
    : [];

  const fallbackQuestions = [
    ...(modelQuestions.length < 12
      ? buildFallbackMultipleChoice(concepts, chunks, sectionTitles)
      : []),
    ...buildOpenSectionQuestions(input.summary, chunks, model, sectionQuestionLimit),
  ];

  const availableQuestions = dedupeQuestions(
    model
      ? anchorAndCompleteChapterQuestions(
          [...modelQuestions, ...fallbackQuestions],
          input.summary,
          model,
          chunks
        )
      : [...modelQuestions, ...fallbackQuestions]
  );
  // No agregar preguntas ficticias: la meta crece con la cantidad de contenido
  // realmente disponible, pero sólo se eligen ítems respaldados por el PDF.
  const questions = selectBalancedQuestionBank(
    availableQuestions,
    questionBankTarget
  ).map((question) => ({
    ...question,
    id: contentStableQuestionId(question),
  }));
  const miniExam = selectMiniExamQuestions(questions, 8);
  const allItems = [...flashcards, ...questions];

  return {
    flashcards,
    questions,
    miniExamQuestionIds: miniExam.map((question) => question.id),
    coverage: {
      conceptsUsed: model?.concepts.length ?? concepts.length,
      sectionsUsed: sectionQuestionLimit,
      referencedItems: allItems.filter((item) => item.reference.excerpt.length > 0).length,
      totalItems: allItems.length,
    },
  };
}
