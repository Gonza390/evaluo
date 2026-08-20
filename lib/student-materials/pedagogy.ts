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

const CORE_CONCEPT_PATTERN =
  /inteligencia artificial|aprendizaje autom[aá]tico|machine learning|deep learning|entrenamiento|inferencia|generalizaci[oó]n|dataset|ia generativa|ciberseguridad|edge computing|computaci[oó]n cu[aá]ntica|brecha digital|automatizaci[oó]n|blockchain|internet de las cosas|iot|rob[oó]tica/i;
const GENERIC_TERM_PATTERN =
  /^(?:idea general|buena pr[aá]ctica|comprender qu[eé]|definir el problema|desplegar|evaluar|generaci[oó]n|hogar|industria|educaci[oó]n|ciudades|arquitectura|agricultura)$/i;

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

function conceptScore(item: StudyGlossaryItem) {
  let score = item.importance === 'alta' ? 4 : 1;
  if (CORE_CONCEPT_PATTERN.test(`${item.term} ${item.definition}`)) score += 10;
  if (item.englishTerm) score += 2;
  if (/secci[oó]n|fundamentos|conceptos/i.test(item.context)) score += 2;
  if (/d[oó]nde se utiliza|realidad mixta/i.test(item.context)) score -= 2;
  return score;
}

export function selectPedagogicalConcepts(glossary: StudyGlossaryItem[], limit = 12) {
  return glossary
    .filter(isPedagogicalGlossaryItem)
    .map((item, index) => ({ item, index, score: conceptScore(item) }))
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

export function buildPedagogicalArtifacts(input: {
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  chunks?: PedagogicalChunk[];
}): PedagogicalArtifacts {
  const chunks = input.chunks ?? [];
  const concepts = selectPedagogicalConcepts(input.glossary, 12);
  const sectionTitles = dedupeStrings(input.summary.sections.map((section) => section.title));
  const flashcards = concepts.slice(0, 12).map(
    (concept, index): StudyFlashcard => ({
      front: index % 3 === 0 ? `¿Qué significa ${concept.term}?` : concept.term,
      back: concept.definition,
      level: index % 3 === 0 ? 'recordar' : 'comprender',
      reference: findReference(
        concept.term,
        chunks,
        emptyReference(
          sectionTitles[index % Math.max(1, sectionTitles.length)] ?? null,
          concept.context || concept.definition
        )
      ),
    })
  );
  const multipleChoice = concepts
    .slice(0, 5)
    .map((concept, index): StudyQuestion => {
      const distractors = concepts
        .filter((candidate) => candidate.term !== concept.term)
        .map((candidate) => candidate.definition)
        .filter(
          (definition) => normalizeForDedupe(definition) !== normalizeForDedupe(concept.definition)
        )
        .slice(index % 2, (index % 2) + 3);
      const options = dedupeStrings([concept.definition, ...distractors]).slice(0, 4);
      const rotated = options.length > 1 ? [...options.slice(1), options[0]!] : options;
      return {
        id: `mc-${index + 1}`,
        type: 'multiple_choice',
        level: index < 2 ? 'recordar' : 'comprender',
        prompt: `¿Cuál es la explicación correcta de “${concept.term}” según el material?`,
        options: rotated,
        answer: concept.definition,
        explanation: `La respuesta se apoya en la definición y el contexto que el documento presenta para ${concept.term}.`,
        reference: findReference(
          concept.term,
          chunks,
          emptyReference(sectionTitles[index] ?? null, concept.context || concept.definition)
        ),
      };
    })
    .filter((question) => question.options.length >= 3);
  const openQuestions = input.summary.sections.slice(0, 5).map((section, index): StudyQuestion => {
    const level = index < 1 ? 'comprender' : 'aplicar';
    return {
      id: `open-${index + 1}`,
      type: 'open',
      level,
      prompt:
        level === 'comprender'
          ? `Explicá con tus palabras la idea central de “${section.title}” y relacioná al menos dos conceptos.`
          : `Aplicá las ideas de “${section.title}” a una situación nueva y justificá cada decisión con el material.`,
      options: [],
      answer: truncateAtWord(section.body, 700),
      explanation:
        level === 'comprender'
          ? 'Una respuesta sólida debe definir la idea central, conectar conceptos y evitar limitarse a copiar frases.'
          : 'La aplicación debe usar criterios del documento, explicar por qué corresponden al caso y anticipar consecuencias.',
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
