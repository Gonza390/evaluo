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
const COLUMN_MIN_LINE_START_MASS = 40;
const COLUMN_MIN_SIDE_LINE_COUNT = 6;
const COLUMN_MIN_SIDE_MASS_RATIO = 0.18;
const COLUMN_MIN_VERTICAL_COVERAGE_RATIO = 0.35;
const COLUMN_DIVIDER_TOLERANCE = 4;

const CELL_GAP_PX = 14;
const TABLE_MIN_ROWS = 3;
const TABLE_MIN_CELLS = 2;
const TABLE_MAX_CELLS = 9;
const TABLE_CELL_ALIGNMENT_TOLERANCE = 28;

/**
 * Extrae texto por página usando pdfjs-dist 5 como motor principal.
 *
 * En Node, PDF.js 5 configura automáticamente su fake worker interno.
 * No sobrescribimos GlobalWorkerOptions.workerSrc y no usamos disableWorker.
 *
 * pdf-parse-fork queda únicamente como fallback de compatibilidad. Si ese
 * fallback funciona, devuelve pages:null para no inventar trazabilidad física.
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

      try {
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const fragments: TextFragment[] = [];

        for (const item of content.items ?? []) {
          if (!item || !('str' in item) || typeof item.str !== 'string') {
            continue;
          }

          const text = item.str.replace(/\r/g, '');
          if (!text.trim()) {
            continue;
          }

          const transform = item.transform ?? [1, 0, 0, 1, 0, 0];
          const [x, y] = viewport.convertToViewportPoint(
            transform[4] ?? 0,
            transform[5] ?? 0
          );

          fragments.push({
            text,
            x,
            y,
            width: Math.max(0, item.width ?? 0),
          });
        }

        pages.push(buildPageText(fragments, viewport.width));
      } finally {
        try {
          await page.cleanup();
        } catch {
          // Liberación de memoria best-effort por página.
        }
      }
    }

    const cleanedPages = cleanRepeatedPageChrome(pages);

    return {
      text: cleanedPages.filter(Boolean).join('\n\n').trim(),
      pageCount,
      pages: cleanedPages,
    };
  } finally {
    if (documentHandle) {
      void documentHandle.destroy().catch(() => undefined);
    }
  }
}

/**
 * Quita encabezados y pies repetidos sin alterar la cantidad ni el orden
 * físico de las páginas.
 *
 * La posición importa: una definición repetida dentro del cuerpo no debe
 * desaparecer sólo porque aparezca varias veces.
 */
export function cleanRepeatedPageChrome(pages: string[]) {
  const pageLines = pages.map((page) =>
    page
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  );

  const minimumOccurrences = Math.max(3, Math.ceil(pageLines.length * 0.5));
  const positionalFrequency = new Map<string, number>();

  for (const lines of pageLines) {
    /**
     * Con una o dos líneas no existe suficiente contexto para distinguir
     * contenido real de chrome. En ese caso preservamos la página completa.
     *
     * Esto evita borrar slides minimalistas, títulos aislados o páginas con
     * una única definición que se repite con numeración distinta.
     */
    if (lines.length < 3) {
      continue;
    }

    const candidates = [
      `header:${normalizeChromeLine(lines[0] ?? '')}`,
      `footer:${normalizeChromeLine(lines[lines.length - 1] ?? '')}`,
    ];

    for (const candidate of new Set(candidates)) {
      if (!candidate.endsWith(':')) {
        positionalFrequency.set(
          candidate,
          (positionalFrequency.get(candidate) ?? 0) + 1
        );
      }
    }
  }

  return pageLines.map((lines) => {
    if (lines.length < 3) {
      return lines.join('\n').trim();
    }

    return lines
      .filter((line, index) => {
        if (line.length > 120) {
          return true;
        }

        const position =
          index === 0
            ? 'header'
            : index === lines.length - 1
              ? 'footer'
              : null;

        if (!position) {
          return true;
        }

        return (
          (positionalFrequency.get(
            `${position}:${normalizeChromeLine(line)}`
          ) ?? 0) < minimumOccurrences
        );
      })
      .join('\n')
      .trim();
  });
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
      Math.abs(fragment.y - (lastLine.fragments[0]?.y ?? fragment.y)) <=
        LINE_Y_TOLERANCE
    ) {
      lastLine.fragments.push(fragment);
    } else {
      lines.push({ fragments: [fragment] });
    }
  }

  return lines;
}

function detectColumnSplit(
  lines: Line[],
  pageWidth: number
): { rightStart: number } | null {
  if (lines.length < 6 || pageWidth <= 0) {
    return null;
  }

  const startMasses = new Map<number, number>();

  for (const line of lines) {
    const sorted = [...line.fragments].sort((a, b) => a.x - b.x);
    const first = sorted[0];

    if (!first) {
      continue;
    }

    const key = Math.round(first.x);
    startMasses.set(
      key,
      (startMasses.get(key) ?? 0) + first.text.trim().length
    );
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
        cluster.mass >= COLUMN_MIN_LINE_START_MASS &&
        cluster.end - cluster.start < pageWidth * 0.4
    )
    .sort((a, b) => a.start - b.start);

  const left = meaningful[0];
  const right = meaningful[1];

  if (!left || !right) {
    return null;
  }

  if (left.start >= pageWidth * 0.4) {
    return null;
  }

  if (right.start <= pageWidth * 0.5) {
    return null;
  }

  if (right.start - left.end < COLUMN_SPLIT_MIN_WIDTH + 10) {
    return null;
  }

  /**
   * Una tabla de dos columnas también crea una segunda masa de comienzos en X.
   * Si usáramos sólo esa señal, las continuaciones de celdas derechas se
   * interpretarían como una segunda columna de página y acabarían al final.
   *
   * Para aceptar un layout realmente multicolumna exigimos que ambas columnas
   * contengan una cantidad significativa de texto y se extiendan verticalmente
   * por una parte relevante de la página. Las filas que cruzan el divisor se
   * consideran contenido de ancho completo (por ejemplo tablas o títulos).
   */
  const rightStart = right.start;
  const allY: number[] = [];
  const leftY: number[] = [];
  const rightY: number[] = [];
  let totalMass = 0;
  let leftMass = 0;
  let rightMass = 0;

  for (const line of lines) {
    const sorted = [...line.fragments]
      .sort((a, b) => a.x - b.x)
      .filter((fragment) => fragment.text.trim());

    if (sorted.length === 0) {
      continue;
    }

    const textMass = sorted.reduce(
      (sum, fragment) => sum + fragment.text.trim().length,
      0
    );

    if (textMass <= 0) {
      continue;
    }

    const leftMost = Math.min(...sorted.map((fragment) => fragment.x));
    const rightMost = Math.max(
      ...sorted.map((fragment) => fragment.x + fragment.width)
    );
    const y = sorted[0]?.y ?? 0;

    totalMass += textMass;
    allY.push(y);

    if (leftMost >= rightStart - COLUMN_DIVIDER_TOLERANCE) {
      rightMass += textMass;
      rightY.push(y);
      continue;
    }

    if (rightMost < rightStart - COLUMN_DIVIDER_TOLERANCE) {
      leftMass += textMass;
      leftY.push(y);
    }
  }

  if (
    leftY.length < COLUMN_MIN_SIDE_LINE_COUNT ||
    rightY.length < COLUMN_MIN_SIDE_LINE_COUNT ||
    totalMass <= 0
  ) {
    return null;
  }

  if (
    leftMass / totalMass < COLUMN_MIN_SIDE_MASS_RATIO ||
    rightMass / totalMass < COLUMN_MIN_SIDE_MASS_RATIO
  ) {
    return null;
  }

  const totalVerticalSpread = getVerticalSpread(allY);

  if (totalVerticalSpread <= 0) {
    return null;
  }

  if (
    getVerticalSpread(leftY) / totalVerticalSpread <
      COLUMN_MIN_VERTICAL_COVERAGE_RATIO ||
    getVerticalSpread(rightY) / totalVerticalSpread <
      COLUMN_MIN_VERTICAL_COVERAGE_RATIO
  ) {
    return null;
  }

  return { rightStart };
}

function getVerticalSpread(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  return Math.max(...values) - Math.min(...values);
}

function buildPageText(fragments: TextFragment[], pageWidth: number) {
  if (fragments.length === 0) {
    return '';
  }

  const lines = buildLines(fragments);
  const split = detectColumnSplit(lines, pageWidth);

  if (split) {
    const leftLines = lines.filter((line) => {
      const leftMost = Math.min(
        ...line.fragments.map((fragment) => fragment.x)
      );
      return leftMost < split.rightStart;
    });

    const rightLines = lines.filter((line) => {
      const leftMost = Math.min(
        ...line.fragments.map((fragment) => fragment.x)
      );
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

    const line = lines[index];
    if (line) {
      output.push(renderLine(line));
    }

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
    if (!fragment.text.trim()) {
      continue;
    }

    const charWidth = Math.max(
      2,
      fragment.width / Math.max(1, fragment.text.length)
    );

    if (text.length > 0) {
      const gap = fragment.x - previousEnd;
      const carriesOwnSpace = /\s$/.test(text) || /^\s/.test(fragment.text);
      const needsSpace =
        !carriesOwnSpace && (gap < 0 || gap > 0.3 * previousCharWidth);

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
  const firstLine = lines[startIndex];
  if (!firstLine) {
    return null;
  }

  const firstCells = splitCellsWithPositions(firstLine.fragments);
  const cellCount = firstCells.length;

  if (cellCount < TABLE_MIN_CELLS || cellCount > TABLE_MAX_CELLS) {
    return null;
  }

  const anchorStarts = firstCells.map((cell) => cell.start);
  const rows: string[][] = [firstCells.map((cell) => cell.text)];
  let currentRow = rows[0];
  let cursor = startIndex + 1;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line) {
      break;
    }

    const cells = splitCellsWithPositions(line.fragments);

    if (cells.length === 0 || cells.length > cellCount) {
      break;
    }

    const matched = matchCellsToAnchors(cells, anchorStarts);
    if (!matched) {
      break;
    }

    const populatedIndexes = matched
      .map((value, index) => (value ? index : -1))
      .filter((index) => index >= 0);

    if (populatedIndexes.length === 0) {
      break;
    }

    /**
     * Una fila nueva debe arrancar en la primera columna y aportar al menos
     * otra celda. Si sólo aparece texto alineado con columnas posteriores,
     * lo tratamos como continuación de la fila anterior: es el patrón típico
     * de una celda derecha que ocupa varias líneas.
     *
     * Si aparece únicamente la primera columna detenemos el bloque para no
     * absorber por accidente un párrafo normal que empieza alineado con la
     * tabla.
     */
    if (populatedIndexes.includes(0)) {
      if (populatedIndexes.length < 2) {
        break;
      }

      currentRow = matched.map((value) => value ?? '');
      rows.push(currentRow);
      cursor += 1;
      continue;
    }

    for (const cellIndex of populatedIndexes) {
      const continuation = matched[cellIndex];
      if (!continuation) {
        continue;
      }

      currentRow[cellIndex] = `${currentRow[cellIndex] ?? ''} ${continuation}`
        .replace(/\s+/g, ' ')
        .trim();
    }

    cursor += 1;
  }

  if (rows.length < TABLE_MIN_ROWS) {
    return null;
  }

  return {
    markdown: rows
      .map(
        (row) =>
          `| ${row.map((cell) => escapeMarkdownTableCell(cell)).join(' | ')} |`
      )
      .join('\n'),
    endIndex: cursor,
  };
}

function matchCellsToAnchors(
  cells: Array<{ text: string; start: number }>,
  anchorStarts: number[]
) {
  const matched: Array<string | null> = Array.from(
    { length: anchorStarts.length },
    () => null
  );

  for (const cell of cells) {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < anchorStarts.length; index += 1) {
      const anchor = anchorStarts[index];
      if (typeof anchor !== 'number') {
        continue;
      }

      const distance = Math.abs(cell.start - anchor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    if (
      bestIndex < 0 ||
      bestDistance > TABLE_CELL_ALIGNMENT_TOLERANCE ||
      matched[bestIndex] !== null
    ) {
      return null;
    }

    matched[bestIndex] = cell.text;
  }

  return matched;
}

function escapeMarkdownTableCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}
