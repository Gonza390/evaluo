import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import {
  requestGeminiImagesJson,
  requestGeminiJson,
  requestGeminiPdfJson,
  requestGroqJson,
  requestNvidiaJson,
} from '@/lib/ai/providers';
import { renderPdfPagesToPngs } from '@/lib/student-materials/pdf-render';
import { extractJsonObject } from '@/lib/ai/json';
import {
  isolateUntrustedContent,
  MAX_AI_GLOSSARY_DEFINITION_CHARS,
  PROMPT_INJECTION_GUARD,
} from '@/lib/ai/safety';
import {
  buildGlossarySourceFromModel,
  buildStudyDocumentModel,
  buildSummaryChunks,
  cleanLine,
  dedupeStrings,
  extractPdfTextAndPageCount,
  normalizeForDedupe,
  prepareTextForSummary,
  truncateAtWord,
} from '@/lib/student-materials/text';
import { generateStudentMaterialSummary } from '@/lib/student-materials/summary';
import { recordAiUsage } from '@/lib/student-materials/ai-usage';
import type {
  GenerateSummaryInput,
  StudyGlossaryItem,
  StudySummarySection,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';

const VISION_BATCH_SIZE = 10;

function mergeGlossaryItemsByTerm(items: StudyGlossaryItem[]): StudyGlossaryItem[] {
  const merged = new Map<string, StudyGlossaryItem>();
  for (const item of items) {
    const key = normalizeForDedupe(item.term);
    if (!key) continue;
    const existing = merged.get(key);
    if (!existing || (item.definition?.length ?? 0) > (existing.definition?.length ?? 0)) {
      merged.set(key, item);
    }
  }
  return Array.from(merged.values());
}

function buildGlossaryStrategyInstructions(input: GenerateSummaryInput) {
  const analysis = input.documentAnalysis;
  if (!analysis) return [];

  const lines = [
    `Tipo detectado: ${analysis.documentType}.`,
    `Estrategia sugerida: ${analysis.processingStrategy}.`,
  ];

  if (analysis.processingStrategy === 'slide_layout') {
    lines.push('El PDF se parece a una presentacion o diapositiva.');
    lines.push(
      'Extrae terminos desde titulos, subtitulos, bullets, siglas, etiquetas y conceptos repetidos entre diapositivas.'
    );
  }

  if (analysis.processingStrategy === 'hybrid_text') {
    lines.push('El PDF mezcla texto e imagenes.');
    lines.push(
      'Prioriza conceptos visibles, definiciones, modelos, etapas, clasificaciones y autores nombrados en el texto extraido.'
    );
  }

  if (analysis.processingStrategy === 'ocr_recommended') {
    lines.push('El PDF parece escaneado o con texto parcial.');
    lines.push(
      'No inventes terminos no visibles. Recupera la mayor cobertura posible a partir de encabezados, listas y definiciones explicitamente extraidas.'
    );
  }

  if (analysis.hasTables) {
    lines.push(
      'Se detectaron posibles tablas: incluye categorias, tipos, ambitos y comparaciones si aparecen en el contenido.'
    );
  }

  return lines;
}

function sentenceCase(value: string) {
  const text = cleanLine(value);
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildGlossaryContext(sectionTitles: string[], index: number) {
  if (sectionTitles.length === 0) {
    return `Tema ${index + 1}`;
  }

  return sectionTitles[index % sectionTitles.length] ?? sectionTitles[0];
}

function isGoodGlossaryTerm(term: string) {
  const clean = cleanLine(term);
  if (clean.length < 4 || clean.length > 72) return false;
  if (/^\d/.test(clean)) return false;
  return /[\p{L}]/u.test(clean);
}

const NOISE_GLOSSARY_LABELS = new Set([
  'importante',
  'ejemplo',
  'ejemplo aplicado',
  'definicion',
  'clave de estudio',
  'puntos clave',
  'resumen',
  'resumen breve',
  'concepto del documento',
  'clasificacion del documento',
  'definicion central del documento',
  'glosario',
  'contenido',
  'bibliografia',
  'referencias',
  'indice',
  'anexo',
  'conclusion',
  'introduccion',
  'temario',
  'organizacion',
]);

function stripLeadingArticle(value: string) {
  return cleanLine(value)
    .replace(/^(?:el|la|los|las|un|una|unos|unas)\s+/iu, '')
    .trim();
}

function isNoisyGlossaryTerm(term: string) {
  const clean = cleanLine(term).toLocaleLowerCase('es');
  if (NOISE_GLOSSARY_LABELS.has(clean)) return true;
  if (/^[\p{L}\p{N}\s,;:()-]{45,}[.]$/u.test(clean)) return true;
  if (/—/.test(clean)) return true;
  if (/,\s*\p{Lu}\./u.test(clean)) return true;
  if (/^(?:bibliograf|referencias|glosario|indice|anexo|contenido del)/iu.test(clean)) return true;
  return false;
}

function filterSectionTitleTerms(items: StudyGlossaryItem[], sectionTitles: string[]) {
  const stripNumbering = (value: string) =>
    stripLeadingArticle(value)
      .replace(/^\d+(?:\.\d+)*\.?\s+/, '')
      .trim();
  const normalizedTitles = new Set(
    sectionTitles.map((title) => normalizeForDedupe(stripNumbering(title)))
  );
  return items.filter(
    (item) => !normalizedTitles.has(normalizeForDedupe(stripNumbering(item.term)))
  );
}

function isMaterialMetadataTerm(term: string, input?: GenerateSummaryInput) {
  const normalized = normalizeForDedupe(term);
  if (!normalized) return true;
  if (/universidad.+carrera.+materia/i.test(term)) return true;
  if (!input) return false;

  return [input.title, input.universidadName, input.carreraName, input.materiaName]
    .filter((value): value is string => Boolean(value))
    .map(normalizeForDedupe)
    .some((metadata) => metadata.length >= 4 && normalized === metadata);
}

function sanitizeGlossaryItems(
  items: StudyGlossaryItem[],
  input?: GenerateSummaryInput
): StudyGlossaryItem[] {
  return items
    .map((item) => ({
      term: stripLeadingArticle(sentenceCase(item.term)),
      englishTerm: item.englishTerm ? cleanLine(item.englishTerm) : null,
      definition: truncateAtWord(cleanLine(item.definition), MAX_AI_GLOSSARY_DEFINITION_CHARS),
      context: truncateAtWord(cleanLine(item.context), 180),
      importance: item.importance === 'alta' ? ('alta' as const) : ('media' as const),
    }))
    .filter(
      (item) =>
        isGoodGlossaryTerm(item.term) &&
        !isNoisyGlossaryTerm(item.term) &&
        !isMaterialMetadataTerm(item.term, input) &&
        item.definition.length >= 20
    )
    .sort((a, b) => a.term.localeCompare(b.term, 'es', { sensitivity: 'base' }))
    .slice(0, 45);
}

function normalizeGlossaryTerm(term: string) {
  return stripLeadingArticle(
    sentenceCase(
      cleanLine(term)
        .replace(/^(?:[-*]|\u2022|\s)+/, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
  );
}

function extractGlossaryCandidatesFromText(text: string) {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);

  const paragraphs = text
    .split(/\n\s*\n/)
    .map(cleanLine)
    .filter((paragraph) => paragraph.length >= 50);

  let currentHeading = '';
  const candidates: Array<{
    term: string;
    definition: string;
    context: string;
    importance: 'alta' | 'media';
  }> = [];

  for (const line of lines) {
    if (
      /^(\d+([.)-])\s+|\p{Lu}[\p{L}\p{N}\s/-]{4,})$/u.test(line) &&
      line.length <= 80 &&
      !line.includes(':')
    ) {
      currentHeading = normalizeGlossaryTerm(line.replace(/^\d+([.)-])\s+/, ''));
      continue;
    }

    const colonMatch = line.match(/^([^:]{4,72}):\s+(.{20,})$/);
    if (colonMatch) {
      const rawTerm = normalizeGlossaryTerm(colonMatch[1] ?? '');
      const definition = truncateAtWord(cleanLine(colonMatch[2] ?? ''), 360);
      if (isGoodGlossaryTerm(rawTerm) && definition.length >= 24) {
        candidates.push({
          term: rawTerm,
          definition,
          context: currentHeading || 'Concepto del documento',
          importance:
            /(defin|tipolog|modelo|etapa|dimension|teor|paradigma|revoluci|sistema)/i.test(rawTerm)
              ? 'alta'
              : 'media',
        });
      }

      const acronymMatch = rawTerm.match(/^(.+?)\s+\(([^)]+)\)$/);
      if (acronymMatch) {
        const acronym = normalizeGlossaryTerm(acronymMatch[2] ?? '');
        if (isGoodGlossaryTerm(acronym)) {
          candidates.push({
            term: acronym,
            definition,
            context: rawTerm,
            importance: 'alta',
          });
        }
      }
    }

    const bulletMatch = line.match(/^(?:[-*]|\u2022)\s*([^:]{3,56}):\s+(.{20,})$/);
    if (bulletMatch) {
      const term = normalizeGlossaryTerm(bulletMatch[1] ?? '');
      const definition = truncateAtWord(cleanLine(bulletMatch[2] ?? ''), 360);
      if (isGoodGlossaryTerm(term) && definition.length >= 24) {
        candidates.push({
          term,
          definition,
          context: currentHeading || 'Clasificacion del documento',
          importance: 'alta',
        });
      }
    }
  }

  for (const paragraph of paragraphs) {
    const defineMatch = paragraph.match(
      /^(.{4,72}?)\s+(?:se define como|es|consiste en|se caracteriza por)\s+(.{25,})$/i
    );
    if (defineMatch) {
      const term = normalizeGlossaryTerm(defineMatch[1] ?? '');
      const definition = truncateAtWord(cleanLine(defineMatch[2] ?? ''), 360);
      if (isGoodGlossaryTerm(term) && definition.length >= 24) {
        candidates.push({
          term,
          definition,
          context: currentHeading || 'Definicion central del documento',
          importance: 'alta',
        });
      }
    }
  }

  return candidates;
}

function extractGlossaryCandidatesFromSections(sections: StudySummarySection[]) {
  const candidates: StudyGlossaryItem[] = [];

  for (const section of sections) {
    const lines = section.body.split('\n').map(cleanLine).filter(Boolean);

    let currentSubheading = section.title;

    for (const line of lines) {
      if (/^\d+\.\d+\s+/.test(line)) {
        currentSubheading = line;
        continue;
      }

      const bullet = line.replace(/^(?:[-*]|\u2022)\s+/, '').trim();
      if (!bullet || bullet.length < 28) continue;

      const colonMatch = bullet.match(/^([^:]{4,72}):\s+(.{18,})$/);
      if (colonMatch) {
        const term = normalizeGlossaryTerm(colonMatch[1] ?? '');
        const definition = truncateAtWord(cleanLine(colonMatch[2] ?? ''), 360);
        if (isGoodGlossaryTerm(term) && definition.length >= 24) {
          candidates.push({
            term,
            definition,
            context: currentSubheading || section.title,
            importance: 'alta',
          });
        }
        continue;
      }

      const leadingConceptMatch = bullet.match(
        /^([\p{Lu}][^,.();:]{3,64})\s+(?:es|son|se define|se entiende|implica|incluye|permite)\s+(.{18,})$/iu
      );
      if (leadingConceptMatch) {
        const term = normalizeGlossaryTerm(leadingConceptMatch[1] ?? '');
        const definition = truncateAtWord(
          cleanLine(`${leadingConceptMatch[1] ?? ''} ${leadingConceptMatch[2] ?? ''}`),
          360
        );
        if (isGoodGlossaryTerm(term) && definition.length >= 24) {
          candidates.push({
            term,
            definition,
            context: currentSubheading || section.title,
            importance: 'media',
          });
        }
      }
    }
  }

  return candidates;
}

export function buildStudentMaterialGlossary(
  text: string,
  summary: StudentMaterialSummary
): StudyGlossaryItem[] {
  const normalizedText = prepareTextForSummary(text);
  const model = buildStudyDocumentModel(normalizedText, summary.sections[0]?.title ?? 'Documento');
  const sectionTitles = summary.sections.map((section) => section.title).filter(Boolean);
  const glossaryFromText = [
    ...extractGlossaryCandidatesFromText(normalizedText),
    ...model.conceptIndex.map((concept, index) => ({
      term: normalizeGlossaryTerm(concept.term),
      definition: truncateAtWord(cleanLine(concept.detail), 320),
      context: buildGlossaryContext(model.sectionTitles, index),
      importance:
        concept.kind === 'definicion' || concept.kind === 'clasificacion'
          ? ('alta' as const)
          : ('media' as const),
    })),
  ];
  const glossaryFromSections = extractGlossaryCandidatesFromSections(summary.sections);

  const glossaryFromSummary = summary.keyPoints
    .map((point, index) => {
      const colonMatch = point.match(/^([^:]{4,72}):\s+(.{12,})$/);
      if (colonMatch) {
        return {
          term: normalizeGlossaryTerm(colonMatch[1] ?? ''),
          definition: truncateAtWord(cleanLine(colonMatch[2] ?? ''), 320),
          context: buildGlossaryContext(sectionTitles, index),
          importance: index < 4 ? ('alta' as const) : ('media' as const),
        };
      }

      const section = summary.sections[index % Math.max(summary.sections.length, 1)];
      if (!section) return null;

      return {
        term: normalizeGlossaryTerm(section.title),
        definition: truncateAtWord(cleanLine(section.body), 320),
        context: section.title,
        importance: index < 4 ? ('alta' as const) : ('media' as const),
      };
    })
    .filter((item): item is StudyGlossaryItem => item !== null && isGoodGlossaryTerm(item.term));

  const merged: StudyGlossaryItem[] = dedupeStrings([
    ...glossaryFromText.map((item) => item.term),
    ...glossaryFromSections.map((item) => item.term),
    ...glossaryFromSummary.map((item) => item.term),
  ])
    .map((term, index) => {
      const fromText = glossaryFromText.find(
        (item) => normalizeForDedupe(item.term) === normalizeForDedupe(term)
      );
      const fromSection = glossaryFromSections.find(
        (item) => normalizeForDedupe(item.term) === normalizeForDedupe(term)
      );
      const fromSummary = glossaryFromSummary.find(
        (item) => normalizeForDedupe(item.term) === normalizeForDedupe(term)
      );
      const definition =
        fromText?.definition ?? fromSection?.definition ?? fromSummary?.definition ?? '';
      if (!definition) return null;

      return {
        term,
        definition,
        context:
          fromText?.context ??
          fromSection?.context ??
          fromSummary?.context ??
          buildGlossaryContext(sectionTitles, index),
        importance:
          fromText?.importance ??
          fromSection?.importance ??
          fromSummary?.importance ??
          (index < 8 ? ('alta' as const) : ('media' as const)),
      } satisfies StudyGlossaryItem;
    })
    .filter((item): item is StudyGlossaryItem => Boolean(item));

  return sanitizeGlossaryItems(merged);
}

function buildGlossaryPrompt(input: GenerateSummaryInput, sourceText: string) {
  const context = [
    input.universidadName ? `Universidad: ${input.universidadName}` : null,
    input.carreraName ? `Carrera: ${input.carreraName}` : null,
    input.materiaName ? `Materia: ${input.materiaName}` : null,
    `Documento: ${input.title}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    'Actúa como un profesor experto y un especialista en técnicas de estudio.',
    'He subido un archivo PDF que contiene material que debo estudiar.',
    'Analiza el documento por completo y crea un glosario exhaustivo, claro y estructurado con los términos clave.',
    'Debes responder únicamente con JSON válido.',
    'Básate únicamente en la información del PDF provisto.',
    'No inventes información ni completes huecos con conocimiento externo.',
    ...buildGlossaryStrategyInstructions(input),
    '',
    'Pautas:',
    PROMPT_INJECTION_GUARD,
    '',
    '1. Selecciona conceptos técnicos, palabras clave, teorías, autores importantes, modelos, etapas, clasificaciones, siglas y jerga específica del texto que sean fundamentales para entender el tema.',
    '2. Para cada término debes devolver:',
    '   - term: término claro y específico, sin artículos iniciales (ej: "Segmentación" y no "La segmentación").',
    '   - englishTerm: la traducción o equivalente en inglés del término si existe una forma estándar (ej: "Customer journey"). Si no hay una traducción estándar, deja el campo vacío ("").',
    '   - definition: definición clara y concisa, explicada con tus propias palabras pero basada en el texto.',
    '   - context: breve frase de cómo se aplica o se menciona en el documento.',
    '   - importance: "alta" para conceptos nucleares y "media" para complementarios útiles.',
    '3. Organiza los términos en orden alfabético.',
    '4. NO incluyas como términos: etiquetas de formato ("Importante", "Ejemplo aplicado", "Clave de estudio"), títulos de sección genéricos ("Bibliografía", "Referencias", "Glosario", "Resumen breve", "Puntos clave") ni citas bibliográficas de autores.',
    '5. El glosario debe ser visualmente fácil de escanear y repasar.',
    '6. Debes cubrir todo el PDF, no solo las primeras páginas.',
    '7. Si el documento tiene secciones o capítulos distintos, refleja esa diferencia en el campo context.',
    '8. Genera entre 30 y 40 términos si el documento lo permite. No devuelvas un glosario corto si el PDF contiene suficiente material.',
    '',
    'Formato exacto:',
    '{"items":[{"term":"...","englishTerm":"...","definition":"...","context":"...","importance":"alta"}]}',
    '',
    context,
    '',
    'Contenido base del PDF:',
    isolateUntrustedContent(sourceText),
  ].join('\n');
}

function buildCompactGlossarySource(input: GenerateSummaryInput, summary: StudentMaterialSummary) {
  const documentModel = buildStudyDocumentModel(input.text, input.title);
  const sectionDigest = summary.sections
    .slice(0, 5)
    .map((section) =>
      [
        `Tema: ${section.title}`,
        truncateAtWord(cleanLine(section.body.replace(/\n+/g, ' ')), 360),
      ].join('\n')
    )
    .join('\n\n');

  const keyPointsDigest = summary.keyPoints
    .slice(0, 5)
    .map((point) => `- ${truncateAtWord(cleanLine(point), 180)}`)
    .join('\n');

  const modelDigest = buildGlossarySourceFromModel(documentModel);

  return [sectionDigest, keyPointsDigest ? `Puntos clave:\n${keyPointsDigest}` : null, modelDigest]
    .filter(Boolean)
    .join('\n\n');
}

type GlossaryPayload = {
  items?: Array<{
    term?: string;
    englishTerm?: string;
    definition?: string;
    context?: string;
    importance?: 'alta' | 'media' | string;
  }>;
};

function parseGlossaryPayload(raw: string) {
  const parsed: GlossaryPayload = (() => {
    try {
      return extractJsonObject(raw) as GlossaryPayload;
    } catch {
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const candidate = fenced?.[1] ?? raw;
      const itemMatches = Array.from(
        candidate.matchAll(
          /"term"\s*:\s*"([\s\S]*?)"\s*,\s*"englishTerm"\s*:\s*"([\s\S]*?)"\s*,\s*"definition"\s*:\s*"([\s\S]*?)"\s*,\s*"context"\s*:\s*"([\s\S]*?)"\s*,\s*"importance"\s*:\s*"(alta|media)"/gi
        )
      );

      return {
        items: itemMatches.map((match) => ({
          term: cleanLine(match[1] ?? ''),
          englishTerm: cleanLine(match[2] ?? ''),
          definition: cleanLine(match[3] ?? ''),
          context: cleanLine(match[4] ?? ''),
          importance: match[5] === 'alta' ? 'alta' : 'media',
        })),
      };
    }
  })();

  const items: StudyGlossaryItem[] = Array.isArray(parsed.items)
    ? parsed.items.map((item) => ({
        term: String(item.term ?? ''),
        englishTerm: item.englishTerm ? String(item.englishTerm) : null,
        definition: String(item.definition ?? ''),
        context: String(item.context ?? ''),
        importance: item.importance === 'alta' ? ('alta' as const) : ('media' as const),
      }))
    : [];

  return sanitizeGlossaryItems(items);
}

export async function generateStudentMaterialGlossary(
  input: GenerateSummaryInput,
  summary: StudentMaterialSummary
): Promise<StudyGlossaryItem[]> {
  const chunks = buildSummaryChunks(input.text);
  const fallbackGlossary = sanitizeGlossaryItems(
    buildStudentMaterialGlossary(input.text, summary),
    input
  );
  if (chunks.length === 0) {
    return fallbackGlossary;
  }

  const prompt = buildGlossaryPrompt(input, buildCompactGlossarySource(input, summary));

  if (input.pdfBuffer) {
    const glossarySchema = {
      type: 'OBJECT',
      properties: {
        items: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              term: { type: 'STRING' },
              englishTerm: { type: 'STRING' },
              definition: { type: 'STRING' },
              context: { type: 'STRING' },
              importance: { type: 'STRING', enum: ['alta', 'media'] },
            },
            required: ['term', 'englishTerm', 'definition', 'context', 'importance'],
          },
        },
      },
      required: ['items'],
    };

    const mergeAiGlossary = (glossary: StudyGlossaryItem[]) => {
      const filtered = filterSectionTitleTerms(
        glossary,
        summary.sections.map((section) => section.title)
      );
      return sanitizeGlossaryItems(
        [
          ...filtered,
          ...fallbackGlossary.filter(
            (item) =>
              !filtered.some(
                (existing) => normalizeForDedupe(existing.term) === normalizeForDedupe(item.term)
              )
          ),
        ],
        input
      ).filter((item) => !/[\p{L}]{35,}/u.test(item.definition));
    };

    try {
      const renderResult = await renderPdfPagesToPngs(input.pdfBuffer);
      if (renderResult.images.length > 0) {
        const visionItems: StudyGlossaryItem[] = [];

        for (let index = 0; index < renderResult.images.length; index += VISION_BATCH_SIZE) {
          const batch = renderResult.images.slice(index, index + VISION_BATCH_SIZE);
          try {
            const geminiVisionResult = await requestGeminiImagesJson({
              prompt,
              images: batch,
              temperature: 0.1,
              maxOutputTokens: 2600,
              responseSchema: glossarySchema,
            });
            if (geminiVisionResult) {
              await recordAiUsage({
                materialId: input.materialId,
                userId: input.userId,
                provider: 'gemini',
                model: geminiVisionResult.model,
                operation: 'glossary_vision',
                usage: geminiVisionResult.usage,
              });
              visionItems.push(...parseGlossaryPayload(geminiVisionResult.content));
            }
          } catch (batchError) {
            logError('studentMaterialGlossary.geminiVisionBatch', batchError, {
              title: input.title,
              batch: Math.floor(index / VISION_BATCH_SIZE) + 1,
            });
          }
        }

        if (visionItems.length > 0) {
          const mergedGlossary = mergeAiGlossary(mergeGlossaryItemsByTerm(visionItems));
          if (mergedGlossary.length >= Math.min(12, Math.max(8, fallbackGlossary.length))) {
            return mergedGlossary;
          }
        }
      }
    } catch (error) {
      logError('studentMaterialGlossary.geminiVision', error, { title: input.title });
    }

    try {
      const geminiPdfResult = await requestGeminiPdfJson({
        prompt,
        pdfBuffer: input.pdfBuffer,
        temperature: 0.1,
        maxOutputTokens: 2600,
        responseSchema: glossarySchema,
      });
      if (geminiPdfResult) {
        await recordAiUsage({
          materialId: input.materialId,
          userId: input.userId,
          provider: 'gemini',
          model: geminiPdfResult.model,
          operation: 'glossary_pdf',
          usage: geminiPdfResult.usage,
        });
        const mergedGlossary = mergeAiGlossary(parseGlossaryPayload(geminiPdfResult.content));
        if (mergedGlossary.length >= Math.min(12, Math.max(8, fallbackGlossary.length))) {
          return mergedGlossary;
        }
      }
    } catch (error) {
      logError('studentMaterialGlossary.geminiPdf', error, { title: input.title });
    }
  }

  try {
    const geminiResult = await requestGeminiJson({
      prompt,
      temperature: 0.14,
      maxOutputTokens: 2400,
      responseSchema: {
        type: 'OBJECT',
        properties: {
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                term: { type: 'STRING' },
                englishTerm: { type: 'STRING' },
                definition: { type: 'STRING' },
                context: { type: 'STRING' },
                importance: { type: 'STRING', enum: ['alta', 'media'] },
              },
              required: ['term', 'englishTerm', 'definition', 'context', 'importance'],
            },
          },
        },
        required: ['items'],
      },
    });
    if (geminiResult) {
      await recordAiUsage({
        materialId: input.materialId,
        userId: input.userId,
        provider: 'gemini',
        model: geminiResult.model,
        operation: 'glossary',
        usage: geminiResult.usage,
      });
      const glossary = filterSectionTitleTerms(
        parseGlossaryPayload(geminiResult.content),
        summary.sections.map((section) => section.title)
      );
      const mergedGlossary = sanitizeGlossaryItems(
        [
          ...glossary,
          ...fallbackGlossary.filter(
            (item) =>
              !glossary.some(
                (existing) => normalizeForDedupe(existing.term) === normalizeForDedupe(item.term)
              )
          ),
        ],
        input
      );

      if (mergedGlossary.length >= Math.min(12, Math.max(8, fallbackGlossary.length))) {
        return mergedGlossary;
      }
    }
  } catch (error) {
    logError('studentMaterialGlossary.gemini', error, { title: input.title });
  }

  try {
    const groqResult = await requestGroqJson({
      prompt,
      system:
        'Sos un asistente académico experto en crear glosarios de estudio fieles al PDF. Responde solo con JSON válido.',
      temperature: 0.08,
      maxTokens: 2400,
    });
    if (groqResult) {
      await recordAiUsage({
        materialId: input.materialId,
        userId: input.userId,
        provider: 'groq',
        model: groqResult.model,
        operation: 'glossary',
        usage: groqResult.usage,
      });
      const glossary = filterSectionTitleTerms(
        parseGlossaryPayload(groqResult.content),
        summary.sections.map((section) => section.title)
      );
      const mergedGlossary = sanitizeGlossaryItems(
        [
          ...glossary,
          ...fallbackGlossary.filter(
            (item) =>
              !glossary.some(
                (existing) => normalizeForDedupe(existing.term) === normalizeForDedupe(item.term)
              )
          ),
        ],
        input
      );

      if (mergedGlossary.length >= Math.min(12, Math.max(8, fallbackGlossary.length))) {
        return mergedGlossary;
      }
    }
  } catch (error) {
    logError('studentMaterialGlossary.groq', error, { title: input.title });
  }

  try {
    const nvidiaResult = await requestNvidiaJson({
      prompt,
      system:
        'Sos un asistente académico experto en crear glosarios de estudio fieles al PDF. Responde solo con JSON válido.',
      temperature: 0.08,
      maxTokens: 2400,
    });
    if (nvidiaResult) {
      await recordAiUsage({
        materialId: input.materialId,
        userId: input.userId,
        provider: 'nvidia',
        model: nvidiaResult.model,
        operation: 'glossary',
        usage: nvidiaResult.usage,
      });
      const glossary = filterSectionTitleTerms(
        parseGlossaryPayload(nvidiaResult.content),
        summary.sections.map((section) => section.title)
      );
      const mergedGlossary = sanitizeGlossaryItems(
        [
          ...glossary,
          ...fallbackGlossary.filter(
            (item) =>
              !glossary.some(
                (existing) => normalizeForDedupe(existing.term) === normalizeForDedupe(item.term)
              )
          ),
        ],
        input
      );

      if (mergedGlossary.length >= Math.min(12, Math.max(8, fallbackGlossary.length))) {
        return mergedGlossary;
      }
    }
  } catch (error) {
    logError('studentMaterialGlossary.nvidia', error, { title: input.title });
  }

  return fallbackGlossary;
}

export async function buildStudentMaterialGlossaryFromFile(
  filePath: string,
  title: string,
  summary?: StudentMaterialSummary
): Promise<StudyGlossaryItem[]> {
  const admin = createAdminClient();
  const { data: fileData, error } = await admin.storage.from('biblioteca').download(filePath);

  if (error || !fileData) {
    return [];
  }

  try {
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const { text } = await extractPdfTextAndPageCount(buffer);
    const resolvedSummary = summary ?? (await generateStudentMaterialSummary({ title, text }));
    return await generateStudentMaterialGlossary({ title, text }, resolvedSummary);
  } catch (glossaryError) {
    logError('studentMaterialGlossary.build', glossaryError, { filePath, title });
    return [];
  }
}
