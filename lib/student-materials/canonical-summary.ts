import { extractJsonObject } from '@/lib/ai/json';
import { requestGeminiJson } from '@/lib/ai/providers';
import {
  isolateUntrustedContent,
  MAX_AI_SECTION_BODY_CHARS,
  PROMPT_INJECTION_GUARD,
} from '@/lib/ai/safety';
import { recordAiUsage } from '@/lib/student-materials/ai-usage';
import {
  buildCanonicalSummarySource,
  type CanonicalSummarySource,
} from '@/lib/student-materials/canonical-summary-source';
import {
  cleanLine,
  cleanMultilineBlock,
  dedupeStrings,
  truncateAtWord,
} from '@/lib/student-materials/text';
import type {
  CanonicalPedagogicalModel,
  GenerateSummaryInput,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';
import { logError } from '@/lib/observability';

const CANONICAL_SUMMARY_BASE_MAX_OUTPUT_TOKENS = 6_000;
const CANONICAL_SUMMARY_HARD_MAX_OUTPUT_TOKENS = 9_000;
const MIN_GUIDE_CHAPTERS = 3;
const MAX_GUIDE_CHAPTERS = 8;
const TARGET_SOURCE_PAGES_PER_CHAPTER = 5;
const MIN_GUIDE_WORDS = 900;
const MAX_GUIDE_WORDS = 6_500;
const TARGET_WORDS_PER_SOURCE_PAGE = 160;
const TARGET_WORDS_PER_TOPIC = 90;
const MAX_FALLBACK_TABLES_PER_CHAPTER = 2;

type CanonicalGuidePlan = {
  estimatedPageCount: number;
  preferredChapterCount: number;
  minChapterCount: number;
  maxChapterCount: number;
  targetWordCount: number;
  maxTopicsPerChapter: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isAdministrativeTopic(topic: CanonicalSummarySource['topics'][number]) {
  const title = cleanLine(topic.title).toLocaleLowerCase('es');
  return (
    /^presentaci[oó]n (?:de la asignatura|del documento)$/u.test(title) ||
    /^informaci[oó]n (?:de )?autor[ií]a(?: y derechos)?$/u.test(title) ||
    /^autor[ií]a y derechos$/u.test(title) ||
    /^datos? de autor[ií]a$/u.test(title)
  );
}

function buildStudyCanonicalSummarySource(
  model: CanonicalPedagogicalModel
): CanonicalSummarySource {
  const source = buildCanonicalSummarySource(model);
  return {
    ...source,
    topics: source.topics.filter((topic) => !isAdministrativeTopic(topic)),
  };
}

function getEstimatedSourcePageCount(source: CanonicalSummarySource) {
  const pages = [
    ...source.topics.flatMap((item) => item.pageReferences),
    ...source.concepts.flatMap((item) => item.pageReferences),
    ...source.relationships.flatMap((item) => item.pageReferences),
    ...source.classifications.flatMap((item) => item.pageReferences),
    ...source.processes.flatMap((item) => item.pageReferences),
    ...source.formulas.flatMap((item) => item.pageReferences),
    ...source.examples.flatMap((item) => item.pageReferences),
    ...source.confusions.flatMap((item) => item.pageReferences),
  ];

  return pages.length > 0 ? Math.max(...pages) : 1;
}

function resolveCanonicalGuidePlan(
  source: CanonicalSummarySource
): CanonicalGuidePlan {
  const topicCount = Math.max(1, source.topics.length);
  const estimatedPageCount = getEstimatedSourcePageCount(source);
  const preferredChapterCount = Math.min(
    topicCount,
    clamp(
      Math.ceil(estimatedPageCount / TARGET_SOURCE_PAGES_PER_CHAPTER),
      MIN_GUIDE_CHAPTERS,
      MAX_GUIDE_CHAPTERS
    )
  );
  const minChapterCount = Math.min(
    preferredChapterCount,
    Math.max(2, preferredChapterCount - 1)
  );
  const maxChapterCount = Math.min(
    topicCount,
    Math.max(preferredChapterCount, Math.min(MAX_GUIDE_CHAPTERS, preferredChapterCount + 1))
  );
  const pageDrivenWords = estimatedPageCount * TARGET_WORDS_PER_SOURCE_PAGE;
  const topicDrivenWords = topicCount * TARGET_WORDS_PER_TOPIC;
  const targetWordCount = clamp(
    Math.round(
      Math.min(
        pageDrivenWords,
        Math.max(estimatedPageCount * 100, topicDrivenWords)
      )
    ),
    MIN_GUIDE_WORDS,
    MAX_GUIDE_WORDS
  );
  const maxTopicsPerChapter = Math.max(
    6,
    Math.ceil((topicCount / Math.max(1, minChapterCount)) * 1.75)
  );

  return {
    estimatedPageCount,
    preferredChapterCount,
    minChapterCount,
    maxChapterCount,
    targetWordCount,
    maxTopicsPerChapter,
  };
}

function resolveCanonicalSummaryMaxOutputTokens(model: CanonicalPedagogicalModel) {
  const source = buildStudyCanonicalSummarySource(model);
  const plan = resolveCanonicalGuidePlan(source);
  const estimated = Math.ceil(plan.targetWordCount * 1.55);

  return Math.min(
    CANONICAL_SUMMARY_HARD_MAX_OUTPUT_TOKENS,
    Math.max(CANONICAL_SUMMARY_BASE_MAX_OUTPUT_TOKENS, estimated)
  );
}

const CANONICAL_SUMMARY_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary_short: { type: 'STRING' },
    key_points: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    sections: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          body: { type: 'STRING' },
          source_topic_numbers: {
            type: 'ARRAY',
            items: { type: 'INTEGER' },
          },
        },
        required: ['title', 'body', 'source_topic_numbers'],
      },
    },
  },
  required: ['summary_short', 'key_points', 'sections'],
};

type CanonicalSummaryPayload = {
  summary_short?: string;
  key_points?: string[];
  sections?: Array<{
    title?: string;
    body?: unknown;
    source_topic_numbers?: unknown;
  }>;
};

type IndexedCanonicalSummarySource = Omit<CanonicalSummarySource, 'topics'> & {
  topics: Array<
    CanonicalSummarySource['topics'][number] & {
      sourceTopicNumber: number;
    }
  >;
};

/**
 * Construye el prompt de una única generación de Guía de estudio a partir del
 * modelo canónico ya consolidado. No vuelve a enviar el PDF, chunks ni excerpts.
 */
export function buildCanonicalSummaryPrompt(
  input: Pick<
    GenerateSummaryInput,
    'title' | 'universidadName' | 'carreraName' | 'materiaName'
  >,
  model: CanonicalPedagogicalModel
) {
  const source = buildIndexedCanonicalSummarySource(model);
  const plan = resolveCanonicalGuidePlan(source);
  const context = [
    input.universidadName ? `Universidad: ${input.universidadName}` : null,
    input.carreraName ? `Carrera: ${input.carreraName}` : null,
    input.materiaName ? `Materia: ${input.materiaName}` : null,
    `Documento: ${input.title}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    'Sos un tutor académico experto en convertir un modelo pedagógico canónico en una Guía de estudio.',
    'El documento ya fue analizado y consolidado. NO vuelvas a inferir la estructura desde un PDF ni agregues conocimiento externo.',
    'Respondé únicamente con JSON válido.',
    '',
    'Objetivo:',
    '- Crear una guía clara, completa y útil para estudiar.',
    '- Cubrir TODOS los topics de la fuente canónica.',
    '- Podés integrar varios topics relacionados dentro de una misma sección, pero ningún topic puede quedar sin representación.',
    '- Priorizá definiciones, relaciones, clasificaciones, procesos, fórmulas, ejemplos y confusiones conceptuales.',
    '- No repitas la misma idea en varias secciones.',
    '- Priorizá cobertura académica suficiente por encima de una brevedad excesiva.',
    '',
    'Contrato de cobertura interna:',
    '- No alcanza con mencionar el nombre de un topic: representá sus ideas, conceptos y estructuras importantes.',
    '- Si una clasificación canónica tiene hasta 10 elementos, conservá todos sus elementos. No reduzcas una clasificación desarrollada a una lista incompleta.',
    '- Cuando la fuente aporte características o diferencias de los miembros de una clasificación, incluilas; evitá dejar nombres aislados si existe detalle canónico disponible.',
    '- Si un proceso tiene una secuencia explícita, conservá todos sus pasos relevantes y su orden.',
    '- Conservá las fórmulas y su significado cuando aparezcan en el modelo.',
    '- Las relaciones conceptuales centrales del topic deben aparecer en el desarrollo, no sólo las definiciones sueltas.',
    '- Un topic desarrollado mediante varios conceptos, relaciones o procesos no debe comprimirse a una sola oración genérica.',
    '- No completes huecos con conocimiento general: si el modelo no aporta un detalle, no lo inventes.',
    '',
    'Separación pedagógica obligatoria:',
    '- La fuente de esta llamada excluye deliberadamente examRelevantClaims.',
    '- NO inventes preguntas, consignas, predicciones de examen ni secciones del tipo "Pregunta típica de examen".',
    '- Las confusiones conceptuales sí pertenecen a la guía porque ayudan a estudiar.',
    '',
    'Estructura de salida:',
    '- summary_short: síntesis global de 4 a 6 líneas.',
    '- key_points: exactamente 5 ideas académicas concretas, no títulos.',
    '- sections representa CAPÍTULOS, no topics atómicos. Agrupá los topics relacionados dentro de una jerarquía de estudio.',
    '- Cada title debe ser corto, amplio y venir numerado: "1. ...", "2. ...".',
    `- Para este material, generá entre ${plan.minChapterCount} y ${plan.maxChapterCount} capítulos; el objetivo preferido es ${plan.preferredChapterCount}.`,
    '- Dentro de cada capítulo usá entre 3 y 7 subtítulos internos (por ejemplo "### 2.1 ...") cuando el volumen lo justifique. Esos subtítulos deben consolidar topics relacionados, no copiar un topic por subtítulo de forma mecánica.',
    `- La guía debe ser moderada y estudiar, no reconstruir el PDF. Apuntá aproximadamente a ${plan.targetWordCount} palabras totales: conservá el núcleo académico, condensá soporte repetitivo y usá ejemplos/casos para aplicar, no para duplicar teoría.`,
    '- Cada body debe usar subtítulos, viñetas y tablas Markdown cuando una clasificación, comparación o conjunto de valores de referencia lo justifique.',
    '- Una tabla Markdown debe reconstruir relaciones reales de la fuente (por ejemplo Tipo | Característica | Diferencia o Parámetro | Valor). No inventes celdas ni atributos ausentes.',
    '- No copies fragmentos rotos del parser dentro de una tabla: cada fila debe representar una entidad académica coherente.',
    '- Cuando haya varias clasificaciones comparables, preferí un cuadro antes que repetir párrafos equivalentes.',
    '- Agrupá los casos clínicos o aplicaciones extensas en un capítulo de aplicación cuando sea coherente, usando un subtítulo por caso o problema; no conviertas cada pregunta interna del caso en una sección independiente.',
    '- Excluí créditos, copyright, presentación administrativa y metadatos del documento del contenido de estudio.',
    `- Esta fuente contiene ${source.topics.length} topics académicos. Un capítulo puede integrar varios; no agrupes más de ${plan.maxTopicsPerChapter} topics distintos dentro de un mismo capítulo.`,
    '- Cada sección debe declarar source_topic_numbers con los números de topic que realmente integra.',
    '- source_topic_numbers sólo puede contener números existentes en la fuente.',
    '- No escribas números de página dentro del body: la aplicación los añadirá a partir de source_topic_numbers validados.',
    '',
    'Formato exacto:',
    '{"summary_short":"...","key_points":["..."],"sections":[{"title":"1. ...","body":"...","source_topic_numbers":[1]}]}',
    '',
    PROMPT_INJECTION_GUARD,
    '',
    context,
    '',
    'MODELO CANÓNICO PARA LA GUÍA:',
    isolateUntrustedContent(JSON.stringify(source)),
  ].join('\n');
}

/**
 * Genera una guía desde el modelo canónico con UNA sola llamada de IA.
 *
 * Si la llamada falla o devuelve una forma insuficiente, usa un fallback local
 * derivado del mismo modelo. No vuelve al PDF ni dispara el map/reduce legacy.
 */
export async function generateCanonicalStudentMaterialSummary(
  input: GenerateSummaryInput,
  model: CanonicalPedagogicalModel
): Promise<StudentMaterialSummary> {
  const prompt = buildCanonicalSummaryPrompt(input, model);

  try {
    const result = await requestGeminiJson({
      prompt,
      temperature: 0.12,
      maxOutputTokens: resolveCanonicalSummaryMaxOutputTokens(model),
      responseSchema: CANONICAL_SUMMARY_RESPONSE_SCHEMA,
    });

    if (result) {
      await recordAiUsage({
        materialId: input.materialId,
        userId: input.userId,
        provider: 'gemini',
        model: result.model,
        operation: 'summary_canonical',
        usage: result.usage,
      });

      const parsed = parseCanonicalSummaryPayload(result.content);
      const summary = sanitizeCanonicalSummaryPayload(parsed, model, result.model);

      if (summary) {
        return summary;
      }
    }
  } catch (error) {
    logError('studentMaterialSummary.canonical', error, {
      materialId: input.materialId,
      title: input.title,
    });
  }

  return buildCanonicalStudentMaterialSummaryFallback(model);
}

/**
 * Fallback determinista y sin IA. Mantiene cobertura de todos los topics del
 * modelo canónico y conserva sus páginas físicas en el texto visible.
 */
export function buildCanonicalStudentMaterialSummaryFallback(
  model: CanonicalPedagogicalModel
): StudentMaterialSummary {
  const source = buildStudyCanonicalSummarySource(model);
  const shortSummary =
    truncateAtWord(cleanLine(source.overview), 1_400) ||
    `Guía de estudio de ${cleanLine(source.title) || 'este material'}.`;

  const keyPoints = buildCanonicalFallbackKeyPoints(source);
  const plan = resolveCanonicalGuidePlan(source);
  const chapterGroups = partitionTopicsByPageRange(
    source.topics,
    plan.preferredChapterCount,
    plan.estimatedPageCount
  );
  const sections = chapterGroups.map((topics, chapterIndex) => ({
    title: `${chapterIndex + 1}. ${buildFallbackChapterTitle(topics)}`,
    body: buildStructuredChapterBody(source, topics, chapterIndex),
  }));

  return {
    shortSummary,
    keyPoints,
    sections,
    hasContent: Boolean(shortSummary && (sections.length > 0 || keyPoints.length > 0)),
    status: shortSummary ? 'ready' : 'error',
    provider: 'canonical-local-fallback',
    errorMessage: shortSummary ? null : 'Modelo canónico sin contenido suficiente',
    sourceChunksCount: model.chunkCount,
  };
}

function buildIndexedCanonicalSummarySource(
  model: CanonicalPedagogicalModel
): IndexedCanonicalSummarySource {
  const source = buildStudyCanonicalSummarySource(model);

  return {
    ...source,
    topics: source.topics.map((topic, index) => ({
      ...topic,
      sourceTopicNumber: index + 1,
    })),
  };
}

function parseCanonicalSummaryPayload(raw: string): CanonicalSummaryPayload {
  try {
    return extractJsonObject(raw) as CanonicalSummaryPayload;
  } catch {
    return {};
  }
}

function sanitizeCanonicalSummaryPayload(
  payload: CanonicalSummaryPayload,
  model: CanonicalPedagogicalModel,
  providerModel: string
): StudentMaterialSummary | null {
  const source = buildStudyCanonicalSummarySource(model);
  if (source.topics.length === 0) return null;
  const plan = resolveCanonicalGuidePlan(source);

  const shortSummary = truncateAtWord(
    cleanLine(payload.summary_short ?? ''),
    1_400
  );

  const keyPoints = dedupeStrings(
    Array.isArray(payload.key_points)
      ? payload.key_points
          .map((point) => truncateAtWord(cleanLine(String(point ?? '')), 240))
          .filter((point) => point.length >= 20)
      : []
  ).slice(0, 5);

  if (keyPoints.length !== 5 || shortSummary.length < 100) {
    return null;
  }

  const rawSections = Array.isArray(payload.sections) ? payload.sections : [];
  if (
    rawSections.length < plan.minChapterCount ||
    rawSections.length > plan.maxChapterCount
  ) {
    return null;
  }

  const sectionTopicNumbers = rawSections.map((section) =>
    normalizeTopicNumbers(section.source_topic_numbers, source.topics.length)
  );

  if (
    sectionTopicNumbers.some(
      (topicNumbers) =>
        topicNumbers.length === 0 ||
        topicNumbers.length > plan.maxTopicsPerChapter
    )
  ) {
    return null;
  }

  const coveredTopics = new Set<number>();
  const sections = rawSections
    .map((section, index) => {
      const topicNumbers = sectionTopicNumbers[index] ?? [];

      topicNumbers.forEach((number) => coveredTopics.add(number));

      const title = normalizeSectionTitle(
        cleanLine(section.title ?? ''),
        index
      );
      const body = truncateAtWord(
        cleanMultilineBlock(coerceBody(section.body)),
        MAX_AI_SECTION_BODY_CHARS
      );
      const pages = normalizePages(
        topicNumbers.flatMap(
          (topicNumber) =>
            source.topics[topicNumber - 1]?.pageReferences ?? []
        )
      );

      if (!title || !body || topicNumbers.length === 0) {
        return null;
      }

      return {
        title,
        body: cleanMultilineBlock(
          [body, formatPdfReference(pages)].filter(Boolean).join('\n')
        ),
      };
    })
    .filter(
      (section): section is { title: string; body: string } =>
        section !== null
    );

  if (sections.length === 0) return null;

  const allTopicsCovered = source.topics.every((_, index) =>
    coveredTopics.has(index + 1)
  );

  if (!allTopicsCovered) {
    return null;
  }

  const totalBodyChars = sections.reduce(
    (total, section) => total + cleanLine(section.body).length,
    0
  );
  const canonicalDetailCount =
    source.concepts.length +
    source.relationships.length +
    source.classifications.length +
    source.processes.length +
    source.formulas.length;
  const minimumBodyChars = Math.min(
    28_000,
    Math.max(
      4_500,
      plan.targetWordCount * 3,
      canonicalDetailCount * 28
    )
  );

  const needsCanonicalExpansion = totalBodyChars < minimumBodyChars;
  const completeSections = needsCanonicalExpansion
    ? sections.map((section, index) => {
        const topics = (sectionTopicNumbers[index] ?? [])
          .map((topicNumber) => source.topics[topicNumber - 1])
          .filter(
            (
              topic
            ): topic is CanonicalSummarySource['topics'][number] =>
              Boolean(topic)
          );

        return {
          title: section.title,
          body: buildStructuredChapterBody(source, topics, index),
        };
      })
    : sections;

  const enrichedSections = injectCanonicalTables(
    completeSections,
    sectionTopicNumbers,
    source
  );

  return {
    shortSummary,
    keyPoints,
    sections: enrichedSections,
    hasContent: true,
    status: 'ready',
    provider: needsCanonicalExpansion
      ? `${providerModel}-canonical-expanded`
      : `${providerModel}-canonical`,
    errorMessage: null,
    sourceChunksCount: model.chunkCount,
  };
}

function partitionEvenly<T>(items: T[], desiredGroups: number): T[][] {
  if (items.length === 0) return [];

  const groupCount = clamp(desiredGroups, 1, items.length);
  const groups: T[][] = [];
  let cursor = 0;

  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const remainingItems = items.length - cursor;
    const remainingGroups = groupCount - groupIndex;
    const size = Math.ceil(remainingItems / remainingGroups);
    groups.push(items.slice(cursor, cursor + size));
    cursor += size;
  }

  return groups.filter((group) => group.length > 0);
}

function partitionTopicsByPageRange(
  topics: CanonicalSummarySource['topics'],
  desiredGroups: number,
  estimatedPageCount: number
) {
  if (topics.length === 0) return [];

  const groupCount = clamp(desiredGroups, 1, topics.length);
  const pageCount = Math.max(1, estimatedPageCount);
  const groups = Array.from(
    { length: groupCount },
    () => [] as CanonicalSummarySource['topics']
  );

  topics.forEach((topic, index) => {
    const firstPage = topic.pageReferences[0];
    const proportionalIndex =
      typeof firstPage === 'number'
        ? Math.floor(((firstPage - 1) / pageCount) * groupCount)
        : Math.floor((index / topics.length) * groupCount);
    const groupIndex = clamp(proportionalIndex, 0, groupCount - 1);
    groups[groupIndex]?.push(topic);
  });

  return groups.filter((group) => group.length > 0);
}

function buildStructuredChapterBody(
  source: CanonicalSummarySource,
  topics: CanonicalSummarySource['topics'],
  chapterIndex: number
) {
  const chapterPages = normalizePages(
    topics.flatMap((topic) => topic.pageReferences)
  );
  const desiredSubtopicCount = clamp(
    Math.ceil(topics.length / 2),
    Math.min(2, topics.length),
    Math.min(6, topics.length)
  );
  const subtopicGroups = partitionEvenly(topics, desiredSubtopicCount);
  const subtopicBlocks = subtopicGroups.map((subtopics, subtopicIndex) => {
    const firstTopic = subtopics[0];
    if (!firstTopic) return '';

    const lines = subtopics.map((topic) =>
      subtopics.length === 1
        ? topic.description
        : `- **${stripLeadingNumber(topic.title)}:** ${topic.description}`
    );

    return [
      `### ${chapterIndex + 1}.${subtopicIndex + 1} ${stripLeadingNumber(firstTopic.title)}`,
      ...lines,
    ].join('\n');
  });
  const structuredBlocks = buildFallbackStructuredBlocks(
    source,
    chapterPages
  );

  return cleanMultilineBlock(
    [
      ...subtopicBlocks,
      ...structuredBlocks,
      formatPdfReference(chapterPages),
    ]
      .filter(Boolean)
      .join('\n\n')
  );
}

function buildFallbackChapterTitle(
  topics: CanonicalSummarySource['topics']
) {
  const first = topics[0];
  if (!first) return 'Contenido central';
  return truncateAtWord(stripLeadingNumber(first.title), 90);
}

function buildFallbackStructuredBlocks(
  source: CanonicalSummarySource,
  pages: number[]
) {
  const blocks: string[] = [];
  const matchingClassifications = source.classifications.filter((item) =>
    sharesPage(pages, item.pageReferences)
  );
  let tableCount = 0;

  for (const classification of matchingClassifications) {
    if (tableCount >= MAX_FALLBACK_TABLES_PER_CHAPTER) break;
    const table = buildClassificationMarkdownTable(source, classification);
    if (!table) continue;
    blocks.push(table);
    tableCount += 1;
  }

  if (tableCount === 0) {
    for (const classification of matchingClassifications.slice(0, 2)) {
      blocks.push(
        `Clasificación: **${classification.title}** — ${classification.items.join('; ')}.`
      );
    }
  }

  for (const process of source.processes
    .filter((item) => sharesPage(pages, item.pageReferences))
    .slice(0, 2)) {
    blocks.push(`Proceso: **${process.title}** — ${process.steps.join(' → ')}.`);
  }

  for (const formula of source.formulas
    .filter((item) => sharesPage(pages, item.pageReferences))
    .slice(0, 2)) {
    blocks.push(`Fórmula: **${formula.expression}** — ${formula.description}`);
  }

  for (const confusion of source.confusions
    .filter((item) => sharesPage(pages, item.pageReferences))
    .slice(0, 2)) {
    blocks.push(`Confusión frecuente: ${confusion.value}`);
  }

  return blocks;
}

function injectCanonicalTables(
  sections: Array<{ title: string; body: string }>,
  sectionTopicNumbers: number[][],
  source: CanonicalSummarySource
) {
  const usedClassifications = new Set<string>();

  return sections.map((section, index) => {
    if (hasMarkdownTable(section.body)) return section;

    const topicNumbers = sectionTopicNumbers[index] ?? [];
    const pages = normalizePages(
      topicNumbers.flatMap(
        (topicNumber) => source.topics[topicNumber - 1]?.pageReferences ?? []
      )
    );

    const candidate = source.classifications.find((classification) => {
      const key = cleanLine(classification.title).toLocaleLowerCase('es');
      return (
        !usedClassifications.has(key) &&
        sharesPage(pages, classification.pageReferences) &&
        Boolean(buildClassificationMarkdownTable(source, classification))
      );
    });

    if (!candidate) return section;

    const table = buildClassificationMarkdownTable(source, candidate);
    if (!table) return section;

    usedClassifications.add(
      cleanLine(candidate.title).toLocaleLowerCase('es')
    );

    return {
      ...section,
      body: cleanMultilineBlock([section.body, table].join('\n\n')),
    };
  });
}

function hasMarkdownTable(body: string) {
  return /\|[^\n]+\|\s*\n\s*\|\s*:?-{3,}/u.test(body);
}

function buildClassificationMarkdownTable(
  source: CanonicalSummarySource,
  classification: CanonicalSummarySource['classifications'][number]
) {
  if (classification.items.length < 2 || classification.items.length > 10) {
    return '';
  }

  const rows = classification.items
    .map((item) => resolveClassificationRow(source, item))
    .filter(
      (row): row is { label: string; detail: string } =>
        Boolean(row?.label && row.detail)
    );

  if (
    rows.length < 2 ||
    rows.length < Math.ceil(classification.items.length * 0.6)
  ) {
    return '';
  }

  const tableRows = rows.map(
    (row) =>
      `| ${escapeMarkdownTableCell(row.label)} | ${escapeMarkdownTableCell(
        truncateAtWord(row.detail, 240)
      )} |`
  );

  return [
    `### ${classification.title}`,
    '| Tipo / categoría | Característica clave |',
    '| --- | --- |',
    ...tableRows,
  ].join('\n');
}

function resolveClassificationRow(
  source: CanonicalSummarySource,
  rawItem: string
) {
  const item = cleanLine(rawItem);
  if (!item) return null;

  const explicit = item.match(/^(.{2,90}?)(?::|\s+[—–-]\s+)(.+)$/u);
  if (explicit?.[1] && explicit[2]) {
    return {
      label: cleanLine(explicit[1]),
      detail: cleanLine(explicit[2]),
    };
  }

  const itemKey = normalizeComparisonKey(item);
  const matchingConcept = source.concepts.find((concept) => {
    const conceptKey = normalizeComparisonKey(concept.term);
    return (
      conceptKey === itemKey ||
      (conceptKey.length >= 5 &&
        itemKey.length >= 5 &&
        (conceptKey.includes(itemKey) || itemKey.includes(conceptKey)))
    );
  });

  if (!matchingConcept) return null;

  return {
    label: item,
    detail: matchingConcept.detail,
  };
}

function normalizeComparisonKey(value: string) {
  return cleanLine(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase('es');
}

function escapeMarkdownTableCell(value: string) {
  return cleanLine(value).replace(/\|/gu, '/');
}

function buildCanonicalFallbackKeyPoints(source: CanonicalSummarySource) {
  const topicPoints = source.topics
    .filter((topic) => topic.relevance === 'alta')
    .map((topic) => topic.description);

  const conceptPoints = source.concepts.map(
    (concept) => `${concept.term}: ${concept.detail}`
  );

  const confusionPoints = source.confusions.map(
    (confusion) => confusion.value
  );

  return dedupeStrings([
    ...topicPoints,
    ...conceptPoints,
    ...confusionPoints,
  ])
    .map((point) => truncateAtWord(cleanLine(point), 240))
    .filter((point) => point.length >= 20)
    .slice(0, 5);
}

function normalizeTopicNumbers(value: unknown, topicCount: number) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter(
          (item) =>
            Number.isInteger(item) &&
            item >= 1 &&
            item <= topicCount
        )
    )
  ).sort((a, b) => a - b);
}

function normalizePages(pages: number[]) {
  return Array.from(
    new Set(
      pages.filter(
        (page) =>
          Number.isInteger(page) &&
          Number.isFinite(page) &&
          page > 0
      )
    )
  ).sort((a, b) => a - b);
}

function sharesPage(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0) return false;
  const rightSet = new Set(right);
  return left.some((page) => rightSet.has(page));
}

function normalizeSectionTitle(value: string, index: number) {
  const title = stripLeadingNumber(value);
  if (!title || isPracticeOnlyTitle(title)) return '';
  return `${index + 1}. ${title}`;
}

function stripLeadingNumber(value: string) {
  return cleanLine(value).replace(/^\d+(?:\.\d+)*\.?\s+/, '').trim();
}

function isPracticeOnlyTitle(value: string) {
  return /^(?:pregunta(?:s)?(?:\s+t[ií]pica(?:s)?)?(?:\s+de\s+examen)?|ejemplo\s+de\s+examen|idea\s+de\s+examen|comparaci[oó]n\s+de\s+examen|respuesta\s+completa\s+en\s+examen|preguntas\s+de\s+repaso)$/i.test(
    cleanLine(value)
  );
}

function coerceBody(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => coerceBody(item)).filter(Boolean).join('\n');
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .map((item) => coerceBody(item))
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

function formatPdfReference(pages: number[]) {
  const normalized = normalizePages(pages);
  if (normalized.length === 0) return '';

  if (normalized.length === 1) {
    return `Ver en PDF · página ${normalized[0]}`;
  }

  return `Ver en PDF · páginas ${normalized.join(', ')}`;
}
