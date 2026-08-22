import type {
  CanonicalPedagogicalModel,
  CanonicalPedagogicalSourceKind,
  StudyGlossaryItem,
} from '@/lib/student-materials/types';

type CanonicalGlossaryCandidate = StudyGlossaryItem & {
  pageReferences: number[];
  priority: number;
};

export const CANONICAL_GLOSSARY_PROVIDER = 'canonical-local';

export function buildCanonicalStudentMaterialGlossary(
  model: CanonicalPedagogicalModel
): StudyGlossaryItem[] {
  const candidates: CanonicalGlossaryCandidate[] = [];

  for (const concept of model.concepts) {
    const term = cleanInline(concept.term);
    const definition = cleanInline(concept.detail);
    if (!isUsefulTerm(term) || definition.length < 12) continue;

    const pageReferences = resolveEntityPages(
      model,
      'concept',
      term,
      concept.pageReferences
    );
    const relatedTopics = findRelatedTopics(model, pageReferences);
    const importance = resolveImportance(
      concept.kind === 'definicion' || concept.kind === 'clasificacion',
      relatedTopics.some((topic) => topic.relevance === 'alta')
    );

    candidates.push({
      term,
      definition,
      context: buildContext(
        relatedTopics.map((topic) => topic.title),
        pageReferences
      ),
      importance,
      englishTerm: null,
      pageReferences,
      priority: buildCandidatePriority(
        concept.kind === 'definicion' || concept.kind === 'clasificacion'
          ? 0
          : concept.kind === 'autor' || concept.kind === 'idea_clave'
            ? 2
            : 3,
        importance
      ),
    });
  }

  for (const classification of model.classifications) {
    const term = cleanInline(classification.title);
    const items = classification.items.map(cleanInline).filter(Boolean);
    if (!isUsefulTerm(term) || items.length === 0) continue;

    const pageReferences = resolveEntityPages(
      model,
      'classification',
      term,
      classification.pageReferences
    );
    const relatedTopics = findRelatedTopics(model, pageReferences);

    const importance = relatedTopics.some((topic) => topic.relevance === 'alta')
      ? ('alta' as const)
      : ('media' as const);

    candidates.push({
      term,
      definition: `Clasificación que incluye: ${items.join('; ')}.`,
      context: buildContext(
        relatedTopics.map((topic) => topic.title),
        pageReferences
      ),
      importance,
      englishTerm: null,
      pageReferences,
      priority: buildCandidatePriority(1, importance),
    });
  }

  for (const formula of model.formulas) {
    const term = cleanInline(formula.expression);
    const definition = cleanInline(formula.description);
    if (!isUsefulTerm(term) || definition.length < 8) continue;

    const pageReferences = resolveEntityPages(
      model,
      'formula',
      term,
      formula.pageReferences
    );
    const relatedTopics = findRelatedTopics(model, pageReferences);

    const importance = relatedTopics.some((topic) => topic.relevance === 'alta')
      ? ('alta' as const)
      : ('media' as const);

    candidates.push({
      term,
      definition,
      context: buildContext(
        relatedTopics.map((topic) => topic.title),
        pageReferences
      ),
      importance,
      englishTerm: null,
      pageReferences,
      priority: buildCandidatePriority(1, importance),
    });
  }

  return selectCanonicalGlossaryCandidates(
    model,
    mergeCandidates(candidates)
  )
    .sort((left, right) =>
      left.term.localeCompare(right.term, 'es', {
        sensitivity: 'base',
      })
    )
    .map(({ pageReferences: _pageReferences, priority: _priority, ...item }) => item);
}

export function resolveCanonicalGlossaryLimit(
  model: CanonicalPedagogicalModel
) {
  const pageCount = inferCanonicalPageCount(model);
  const topicCoverageFloor = model.topics.length;

  return Math.min(
    60,
    Math.max(
      12,
      pageCount * 3,
      topicCoverageFloor
    )
  );
}

function selectCanonicalGlossaryCandidates(
  model: CanonicalPedagogicalModel,
  candidates: CanonicalGlossaryCandidate[]
) {
  const limit = resolveCanonicalGlossaryLimit(model);
  if (candidates.length <= limit) return candidates;

  const ordered = [...candidates].sort(compareCandidatePriority);
  const selected = new Map<string, CanonicalGlossaryCandidate>();

  const topicsByPriority = [...model.topics].sort((left, right) => {
    if (left.relevance !== right.relevance) {
      return left.relevance === 'alta' ? -1 : 1;
    }

    return left.title.localeCompare(right.title, 'es', {
      sensitivity: 'base',
    });
  });

  for (const topic of topicsByPriority) {
    if (selected.size >= limit) break;

    const topicPages = new Set(normalizePages(topic.pageReferences));
    if (topicPages.size === 0) continue;

    const representative = ordered.find((candidate) => {
      const key = normalizeKey(candidate.term);
      if (selected.has(key)) return false;

      return candidate.pageReferences.some((page) => topicPages.has(page));
    });

    if (representative) {
      selected.set(normalizeKey(representative.term), representative);
    }
  }

  for (const candidate of ordered) {
    if (selected.size >= limit) break;

    const key = normalizeKey(candidate.term);
    if (!selected.has(key)) {
      selected.set(key, candidate);
    }
  }

  return [...selected.values()];
}

function compareCandidatePriority(
  left: CanonicalGlossaryCandidate,
  right: CanonicalGlossaryCandidate
) {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  if (left.pageReferences.length !== right.pageReferences.length) {
    return left.pageReferences.length - right.pageReferences.length;
  }

  return left.term.localeCompare(right.term, 'es', {
    sensitivity: 'base',
  });
}

function buildCandidatePriority(
  structuralRank: number,
  importance: 'alta' | 'media'
) {
  return structuralRank + (importance === 'alta' ? 0 : 2);
}

function inferCanonicalPageCount(model: CanonicalPedagogicalModel) {
  const pages = [
    ...model.topics.flatMap((topic) => topic.pageReferences),
    ...model.concepts.flatMap((concept) => concept.pageReferences ?? []),
    ...model.relationships.flatMap(
      (relationship) => relationship.pageReferences ?? []
    ),
    ...model.classifications.flatMap(
      (classification) => classification.pageReferences ?? []
    ),
    ...model.processes.flatMap((process) => process.pageReferences ?? []),
    ...model.formulas.flatMap((formula) => formula.pageReferences ?? []),
    ...(model.sourceBindings ?? []).flatMap((binding) =>
      binding.references.flatMap((reference) =>
        expandPageRange(reference.pageStart, reference.pageEnd)
      )
    ),
  ];

  return normalizePages(pages).at(-1) ?? 1;
}

function mergeCandidates(
  candidates: CanonicalGlossaryCandidate[]
): CanonicalGlossaryCandidate[] {
  const merged = new Map<string, CanonicalGlossaryCandidate>();

  for (const candidate of candidates) {
    const key = normalizeKey(candidate.term);
    if (!key) continue;

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, candidate);
      continue;
    }

    const pageReferences = normalizePages([
      ...existing.pageReferences,
      ...candidate.pageReferences,
    ]);
    const importance =
      existing.importance === 'alta' || candidate.importance === 'alta'
        ? ('alta' as const)
        : ('media' as const);
    const preferred =
      candidate.definition.length > existing.definition.length
        ? candidate
        : existing;

    merged.set(key, {
      ...preferred,
      importance,
      pageReferences,
      context: mergeContexts(existing.context, candidate.context, pageReferences),
      priority: Math.min(existing.priority, candidate.priority),
    });
  }

  return [...merged.values()];
}

function resolveEntityPages(
  model: CanonicalPedagogicalModel,
  kind: CanonicalPedagogicalSourceKind,
  key: string,
  directPages?: number[]
) {
  const direct = normalizePages(directPages ?? []);
  if (direct.length > 0) return direct;

  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) return [];

  const binding = (model.sourceBindings ?? []).find(
    (candidate) =>
      candidate.kind === kind &&
      normalizeKey(candidate.key) === normalizedKey
  );

  if (!binding) return [];

  return normalizePages(
    binding.references.flatMap((reference) =>
      expandPageRange(reference.pageStart, reference.pageEnd)
    )
  );
}

function findRelatedTopics(
  model: CanonicalPedagogicalModel,
  pageReferences: number[]
) {
  if (pageReferences.length === 0) return [];

  const pages = new Set(pageReferences);

  return model.topics.filter((topic) =>
    topic.pageReferences.some((page) => pages.has(page))
  );
}

function resolveImportance(
  conceptIsStructurallyCentral: boolean,
  belongsToHighRelevanceTopic: boolean
): 'alta' | 'media' {
  return conceptIsStructurallyCentral || belongsToHighRelevanceTopic
    ? 'alta'
    : 'media';
}

function buildContext(topicTitles: string[], pageReferences: number[]) {
  const uniqueTopics = dedupeStrings(topicTitles).slice(0, 2);
  const parts: string[] = [];

  if (uniqueTopics.length > 0) {
    parts.push(uniqueTopics.join(' · '));
  } else {
    parts.push('Concepto del material');
  }

  const pageLabel = formatPageReferences(pageReferences);
  if (pageLabel) parts.push(pageLabel);

  return parts.join(' · ');
}

function mergeContexts(
  left: string,
  right: string,
  pageReferences: number[]
) {
  const topicParts = dedupeStrings(
    [extractTopicContext(left), extractTopicContext(right)].filter(Boolean)
  ).slice(0, 2);

  return buildContext(topicParts, pageReferences);
}

function extractTopicContext(value: string) {
  const [topicPart = ''] = value.split(' · Ver en PDF · ');
  const clean = topicPart.trim();

  return clean === 'Concepto del material' ? '' : clean;
}

function formatPageReferences(pageReferences: number[]) {
  const pages = normalizePages(pageReferences);
  if (pages.length === 0) return '';

  if (pages.length === 1) {
    return `Ver en PDF · página ${pages[0]}`;
  }

  return `Ver en PDF · páginas ${pages.join(', ')}`;
}

function normalizePages(values: number[]) {
  return [
    ...new Set(
      values.filter(
        (value) =>
          Number.isInteger(value) &&
          value >= 1
      )
    ),
  ].sort((left, right) => left - right);
}

function expandPageRange(
  pageStart: number | null,
  pageEnd: number | null
) {
  if (pageStart === null) return [];

  const end =
    pageEnd !== null && pageEnd >= pageStart
      ? pageEnd
      : pageStart;

  return Array.from(
    { length: end - pageStart + 1 },
    (_, index) => pageStart + index
  );
}

function cleanInline(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function isUsefulTerm(value: string) {
  const clean = cleanInline(value);
  if (clean.length < 2 || clean.length > 120) return false;
  return /[\p{L}\p{N}]/u.test(clean);
}

function normalizeKey(value: string) {
  return cleanInline(value)
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const clean = cleanInline(value);
    const key = normalizeKey(clean);
    if (!clean || seen.has(key)) continue;

    seen.add(key);
    result.push(clean);
  }

  return result;
}
