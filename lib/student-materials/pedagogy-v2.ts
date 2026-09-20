import type {
  CanonicalPedagogicalModel,
  StudyGlossaryItem,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';
import {
  buildPedagogicalArtifacts as buildLegacyPedagogicalArtifacts,
  type PedagogicalArtifacts,
  type PedagogicalChunk,
  type PedagogicalReference,
  type StudyFlashcard,
} from '@/lib/student-materials/pedagogy';

type FlashcardKind =
  | 'concept'
  | 'relationship'
  | 'classification'
  | 'process'
  | 'formula'
  | 'confusion';

type FlashcardCandidate = {
  id: string;
  kind: FlashcardKind;
  page: number | null;
  card: StudyFlashcard;
};

type BuildPedagogicalArtifactsInput = {
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  chunks?: PedagogicalChunk[];
  canonicalModel?: CanonicalPedagogicalModel | null;
};

const FLASHCARD_LIMIT = 12;

export function buildPedagogicalArtifacts(
  input: BuildPedagogicalArtifactsInput
): PedagogicalArtifacts {
  const base = buildLegacyPedagogicalArtifacts(input);
  const model = input.canonicalModel;

  if (!model) return base;

  const canonicalFlashcards = buildCanonicalFlashcards(
    model,
    input.chunks ?? [],
    FLASHCARD_LIMIT
  );

  if (canonicalFlashcards.length < 6) return base;

  const allItems = [...canonicalFlashcards, ...base.questions];

  return {
    ...base,
    flashcards: canonicalFlashcards,
    coverage: {
      ...base.coverage,
      referencedItems: allItems.filter(
        (item) =>
          item.reference.pageStart !== null ||
          item.reference.sectionTitle !== null ||
          item.reference.excerpt.length > 0
      ).length,
      totalItems: allItems.length,
    },
  };
}

function buildCanonicalFlashcards(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[],
  limit: number
) {
  const candidates = buildCandidates(model, chunks);
  if (candidates.length <= limit) return candidates.map((candidate) => candidate.card);

  const quotas: Array<[FlashcardKind, number]> = [
    ['concept', 3],
    ['relationship', 2],
    ['classification', 2],
    ['process', 2],
    ['formula', 1],
    ['confusion', 1],
  ];

  const selected = new Map<string, FlashcardCandidate>();

  for (const [kind, quota] of quotas) {
    const bucket = candidates.filter((candidate) => candidate.kind === kind);
    for (const candidate of takeEvenlyAcrossPages(bucket, quota)) {
      selected.set(candidate.id, candidate);
    }
  }

  const remaining = candidates.filter((candidate) => !selected.has(candidate.id));
  for (const candidate of takeEvenlyAcrossPages(remaining, limit - selected.size)) {
    selected.set(candidate.id, candidate);
  }

  return [...selected.values()]
    .slice(0, limit)
    .sort(compareByPageThenKind)
    .map((candidate) => candidate.card);
}

function buildConfusionFlashcardFront(detail: string, sectionTitle: string | null) {
  const normalizedDetail = clean(detail).replace(/[.!?]+$/u, '');
  const contrast = normalizedDetail.match(/^Confundir\s+(.+?)\s+con\s+(.+)$/iu);

  if (contrast?.[1] && contrast[2]) {
    return `¿Cómo distinguís ${truncate(contrast[1], 90)} de ${truncate(contrast[2], 90)} según el material?`;
  }

  if (sectionTitle) {
    return `¿Qué confusión conceptual conviene evitar en “${truncate(sectionTitle, 90)}”?`;
  }

  return `¿Qué problema conceptual señala el material cuando plantea “${truncate(normalizedDetail, 110)}”?`;
}

function buildCandidates(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[]
): FlashcardCandidate[] {
  const result: FlashcardCandidate[] = [];

  model.concepts.forEach((concept, index) => {
    const term = clean(concept.term);
    const detail = clean(concept.detail);
    if (term.length < 3 || detail.length < 12) return;

    const reference = resolveReference(
      model,
      'concept',
      term,
      concept.pageReferences,
      term,
      detail,
      chunks
    );

    result.push({
      id: `concept:${normalize(term)}`,
      kind: 'concept',
      page: reference.pageStart,
      card: {
        front:
          index % 3 === 0
            ? `¿Qué significa “${term}” según el material?`
            : `¿Cómo explicarías “${term}” sin mirar el PDF?`,
        back: detail,
        level: index % 3 === 0 ? 'recordar' : 'comprender',
        reference,
      },
    });
  });

  model.relationships.forEach((relationship) => {
    const source = clean(relationship.source);
    const target = clean(relationship.target);
    const detail = clean(relationship.description);
    if (!source || !target || detail.length < 12) return;

    const key = `${source} → ${target}`;
    const reference = resolveReference(
      model,
      'relationship',
      key,
      relationship.pageReferences,
      `${source} ${target}`,
      detail,
      chunks
    );

    result.push({
      id: `relationship:${normalize(key)}`,
      kind: 'relationship',
      page: reference.pageStart,
      card: {
        front: `¿Cómo relaciona el material “${source}” con “${target}”?`,
        back: detail,
        level: 'comprender',
        reference,
      },
    });
  });

  model.classifications.forEach((classification) => {
    const title = clean(classification.title);
    const items = classification.items.map(clean).filter(Boolean);
    if (!title || items.length < 2) return;

    const reference = resolveReference(
      model,
      'classification',
      title,
      classification.pageReferences,
      title,
      `${title}: ${items.join(', ')}`,
      chunks
    );

    result.push({
      id: `classification:${normalize(title)}`,
      kind: 'classification',
      page: reference.pageStart,
      card: {
        front: `¿Qué elementos incluye “${title}” según el PDF?`,
        back: items.join(' · '),
        level: 'comprender',
        reference,
      },
    });
  });

  model.processes.forEach((process) => {
    const title = clean(process.title);
    const steps = process.steps.map(clean).filter(Boolean);
    if (!title || steps.length < 2) return;

    const reference = resolveReference(
      model,
      'process',
      title,
      process.pageReferences,
      title,
      `${title}: ${steps.join(' → ')}`,
      chunks
    );

    result.push({
      id: `process:${normalize(title)}`,
      kind: 'process',
      page: reference.pageStart,
      card: {
        front: `Reconstruí el proceso “${title}” en el orden explicado por el material.`,
        back: steps.join(' → '),
        level: 'comprender',
        reference,
      },
    });
  });

  model.formulas.forEach((formula) => {
    const expression = clean(formula.expression);
    const detail = clean(formula.description);
    if (!expression || detail.length < 8) return;

    const reference = resolveReference(
      model,
      'formula',
      expression,
      formula.pageReferences,
      expression,
      detail,
      chunks
    );

    result.push({
      id: `formula:${normalize(expression)}`,
      kind: 'formula',
      page: reference.pageStart,
      card: {
        front: `¿Qué representa “${expression}” en este material?`,
        back: detail,
        level: 'comprender',
        reference,
      },
    });
  });

  model.confusions.forEach((confusion, index) => {
    const detail = clean(confusion);
    if (detail.length < 18) return;

    const reference = resolveReference(
      model,
      'confusion',
      detail,
      undefined,
      detail,
      detail,
      chunks
    );

    result.push({
      id: `confusion:${index}:${normalize(detail).slice(0, 80)}`,
      kind: 'confusion',
      page: reference.pageStart,
      card: {
        front: buildConfusionFlashcardFront(detail, reference.sectionTitle),
        back: detail,
        level: 'comprender',
        reference,
      },
    });
  });

  return dedupeCandidates(result);
}

function resolveReference(
  model: CanonicalPedagogicalModel,
  kind: FlashcardKind,
  key: string,
  directPages: number[] | undefined,
  searchText: string,
  excerpt: string,
  chunks: PedagogicalChunk[]
): PedagogicalReference {
  const pages = normalizePages(directPages ?? []);

  if (pages.length > 0) {
    return {
      pageStart: pages[0] ?? null,
      pageEnd: pages.at(-1) ?? pages[0] ?? null,
      sectionTitle: findTopicTitle(model, pages),
      excerpt: truncate(excerpt, 220),
    };
  }

  const bindingPages = normalizePages(
    (model.sourceBindings ?? [])
      .filter(
        (binding) =>
          binding.kind === kind &&
          (normalize(binding.key) === normalize(key) ||
            normalize(binding.key).includes(normalize(searchText)) ||
            normalize(searchText).includes(normalize(binding.key)))
      )
      .flatMap((binding) =>
        binding.references.flatMap((reference) =>
          expandRange(reference.pageStart, reference.pageEnd)
        )
      )
  );

  if (bindingPages.length > 0) {
    return {
      pageStart: bindingPages[0] ?? null,
      pageEnd: bindingPages.at(-1) ?? bindingPages[0] ?? null,
      sectionTitle: findTopicTitle(model, bindingPages),
      excerpt: truncate(excerpt, 220),
    };
  }

  const needle = normalize(searchText);
  const words = needle.split(/\s+/).filter((word) => word.length >= 4);
  const chunk = chunks.find((candidate) => {
    const haystack = normalize(candidate.text);
    return haystack.includes(needle) || words.every((word) => haystack.includes(word));
  });

  if (chunk) {
    return {
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      sectionTitle: chunk.sectionTitle,
      excerpt: truncate(chunk.text, 220),
    };
  }

  return {
    pageStart: null,
    pageEnd: null,
    sectionTitle: null,
    excerpt: truncate(excerpt, 220),
  };
}

function findTopicTitle(model: CanonicalPedagogicalModel, pages: number[]) {
  const pageSet = new Set(pages);
  return (
    model.topics.find((topic) =>
      topic.pageReferences.some((page) => pageSet.has(page))
    )?.title ?? null
  );
}

function takeEvenlyAcrossPages(
  candidates: FlashcardCandidate[],
  count: number
) {
  if (count <= 0 || candidates.length === 0) return [];
  if (candidates.length <= count) return candidates;

  const ordered = [...candidates].sort(compareByPageThenKind);
  if (count === 1) return [ordered[Math.floor((ordered.length - 1) / 2)]!];

  const selected: FlashcardCandidate[] = [];
  const used = new Set<string>();

  for (let index = 0; index < count; index += 1) {
    const target = Math.round((index * (ordered.length - 1)) / (count - 1));
    const candidate = ordered[target];
    if (candidate && !used.has(candidate.id)) {
      selected.push(candidate);
      used.add(candidate.id);
    }
  }

  for (const candidate of ordered) {
    if (selected.length >= count) break;
    if (used.has(candidate.id)) continue;
    selected.push(candidate);
    used.add(candidate.id);
  }

  return selected;
}

function compareByPageThenKind(
  left: FlashcardCandidate,
  right: FlashcardCandidate
) {
  const leftPage = left.page ?? Number.MAX_SAFE_INTEGER;
  const rightPage = right.page ?? Number.MAX_SAFE_INTEGER;
  if (leftPage !== rightPage) return leftPage - rightPage;
  return left.kind.localeCompare(right.kind);
}

function dedupeCandidates(candidates: FlashcardCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.kind}:${normalize(candidate.card.front)}:${normalize(candidate.card.back)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizePages(values: number[]) {
  return [
    ...new Set(
      values.filter(
        (value) => Number.isInteger(value) && Number.isFinite(value) && value > 0
      )
    ),
  ].sort((left, right) => left - right);
}

function expandRange(pageStart: number | null, pageEnd: number | null) {
  if (pageStart === null || pageStart < 1) return [];
  const end = pageEnd !== null && pageEnd >= pageStart ? pageEnd : pageStart;
  return Array.from({ length: end - pageStart + 1 }, (_, index) => pageStart + index);
}

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalize(value: string) {
  return clean(value)
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, limit: number) {
  const cleanValue = clean(value);
  if (cleanValue.length <= limit) return cleanValue;
  const partial = cleanValue.slice(0, limit);
  const cut = partial.lastIndexOf(' ');
  return `${partial.slice(0, cut > 0 ? cut : limit).trim()}...`;
}
