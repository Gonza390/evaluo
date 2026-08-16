import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { requestGeminiImagesJson, requestGeminiJson, requestGeminiPdfJson, requestGroqJson, requestNvidiaJson } from '@/lib/ai/providers';
import { renderPdfPagesToPngs } from '@/lib/student-materials/pdf-render';
import { extractJsonObject } from '@/lib/ai/json';
import {
  isolateUntrustedContent,
  MAX_AI_SECTION_BODY_CHARS,
  PROMPT_INJECTION_GUARD,
} from '@/lib/ai/safety';
import {
  buildFallbackSectionTitle,
  buildSummaryChunks,
  cleanLine,
  cleanMultilineBlock,
  dedupeStrings,
  extractPdfTextAndPageCount,
  mapLocalSummaryToView,
  prepareTextForSummary,
  summarizeExtractedText,
  truncateAtWord,
} from '@/lib/student-materials/text';
import type { GenerateSummaryInput, StudentMaterialSummary } from '@/lib/student-materials/types';

const SUMMARY_SYSTEM_PROMPT =
  'Sos un asistente académico experto en transformar PDFs universitarios en guías de estudio útiles y fieles al texto. Responde solo con JSON válido.';

const SUMMARY_CHUNK_GROUP_SIZE = 5;
const SUMMARY_MAP_CONCURRENCY = 3;
const SUMMARY_MAP_MAX_TOKENS = 1200;
const SUMMARY_REDUCE_MAX_TOKENS = 1700;
const SUMMARY_DIGEST_MAX_CHARS = 26_000;

const SUMMARY_RESPONSE_SCHEMA = {
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
        },
        required: ['title', 'body'],
      },
    },
  },
  required: ['summary_short', 'key_points', 'sections'],
};

const SUMMARY_CHUNK_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
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
        },
        required: ['title', 'body'],
      },
    },
  },
  required: ['key_points', 'sections'],
};

function buildSummaryStrategyInstructions(input: GenerateSummaryInput) {
  const analysis = input.documentAnalysis;
  if (!analysis) return [];

  const lines = [
    `Tipo detectado: ${analysis.documentType}.`,
    `Estrategia sugerida: ${analysis.processingStrategy}.`,
  ];

  if (analysis.processingStrategy === 'slide_layout') {
    lines.push('El material se parece a una presentación o diapositiva.');
    lines.push('Prioriza títulos, subtítulos, bullets, definiciones cortas, comparaciones y relaciones entre bloques.');
    lines.push('No esperes párrafos largos: reconstruye el sentido académico uniendo encabezados y listas del PDF.');
  }

  if (analysis.processingStrategy === 'hybrid_text') {
    lines.push('El PDF mezcla texto e imágenes.');
    lines.push('Da prioridad a conceptos, definiciones, clasificaciones, ejemplos y etiquetas explícitas del contenido textual extraído.');
  }

  if (analysis.processingStrategy === 'ocr_recommended') {
    lines.push('El PDF parece escaneado o con poco texto seleccionable.');
    lines.push('Si faltan datos en el texto base, no los inventes. Trabaja solo con lo extraído y explicita la estructura de la forma más útil posible.');
    lines.push('Prioriza toda definición, término visible, encabezado, lista o fragmento útil aunque el contenido sea parcial.');
  }

  if (analysis.hasTables) {
    lines.push('Se detectaron posibles tablas o cuadros comparativos: preserva esas clasificaciones dentro del resumen cuando sea posible.');
  }

  return lines;
}

function buildSummaryPrompt(input: GenerateSummaryInput, sourceText: string) {
  const context = [
    input.universidadName ? `Universidad: ${input.universidadName}` : null,
    input.carreraName ? `Carrera: ${input.carreraName}` : null,
    input.materiaName ? `Materia: ${input.materiaName}` : null,
    `Documento: ${input.title}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    'Actúa como un tutor académico y experto en síntesis de contenido.',
    'Analiza el documento PDF adjunto y genera un documento de estudio estructurado con el formato solicitado.',
    'Debes responder únicamente con JSON válido.',
    'No inventes información, no agregues conocimiento externo y no mezcles contenido ajeno al PDF.',
    'Ignora marcas de agua, líneas de descarga, correos, encabezados repetidos y ruido del parser.',
    'Debes cubrir el documento completo, no solo la introducción.',
    'El objetivo es producir un material realmente útil para estudiar y repasar.',
    'Trabaja a partir de la estructura del documento: temas, subtemas, conceptos, definiciones, clasificaciones, autores, ejemplos y relaciones.',
    ...buildSummaryStrategyInstructions(input),
    '',
    'El contenido base es un resumen por partes del PDF original. Úsalo para reconstruir el resumen completo, respetando el orden temático y uniendo los fragmentos sin repetir ideas.',
    '',
    'Estructura obligatoria dentro del JSON:',
    '- summary_short: un único párrafo conciso de 4 a 6 líneas que sintetice globalmente el contenido del PDF, explicando su propósito principal y su alcance.',
    '- key_points: exactamente 5 puntos clave. DEBEN ser ideas específicas (hechos, definiciones, conclusiones o implicancias), NO títulos de sección ni encabezados. Si no tenés 5 ideas sólidas, usá las más importantes del documento.',
    '- sections: lista ordenada por temas principales del documento.',
    '- Cada section.title debe venir numerado, por ejemplo: "1. Nombre del Tema Principal".',
    '- Cada section.body DEBE seguir este formato interno, con saltos de línea reales y jerarquía clara:',
    '  1.1 Subtema 1',
    '  - idea clave o definición',
    '  - idea clave o definición',
    '  1.2 Subtema 2',
    '  - idea clave o definición',
    '  Importante: conclusión o reflexión central que no se puede olvidar de esa sección.',
    '  Ejemplo aplicado: caso concreto, ejemplo o aplicación real del tema.',
    '- CADA sección debe tener AL MENOS 2 subtemas numerados (1.1, 1.2, ...). Evita secciones con un único bloque plano.',
    '- Si el texto incluye clasificaciones, comparaciones, tipos, etapas, dimensiones o modelos: genera SIEMPRE una tabla Markdown con encabezados descriptivos, por ejemplo:',
    '  | Tipo/Ámbito | Descripción | Ejemplos |',
    '  | --- | --- | --- |',
    '  | SEO | ... | ... |',
    '  No dejes ninguna clasificación en texto plano: conviértela en tabla.',
    '- Usa "Importante:" solo cuando haya una conclusión o dato relevante, y "Ejemplo aplicado:" cuando el PDF tenga un caso concreto. No los repitas mecánicamente en todas las secciones.',
    '',
    PROMPT_INJECTION_GUARD,
    '',
    'Criterios de calidad:',
    '- Ordena el resumen por temas y subtítulos reales del PDF.',
    '- Prioriza definiciones, modelos, etapas, clasificaciones, autores, comparaciones, cuadros conceptuales y ejemplos del documento.',
    '- Si existen ejemplos o aplicaciones dentro del PDF, intégralos como bloques "Ejemplo aplicado: ...".',
    '- Si una sección incluye clasificaciones, tipos, etapas, dimensiones o comparaciones, agrega SIEMPRE la tabla Markdown correspondiente dentro de esa misma sección.',
    '- Si una sección tiene un modelo, proceso o lista importante para examen, sintetízalo como bloque de estudio dentro de esa misma sección.',
    '- No repitas ideas entre secciones.',
    '- No escribas una prosa genérica: usa subtítulos y viñetas claras.',
    '- Si el documento aborda varios bloques temáticos, distribuye la cobertura entre todos.',
    '- Si el bloque incluye definiciones o clasificaciones, reflejalas en los subtemas y no las pierdas en un resumen demasiado corto.',
    '',
    'Formato exacto de salida:',
    '{"summary_short":"...","key_points":["..."],"sections":[{"title":"...","body":"..."}]}',
    '',
    context,
    '',
    'Contenido base del PDF (resumen por partes):',
    isolateUntrustedContent(sourceText),
  ].join('\n');
}

function buildSummaryChunkPrompt(input: GenerateSummaryInput, chunkText: string, chunkIndex: number, totalChunks: number) {
  const context = [
    input.universidadName ? `Universidad: ${input.universidadName}` : null,
    input.carreraName ? `Carrera: ${input.carreraName}` : null,
    input.materiaName ? `Materia: ${input.materiaName}` : null,
    `Documento: ${input.title}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    'Sos parte de un proceso de resumen por partes de un PDF universitario.',
    `Estás analizando la parte ${chunkIndex} de ${totalChunks} del documento.`,
    'Debes responder únicamente con JSON válido.',
    'No inventes información, no agregues conocimiento externo y no mezcles contenido ajeno a esta parte.',
    'Produce un resumen parcial y fiel de SOLO esta parte:',
    '- key_points: hasta 5 puntos clave directos de esta parte.',
    '- sections: hasta 4 bloques temáticos de esta parte, cada uno con title y body.',
    '- En cada body usa subtemas numerados (1.1, 1.2, ...), viñetas, e "Importante: ..." / "Ejemplo aplicado: ..." cuando corresponda.',
    '- Si esta parte incluye clasificaciones, comparaciones, tipos o etapas: genera SIEMPRE una tabla Markdown con encabezados.',
    '- Ignora marcas de agua, líneas de descarga, correos, encabezados repetidos y ruido del parser.',
    '',
    PROMPT_INJECTION_GUARD,
    '',
    'Formato exacto de salida:',
    '{"key_points":["..."],"sections":[{"title":"...","body":"..."}]}',
    '',
    context,
    '',
    'Parte del documento a resumir:',
    isolateUntrustedContent(chunkText),
  ].join('\n');
}

function fallbackParseModelJson(raw: string) {
  const candidate = raw.trim();
  const summaryMatch = candidate.match(/"summary_short"\s*:\s*"([\s\S]*?)"/i);
  const keyPointsBlock = candidate.match(/"key_points"\s*:\s*\[([\s\S]*?)\]/i);
  const sectionsBlock = candidate.match(/"sections"\s*:\s*\[([\s\S]*?)\]/i);

  const keyPoints = keyPointsBlock
    ? Array.from(keyPointsBlock[1].matchAll(/"([\s\S]*?)"/g)).map((match) => cleanLine(match[1] ?? ''))
    : [];

  const sections = sectionsBlock
    ? Array.from(
        sectionsBlock[1].matchAll(/"title"\s*:\s*"([\s\S]*?)"\s*,\s*"body"\s*:\s*"([\s\S]*?)"/gi)
      ).map((match) => ({
        title: cleanLine(match[1] ?? ''),
        body: cleanLine(match[2] ?? ''),
      }))
    : [];

  return {
    summary_short: cleanLine(summaryMatch?.[1] ?? ''),
    key_points: keyPoints,
    sections,
  };
}

type SummaryPayload = {
  summary_short?: string;
  key_points?: string[];
  sections?: Array<{ title?: string; body?: unknown }>;
};

function parseModelSummaryPayload(raw: string) {
  try {
    return extractJsonObject(raw) as SummaryPayload;
  } catch {
    return fallbackParseModelJson(raw);
  }
}

function splitBodyIntoBulletLines(body: string) {
  return cleanMultilineBlock(body)
    .split('\n')
    .map(cleanLine)
    .filter(Boolean);
}

function ensureBulletPrefix(line: string) {
  if (/^(?:[-*]|\u2022)\s+/.test(line)) {
    return line.replace(/^(?:[-*]|\u2022)\s+/, '- ');
  }

  return `- ${line}`;
}

function coerceSectionBodyLines(value: unknown): string[] {
  if (typeof value === 'string') {
    return cleanMultilineBlock(value)
      .split('\n')
      .map(cleanLine)
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => coerceSectionBodyLines(item));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const collected = [
      ...coerceSectionBodyLines(record.title),
      ...coerceSectionBodyLines(record.subtitle),
      ...coerceSectionBodyLines(record.heading),
      ...coerceSectionBodyLines(record.body),
      ...coerceSectionBodyLines(record.content),
      ...coerceSectionBodyLines(record.text),
      ...(Array.isArray(record.points)
        ? (record.points as unknown[]).map((item) => ensureBulletPrefix(cleanLine(String(item ?? ''))))
        : []),
      ...(Array.isArray(record.items)
        ? (record.items as unknown[]).map((item) => ensureBulletPrefix(cleanLine(String(item ?? ''))))
        : []),
      ...(Array.isArray(record.rows) ? (record.rows as unknown[]).flatMap((row) => coerceSectionBodyLines(row)) : []),
    ].filter(Boolean);

    if (collected.length > 0) {
      return collected;
    }

    return Object.values(record).flatMap((entry) => coerceSectionBodyLines(entry));
  }

  return [];
}

function looksLikeSubheading(line: string) {
  const clean = cleanLine(line);
  if (!clean || clean.length < 8 || clean.length > 90) return false;
  if (/[|]/.test(clean)) return false;
  if (/^(?:[-*]|\u2022|\d+\.\d+\s+)/.test(clean)) return false;
  if (/^Importante:|^Clave de estudio:|^Ejemplo aplicado:/i.test(clean)) return false;
  if (/[.:;]$/.test(clean)) return false;
  return (
    /^[A-ZÁÉÍÓÚÑ]/.test(clean) &&
    !/[.?!]/.test(clean) &&
    clean.split(' ').length <= 8
  );
}

function looksLikeAppliedExample(line: string) {
  return /(ejemplo|caso|aplicacion|aplicación)/i.test(line);
}

function tryBuildComparativeTable(lines: string[]) {
  const rows = lines
    .map((line) => {
      const match = line.match(/^([^:]{3,60}):\s+(.+)$/);
      if (!match) return null;
      const label = cleanLine(match[1] ?? '');
      const detail = cleanLine(match[2] ?? '');
      const exampleMatch = detail.match(/(?:ej\.?|ejemplo(?:s)?|como)\s+(.+)$/i);
      const examples = exampleMatch ? cleanLine(exampleMatch[1] ?? '') : '-';
      const description = exampleMatch ? cleanLine(detail.replace(exampleMatch[0], '').replace(/[,(]\s*$/, '')) : detail;
      return {
        label,
        description: description || detail,
        examples,
      };
    })
    .filter((row): row is { label: string; description: string; examples: string } => Boolean(row));

  if (rows.length < 3) {
    return [];
  }

  return [
    '| Tipo/Ámbito | Descripción | Ejemplos |',
    '| --- | --- | --- |',
    ...rows.map((row) => `| ${row.label} | ${row.description} | ${row.examples} |`),
  ];
}

function normalizeSectionBody(body: string, sectionNumber: string) {
  const rawLines = coerceSectionBodyLines(body);
  const content: string[] = [];
  let subsectionIndex = 0;
  let bufferForComparison: string[] = [];

  const flushComparisonBuffer = () => {
    if (bufferForComparison.length === 0) return;
    const tableLines = tryBuildComparativeTable(bufferForComparison);
    if (tableLines.length >= 3) {
      content.push(...tableLines);
    } else {
      content.push(...bufferForComparison.map(ensureBulletPrefix));
    }
    bufferForComparison = [];
  };

  for (const line of rawLines) {
    const clean = cleanLine(line);
    if (!clean) continue;

    if (looksLikeSubheading(clean)) {
      flushComparisonBuffer();
      subsectionIndex += 1;
      content.push(`${sectionNumber}.${subsectionIndex} ${clean}`);
      continue;
    }

    if (clean.includes('|')) {
      flushComparisonBuffer();
      content.push(clean);
      continue;
    }

    if (/^Importante:/i.test(clean)) {
      flushComparisonBuffer();
      const importantText = clean.replace(/^Importante:\s*/i, '');
      content.push(
        importantText.length <= 200 ? `Importante: ${importantText}` : ensureBulletPrefix(importantText)
      );
      continue;
    }

    if (looksLikeAppliedExample(clean)) {
      flushComparisonBuffer();
      const exampleText = clean
        .replace(/^Ejemplo aplicado:\s*/i, '')
        .replace(/^(?:[-*]|\u2022)\s*/, '');
      content.push(
        exampleText.length <= 200 ? `Ejemplo aplicado: ${exampleText}` : ensureBulletPrefix(exampleText)
      );
      continue;
    }

    if (/^[^:]{3,60}:\s+.+$/.test(clean)) {
      bufferForComparison.push(clean);
      continue;
    }

    flushComparisonBuffer();
    content.push(ensureBulletPrefix(clean.replace(/^(?:[-*]|\u2022)\s*/, '')));
  }

  flushComparisonBuffer();

  const studyAidLines = buildStudyAidLines(content.join('\n'));
  const finalLines = dedupeStrings([...content, ...studyAidLines]);
  return cleanMultilineBlock(finalLines.join('\n'));
}

function buildStudyAidLines(text: string) {
  const normalized = cleanMultilineBlock(text);
  const lines = normalized
    .split('\n')
    .map(cleanLine)
    .filter(Boolean);

  const classificationLine = lines.find((line) =>
    /(tipos|clasificacion|clasificación|dimensiones|fases|etapas|componentes|paradigmas)/i.test(line)
  );

  if (!classificationLine) {
    return [];
  }

  return [
    'Clave de estudio: presta especial atención a esta clasificación porque organiza gran parte del tema.',
    ensureBulletPrefix(classificationLine),
  ];
}

function normalizeTopLevelSectionTitle(title: string, index: number) {
  const cleaned = cleanLine(title);
  const topLevelMatch = cleaned.match(/^(\d+)\.\s+(.+)$/);
  if (topLevelMatch) {
    return `${topLevelMatch[1]}. ${cleanLine(topLevelMatch[2] ?? '')}`;
  }

  const subsectionMatch = cleaned.match(/^\d+\.\d+\.?\s+(.+)$/);
  if (subsectionMatch) {
    return `${index + 1}. ${cleanLine(subsectionMatch[1] ?? '')}`;
  }

  return /^\d+\./.test(cleaned) ? cleaned : `${index + 1}. ${cleaned}`;
}

function mergeHierarchicalSections(sections: Array<{ title: string; body: string }>) {
  const merged: Array<{ title: string; body: string }> = [];
  const parentIndexByNumber = new Map<string, number>();

  for (const [index, section] of sections.entries()) {
    const title = cleanLine(section.title);
    const body = cleanMultilineBlock(section.body);
    if (!title || !body) continue;

    const topLevelMatch = title.match(/^(\d+)\.\s+(.+)$/);
    if (topLevelMatch) {
      const normalizedTitle = `${topLevelMatch[1]}. ${cleanLine(topLevelMatch[2] ?? '')}`;
      parentIndexByNumber.set(topLevelMatch[1] ?? String(index + 1), merged.length);
      merged.push({
        title: normalizedTitle,
        body,
      });
      continue;
    }

    const subsectionMatch = title.match(/^(\d+)\.(\d+)\.?\s+(.+)$/);
    if (subsectionMatch) {
      const parentNumber = subsectionMatch[1] ?? String(index + 1);
      const parentIndex = parentIndexByNumber.get(parentNumber);
      const subsectionTitle = `${parentNumber}.${subsectionMatch[2]} ${cleanLine(subsectionMatch[3] ?? '')}`;
      const subsectionLines = splitBodyIntoBulletLines(normalizeSectionBody(body, parentNumber));
      const studyAidLines = buildStudyAidLines(body);
      const subsectionBlock = [subsectionTitle, ...subsectionLines, ...studyAidLines].join('\n');

      if (typeof parentIndex === 'number' && merged[parentIndex]) {
        merged[parentIndex] = {
          ...merged[parentIndex],
          body: `${merged[parentIndex].body}\n\n${subsectionBlock}`.trim(),
        };
      } else {
        merged.push({
          title: normalizeTopLevelSectionTitle(title, merged.length),
          body: subsectionBlock,
        });
      }
      continue;
    }

    merged.push({
      title: normalizeTopLevelSectionTitle(title, merged.length),
      body,
    });
  }

  return merged;
}

function normalizeSummarySections(
  sections: Array<{ title: string; body: string }>,
  fallbackSections: StudentMaterialSummary['sections']
) {
  const merged = mergeHierarchicalSections(sections)
    .map((section, index) => ({
      title: normalizeTopLevelSectionTitle(section.title, index),
      body: truncateAtWord(
        normalizeSectionBody(cleanMultilineBlock(section.body), String(index + 1)),
        MAX_AI_SECTION_BODY_CHARS
      ),
    }))
    .filter((section) => section.body.length > 0);

  if (merged.length >= 2) {
    return merged.slice(0, 8);
  }

  return fallbackSections;
}

function normalizeSummaryKeyPoints(aiKeyPoints: string[], fallbackKeyPoints: string[]) {
  const merged = dedupeStrings([...aiKeyPoints, ...fallbackKeyPoints])
    .map((point) => truncateAtWord(cleanLine(point), 220))
    .filter((point) => point.length >= 24);

  const exactFive = merged.slice(0, 5);
  if (exactFive.length === 5) {
    return exactFive;
  }

  const filler = fallbackKeyPoints
    .map((point) => truncateAtWord(cleanLine(point), 220))
    .filter((point) => point.length >= 24);

  return dedupeStrings([...exactFive, ...filler]).slice(0, 5);
}

function sanitizeAiSummaryResponse(
  payload: {
    summary_short?: string;
    key_points?: string[];
    sections?: Array<{ title?: string; body?: unknown }>;
  },
  fallbackTitle: string,
  sourceText: string,
  sourceChunksCount: number,
  provider: string,
  options: { trustAi?: boolean } = {}
): StudentMaterialSummary {
  const trustAi = options.trustAi ?? false;
  const localFallback = summarizeExtractedText(sourceText, fallbackTitle);
  const shortSummary = truncateAtWord(cleanLine(payload.summary_short ?? ''), 1_400);
  const aiKeyPoints = dedupeStrings(
    Array.isArray(payload.key_points) ? payload.key_points.map((item) => truncateAtWord(cleanLine(item), 220)) : []
  );

  const aiSections = (Array.isArray(payload.sections) ? payload.sections : [])
    .map((section, index) => ({
      title: cleanLine(section.title ?? '') || buildFallbackSectionTitle(index),
      body: truncateAtWord(cleanMultilineBlock(coerceSectionBodyLines(section.body).join('\n')), 3_600),
    }))
    .filter((section) => section.body.length > 0)
    .slice(0, 18);

  const keyPoints = normalizeSummaryKeyPoints(aiKeyPoints, trustAi ? [] : localFallback.keyPoints);
  const sections = normalizeSummarySections(aiSections, trustAi ? [] : localFallback.sections);
  const finalShortSummary =
    shortSummary.length >= (trustAi ? 120 : 180)
      ? shortSummary
      : truncateAtWord(localFallback.shortSummary, 1_400);

  const minKeyPoints = trustAi ? 3 : 5;
  const minSections = trustAi ? 1 : 2;
  if (!finalShortSummary || keyPoints.length < minKeyPoints || sections.length < minSections) {
    return mapLocalSummaryToView(localFallback, sourceChunksCount, `${provider}-fallback`);
  }

  return {
    shortSummary: finalShortSummary,
    keyPoints,
    sections,
    hasContent: true,
    status: 'ready',
    provider,
    errorMessage: null,
    sourceChunksCount,
  };
}

type JsonProviderResult = {
  content: string;
  model: string;
};

type JsonProviderCall = () => Promise<JsonProviderResult | null>;

const PROVIDER_ORDER = ['groq', 'nvidia', 'gemini'] as const;
type ProviderName = (typeof PROVIDER_ORDER)[number];

async function runJsonProviderChain(
  calls: Array<{ name: ProviderName; call: JsonProviderCall }>,
  onError: (name: string, error: unknown) => void
): Promise<{ content: string; model: string; provider: string } | null> {
  for (const entry of calls) {
    try {
      const result = await entry.call();
      if (result) {
        return { ...result, provider: entry.name };
      }
    } catch (error) {
      onError(entry.name, error);
    }
  }
  return null;
}

function buildJsonProviderCalls(options: {
  prompt: string;
  preferredProvider: ProviderName | null;
  temperature: number;
  maxTokens: number;
  responseSchema?: Record<string, unknown>;
}): Array<{ name: ProviderName; call: JsonProviderCall }> {
  const order: ProviderName[] = options.preferredProvider
    ? [options.preferredProvider, ...PROVIDER_ORDER.filter((name) => name !== options.preferredProvider)]
    : [...PROVIDER_ORDER];

  return order.map((name) => ({
    name,
    call: () => {
      switch (name) {
        case 'groq':
          return requestGroqJson({
            prompt: options.prompt,
            system: SUMMARY_SYSTEM_PROMPT,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          });
        case 'nvidia':
          return requestNvidiaJson({
            prompt: options.prompt,
            system: SUMMARY_SYSTEM_PROMPT,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          });
        case 'gemini':
          return requestGeminiJson({
            prompt: options.prompt,
            temperature: options.temperature + 0.06,
            maxOutputTokens: options.maxTokens,
            responseSchema: options.responseSchema,
          });
      }
    },
  }));
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
) {
  const queue: Array<[T, number]> = items.map((item, index) => [item, index]);
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) break;
      await worker(entry[0], entry[1]);
    }
  });
  await Promise.all(workers);
}

function groupChunksForSummary(chunks: string[], groupSize: number) {
  const groups: string[] = [];
  for (let index = 0; index < chunks.length; index += groupSize) {
    groups.push(chunks.slice(index, index + groupSize).join('\n\n'));
  }
  return groups;
}

type ChunkPartial = {
  keyPoints: string[];
  sections: Array<{ title: string; body: string }>;
};

function sanitizeAiChunkSummary(payload: SummaryPayload): ChunkPartial {
  const keyPoints = dedupeStrings(
    Array.isArray(payload.key_points)
      ? payload.key_points.map((item) => truncateAtWord(cleanLine(item), 220))
      : []
  )
    .filter((point) => point.length >= 24)
    .slice(0, 5);

  const sections = (Array.isArray(payload.sections) ? payload.sections : [])
    .map((section, index) => ({
      title: cleanLine(section.title ?? '') || buildFallbackSectionTitle(index),
      body: truncateAtWord(cleanMultilineBlock(coerceSectionBodyLines(section.body).join('\n')), 1_800),
    }))
    .filter((section) => section.body.length > 0)
    .slice(0, 4);

  return { keyPoints, sections };
}

function buildPartialSummaryDigest(partials: ChunkPartial[]) {
  const blocks: string[] = [];

  partials.forEach((partial, index) => {
    const sectionText = partial.sections.map((section) => `${section.title}\n${section.body}`).join('\n\n');
    const keyPointText = partial.keyPoints.map((point) => `- ${point}`).join('\n');
    const block = [sectionText, keyPointText].filter(Boolean).join('\n\n');
    if (block) {
      blocks.push(`Fragmento ${index + 1}:\n${block}`);
    }
  });

  return truncateAtWord(blocks.join('\n\n---\n\n'), SUMMARY_DIGEST_MAX_CHARS);
}

async function mapChunksToPartialSummaries(
  input: GenerateSummaryInput,
  groups: string[]
): Promise<{ partials: ChunkPartial[]; preferredProvider: ProviderName | null }> {
  const partials: ChunkPartial[] = [];
  let preferredProvider: ProviderName | null = null;

  const processGroup = async (group: string, groupIndex: number) => {
    const prompt = buildSummaryChunkPrompt(input, group, groupIndex + 1, groups.length);
    const result = await runJsonProviderChain(
      buildJsonProviderCalls({
        prompt,
        preferredProvider,
        temperature: 0.1,
        maxTokens: SUMMARY_MAP_MAX_TOKENS,
        responseSchema: SUMMARY_CHUNK_RESPONSE_SCHEMA,
      }),
      (name, error) => logError(`studentMaterialSummary.map.${name}`, error, { title: input.title })
    );

    if (!result) {
      return;
    }

    preferredProvider = result.provider as ProviderName;
    const partial = sanitizeAiChunkSummary(parseModelSummaryPayload(result.content));
    if (partial.keyPoints.length > 0 || partial.sections.length > 0) {
      partials.push(partial);
    }
  };

  await mapWithConcurrency(groups, SUMMARY_MAP_CONCURRENCY, processGroup);
  return { partials, preferredProvider };
}

async function generateAiSummary(input: GenerateSummaryInput, sourceChunksCount: number) {
  const chunks = buildSummaryChunks(input.text);
  if (chunks.length === 0) {
    return null;
  }

  const groups = groupChunksForSummary(chunks, SUMMARY_CHUNK_GROUP_SIZE);
  const { partials, preferredProvider } = await mapChunksToPartialSummaries(input, groups);

  if (partials.length === 0) {
    return null;
  }

  const digest = buildPartialSummaryDigest(partials);
  const prompt = buildSummaryPrompt(input, digest);

  const result = await runJsonProviderChain(
    buildJsonProviderCalls({
      prompt,
      preferredProvider,
      temperature: 0.12,
      maxTokens: SUMMARY_REDUCE_MAX_TOKENS,
      responseSchema: SUMMARY_RESPONSE_SCHEMA,
    }),
    (name, error) => logError(`studentMaterialSummary.reduce.${name}`, error, { title: input.title })
  );

  if (!result) {
    return null;
  }

  return sanitizeAiSummaryResponse(
    parseModelSummaryPayload(result.content),
    input.title,
    input.text,
    sourceChunksCount,
    result.model
  );
}

function buildPdfSummaryPrompt(input: GenerateSummaryInput) {
  const context = [
    input.universidadName ? `Universidad: ${input.universidadName}` : null,
    input.carreraName ? `Carrera: ${input.carreraName}` : null,
    input.materiaName ? `Materia: ${input.materiaName}` : null,
    `Documento: ${input.title}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    'Sos un tutor académico. Leíste el PDF adjunto completo.',
    'Genera un resumen fiel del documento como guía de estudio.',
    'Responde SOLO con JSON válido con este formato: {"summary_short":"...","key_points":["..."],"sections":[{"title":"...","body":"..."}]}',
    'Reglas breves:',
    '- summary_short: un párrafo de 4 a 6 líneas que sintetice el documento.',
    '- key_points: 5 ideas específicas (hechos, definiciones o conclusiones). NO uses títulos de sección.',
    '- sections: temas en orden; cada title numerado ("1. Tema").',
    '- section.body: subtemas numerados (1.1, 1.2, ...), viñetas, y bloques "Importante: ..." y "Ejemplo aplicado: ...".',
    '- Para CADA clasificación o comparación: genera SIEMPRE una tabla Markdown con encabezados.',
    '- Cada sección con al menos 2 subtemas.',
    'No inventes información.',
    ...buildSummaryStrategyInstructions(input),
    '',
    context,
    '',
  ].join('\n');
}

function isSummaryDegraded(summary: StudentMaterialSummary) {
  const texts = [
    summary.shortSummary,
    ...summary.keyPoints,
    ...summary.sections.map((section) => `${section.title} ${section.body}`),
  ].join('\n');
  return /[\p{L}]{14,}/u.test(texts);
}

async function generatePdfSummaryWithGemini(input: GenerateSummaryInput) {
  if (!input.pdfBuffer) {
    return null;
  }

  const prompt = buildPdfSummaryPrompt(input);

  try {
    const pages = await renderPdfPagesToPngs(input.pdfBuffer);
    if (pages.length > 0) {
      const result = await requestGeminiImagesJson({
        prompt,
        images: pages,
        temperature: 0.12,
        maxOutputTokens: 2800,
        responseSchema: SUMMARY_RESPONSE_SCHEMA,
      });
      if (result) {
        const summary = sanitizeAiSummaryResponse(
          parseModelSummaryPayload(result.content),
          input.title,
          input.text,
          buildSummaryChunks(input.text).length,
          `${result.model}-vision`,
          { trustAi: true }
        );
        if (summary.hasContent && !isSummaryDegraded(summary)) {
          return summary;
        }
      }
    }
  } catch (error) {
    logError('studentMaterialSummary.vision', error, { title: input.title });
  }

  try {
    const result = await requestGeminiPdfJson({
      prompt,
      pdfBuffer: input.pdfBuffer,
      temperature: 0.12,
      maxOutputTokens: 2800,
      responseSchema: SUMMARY_RESPONSE_SCHEMA,
    });

    if (!result) {
      return null;
    }

    const summary = sanitizeAiSummaryResponse(
      parseModelSummaryPayload(result.content),
      input.title,
      input.text,
      buildSummaryChunks(input.text).length,
      `${result.model}-pdf`,
      { trustAi: true }
    );

    return summary.hasContent && !isSummaryDegraded(summary) ? summary : null;
  } catch (error) {
    logError('studentMaterialSummary.pdfGemini', error, { title: input.title });
    return null;
  }
}

export async function generateStudentMaterialSummary(input: GenerateSummaryInput): Promise<StudentMaterialSummary> {
  if (input.pdfBuffer) {
    const pdfSummary = await generatePdfSummaryWithGemini(input);
    if (pdfSummary) {
      return pdfSummary;
    }
  }

  const text = prepareTextForSummary(input.text);
  const chunks = buildSummaryChunks(text);

  if (text.length < 120 || chunks.length === 0) {
    return {
      shortSummary:
        'Este PDF no trae suficiente texto extraíble para construir un resumen automático. Puede ser un escaneo o una imagen.',
      keyPoints: [],
      sections: [],
      hasContent: false,
      status: 'error',
      provider: 'fallback-local',
      errorMessage: 'Sin texto suficiente para resumir',
      sourceChunksCount: chunks.length,
    };
  }

  const aiSummary = await generateAiSummary({ ...input, text }, chunks.length);
  if (aiSummary) {
    return aiSummary;
  }

  return mapLocalSummaryToView(summarizeExtractedText(text, input.title), chunks.length, 'fallback-local');
}

export async function buildStudentMaterialSummary(
  filePath: string,
  title: string
): Promise<StudentMaterialSummary> {
  const admin = createAdminClient();
  const { data: fileData, error } = await admin.storage.from('biblioteca').download(filePath);

  if (error || !fileData) {
    return {
      shortSummary: 'No pudimos leer el PDF para generar un resumen.',
      keyPoints: [],
      sections: [],
      hasContent: false,
      status: 'error',
      provider: 'fallback-local',
      errorMessage: 'No pudimos leer el archivo',
      sourceChunksCount: 0,
    };
  }

  try {
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const { text } = await extractPdfTextAndPageCount(buffer);
    return await generateStudentMaterialSummary({ title, text, pdfBuffer: buffer });
  } catch (summaryError) {
    logError('studentMaterialSummary.build', summaryError, { filePath, title });
    return {
      shortSummary: 'No pudimos procesar el contenido del PDF para generar el resumen.',
      keyPoints: [],
      sections: [],
      hasContent: false,
      status: 'error',
      provider: 'fallback-local',
      errorMessage: 'No pudimos procesar el contenido',
      sourceChunksCount: 0,
    };
  }
}
