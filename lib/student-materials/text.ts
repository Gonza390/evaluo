import { createHash } from 'node:crypto';
import { extractTextFromPdfBuffer } from '@/lib/student-materials/pdf-extract';
import { splitIntoChunks } from '@/lib/rag';
import type {
  StudyDocumentAnalysis,
  StudyDocumentConcept,
  StudyDocumentModel,
  StudyDocumentSection,
  StudyDocumentSubsection,
  StudySummarySection,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';

const DIRECT_SUMMARY_TEXT_LIMIT = 14_000;
const SUMMARY_CHUNK_PREVIEW_LIMIT = 10;
const DIRECT_GLOSSARY_TEXT_LIMIT = 24_000;
const GLOSSARY_CHUNK_PREVIEW_LIMIT = 18;
const MAX_DOCUMENT_SECTIONS = 24;
const MAX_SUMMARY_CHUNKS = 120;

/** Conserva inicio, centro y final cuando hay que reducir una colección. */
function sampleEvenly<T>(items: T[], limit: number) {
  if (items.length <= limit) return items;
  if (limit <= 1) return items.slice(0, Math.max(0, limit));

  const selected: T[] = [];
  const used = new Set<number>();
  for (let slot = 0; slot < limit; slot += 1) {
    const index = Math.round((slot * (items.length - 1)) / (limit - 1));
    if (!used.has(index) && items[index] !== undefined) {
      selected.push(items[index]);
      used.add(index);
    }
  }
  return selected;
}

export function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function cleanMultilineBlock(value: string) {
  return value
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Detecta una fila de tabla Markdown reconstruida por el extractor:
 * empieza y termina con "|" y tiene al menos 2 celdas (3+ pipes).
 */
export function isTableRowLine(value: string) {
  const line = value.trim();
  if (!line.startsWith('|') || !line.endsWith('|')) return false;
  return (line.match(/\|/g) ?? []).length >= 3;
}

function isLikelyNoiseLine(value: string) {
  const line = cleanLine(value);
  if (!line) return true;
  if (/^lOMoAR\s+cPSD/i.test(line)) return true;
  if (/^Descargado por\s+/i.test(line)) return true;
  if (/^(page|pagina|pag\.?)\s*\d+(\s*(de|\/)\s*\d+)?$/i.test(line)) return true;
  if (/^\d+\s*(de|\/)\s*\d+$/.test(line)) return true;
  if (/^(www\.|https?:\/\/)/i.test(line)) return true;
  if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i.test(line)) return true;
  if (/^https?:\/\//i.test(line)) return true;
  return false;
}

export function normalizeForDedupe(value: string) {
  return cleanLine(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function isUsefulLine(value: string) {
  const line = cleanLine(value);
  if (line.length < 18) return false;
  if (/^\d+$/.test(line)) return false;
  if (/^pagina\s+\d+/i.test(line)) return false;
  return /[\p{L}]/u.test(line);
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(cleanLine)
    .filter((sentence) => sentence.length >= 40);
}

export function truncateAtWord(text: string, limit: number) {
  if (text.length <= limit) return text;
  const trimmed = text.slice(0, limit);
  const lastSpace = trimmed.lastIndexOf(' ');
  return `${trimmed.slice(0, lastSpace > 0 ? lastSpace : limit).trim()}...`;
}

export function dedupeStrings(items: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const item of items) {
    const normalized = normalizeForDedupe(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push(cleanLine(item));
  }

  return deduped;
}

export function buildFallbackSectionTitle(index: number) {
  return `Tema ${index + 1}`;
}

function detectSections(lines: string[], paragraphs: string[]) {
  const sectionCandidates = lines.filter((line) => {
    const clean = cleanLine(line);
    if (clean.length < 12 || clean.length > 80) return false;
    return /^(\d+([.)-])\s+|\p{Lu}[\p{L}\p{N}\s.-]{8,})/u.test(clean);
  });

  const uniqueTitles = dedupeStrings(sectionCandidates).slice(0, 5);
  if (uniqueTitles.length > 0) {
    return uniqueTitles.map((title, index) => ({
      title,
      body: truncateAtWord(paragraphs[index] ?? paragraphs[0] ?? '', 420),
    }));
  }

  return paragraphs.slice(0, 5).map((paragraph, index) => ({
    title: buildFallbackSectionTitle(index),
    body: truncateAtWord(paragraph, 420),
  }));
}

function isLikelyHeading(line: string) {
  const clean = cleanLine(line);
  if (clean.length < 8 || clean.length > 120) return false;
  if (/^[a-z]/.test(clean)) return false;
  if (/^[\d\s./-]+$/.test(clean)) return false;
  if (/^(?:[-*]|\u2022)\s+/.test(clean)) return false;
  if (/[.!?:;]$/.test(clean) && clean.length > 70) return false;
  return /^(\d+([.)-]|\.\d+)\s+)/.test(clean) || /^\p{Lu}[\p{L}\p{N}\s:()/,.-]{6,}$/u.test(clean);
}

function normalizeHeading(line: string) {
  return cleanLine(line.replace(/^[\d.()\-]+\s*/, '').replace(/\s+/g, ' '));
}

function pickConceptKind(term: string, detail: string): StudyDocumentConcept['kind'] {
  const sample = `${term} ${detail}`.toLowerCase();
  if (/(autor|segun|según|plantea|sostiene|propone)/i.test(sample)) return 'autor';
  if (/(ejemplo|caso|aplicacion|aplicación)/i.test(sample)) return 'ejemplo';
  if (/(tipos|clasificacion|clasificación|etapas|dimensiones|componentes|niveles)/i.test(sample)) {
    return 'clasificacion';
  }
  if (/(se define|es|consiste|significa|implica)/i.test(sample)) return 'definicion';
  return 'idea_clave';
}

function extractConceptsFromLines(lines: string[]): StudyDocumentConcept[] {
  const concepts: StudyDocumentConcept[] = [];

  for (const line of lines) {
    const clean = cleanLine(line);
    if (!clean) continue;

    const colonMatch = clean.match(/^([^:]{4,72}):\s+(.{18,})$/);
    if (colonMatch) {
      const term = cleanLine(colonMatch[1] ?? '');
      const detail = truncateAtWord(cleanLine(colonMatch[2] ?? ''), 240);
      concepts.push({
        term,
        detail,
        kind: pickConceptKind(term, detail),
      });
      continue;
    }

    const definitionMatch = clean.match(
      /^(.{4,72}?)\s+(?:es|son|se define como|consiste en|se caracteriza por)\s+(.{18,})$/i
    );
    if (definitionMatch) {
      const term = cleanLine(definitionMatch[1] ?? '');
      const detail = truncateAtWord(cleanLine(definitionMatch[2] ?? ''), 240);
      concepts.push({
        term,
        detail,
        kind: pickConceptKind(term, detail),
      });
    }
  }

  const seen = new Set<string>();
  return concepts.filter((concept) => {
    const key = normalizeForDedupe(`${concept.term} ${concept.detail}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return concept.term.length >= 4 && concept.detail.length >= 20;
  });
}

function splitIntoSemanticBlocks(text: string) {
  const cleaned = prepareTextForSummary(text);
  const lines = cleaned.split(/\r?\n/).map(cleanLine);
  const blocks: Array<{ heading: string | null; lines: string[] }> = [];

  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    const usefulLines = currentLines.map(cleanLine).filter(Boolean);
    if (usefulLines.length === 0) return;
    blocks.push({
      heading: currentHeading,
      lines: usefulLines,
    });
    currentLines = [];
  };

  for (const rawLine of lines) {
    if (!rawLine) {
      if (currentLines.length > 0) {
        currentLines.push('');
      }
      continue;
    }

    if (isLikelyHeading(rawLine)) {
      flush();
      currentHeading = normalizeHeading(rawLine);
      continue;
    }

    currentLines.push(rawLine);
  }

  flush();
  return blocks;
}

function buildSubsectionsFromBlock(
  block: { heading: string | null; lines: string[] },
  sectionTitle: string
): StudyDocumentSubsection[] {
  const subsections: StudyDocumentSubsection[] = [];
  let currentTitle = block.heading || sectionTitle;
  let currentLines: string[] = [];

  const flush = () => {
    const normalizedLines = currentLines.map(cleanLine).filter(Boolean);
    if (normalizedLines.length === 0) return;
    const points = dedupeStrings(
      normalizedLines
        .map((line) => line.replace(/^(?:[-*]|\u2022|\d+[.)-])\s+/i, ''))
        .filter((line) => line.length >= 24)
    ).slice(0, 7);

    subsections.push({
      title: currentTitle,
      points,
      concepts: extractConceptsFromLines(normalizedLines),
    });
    currentLines = [];
  };

  for (const line of block.lines) {
    if (isLikelyHeading(line) && normalizeHeading(line) !== sectionTitle) {
      flush();
      currentTitle = normalizeHeading(line);
      continue;
    }

    currentLines.push(line);
  }

  flush();

  if (subsections.length === 0) {
    return [
      {
        title: sectionTitle,
        points: [],
        concepts: [],
      },
    ];
  }

  return subsections;
}

export function buildStudyDocumentModel(text: string, fallbackTitle: string): StudyDocumentModel {
  const cleaned = prepareTextForSummary(text);
  const blocks = splitIntoSemanticBlocks(cleaned);
  const chunks = buildSummaryChunks(cleaned);
  const overview = truncateAtWord(
    cleaned
      .split(/\n\s*\n/)
      .map(cleanLine)
      .filter((paragraph) => paragraph.length >= 60)
      .slice(0, 2)
      .join(' '),
    900
  );

  const selectedBlocks = sampleEvenly(blocks, MAX_DOCUMENT_SECTIONS);
  const sections: StudyDocumentSection[] = selectedBlocks.map((block, index) => {
    const title = block.heading || buildFallbackSectionTitle(index);
    const subsectionModels = buildSubsectionsFromBlock(block, title);
    const blockText = truncateAtWord(block.lines.map(cleanLine).filter(Boolean).join(' '), 650);

    const concepts = extractConceptsFromLines(block.lines)
      .concat(subsectionModels.flatMap((subsection) => subsection.concepts))
      .filter((concept, conceptIndex, array) => {
        const key = normalizeForDedupe(`${concept.term} ${concept.detail}`);
        return (
          array.findIndex((item) => normalizeForDedupe(`${item.term} ${item.detail}`) === key) ===
          conceptIndex
        );
      })
      .slice(0, 8);

    return {
      title,
      summary: blockText,
      subsections: subsectionModels.slice(0, 5),
      concepts,
    };
  });

  const conceptIndex = sections
    .flatMap((section) => [
      ...section.concepts,
      ...section.subsections.flatMap((subsection) => subsection.concepts),
    ])
    .filter((concept, index, array) => {
      const key = normalizeForDedupe(`${concept.term} ${concept.detail}`);
      return (
        array.findIndex((item) => normalizeForDedupe(`${item.term} ${item.detail}`) === key) ===
        index
      );
    })
    .slice(0, 36);

  return {
    title: fallbackTitle,
    overview: overview || truncateAtWord(cleaned, 900),
    sectionTitles: sections.map((section) => section.title),
    sections,
    conceptIndex,
    chunkCount: chunks.length,
  };
}

export function buildSummarySourceFromModel(model: StudyDocumentModel) {
  return sampleEvenly(model.sections, 10)
    .map((section, index) => {
      const subsectionText = section.subsections
        .slice(0, 3)
        .map((subsection, subsectionIndex) => {
          const points = subsection.points
            .slice(0, 3)
            .map((point) => `- ${point}`)
            .join('\n');
          return `${index + 1}.${subsectionIndex + 1} ${subsection.title}\n${points}`;
        })
        .join('\n\n');

      const concepts = section.concepts
        .slice(0, 3)
        .map((concept) => `* ${concept.term}: ${concept.detail}`)
        .join('\n');

      return [
        `Tema ${index + 1}: ${section.title}`,
        `Resumen del bloque: ${section.summary}`,
        subsectionText,
        concepts ? `Conceptos detectados:\n${concepts}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

export function buildGlossarySourceFromModel(model: StudyDocumentModel) {
  const conceptPool = dedupeStrings(
    model.conceptIndex
      .slice(0, 18)
      .map((concept) => `${concept.term}: ${truncateAtWord(concept.detail, 160)}`)
  ).join('\n');

  return sampleEvenly(model.sections, 10)
    .map((section) => {
      const concepts = section.concepts
        .slice(0, 3)
        .map((concept) => `${concept.term}: ${concept.detail}`)
        .join('\n');

      return [
        `Seccion: ${section.title}`,
        `Resumen: ${truncateAtWord(section.summary, 220)}`,
        concepts ? `Conceptos:\n${concepts}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .concat(conceptPool ? `\n\nConceptos globales:\n${conceptPool}` : '')
    .join('\n\n');
}

function normalizePdfRawText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/([\p{L}])-\n(?=[\p{L}])/gu, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

function shouldMergeWithPreviousLine(previous: string, current: string) {
  if (!previous || !current) return false;
  if (isTableRowLine(previous) || isTableRowLine(current)) return false;
  if (/[.!?:;]$/.test(previous)) return false;
  if (/^(?:[-*]|\u2022)\s+/.test(current)) return false;
  if (/^\d+([.)-])\s+/.test(current)) return false;
  if (/^\p{Lu}[\p{Lu}\s]{6,}$/u.test(current)) return false;
  if (/^\p{Lu}[\p{L}\p{N}\s/-]{8,}$/u.test(current) && current.length <= 90) return false;
  return /^[\p{Ll}(]/u.test(current) || current.length <= 55;
}

function collapseBrokenParagraphs(lines: string[]) {
  const merged: string[] = [];

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) {
      if (merged.at(-1) !== '') {
        merged.push('');
      }
      continue;
    }

    const previous = merged.at(-1) ?? '';
    if (previous && previous !== '' && shouldMergeWithPreviousLine(previous, line)) {
      merged[merged.length - 1] = `${previous} ${line}`.replace(/\s+/g, ' ').trim();
      continue;
    }

    merged.push(line);
  }

  return merged;
}

function stripRepeatedPdfChrome(lines: string[]) {
  const frequency = new Map<string, number>();

  for (const line of lines) {
    const normalized = normalizeForDedupe(line);
    if (!normalized) continue;
    frequency.set(normalized, (frequency.get(normalized) ?? 0) + 1);
  }

  return lines.filter((line) => {
    const normalized = normalizeForDedupe(line);
    const repeats = frequency.get(normalized) ?? 0;
    if (repeats < 3) return true;
    if (line.length > 110) return true;
    if (/[.!?:;]$/.test(line)) return true;
    return false;
  });
}

function buildParagraphAwareChunks(text: string, maxChars = 1200, overlapParagraphs = 1) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(cleanLine)
    .filter((paragraph) => paragraph.length >= 60);

  if (paragraphs.length === 0) {
    return splitIntoChunks(text, maxChars, 180);
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentLength = 0;
      }

      const oversizedParts = splitIntoChunks(paragraph, maxChars, 180);
      for (const part of oversizedParts) {
        chunks.push(cleanLine(part));
      }
      continue;
    }

    const nextLength =
      currentLength === 0 ? paragraph.length : currentLength + 2 + paragraph.length;
    if (nextLength > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = overlapParagraphs > 0 ? currentChunk.slice(-overlapParagraphs) : [];
      currentLength = currentChunk.join('\n\n').length;
    }

    currentChunk.push(paragraph);
    currentLength = currentChunk.join('\n\n').length;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks;
}

export function mapLocalSummaryToView(
  summary: Omit<
    StudentMaterialSummary,
    'status' | 'provider' | 'errorMessage' | 'sourceChunksCount'
  >,
  sourceChunksCount: number,
  provider = 'fallback-local'
): StudentMaterialSummary {
  return {
    ...summary,
    status: 'ready',
    provider,
    errorMessage: null,
    sourceChunksCount,
  };
}

export function prepareTextForSummary(text: string) {
  const lines = normalizePdfRawText(text)
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (isTableRowLine(trimmed)) {
        // Preservamos las filas de tabla reconstruidas (con pipes) para que el
        // modelo reciba la estructura tabular real del PDF.
        return trimmed;
      }
      return trimmed
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gim, ' ')
        .replace(/\s+[|]\s+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    })
    .filter((line) => line.trim() === '' || !isLikelyNoiseLine(line));

  const cleanedLines = collapseBrokenParagraphs(stripRepeatedPdfChrome(lines));

  const dedupedLines: string[] = [];
  let previousNormalizedLine = '';

  for (const line of cleanedLines) {
    if (!line) {
      if (dedupedLines.at(-1) !== '') {
        dedupedLines.push('');
      }
      previousNormalizedLine = '';
      continue;
    }

    const normalized = normalizeForDedupe(line);
    if (!normalized || normalized === previousNormalizedLine) continue;
    previousNormalizedLine = normalized;
    dedupedLines.push(line);
  }

  return dedupedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildSummaryChunks(text: string) {
  return buildParagraphAwareChunks(prepareTextForSummary(text), 1200, 1)
    .map((chunk) => chunk.replace(/\n{3,}/g, '\n\n').trim())
    .filter((chunk) => chunk.length >= 120)
    .slice(0, MAX_SUMMARY_CHUNKS);
}

export type TraceableStudentMaterialChunk = {
  chunkIndex: number;
  text: string;
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
  contentHash: string;
};

export function buildTraceableSummaryChunks(
  pages: string[] | null,
  fallbackText: string
): TraceableStudentMaterialChunk[] {
  const rows: Omit<TraceableStudentMaterialChunk, 'chunkIndex'>[] = [];
  let currentSection: string | null = null;

  if (pages) {
    pages.forEach((pageText, pageIndex) => {
      const cleanedPage = prepareTextForSummary(pageText);
      if (!cleanedPage) return;
      const heading = cleanedPage.split(/\r?\n/).map(cleanLine).find(isLikelyHeading);
      if (heading) currentSection = normalizeHeading(heading);

      for (const chunk of buildSummaryChunks(cleanedPage)) {
        rows.push({
          text: chunk,
          pageStart: pageIndex + 1,
          pageEnd: pageIndex + 1,
          sectionTitle: currentSection,
          contentHash: createHash('sha256').update(chunk).digest('hex'),
        });
      }
    });
  }

  if (rows.length === 0) {
    for (const chunk of buildSummaryChunks(fallbackText)) {
      rows.push({
        text: chunk,
        pageStart: null,
        pageEnd: null,
        sectionTitle: null,
        contentHash: createHash('sha256').update(chunk).digest('hex'),
      });
    }
  }

  return rows.map((row, chunkIndex) => ({ ...row, chunkIndex }));
}

function buildChunkSynopsis(chunk: string) {
  const sentences = splitSentences(chunk).slice(0, 2);
  const base = sentences.join(' ') || truncateAtWord(chunk, 220);
  return truncateAtWord(base, 220);
}

export function buildSummarySourceText(text: string, chunks: string[]) {
  if (text.length <= DIRECT_SUMMARY_TEXT_LIMIT) {
    return truncateAtWord(text, DIRECT_SUMMARY_TEXT_LIMIT);
  }

  return sampleEvenly(chunks, SUMMARY_CHUNK_PREVIEW_LIMIT)
    .map(buildChunkSynopsis)
    .filter(Boolean)
    .map((chunk, index) => `Fragmento ${index + 1}: ${chunk}`)
    .join('\n\n');
}

export function buildGlossarySourceText(text: string, chunks: string[]) {
  if (text.length <= DIRECT_GLOSSARY_TEXT_LIMIT) {
    return truncateAtWord(text, DIRECT_GLOSSARY_TEXT_LIMIT);
  }

  return sampleEvenly(chunks, GLOSSARY_CHUNK_PREVIEW_LIMIT)
    .map((chunk, index) => `Fragmento ${index + 1}:\n${truncateAtWord(chunk, 1_500)}`)
    .join('\n\n');
}

export function summarizeExtractedText(text: string, title: string) {
  const model = buildStudyDocumentModel(text, title);
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => !isLikelyNoiseLine(line))
    .filter(isUsefulLine);

  const paragraphs = dedupeStrings(
    text
      .split(/\n\s*\n/)
      .map(cleanLine)
      .filter((paragraph) => paragraph.length >= 60)
  );

  const sentencePool = dedupeStrings(
    (paragraphs.length > 0 ? paragraphs : lines.slice(0, 12))
      .flatMap(splitSentences)
      .filter((sentence) => sentence.length >= 40 && sentence.length <= 260)
  );

  const shortSummarySource =
    sentencePool.slice(0, 3).join(' ') ||
    paragraphs.slice(0, 2).join(' ') ||
    lines.slice(0, 4).join(' ');

  const shortSummary = truncateAtWord(
    shortSummarySource || `No pudimos generar un resumen claro para ${title}.`,
    1_400
  );

  const bulletLikeLines = lines.filter((line) => /^(?:[-*]|\u2022|\d+[.)-])\s+/i.test(line));
  const keyPointsSource = dedupeStrings([
    ...bulletLikeLines.map((line) => line.replace(/^(?:[-*]|\u2022|\d+[.)-])\s+/i, '')),
    ...sentencePool.slice(0, 5),
  ]);

  const keyPoints = dedupeStrings(keyPointsSource)
    .map((point) => truncateAtWord(point, 220))
    .slice(0, 7);

  const sections =
    model.sections.length > 0
      ? model.sections.slice(0, 5).map((section) => ({
          title: section.title,
          body: [
            ...section.subsections.slice(0, 4).map((subsection, index) => {
              const numberedTitle = `${Math.max(1, model.sections.indexOf(section) + 1)}.${index + 1} ${subsection.title}`;
              const points = subsection.points.slice(0, 4).map((point) => `- ${point}`);
              return [numberedTitle, ...points].join('\n');
            }),
            section.summary ? `Importante: ${section.summary}` : null,
          ]
            .filter(Boolean)
            .join('\n\n'),
        }))
      : detectSections(lines, paragraphs.length > 0 ? paragraphs : sentencePool)
          .filter((section) => section.body.length > 0)
          .slice(0, 5);

  return {
    shortSummary,
    keyPoints,
    sections,
    hasContent: shortSummary.length > 0,
  };
}

function countRegexMatches(value: string, pattern: RegExp) {
  return Array.from(value.matchAll(pattern)).length;
}

function detectDocumentType(input: {
  requiresOcr: boolean;
  isLikelySlides: boolean;
  isImageHeavy: boolean;
  hasSelectableText: boolean;
  hasEmbeddedImages: boolean;
}) {
  if (input.requiresOcr) return 'scanned' as const;
  if (input.isLikelySlides) return 'slides' as const;
  if (input.isImageHeavy) return 'image_heavy' as const;
  if (input.hasSelectableText && input.hasEmbeddedImages) return 'mixed' as const;
  return 'structured_text' as const;
}

function detectProcessingStrategy(input: {
  requiresOcr: boolean;
  isLikelySlides: boolean;
  hasSelectableText: boolean;
  hasEmbeddedImages: boolean;
}) {
  if (input.requiresOcr) return 'ocr_recommended' as const;
  if (input.isLikelySlides) return 'slide_layout' as const;
  if (input.hasSelectableText && input.hasEmbeddedImages) return 'hybrid_text' as const;
  return 'text_native' as const;
}

function buildAnalysisSummary(input: {
  documentType: StudyDocumentAnalysis['documentType'];
  processingStrategy: StudyDocumentAnalysis['processingStrategy'];
  hasSelectableText: boolean;
  hasEmbeddedImages: boolean;
  requiresOcr: boolean;
  hasTables: boolean;
  hasLists: boolean;
  structureQuality: StudyDocumentAnalysis['structureQuality'];
  pageCount: number | null;
}) {
  const parts = [
    `tipo=${input.documentType}`,
    `estrategia=${input.processingStrategy}`,
    input.pageCount ? `paginas=${input.pageCount}` : null,
    input.hasSelectableText ? 'texto=nativo' : 'texto=limitado',
    input.hasEmbeddedImages ? 'imagenes=si' : 'imagenes=no',
    input.requiresOcr ? 'ocr=recomendado' : 'ocr=no',
    input.hasTables ? 'tablas=si' : null,
    input.hasLists ? 'listas=si' : null,
    `estructura=${input.structureQuality}`,
  ].filter(Boolean);

  return parts.join(' | ');
}

export function analyzePdfDocument(
  buffer: Buffer,
  extractedText: string,
  pageCount: number | null
): StudyDocumentAnalysis {
  const text = prepareTextForSummary(extractedText);
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(cleanLine)
    .filter((paragraph) => paragraph.length >= 40);
  const headingCount = lines.filter(isLikelyHeading).length;
  const bulletCount = lines.filter((line) => /^(?:[-*]|\u2022|\d+[.)-])\s+/i.test(line)).length;
  const tableLineCount = lines.filter(
    (line) => isTableRowLine(line) || /(?:\S+\s{2,}\S+\s{2,}\S+)/.test(line)
  ).length;
  const rawPdf = buffer.toString('latin1');
  const imageCountEstimate = countRegexMatches(rawPdf, /\/Subtype\s*\/Image\b/g);
  const resolvedPageCount =
    pageCount && pageCount > 0
      ? pageCount
      : Math.max(1, countRegexMatches(rawPdf, /\/Type\s*\/Page\b/g));
  const textLength = text.length;
  const averageCharsPerPage =
    resolvedPageCount > 0 ? Math.round(textLength / resolvedPageCount) : textLength;
  const averageLinesPerPage =
    resolvedPageCount > 0 ? Math.round(lines.length / resolvedPageCount) : lines.length;
  const hasSelectableText = textLength >= Math.max(220, resolvedPageCount * 90);
  const hasEmbeddedImages = imageCountEstimate > 0;
  const hasTables = tableLineCount >= 3;
  const hasLists = bulletCount >= 4;
  const isLikelySlides =
    hasSelectableText &&
    resolvedPageCount >= 3 &&
    averageCharsPerPage <= 900 &&
    paragraphs.length <= Math.max(1, Math.floor(resolvedPageCount / 2)) &&
    headingCount >= Math.max(2, Math.floor(resolvedPageCount / 2));
  const isImageHeavy = hasEmbeddedImages && imageCountEstimate >= Math.max(2, resolvedPageCount);
  const requiresOcr =
    !hasSelectableText &&
    (hasEmbeddedImages || imageCountEstimate >= Math.max(1, Math.floor(resolvedPageCount / 2)));

  const structureQuality =
    textLength >= 1_800 && paragraphs.length >= 4 && headingCount >= 2
      ? 'high'
      : textLength >= 700 && paragraphs.length >= 2
        ? 'medium'
        : 'low';

  const documentType = detectDocumentType({
    requiresOcr,
    isLikelySlides,
    isImageHeavy,
    hasSelectableText,
    hasEmbeddedImages,
  });

  const processingStrategy = detectProcessingStrategy({
    requiresOcr,
    isLikelySlides,
    hasSelectableText,
    hasEmbeddedImages,
  });

  return {
    documentType,
    processingStrategy,
    hasSelectableText,
    hasEmbeddedImages,
    requiresOcr,
    hasTables,
    hasLists,
    structureQuality,
    pageCount: pageCount ?? resolvedPageCount,
    textLength,
    paragraphCount: paragraphs.length,
    headingCount,
    bulletCount,
    imageCountEstimate,
    tableLineCount,
    averageCharsPerPage,
    averageLinesPerPage,
    analysisSummary: buildAnalysisSummary({
      documentType,
      processingStrategy,
      hasSelectableText,
      hasEmbeddedImages,
      requiresOcr,
      hasTables,
      hasLists,
      structureQuality,
      pageCount: pageCount ?? resolvedPageCount,
    }),
  };
}

export async function extractPdfTextAndPageCount(buffer: Buffer) {
  const extracted = await extractTextFromPdfBuffer(buffer);
  return {
    text: prepareTextForSummary(extracted.text ?? ''),
    pageCount: extracted.pageCount,
    pages: extracted.pages?.map((page) => prepareTextForSummary(page)) ?? null,
  };
}

export function parseSections(value: unknown): StudySummarySection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const title =
        'title' in item ? cleanLine(String(item.title ?? '')) : buildFallbackSectionTitle(index);
      const body = 'body' in item ? cleanMultilineBlock(String(item.body ?? '')) : '';
      if (!body) return null;
      return { title: title || buildFallbackSectionTitle(index), body };
    })
    .filter((item): item is StudySummarySection => Boolean(item));
}
