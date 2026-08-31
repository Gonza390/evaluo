import { Buffer } from 'node:buffer';
import { PDFDocument } from 'pdf-lib';
import { logError } from '@/lib/observability';

export type StudocuCoverStripResult = {
  bytes: Uint8Array;
  removed: boolean;
};

const STUDOCU_STRONG_MARKERS = [
  'scan to open on studocu',
  'studocu is not sponsored or endorsed by any college or university',
  'studocu.com',
  'www.studocu',
];

type PdfParseForkResult = {
  text?: string;
  numpages?: number;
};

type PdfParseFork = (
  buffer: Buffer,
  options?: { max?: number }
) => Promise<PdfParseForkResult>;

function normalizePageText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isStudocuCoverText(value: string) {
  const normalized = normalizePageText(value);
  if (!normalized.includes('studocu')) {
    return false;
  }

  if (STUDOCU_STRONG_MARKERS.some((marker) => normalized.includes(marker))) {
    return true;
  }

  const hasDownloadMarker = normalized.includes('downloaded by');
  const hasDocumentCode = /l\s*o\s*m\s*o\s*a\s*r\s*c\s*p\s*s\s*d/i.test(normalized);

  return hasDownloadMarker || hasDocumentCode;
}

async function extractFirstPageText(bytes: Uint8Array) {
  const module = await import('pdf-parse-fork');
  const pdfParse = module.default as unknown as PdfParseFork;
  const parsed = await pdfParse(Buffer.from(bytes), { max: 1 });

  return {
    text: parsed.text ?? '',
    pageCount: typeof parsed.numpages === 'number' ? parsed.numpages : 0,
  };
}

/**
 * Elimina fisicamente la primera pagina solo cuando detectamos una portada
 * de Studocu con suficiente confianza. Para esta inspeccion usamos
 * pdf-parse-fork limitado a la primera pagina: en Vercel no depende del worker
 * externo de pdfjs-dist que puede quedar fuera del bundle serverless.
 *
 * Si no podemos inspeccionar o reescribir el PDF, devolvemos el original para
 * no bloquear una carga valida.
 */
export async function stripStudocuCoverPage(
  bytes: Uint8Array
): Promise<StudocuCoverStripResult> {
  try {
    const firstPage = await extractFirstPageText(bytes);

    if (firstPage.pageCount <= 1 || !isStudocuCoverText(firstPage.text)) {
      return { bytes, removed: false };
    }

    const pdfDocument = await PDFDocument.load(bytes);
    if (pdfDocument.getPageCount() <= 1) {
      return { bytes, removed: false };
    }

    pdfDocument.removePage(0);
    const normalizedBytes = await pdfDocument.save();

    return {
      bytes: normalizedBytes,
      removed: true,
    };
  } catch (error) {
    logError('studentMaterials.stripStudocuCover', error);
    return { bytes, removed: false };
  }
}
