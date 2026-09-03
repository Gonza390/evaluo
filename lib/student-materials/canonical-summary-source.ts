import type {
  CanonicalPedagogicalModel,
  CanonicalPedagogicalSourceBinding,
  CanonicalPedagogicalSourceKind,
} from '@/lib/student-materials/types';

export type CanonicalSummarySourceTopic = {
  title: string;
  description: string;
  relevance: 'alta' | 'media';
  pageReferences: number[];
};

export type CanonicalSummarySourceConcept = {
  term: string;
  detail: string;
  kind: CanonicalPedagogicalModel['concepts'][number]['kind'];
  pageReferences: number[];
};

export type CanonicalSummarySourceRelationship = {
  source: string;
  target: string;
  description: string;
  pageReferences: number[];
};

export type CanonicalSummarySourceClassification = {
  title: string;
  items: string[];
  pageReferences: number[];
};

export type CanonicalSummarySourceProcess = {
  title: string;
  steps: string[];
  pageReferences: number[];
};

export type CanonicalSummarySourceFormula = {
  expression: string;
  description: string;
  pageReferences: number[];
};

export type CanonicalSummarySourceValue = {
  value: string;
  pageReferences: number[];
};

export type CanonicalSummarySource = {
  title: string;
  overview: string;
  topics: CanonicalSummarySourceTopic[];
  concepts: CanonicalSummarySourceConcept[];
  relationships: CanonicalSummarySourceRelationship[];
  classifications: CanonicalSummarySourceClassification[];
  processes: CanonicalSummarySourceProcess[];
  formulas: CanonicalSummarySourceFormula[];
  authorsOrTheories: CanonicalSummarySourceValue[];
  examples: CanonicalSummarySourceValue[];
  studyClaims: CanonicalSummarySourceValue[];
  confusions: CanonicalSummarySourceValue[];
};

type BindingPageIndex = Map<string, number[]>;

/**
 * Proyecta el modelo pedagógico canónico a una representación compacta y
 * determinista pensada exclusivamente para generar la guía de estudio.
 *
 * La proyección:
 * - conserva todos los elementos académicos del modelo canónico;
 * - conserva páginas físicas sin enviar excerpts ni chunk indexes;
 * - conserva examRelevantClaims como `studyClaims`: son hechos/ideas académicas,
 *   no predicciones ni preguntas de examen;
 * - refuerza cada topic con los studyClaims respaldados por sus mismas páginas;
 * - crea topics complementarios cuando hay contenido canónico respaldado por
 *   páginas que no quedaron representadas en los topics generados;
 * - no recorta por cantidad de elementos ni por caracteres.
 *
 * El modelo canónico ya hizo el trabajo costoso de comprender y consolidar el
 * documento. Esta capa evita que el resumen vuelva a interpretar el PDF crudo.
 */
export function buildCanonicalSummarySource(
  model: CanonicalPedagogicalModel
): CanonicalSummarySource {
  const bindingPages = buildBindingPageIndex(model.sourceBindings ?? []);

  const resolvePages = (
    kind: CanonicalPedagogicalSourceKind,
    key: string,
    explicitPages?: number[]
  ) =>
    normalizePageReferences([
      ...(explicitPages ?? []),
      ...(bindingPages.get(buildBindingIndexKey(kind, key)) ?? []),
    ]);

  const concepts = model.concepts
    .map((concept) => {
      const term = cleanText(concept.term);
      const detail = cleanText(concept.detail);

      return {
        term,
        detail,
        kind: concept.kind,
        pageReferences: resolvePages(
          'concept',
          term,
          concept.pageReferences
        ),
      } satisfies CanonicalSummarySourceConcept;
    })
    .filter((concept) => concept.term && concept.detail);

  const relationships = model.relationships
    .map((relationship) => {
      const source = cleanText(relationship.source);
      const target = cleanText(relationship.target);
      const description = cleanText(relationship.description);

      return {
        source,
        target,
        description,
        pageReferences: resolvePages(
          'relationship',
          buildRelationshipKey(source, target),
          relationship.pageReferences
        ),
      } satisfies CanonicalSummarySourceRelationship;
    })
    .filter(
      (relationship) =>
        relationship.source &&
        relationship.target &&
        relationship.description
    );

  const classifications = model.classifications
    .map((classification) => {
      const title = cleanText(classification.title);

      return {
        title,
        items: cleanTextList(classification.items),
        pageReferences: resolvePages(
          'classification',
          title,
          classification.pageReferences
        ),
      } satisfies CanonicalSummarySourceClassification;
    })
    .filter(
      (classification) =>
        classification.title && classification.items.length > 0
    );

  const processes = model.processes
    .map((process) => {
      const title = cleanText(process.title);

      return {
        title,
        steps: cleanTextList(process.steps),
        pageReferences: resolvePages(
          'process',
          title,
          process.pageReferences
        ),
      } satisfies CanonicalSummarySourceProcess;
    })
    .filter((process) => process.title && process.steps.length > 0);

  const formulas = model.formulas
    .map((formula) => {
      const expression = cleanText(formula.expression);
      const description = cleanText(formula.description);

      return {
        expression,
        description,
        pageReferences: resolvePages(
          'formula',
          expression,
          formula.pageReferences
        ),
      } satisfies CanonicalSummarySourceFormula;
    })
    .filter((formula) => formula.expression && formula.description);

  const authorsOrTheories = cleanTextList(model.authorsOrTheories).map((value) => ({
    value,
    pageReferences: resolvePages('author_or_theory', value),
  }));

  const examples = cleanTextList(model.examples).map((value) => ({
    value,
    pageReferences: resolvePages('example', value),
  }));

  const studyClaims = cleanTextList(model.examRelevantClaims.map(normalizeStudyClaim)).map((value) => ({
    value,
    pageReferences: resolvePages('exam_relevant_claim', value),
  }));

  const confusions = cleanTextList(model.confusions).map((value) => ({
    value,
    pageReferences: resolvePages('confusion', value),
  }));

  const baseTopics = model.topics
    .map((topic) => {
      const title = cleanText(topic.title);
      const baseDescription = cleanText(topic.description);
      const pageReferences = resolvePages(
        'topic',
        title,
        topic.pageReferences
      );
      const relatedClaims = studyClaims
        .filter((claim) => sharesPage(pageReferences, claim.pageReferences))
        .map((claim) => claim.value);
      const description = cleanText(
        [
          baseDescription,
          relatedClaims.length > 0
            ? `Ideas clave del material: ${relatedClaims.join(' ')}`
            : '',
        ]
          .filter(Boolean)
          .join(' ')
      );

      return {
        title,
        description,
        relevance: topic.relevance === 'alta' ? 'alta' : 'media',
        pageReferences,
      } satisfies CanonicalSummarySourceTopic;
    })
    .filter((topic) => topic.title && topic.description);

  const coveredPages = new Set(
    baseTopics.flatMap((topic) => topic.pageReferences)
  );
  const supplementalTopics = buildSupplementalTopics(
    {
      concepts,
      relationships,
      classifications,
      processes,
      formulas,
      authorsOrTheories,
      examples,
      studyClaims,
      confusions,
    },
    coveredPages
  );
  const topics = [...baseTopics, ...supplementalTopics].sort((left, right) => {
    const leftPage = left.pageReferences[0] ?? Number.MAX_SAFE_INTEGER;
    const rightPage = right.pageReferences[0] ?? Number.MAX_SAFE_INTEGER;
    if (leftPage !== rightPage) return leftPage - rightPage;
    return left.title.localeCompare(right.title, 'es', { sensitivity: 'base' });
  });

  return {
    title: cleanText(model.title),
    overview: cleanText(model.overview),
    topics,
    concepts,
    relationships,
    classifications,
    processes,
    formulas,
    authorsOrTheories,
    examples,
    studyClaims,
    confusions,
  };
}

/**
 * Serializa sin indentación para reducir tokens de entrada en la futura llamada
 * que convertirá esta fuente canónica en la Guía de estudio.
 */
export function buildCanonicalSummarySourceText(
  model: CanonicalPedagogicalModel
) {
  return JSON.stringify(buildCanonicalSummarySource(model));
}

function buildSupplementalTopics(
  source: Pick<
    CanonicalSummarySource,
    | 'concepts'
    | 'relationships'
    | 'classifications'
    | 'processes'
    | 'formulas'
    | 'authorsOrTheories'
    | 'examples'
    | 'studyClaims'
    | 'confusions'
  >,
  coveredPages: Set<number>
): CanonicalSummarySourceTopic[] {
  const candidatePages = normalizePageReferences([
    ...source.concepts.flatMap((item) => item.pageReferences),
    ...source.relationships.flatMap((item) => item.pageReferences),
    ...source.classifications.flatMap((item) => item.pageReferences),
    ...source.processes.flatMap((item) => item.pageReferences),
    ...source.formulas.flatMap((item) => item.pageReferences),
    ...source.authorsOrTheories.flatMap((item) => item.pageReferences),
    ...source.examples.flatMap((item) => item.pageReferences),
    ...source.studyClaims.flatMap((item) => item.pageReferences),
    ...source.confusions.flatMap((item) => item.pageReferences),
  ]).filter((page) => !coveredPages.has(page));

  return candidatePages
    .map((page) => {
      const lines = cleanTextList([
        ...source.concepts
          .filter((item) => item.pageReferences.includes(page))
          .map((item) => `${item.term}: ${item.detail}`),
        ...source.relationships
          .filter((item) => item.pageReferences.includes(page))
          .map(
            (item) =>
              `${item.source} ↔ ${item.target}: ${item.description}`
          ),
        ...source.classifications
          .filter((item) => item.pageReferences.includes(page))
          .map((item) => `${item.title}: ${item.items.join('; ')}.`),
        ...source.processes
          .filter((item) => item.pageReferences.includes(page))
          .map((item) => `${item.title}: ${item.steps.join(' → ')}.`),
        ...source.formulas
          .filter((item) => item.pageReferences.includes(page))
          .map((item) => `${item.expression}: ${item.description}`),
        ...source.authorsOrTheories
          .filter((item) => item.pageReferences.includes(page))
          .map((item) => item.value),
        ...source.examples
          .filter((item) => item.pageReferences.includes(page))
          .map((item) => `Ejemplo: ${item.value}`),
        ...source.studyClaims
          .filter((item) => item.pageReferences.includes(page))
          .map((item) => `Idea clave: ${item.value}`),
        ...source.confusions
          .filter((item) => item.pageReferences.includes(page))
          .map((item) => `Confusión importante: ${item.value}`),
      ]);

      return {
        title: `Contenido complementario · página ${page}`,
        description: cleanText(lines.join(' ')),
        relevance: 'alta' as const,
        pageReferences: [page],
      };
    })
    .filter((topic) => topic.description.length > 0);
}

function buildBindingPageIndex(
  bindings: CanonicalPedagogicalSourceBinding[]
): BindingPageIndex {
  const index: BindingPageIndex = new Map();

  for (const binding of bindings) {
    const key = buildBindingIndexKey(binding.kind, binding.key);
    const pages = binding.references.flatMap((reference) =>
      expandPageRange(reference.pageStart, reference.pageEnd)
    );

    index.set(
      key,
      normalizePageReferences([...(index.get(key) ?? []), ...pages])
    );
  }

  return index;
}

function buildBindingIndexKey(
  kind: CanonicalPedagogicalSourceKind,
  key: string
) {
  const normalizedKey = kind === 'exam_relevant_claim' ? normalizeStudyClaim(key) : key;
  return `${kind}:${normalizeLookupKey(normalizedKey)}`;
}

function buildRelationshipKey(source: string, target: string) {
  return `${source} → ${target}`;
}

function normalizeLookupKey(value: string) {
  return cleanText(value).toLocaleLowerCase('es');
}

function normalizeStudyClaim(value: string) {
  return cleanText(value)
    .replace(/^pregunta\s+(?:t[ií]pica\s+)?de\s+examen\s*:\s*/i, '')
    .replace(/^pregunta\s+(?:t[ií]pica\s+)?de\s+parcial\s*:\s*/i, '')
    .trim();
}

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function cleanTextList(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawValue of values) {
    const value = cleanText(rawValue);
    const key = normalizeLookupKey(value);

    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function sharesPage(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0) return false;
  const rightPages = new Set(right);
  return left.some((page) => rightPages.has(page));
}

function normalizePageReferences(values: number[]) {
  return Array.from(
    new Set(
      values.filter(
        (page) =>
          Number.isInteger(page) &&
          Number.isFinite(page) &&
          page > 0
      )
    )
  ).sort((a, b) => a - b);
}

function expandPageRange(
  pageStart: number | null,
  pageEnd: number | null
) {
  const start = normalizePageNumber(pageStart);
  const end = normalizePageNumber(pageEnd);

  if (start === null && end === null) return [];
  if (start === null) return end === null ? [] : [end];
  if (end === null) return [start];

  const lower = Math.min(start, end);
  const upper = Math.max(start, end);
  const pages: number[] = [];

  for (let page = lower; page <= upper; page += 1) {
    pages.push(page);
  }

  return pages;
}

function normalizePageNumber(value: number | null) {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : null;
}
