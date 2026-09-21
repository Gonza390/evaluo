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
const MAX_TOPICS_PER_SECTION = 4;

function resolveMinimumSectionCount(topicCount: number) {
  return Math.max(1, Math.ceil(topicCount / MAX_TOPICS_PER_SECTION));
}

function resolveCanonicalSummaryMaxOutputTokens(model: CanonicalPedagogicalModel) {
  const estimated =
    4_800 +
    model.topics.length * 140 +
    model.classifications.length * 70 +
    model.processes.length * 70 +
    model.formulas.length * 45;

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
  const minimumSectionCount = resolveMinimumSectionCount(source.topics.length);
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
    '- sections: secciones conceptualmente coherentes en el orden general de la fuente.',
    '- Cada title debe ser corto y venir numerado: "1. ...", "2. ...".',
    '- Cada body debe usar subtítulos, viñetas y tablas Markdown cuando una clasificación, comparación o conjunto de valores de referencia lo justifique.',
    '- Una tabla Markdown debe reconstruir relaciones reales de la fuente (por ejemplo Tipo | Característica | Diferencia o Parámetro | Valor). No inventes celdas ni atributos ausentes.',
    '- No copies fragmentos rotos del parser dentro de una tabla: cada fila debe representar una entidad académica coherente.',
    '- Separá los casos clínicos o aplicaciones extensas de la teoría cuando tengan entidad propia en la fuente.',
    '- No fuerces un número fijo de secciones, pero tampoco comprimas en exceso: usa las necesarias para representar todos los topics.',
    `- Esta fuente contiene ${source.topics.length} topics. Generá al menos ${minimumSectionCount} secciones y no agrupes más de ${MAX_TOPICS_PER_SECTION} topics distintos dentro de una misma sección.`,
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
  const source = buildCanonicalSummarySource(model);
  const shortSummary =
    truncateAtWord(cleanLine(source.overview), 1_400) ||
    `Guía de estudio de ${cleanLine(source.title) || 'este material'}.`;

  const keyPoints = buildCanonicalFallbackKeyPoints(source);
  const sections = source.topics.map((topic, index) => {
    const relatedLines = buildRelatedStudyLines(source, topic.pageReferences);
    const body = cleanMultilineBlock(
      [
        topic.description,
        ...relatedLines,
        formatPdfReference(topic.pageReferences),
      ]
        .filter(Boolean)
        .join('\n')
    );

    return {
      title: `${index + 1}. ${stripLeadingNumber(topic.title)}`,
      body,
    };
  });

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
  const source = buildCanonicalSummarySource(model);

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
  const source = buildCanonicalSummarySource(model);
  if (source.topics.length === 0) return null;

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
  const minimumSectionCount = resolveMinimumSectionCount(source.topics.length);
  if (rawSections.length < minimumSectionCount) {
    return null;
  }

  const sectionTopicNumbers = rawSections.map((section) =>
    normalizeTopicNumbers(section.source_topic_numbers, source.topics.length)
  );

  if (
    source.topics.length > MAX_TOPICS_PER_SECTION &&
    sectionTopicNumbers.some(
      (topicNumbers) => topicNumbers.length > MAX_TOPICS_PER_SECTION
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
    5_000,
    Math.max(1_600, canonicalDetailCount * 55)
  );

  if (totalBodyChars < minimumBodyChars) {
    return null;
  }

  return {
    shortSummary,
    keyPoints,
    sections,
    hasContent: true,
    status: 'ready',
    provider: `${providerModel}-canonical`,
    errorMessage: null,
    sourceChunksCount: model.chunkCount,
  };
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

function buildRelatedStudyLines(
  source: CanonicalSummarySource,
  topicPages: number[]
) {
  if (topicPages.length === 0) return [];

  const lines: string[] = [];

  for (const concept of source.concepts) {
    if (!sharesPage(topicPages, concept.pageReferences)) continue;
    lines.push(`- ${concept.term}: ${concept.detail}`);
  }

  for (const relationship of source.relationships) {
    if (!sharesPage(topicPages, relationship.pageReferences)) continue;
    lines.push(
      `- ${relationship.source} ↔ ${relationship.target}: ${relationship.description}`
    );
  }

  for (const classification of source.classifications) {
    if (!sharesPage(topicPages, classification.pageReferences)) continue;
    lines.push(
      `- ${classification.title}: ${classification.items.join('; ')}.`
    );
  }

  for (const process of source.processes) {
    if (!sharesPage(topicPages, process.pageReferences)) continue;
    lines.push(`- ${process.title}: ${process.steps.join(' → ')}.`);
  }

  for (const formula of source.formulas) {
    if (!sharesPage(topicPages, formula.pageReferences)) continue;
    lines.push(`- ${formula.expression}: ${formula.description}`);
  }

  for (const example of source.examples) {
    if (!sharesPage(topicPages, example.pageReferences)) continue;
    lines.push(`Ejemplo aplicado: ${example.value}`);
  }

  for (const confusion of source.confusions) {
    if (!sharesPage(topicPages, confusion.pageReferences)) continue;
    lines.push(`Importante: ${confusion.value}`);
  }

  return dedupeStrings(lines);
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
