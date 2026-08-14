import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { requestGeminiJson, requestGitHubModelsJson, requestGroqJson } from '@/lib/ai/providers';
import { extractJsonObject } from '@/lib/ai/json';
import {
  isolateUntrustedContent,
  MAX_AI_SECTION_BODY_CHARS,
  PROMPT_INJECTION_GUARD,
} from '@/lib/ai/safety';
import {
  buildStudyDocumentModel,
  buildFallbackSectionTitle,
  buildSummaryChunks,
  buildSummarySourceFromModel,
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

function buildSummaryStrategyInstructions(input: GenerateSummaryInput) {
  const analysis = input.documentAnalysis;
  if (!analysis) return [];

  const lines = [
    `Tipo detectado: ${analysis.documentType}.`,
    `Estrategia sugerida: ${analysis.processingStrategy}.`,
  ];

  if (analysis.processingStrategy === 'slide_layout') {
    lines.push('El material se parece a una presentacion o diapositiva.');
    lines.push('Prioriza titulos, subtitulos, bullets, definiciones cortas, comparaciones y relaciones entre bloques.');
    lines.push('No esperes parrafos largos: reconstruye el sentido academico uniendo encabezados y listas del PDF.');
  }

  if (analysis.processingStrategy === 'hybrid_text') {
    lines.push('El PDF mezcla texto e imagenes.');
    lines.push('Da prioridad a conceptos, definiciones, clasificaciones, ejemplos y etiquetas explicitas del contenido textual extraido.');
  }

  if (analysis.processingStrategy === 'ocr_recommended') {
    lines.push('El PDF parece escaneado o con poco texto seleccionable.');
    lines.push('Si faltan datos en el texto base, no los inventes. Trabaja solo con lo extraido y explicita la estructura de la forma mas util posible.');
    lines.push('Prioriza toda definicion, termino visible, encabezado, lista o fragmento util aunque el contenido sea parcial.');
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
    'Actua como un tutor academico y experto en sintesis de contenido.',
    'Analiza el documento PDF adjunto y genera un documento de estudio estructurado con el formato solicitado.',
    'Debes responder unicamente con JSON valido.',
    'No inventes informacion, no agregues conocimiento externo y no mezcles contenido ajeno al PDF.',
    'Ignora marcas de agua, lineas de descarga, correos, encabezados repetidos y ruido del parser.',
    'Debes cubrir el documento completo, no solo la introduccion.',
    'El objetivo es producir un material realmente util para estudiar y repasar.',
    'Trabaja a partir de la estructura del documento: temas, subtemas, conceptos, definiciones, clasificaciones, autores, ejemplos y relaciones.',
    ...buildSummaryStrategyInstructions(input),
    '',
    'Estructura obligatoria dentro del JSON:',
    '- summary_short: un unico parrafo conciso de 4 a 6 lineas que sintetice globalmente el contenido del PDF, explicando su proposito principal y su alcance.',
    '- key_points: exactamente 5 puntos clave, directos e importantes.',
    '- sections: lista ordenada por temas principales del documento.',
    '- Cada section.title debe venir numerado, por ejemplo: "1. Nombre del Tema Principal".',
    '- Cada section.body debe seguir este formato interno, usando saltos de linea reales:',
    '  1.1 Subtema',
    '  - idea clave o definicion',
    '  - idea clave o definicion',
    '  1.2 Subtema',
    '  - idea clave o definicion',
    '  Importante: conclusion o reflexion central de esa seccion.',
    '- Si el texto incluye clasificaciones, comparaciones o tipos, puedes usar tablas Markdown limpias con columnas "Tipo/Ambito", "Descripcion" y "Ejemplos".',
    '',
    PROMPT_INJECTION_GUARD,
    '',
    'Criterios de calidad:',
    '- Ordena el resumen por temas y subtitulos reales del PDF.',
    '- Prioriza definiciones, modelos, etapas, clasificaciones, autores, comparaciones, cuadros conceptuales y ejemplos del documento.',
    '- Si existen ejemplos o aplicaciones dentro del PDF, integralos donde corresponda.',
    '- Si aparecen casos, ejemplos o aplicaciones, conviertelos en mini bloques claramente identificables como "Ejemplo aplicado: ...".',
    '- Si una seccion incluye clasificaciones, tipos, etapas, dimensiones o comparaciones, agrega un cuadro comparativo o una tabla Markdown clara cuando sea util.',
    '- Si una seccion tiene un modelo, proceso o lista importante para examen, sintetizalo como bloque de estudio dentro de esa misma seccion.',
    '- No repitas ideas entre secciones.',
    '- No escribas una prosa generica: usa subtitulos y vietas claras.',
    '- Si el documento aborda varios bloques tematicos, distribuye la cobertura entre todos.',
    '- Si el bloque incluye definiciones o clasificaciones, reflejalas en los subtemas y no las pierdas en un resumen demasiado corto.',
    '',
    'Formato exacto de salida:',
    '{"summary_short":"...","key_points":["..."],"sections":[{"title":"...","body":"..."}]}',
    '',
    context,
    '',
    'Contenido base del PDF:',
    isolateUntrustedContent(sourceText),
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
    '| Tipo/Ambito | Descripcion | Ejemplos |',
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
      content.push(`Importante: ${clean.replace(/^Importante:\s*/i, '')}`);
      continue;
    }

    if (looksLikeAppliedExample(clean)) {
      flushComparisonBuffer();
      content.push(`Ejemplo aplicado: ${clean.replace(/^(?:[-*]|\u2022)\s*/, '')}`);
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
    'Clave de estudio: presta especial atencion a esta clasificacion porque organiza gran parte del tema.',
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
  provider: string
): StudentMaterialSummary {
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

  const keyPoints = normalizeSummaryKeyPoints(aiKeyPoints, localFallback.keyPoints);
  const sections = normalizeSummarySections(aiSections, localFallback.sections);
  const finalShortSummary =
    shortSummary.length >= 180 ? shortSummary : truncateAtWord(localFallback.shortSummary, 1_400);

  if (!finalShortSummary || keyPoints.length < 5 || sections.length < 2) {
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

async function generateAiSummary(input: GenerateSummaryInput, sourceChunksCount: number) {
  const chunks = buildSummaryChunks(input.text);
  if (chunks.length === 0) {
    return null;
  }

  const documentModel = buildStudyDocumentModel(input.text, input.title);
  const prompt = buildSummaryPrompt(input, buildSummarySourceFromModel(documentModel));

  try {
    const githubResult = await requestGitHubModelsJson({
      prompt,
      system:
        'Sos un asistente academico experto en transformar PDFs universitarios en guias de estudio utiles y fieles al texto. Responde solo con JSON valido.',
      temperature: 0.12,
      maxTokens: 1700,
    });
    if (githubResult) {
      return sanitizeAiSummaryResponse(
        parseModelSummaryPayload(githubResult.content),
        input.title,
        input.text,
        sourceChunksCount,
        githubResult.model
      );
    }
  } catch (error) {
    logError('studentMaterialSummary.githubModels', error, { title: input.title });
  }

  try {
    const groqResult = await requestGroqJson({
      prompt,
      system:
        'Sos un asistente academico experto en transformar PDFs universitarios en guias de estudio utiles y fieles al texto. Responde solo con JSON valido.',
      temperature: 0.12,
      maxTokens: 1700,
    });
    if (groqResult) {
      return sanitizeAiSummaryResponse(
        parseModelSummaryPayload(groqResult.content),
        input.title,
        input.text,
        sourceChunksCount,
        groqResult.model
      );
    }
  } catch (error) {
    logError('studentMaterialSummary.groq', error, { title: input.title });
  }

  try {
    const geminiResult = await requestGeminiJson({
      prompt,
      temperature: 0.18,
      maxOutputTokens: 1700,
      responseSchema: SUMMARY_RESPONSE_SCHEMA,
    });
    if (geminiResult) {
      return sanitizeAiSummaryResponse(
        parseModelSummaryPayload(geminiResult.content),
        input.title,
        input.text,
        sourceChunksCount,
        geminiResult.model
      );
    }
  } catch (error) {
    logError('studentMaterialSummary.gemini', error, { title: input.title });
  }

  return null;
}

export async function generateStudentMaterialSummary(input: GenerateSummaryInput): Promise<StudentMaterialSummary> {
  const text = prepareTextForSummary(input.text);
  const chunks = buildSummaryChunks(text);

  if (text.length < 120 || chunks.length === 0) {
    return {
      shortSummary:
        'Este PDF no trae suficiente texto extraible para construir un resumen automatico. Puede ser un escaneo o una imagen.',
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
    return await generateStudentMaterialSummary({ title, text });
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
