import { logError } from '@/lib/observability';

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<{
  text: string;
  pageCount: number | null;
  pages: string[] | null;
}> {
  if (!buffer || buffer.length === 0) {
    return { text: '', pageCount: null, pages: null };
  }

  try {
    const pdfParse = (await import('pdf-parse-fork')).default;
    const parsed = await pdfParse(buffer);
    const text = parsed.text ?? '';
    const pageCount = typeof parsed.numpages === 'number' ? parsed.numpages : null;
    
    // Generar un array aproximado de páginas por saltos de página o división simple si es necesario
    return {
      text,
      pageCount,
      pages: [text],
    };
  } catch (error) {
    logError('studentMaterialPdfExtract.pdfParseFork', error);
    return { text: '', pageCount: null, pages: null };
  }
}

export function cleanRepeatedPageChrome(pages: string[]) {
  return pages;
}
