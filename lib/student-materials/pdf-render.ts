import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import { logError } from '@/lib/observability';

const RENDER_SCALE = 1.6;
const MAX_RENDER_PAGES = 20;
const BLANK_PAGE_PNG_MIN_BYTES = 16_000;

export async function renderPdfPagesToPngs(
  buffer: Buffer,
  maxPages = MAX_RENDER_PAGES
): Promise<Buffer[]> {
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
    const pagesToRender = Math.min(pageCount, maxPages);
    const images: Buffer[] = [];

    for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber += 1) {
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
      } catch (pageError) {
        logError('studentMaterialPdfRender.page', pageError, { page: pageNumber });
      }
    }

    return images;
  } catch (error) {
    logError('studentMaterialPdfRender.render', error, { pages: documentHandle?.numPages ?? null });
    return [];
  } finally {
    if (documentHandle) {
      void documentHandle.destroy().catch(() => undefined);
    }
  }
}
