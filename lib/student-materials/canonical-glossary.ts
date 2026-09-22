import type {
  CanonicalPedagogicalModel,
  CanonicalPedagogicalSourceKind,
  StudyGlossaryItem,
} from '@/lib/student-materials/types';

type GlossaryKind =
  | 'concept'
  | 'classification'
  | 'process'
  | 'relationship'
  | 'formula';

type CanonicalGlossaryCandidate = StudyGlossaryItem & {
  id: string;
  kind: GlossaryKind;
  pageReferences: number[];
  priority: number;
};

export const CANONICAL_GLOSSARY_PROVIDER = 'canonical-local';

export function buildCanonicalStudentMaterialGlossary(
  model: CanonicalPedagogicalModel
): StudyGlossaryItem[] {
  const candidates = mergeCandidates(buildCandidates(model));
  const selected = selectCanonicalGlossaryCandidates(model, candidates);

  return selected
    .sort((left, right) =>
      left.term.localeCompare(right.term, 'es', { sensitivity: 'base' })
    )
    .map(
      ({
        id: _id,
        kind: _kind,
        pageReferences: _pageReferences,
        priority: _priority,
        ...item
      }) => item
    );
}

export function resolveCanonicalGlossaryLimit(
  model: CanonicalPedagogicalModel
) {
  const pageCount = inferCanonicalPageCount(model);
  const topicCount = model.topics.length;

  return Math.min(
    50,
    Math.max(
      18,
      Math.ceil(pageCount * 2.25),
      Math.min(44, topicCount * 2)
    )
  );
}

function buildCandidates(model: CanonicalPedagogicalModel) {
  const candidates: CanonicalGlossaryCandidate[] = [];

  for (const concept of model.concepts) {
    const term = cleanInline(concept.term);
    const definition = cleanInline(concept.detail);
    if (
      !isUsefulTerm(term) ||
      definition.length < 12 ||
      isAdministrativeConcept(model, term, definition)
    ) {
      continue;
    }

    const pageReferences = resolveEntityPages(
      model,
      'concept',
      term,
      concept.pageReferences
    );
    const relatedTopics = findRelatedTopics(model, pageReferences);
    const importance = resolveImportance(
      concept.kind === 'definicion' ||
        concept.kind === 'clasificacion' ||
        concept.kind === 'idea_clave',
      relatedTopics.some((topic) => topic.relevance === 'alta')
    );

    candidates.push({
      id: `concept:${normalizeKey(term)}`,
      kind: 'concept',
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
        concept.kind === 'definicion' || concept.kind === 'idea_clave' ? 0 : 2,
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
      id: `classification:${normalizeKey(term)}`,
      kind: 'classification',
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

  for (const process of model.processes) {
    const term = cleanInline(process.title);
    const steps = process.steps.map(cleanInline).filter(Boolean);
    if (!isUsefulTerm(term) || steps.length < 2) continue;

    const pageReferences = resolveEntityPages(
      model,
      'process',
      term,
      process.pageReferences
    );
    const relatedTopics = findRelatedTopics(model, pageReferences);
    const importance = relatedTopics.some((topic) => topic.relevance === 'alta')
      ? ('alta' as const)
      : ('media' as const);

    candidates.push({
      id: `process:${normalizeKey(term)}`,
      kind: 'process',
      term,
      definition: `Proceso descrito en el material: ${steps.join(' → ')}.`,
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

  for (const relationship of model.relationships) {
    const source = cleanInline(relationship.source);
    const target = cleanInline(relationship.target);
    const definition = cleanInline(relationship.description);
    const term = `${source} ↔ ${target}`;
    if (!source || !target || !isUsefulTerm(term) || definition.length < 12) continue;

    const sourceKey = `${source} → ${target}`;
    const pageReferences = resolveEntityPages(
      model,
      'relationship',
      sourceKey,
      relationship.pageReferences
    );
    const relatedTopics = findRelatedTopics(model, pageReferences);
    const importance = relatedTopics.some((topic) => topic.relevance === 'alta')
      ? ('alta' as const)
      : ('media' as const);

    candidates.push({
      id: `relationship:${normalizeKey(term)}`,
      kind: 'relationship',
      term,
      definition,
      context: buildContext(
        relatedTopics.map((topic) => topic.title),
        pageReferences
      ),
      importance,
      englishTerm: null,
      pageReferences,
      priority: buildCandidatePriority(2, importance),
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
      id: `formula:${normalizeKey(term)}`,
      kind: 'formula',
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

  return candidates;
}

function selectCanonicalGlossaryCandidates(
  model: CanonicalPedagogicalModel,
  candidates: CanonicalGlossaryCandidate[]
) {
  const limit = resolveCanonicalGlossaryLimit(model);
  if (candidates.length <= limit) return candidates;

  const selected = new Map<string, CanonicalGlossaryCandidate>();
  const ordered = [...candidates].sort(compareCandidateCoverage);

  // Las definiciones canónicas son el núcleo del glosario. Para evitar que una
  // página muy densa monopolice el cupo, garantizamos hasta 3 definiciones por
  // página antes de completar por cuotas. Así también se conservan pares o
  // tríadas conceptuales que se explican juntas en la fuente.
  const coreDefinitions = ordered.filter(
    (candidate) => candidate.kind === 'concept' && candidate.priority === 0
  );
  const definitionsByPage = new Map<number, CanonicalGlossaryCandidate[]>();

  for (const candidate of coreDefinitions) {
    const page = candidate.pageReferences[0] ?? Number.MAX_SAFE_INTEGER;
    const bucket = definitionsByPage.get(page) ?? [];
    bucket.push(candidate);
    definitionsByPage.set(page, bucket);
  }

  for (const [, bucket] of [...definitionsByPage.entries()].sort(
    ([left], [right]) => left - right
  )) {
    const representatives = bucket.length <= 3 ? bucket : takeEvenly(bucket, 3);
    for (const candidate of representatives) {
      if (selected.size >= limit) break;
      selected.set(candidate.id, candidate);
    }
    if (selected.size >= limit) break;
  }

  // Garantizamos presencia de los temas del documento, especialmente para
  // evitar glosarios concentrados sólo en las primeras páginas.
  const topics = [...model.topics].sort((left, right) => {
    const leftPage = normalizePages(left.pageReferences)[0] ?? Number.MAX_SAFE_INTEGER;
    const rightPage = normalizePages(right.pageReferences)[0] ?? Number.MAX_SAFE_INTEGER;
    if (leftPage !== rightPage) return leftPage - rightPage;
    if (left.relevance !== right.relevance) return left.relevance === 'alta' ? -1 : 1;
    return left.title.localeCompare(right.title, 'es', { sensitivity: 'base' });
  });

  for (const topic of topics) {
    if (selected.size >= limit) break;
    const topicPages = new Set(normalizePages(topic.pageReferences));
    if (topicPages.size === 0) continue;

    const representative = ordered.find(
      (candidate) =>
        !selected.has(candidate.id) &&
        candidate.pageReferences.some((page) => topicPages.has(page))
    );
    if (representative) selected.set(representative.id, representative);
  }

  // Los topics pueden tener referencias representativas y dejar huecos entre
  // páginas. Cubrimos también cada página que tenga contenido canónico útil.
  const candidatePages = normalizePages(
    ordered.flatMap((candidate) => candidate.pageReferences)
  );

  for (const page of candidatePages) {
    if (selected.size >= limit) break;
    const alreadyCovered = [...selected.values()].some((candidate) =>
      candidate.pageReferences.includes(page)
    );
    if (alreadyCovered) continue;

    const representative = ordered.find(
      (candidate) =>
        !selected.has(candidate.id) && candidate.pageReferences.includes(page)
    );
    if (representative) selected.set(representative.id, representative);
  }

  const quotas: Array<[GlossaryKind, number]> = [
    ['concept', Math.ceil(limit * 0.48)],
    ['classification', Math.ceil(limit * 0.18)],
    ['process', Math.ceil(limit * 0.13)],
    ['relationship', Math.ceil(limit * 0.13)],
    ['formula', Math.max(1, Math.floor(limit * 0.08))],
  ];

  for (const [kind, quota] of quotas) {
    if (selected.size >= limit) break;
    const alreadyOfKind = [...selected.values()].filter(
      (candidate) => candidate.kind === kind
    ).length;
    const needed = Math.max(0, quota - alreadyOfKind);
    const bucket = ordered.filter(
      (candidate) => candidate.kind === kind && !selected.has(candidate.id)
    );

    for (const candidate of takeEvenly(bucket, needed)) {
      if (selected.size >= limit) break;
      selected.set(candidate.id, candidate);
    }
  }

  for (const candidate of ordered) {
    if (selected.size >= limit) break;
    if (!selected.has(candidate.id)) selected.set(candidate.id, candidate);
  }

  return [...selected.values()];
}

function takeEvenly(candidates: CanonicalGlossaryCandidate[], count: number) {
  if (count <= 0 || candidates.length === 0) return [];
  if (candidates.length <= count) return candidates;

  const ordered = [...candidates].sort(compareCandidateCoverage);
  if (count === 1) return [ordered[Math.floor((ordered.length - 1) / 2)]!];

  const result: CanonicalGlossaryCandidate[] = [];
  const used = new Set<string>();

  for (let index = 0; index < count; index += 1) {
    const target = Math.round((index * (ordered.length - 1)) / (count - 1));
    const candidate = ordered[target];
    if (candidate && !used.has(candidate.id)) {
      result.push(candidate);
      used.add(candidate.id);
    }
  }

  for (const candidate of ordered) {
    if (result.length >= count) break;
    if (used.has(candidate.id)) continue;
    result.push(candidate);
    used.add(candidate.id);
  }

  return result;
}

function compareCandidateCoverage(
  left: CanonicalGlossaryCandidate,
  right: CanonicalGlossaryCandidate
) {
  const leftPage = left.pageReferences[0] ?? Number.MAX_SAFE_INTEGER;
  const rightPage = right.pageReferences[0] ?? Number.MAX_SAFE_INTEGER;
  if (leftPage !== rightPage) return leftPage - rightPage;
  if (left.priority !== right.priority) return left.priority - right.priority;
  return left.term.localeCompare(right.term, 'es', { sensitivity: 'base' });
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
    ...model.relationships.flatMap((relationship) => relationship.pageReferences ?? []),
    ...model.classifications.flatMap((classification) => classification.pageReferences ?? []),
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
      candidate.definition.length > existing.definition.length ? candidate : existing;

    merged.set(key, {
      ...preferred,
      id: existing.id,
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

  const bindings = (model.sourceBindings ?? []).filter(
    (candidate) =>
      candidate.kind === kind &&
      (normalizeKey(candidate.key) === normalizedKey ||
        normalizeKey(candidate.key).includes(normalizedKey) ||
        normalizedKey.includes(normalizeKey(candidate.key)))
  );

  return normalizePages(
    bindings.flatMap((binding) =>
      binding.references.flatMap((reference) =>
        expandPageRange(reference.pageStart, reference.pageEnd)
      )
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
  structurallyCentral: boolean,
  belongsToHighRelevanceTopic: boolean
): 'alta' | 'media' {
  return structurallyCentral || belongsToHighRelevanceTopic ? 'alta' : 'media';
}

function buildContext(topicTitles: string[], pageReferences: number[]) {
  const uniqueTopics = dedupeStrings(topicTitles).slice(0, 2);
  const parts = [
    uniqueTopics.length > 0 ? uniqueTopics.join(' · ') : 'Concepto del material',
    formatPageReferences(pageReferences),
  ].filter(Boolean);
  return parts.join(' · ');
}

function mergeContexts(left: string, right: string, pageReferences: number[]) {
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
  if (pages.length === 1) return `Ver en PDF · página ${pages[0]}`;
  return `Ver en PDF · páginas ${pages.join(', ')}`;
}

function normalizePages(values: number[]) {
  return [
    ...new Set(
      values.filter(
        (value) => Number.isInteger(value) && Number.isFinite(value) && value >= 1
      )
    ),
  ].sort((left, right) => left - right);
}

function expandPageRange(pageStart: number | null, pageEnd: number | null) {
  if (pageStart === null) return [];
  const end = pageEnd !== null && pageEnd >= pageStart ? pageEnd : pageStart;
  return Array.from({ length: end - pageStart + 1 }, (_, index) => pageStart + index);
}

function cleanInline(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function isAdministrativeConcept(
  model: CanonicalPedagogicalModel,
  term: string,
  definition: string
) {
  const termKey = normalizeKey(term);
  const titleKey = normalizeKey(model.title);
  const definitionKey = normalizeKey(definition);

  if (termKey && titleKey && (termKey === titleKey || titleKey.includes(termKey))) {
    return true;
  }

  return /^(?:asignatura|materia|titulo|autor|documento)\b/u.test(definitionKey) ||
    /(?:asignatura|materia) correspondiente al material de estudio/u.test(definitionKey);
}

function isUsefulTerm(value: string) {
  const clean = cleanInline(value);
  if (clean.length < 2 || clean.length > 120) return false;
  if (!/[\p{L}\p{N}]/u.test(clean)) return false;

  // Evita que filas o celdas rotas del parser terminen convertidas en términos
  // de glosario. Las fórmulas viven en su categoría propia y las relaciones
  // canónicas pueden seguir usando símbolos como ↔.
  if (clean.includes('|')) return false;
  if (/^[•*#]/u.test(clean)) return false;
  if (/^¿/u.test(clean) || /\?$/u.test(clean)) return false;
  if (clean.split(/\s+/u).length > 14) return false;

  return true;
}

function normalizeKey(value: string) {
  return cleanInline(value)
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
