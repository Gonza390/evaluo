import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { logError } from '@/lib/observability';

type TextFragment = {
  text: string;
  x: number;
  y: number;
  width: number;
};

type Line = {
  fragments: TextFragment[];
};

const LINE_Y_TOLERANCE = 3;
const COLUMN_SPLIT_MIN_WIDTH = 18;
const CELL_GAP_PX = 14;
const TABLE_MIN_ROWS = 3;
const TABLE_MIN_CELLS = 2;
const TABLE_MAX_CELLS = 9;
const COLUMN_MIN_LINE_START_MASS = 40;

/**
 * Extrae el texto plano de un PDF. Primero intenta con pdfjs-dist (v5), que
 * reconstruye columnas y tablas por coordenadas; si falla (PDFs corruptos o
 * viejos), degrada a pdf-parse-fork. Nunca lanza: ante un error devuelve texto
 * vacío y deja que el flujo siga con su fallback local.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<{
  text: string;
  pageCount: number | null;
  pages: string[] | null;
}> {
  if (!buffer || buffer.length === 0) {
    return { text: '', pageCount: null, pages: null };
  }

  try {
    return await extractWithPdfjs(buffer);
  } catch (error) {
    logError('studentMaterialPdfExtract.pdfjs', error);
  }

  try {
    const pdfParse = (await import('pdf-parse-fork')).default;
    const parsed = await pdfParse(buffer);
    return {
      text: parsed.text ?? '',
      pageCount: typeof parsed.numpages === 'number' ? parsed.numpages : null,
      pages: null,
    };
  } catch (error) {
    logError('studentMaterialPdfExtract.pdfParseFork', error);
    return { text: '', pageCount: null, pages: null };
  }
}

async function extractWithPdfjs(buffer: Buffer) {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  let documentHandle: pdfjs.PDFDocumentProxy | null = null;
  try {
    documentHandle = await loadingTask.promise;
    const pageCount = documentHandle.numPages;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await documentHandle.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const fragments: TextFragment[] = [];
      for (const item of content.items ?? []) {
        if (!item || !('str' in item) || typeof item.str !== 'string') continue;
        const transform = item.transform ?? [1, 0, 0, 1, 0, 0];
        const [x, y] = viewport.convertToViewportPoint(transform[4] ?? 0, transform[5] ?? 0);
        const text = item.str.replace(/\r/g, '');
        if (!text.trim()) continue;
        fragments.push({
          text,
          x,
          y,
          width: Math.max(0, item.width ?? 0),
        });
      }

      pages.push(buildPageText(fragments, viewport.width));
    }

    const cleanedPages = cleanRepeatedPageChrome(pages);
    return { text: cleanedPages.filter(Boolean).join('\n\n'), pageCount, pages: cleanedPages };
  } finally {
    if (documentHandle) {
      void documentHandle.destroy().catch(() => undefined);
    }
  }
}

/**
 * Quita encabezados y pies que se repiten en la misma posición de muchas
 * páginas. La posición importa: una definición repetida dentro del cuerpo no
 * debe desaparecer solo por aparecer varias veces en el apunte.
 */
export function cleanRepeatedPageChrome(pages: string[]) {
  const nonEmptyPages = pages.map((page) =>
    page
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  );
  const minimumOccurrences = Math.max(3, Math.ceil(nonEmptyPages.length * 0.5));
  const positionalFrequency = new Map<string, number>();

  for (const lines of nonEmptyPages) {
    const candidates = [
      ...lines.slice(0, 2).map((line) => `header:${normalizeChromeLine(line)}`),
      ...lines.slice(-2).map((line) => `footer:${normalizeChromeLine(line)}`),
    ];
    for (const candidate of new Set(candidates)) {
      if (!candidate.endsWith(':')) {
        positionalFrequency.set(candidate, (positionalFrequency.get(candidate) ?? 0) + 1);
      }
    }
  }

  return nonEmptyPages.map((lines) =>
    lines
      .filter((line, index) => {
        if (line.length > 120) return true;
        const position = index < 2 ? 'header' : index >= lines.length - 2 ? 'footer' : null;
        if (!position) return true;
        return (
          (positionalFrequency.get(`${position}:${normalizeChromeLine(line)}`) ?? 0) <
          minimumOccurrences
        );
      })
      .join('\n')
      .trim()
  );
}

function normalizeChromeLine(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d+\b/g, '#')
    .replace(/[^a-z#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildLines(fragments: TextFragment[]): Line[] {
  const sorted = [...fragments].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Line[] = [];

  for (const fragment of sorted) {
    const lastLine = lines[lines.length - 1];
    if (
      lastLine &&
      Math.abs(fragment.y - (lastLine.fragments[0]?.y ?? fragment.y)) <= LINE_Y_TOLERANCE
    ) {
      lastLine.fragments.push(fragment);
    } else {
      lines.push({ fragments: [fragment] });
    }
  }

  return lines;
}

function detectColumnSplit(lines: Line[], pageWidth: number): { rightStart: number } | null {
  if (lines.length < 6 || pageWidth <= 0) return null;

  const startMasses = new Map<number, number>();
  for (const line of lines) {
    const sorted = [...line.fragments].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    if (!first) continue;
    const key = Math.round(first.x);
    startMasses.set(key, (startMasses.get(key) ?? 0) + first.text.trim().length);
  }

  const entries = [...startMasses.entries()]
    .filter(([, mass]) => mass > 0)
    .sort((a, b) => a[0] - b[0]);

  const clusters: Array<{ start: number; end: number; mass: number }> = [];
  for (const [x, mass] of entries) {
    const last = clusters[clusters.length - 1];
    if (last && x - last.end <= COLUMN_SPLIT_MIN_WIDTH) {
      last.end = Math.max(last.end, x);
      last.mass += mass;
    } else {
      clusters.push({ start: x, end: x, mass });
    }
  }

  const meaningful = clusters
    .filter(
      (cluster) =>
        cluster.mass >= COLUMN_MIN_LINE_START_MASS && cluster.end - cluster.start < pageWidth * 0.4
    )
    .sort((a, b) => a.start - b.start);

  if (meaningful.length < 2) return null;

  const left = meaningful[0];
  const right = meaningful[1];
  if (!left || !right) return null;
  if (left.start >= pageWidth * 0.4) return null;
  if (right.start <= pageWidth * 0.5) return null;
  if (right.start - left.end < COLUMN_SPLIT_MIN_WIDTH + 10) return null;

  return { rightStart: right.start };
}

function buildPageText(fragments: TextFragment[], pageWidth: number) {
  if (fragments.length === 0) return '';
  const lines = buildLines(fragments);
  const split = detectColumnSplit(lines, pageWidth);

  if (split) {
    const leftLines = lines.filter((line) => {
      const leftMost = Math.min(...line.fragments.map((fragment) => fragment.x));
      return leftMost < split.rightStart;
    });
    const rightLines = lines.filter((line) => {
      const leftMost = Math.min(...line.fragments.map((fragment) => fragment.x));
      return leftMost >= split.rightStart;
    });
    return `${renderLines(leftLines)}\n\n${renderLines(rightLines)}`.trim();
  }

  return renderLines(lines);
}

function renderLines(lines: Line[]) {
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const table = tryReadTableBlock(lines, index);
    if (table) {
      output.push(table.markdown);
      index = table.endIndex;
      continue;
    }
    output.push(renderLine(lines[index]));
    index += 1;
  }

  return output.filter((line) => line.length > 0).join('\n');
}

function renderLine(line: Line) {
  const sorted = [...line.fragments].sort((a, b) => a.x - b.x);
  let text = '';
  let previousEnd = -Infinity;
  let previousCharWidth = 6;

  for (const fragment of sorted) {
    if (!fragment.text.trim()) continue;
    const charWidth = Math.max(2, fragment.width / Math.max(1, fragment.text.length));

    if (text.length > 0) {
      const gap = fragment.x - previousEnd;
      const carriesItsOwnSpace = /\s$/.test(text) || /^\s/.test(fragment.text);
      // pdf.js suele posicionar todos los items de una línea en el mismo x
      // (gap negativo) o dejar un hueco posicional sin espacio real. En ambos
      // casos el fragmento es una nueva palabra: insertamos espacio salvo que
      // el texto ya lo traiga o el hueco sea un kerning intra-palabra.
      const needsSpace = !carriesItsOwnSpace && (gap < 0 || gap > 0.3 * previousCharWidth);
      if (needsSpace) {
        text += ' ';
      }
    }

    text += fragment.text;
    previousEnd = fragment.x + fragment.width;
    previousCharWidth = charWidth;
  }

  return text.replace(/\s+/g, ' ').trim();
}

function splitCellsWithPositions(fragments: TextFragment[]) {
  const sorted = [...fragments]
    .sort((a, b) => a.x - b.x)
    .filter((fragment) => fragment.text.trim());

  const cells: Array<{ text: string; start: number }> = [];
  let current: TextFragment[] = [];
  let previousEnd = -Infinity;

  for (const fragment of sorted) {
    if (current.length > 0 && fragment.x - previousEnd > CELL_GAP_PX) {
      cells.push({
        text: current.map((item) => item.text.trim()).join(' '),
        start: current[0]?.x ?? 0,
      });
      current = [];
    }
    current.push(fragment);
    previousEnd = fragment.x + fragment.width;
  }

  if (current.length > 0) {
    cells.push({
      text: current.map((item) => item.text.trim()).join(' '),
      start: current[0]?.x ?? 0,
    });
  }

  return cells.filter((cell) => cell.text.length > 0);
}

function tryReadTableBlock(lines: Line[], startIndex: number) {
  const firstCells = splitCellsWithPositions(lines[startIndex]?.fragments ?? []);
  const cellCount = firstCells.length;
  if (cellCount < TABLE_MIN_CELLS || cellCount > TABLE_MAX_CELLS) return null;

  // Comparamos el comienzo de las celdas, no cada item de pdf.js. Una misma
  // celda puede llegar como una palabra, una frase o muchos glifos según cómo
  // fue exportado el PDF.
  const anchorStarts = firstCells.map((cell) => cell.start);

  const rows: string[][] = [firstCells.map((cell) => cell.text)];
  let cursor = startIndex + 1;

  while (cursor < lines.length) {
    const line = lines[cursor];
    const cells = splitCellsWithPositions(line.fragments ?? []);
    if (cells.length !== cellCount) break;

    const aligned = cells.every((cell, cellIndex) => {
      const anchor = anchorStarts[cellIndex];
      return typeof anchor === 'number' && Math.abs(cell.start - anchor) <= 20;
    });
    if (!aligned) break;

    rows.push(cells.map((cell) => cell.text));
    cursor += 1;
  }

  if (rows.length < TABLE_MIN_ROWS) return null;

  return {
    markdown: rows.map((row) => `| ${row.join(' | ')} |`).join('\n'),
    endIndex: cursor,
  };
}
