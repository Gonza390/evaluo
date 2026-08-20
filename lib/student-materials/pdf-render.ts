import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import { logError } from '@/lib/observability';

// Configuramos un worker dummy para evitar que pdfjs busque un archivo físico en disco
if (typeof window === 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = 'data:application/javascript;base64,';
}

const RENDER_SCALE = 1.6;
const DEFAULT_RENDER_BATCH_SIZE = 10;
// Fallback interno alto para evitar consumos patológicos en PDFs gigantes.
// NO es un límite de cobertura: el objetivo es renderizar todas las páginas.
const MAX_RENDER_PAGES_FALLBACK = 500;
const BLANK_PAGE_PNG_MIN_BYTES = 16_000;

export type PdfRenderResult = {
  images: Buffer[];
  pageCount: number;
  pagesProcessed: number;
  coverageRatio: number;
};

export async function renderPdfPagesToPngs(
  buffer: Buffer,
  options?: { pageNumbers?: number[]; batchSize?: number }
): Promise<PdfRenderResult> {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
    disableWorker: true,
  } as any);

  let documentHandle: pdfjs.PDFDocumentProxy | null = null;
  try {
    documentHandle = await loadingTask.promise;
    const pageCount = documentHandle.numPages;
    const batchSize = Math.max(1, options?.batchSize ?? DEFAULT_RENDER_BATCH_SIZE);

    const requestedPages = options?.pageNumbers?.length
      ? options.pageNumbers.filter(
          (pageNumber) =>
            Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= pageCount
        )
      : Array.from({ length: pageCount }, (_, index) => index + 1);

    const pagesToRender = requestedPages.slice(0, MAX_RENDER_PAGES_FALLBACK);
    const images: Buffer[] = [];

    for (let batchStart = 0; batchStart < pagesToRender.length; batchStart += batchSize) {
      const batch = pagesToRender.slice(batchStart, batchStart + batchSize);

      for (const pageNumber of batch) {
        try {
          const page = await documentHandle.getPage(pageNumber);
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
          const context = canvas.getContext('2d');

          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: context as unknown as CanvasRenderingContext2D,
            canvas: canvas as unknown as HTMLCanvasElement,
            viewport,
          }).promise;

          const png = canvas.toBuffer('image/png');
          if (png.length >= BLANK_PAGE_PNG_MIN_BYTES) {
            images.push(png);
          }

          try {
            await page.cleanup();
          } catch {
            // Liberación de memoria best-effort por página.
          }
        } catch (pageError) {
          logError('studentMaterialPdfRender.page', pageError, { page: pageNumber });
        }
      }

      try {
        await documentHandle.cleanup();
      } catch {
        // Liberación de memoria best-effort por lote.
      }
    }

    const pagesProcessed = images.length;
    const coverageRatio =
      pageCount > 0 ? Math.round((pagesProcessed / pageCount) * 100) / 100 : 0;

    return { images, pageCount, pagesProcessed, coverageRatio };
  } catch (error) {
    logError('studentMaterialPdfRender.render', error, {
      pages: documentHandle?.numPages ?? null,
    });
    return {
      images: [],
      pageCount: documentHandle?.numPages ?? 0,
      pagesProcessed: 0,
      coverageRatio: 0,
    };
  } finally {
    if (documentHandle) {
      void documentHandle.destroy().catch(() => undefined);
    }
  }
}