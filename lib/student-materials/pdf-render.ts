import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { logError } from '@/lib/observability';

const RENDER_SCALE = 1.6;
const DEFAULT_RENDER_BATCH_SIZE = 10;

// Fallback interno alto para evitar consumos patológicos en PDFs gigantes.
// NO es un límite normal de cobertura: el objetivo sigue siendo renderizar
// todas las páginas solicitadas.
const MAX_RENDER_PAGES_FALLBACK = 500;

// Detección conservadora de páginas en blanco. Muestreamos el canvas ya
// renderizado sobre fondo blanco. Ante cualquier duda la página se considera
// NO vacía y sigue a visión; preferimos gastar una llamada antes que perder
// contenido académico tenue o pequeño.
const BLANK_PAGE_SAMPLE_STEP = 6;
const BLANK_PAGE_CHANNEL_THRESHOLD = 245;
const BLANK_PAGE_NON_WHITE_SAMPLE_LIMIT = 8;

type PdfCanvas = {
  width: number;
  height: number;
  toBuffer: (mimeType: 'image/png') => Buffer;
};

type PdfCanvasAndContext = {
  canvas: PdfCanvas;
  context: CanvasRenderingContext2D;
};

type PdfCanvasFactory = {
  create: (width: number, height: number) => PdfCanvasAndContext;
  destroy: (canvasAndContext: PdfCanvasAndContext) => void;
};

export type PdfRenderResult = {
  images: Buffer[];
  renderedPageNumbers: number[];
  blankPageNumbers: number[];
  pageCount: number;
  pagesProcessed: number;
  coverageRatio: number;
};

function isCanvasNearlyBlank(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  if (width <= 0 || height <= 0) return false;

  try {
    // No crear un ImageData de página completa: una página A4 a escala 2.2
    // puede reservar decenas de MB adicionales en cada iteración del OCR.
    // Muestreamos franjas de un píxel, manteniendo el criterio conservador.
    let nonWhiteSamples = 0;

    for (let y = 0; y < height; y += BLANK_PAGE_SAMPLE_STEP) {
      const data = context.getImageData(0, y, width, 1).data;
      for (let x = 0; x < width; x += BLANK_PAGE_SAMPLE_STEP) {
        const offset = x * 4;
        const red = data[offset] ?? 255;
        const green = data[offset + 1] ?? 255;
        const blue = data[offset + 2] ?? 255;

        if (
          red < BLANK_PAGE_CHANNEL_THRESHOLD ||
          green < BLANK_PAGE_CHANNEL_THRESHOLD ||
          blue < BLANK_PAGE_CHANNEL_THRESHOLD
        ) {
          nonWhiteSamples += 1;
          if (nonWhiteSamples >= BLANK_PAGE_NON_WHITE_SAMPLE_LIMIT) {
            return false;
          }
        }
      }
    }

    return true;
  } catch {
    // Si el runtime no permite leer píxeles, nunca asumimos que está vacía.
    return false;
  }
}

export async function renderPdfPagesToPngs(
  buffer: Buffer,
  options?: { pageNumbers?: number[]; batchSize?: number; scale?: number }
): Promise<PdfRenderResult> {
  if (!buffer || buffer.length === 0) {
    return {
      images: [],
      renderedPageNumbers: [],
      blankPageNumbers: [],
      pageCount: 0,
      pagesProcessed: 0,
      coverageRatio: 0,
    };
  }

  /**
   * En Node, PDF.js 5 detecta automáticamente que no debe usar un Web Worker
   * real y configura su fake worker interno.
   *
   * No debemos sobrescribir GlobalWorkerOptions.workerSrc con un módulo vacío:
   * eso hace que WorkerMessageHandler sea undefined y rompe el render.
   *
   * Tampoco usamos `disableWorker`: no es necesario para esta versión y no
   * forma parte de la configuración tipada actual de getDocument().
   */
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
    const batchSize = Math.max(
      1,
      Math.floor(options?.batchSize ?? DEFAULT_RENDER_BATCH_SIZE)
    );
    // Thumbnails can explicitly request a sub-1 scale; OCR callers keep their
    // existing 1.6/2.2 scales and therefore preserve visual extraction quality.
    const scale = Math.min(3, Math.max(0.5, options?.scale ?? RENDER_SCALE));

    const requestedPages = normalizeRequestedPages(
      options?.pageNumbers,
      pageCount
    );

    const pagesToRender = requestedPages.slice(0, MAX_RENDER_PAGES_FALLBACK);
    const images: Buffer[] = [];
    const renderedPageNumbers: number[] = [];
    const blankPageNumbers: number[] = [];
    let pagesProcessed = 0;

    // En Node, PDF.js 5 crea su propio canvasFactory respaldado por
    // @napi-rs/canvas. Usarlo también para el canvas principal mantiene
    // imágenes, Path2D, DOMMatrix y contexto dentro del mismo runtime.
    // Mezclar este runtime con node-canvas provoca `Image or Canvas expected`.
    const canvasFactory = (
      documentHandle as pdfjs.PDFDocumentProxy & { canvasFactory: PdfCanvasFactory }
    ).canvasFactory;

    if (!canvasFactory?.create || !canvasFactory?.destroy) {
      throw new Error('PDF.js canvasFactory is unavailable');
    }

    for (
      let batchStart = 0;
      batchStart < pagesToRender.length;
      batchStart += batchSize
    ) {
      const batch = pagesToRender.slice(
        batchStart,
        batchStart + batchSize
      );

      for (const pageNumber of batch) {
        let page: pdfjs.PDFPageProxy | null = null;
        let canvasAndContext: PdfCanvasAndContext | null = null;

        try {
          page = await documentHandle.getPage(pageNumber);

          const viewport = page.getViewport({ scale });

          canvasAndContext = canvasFactory.create(
            Math.ceil(viewport.width),
            Math.ceil(viewport.height)
          );

          const { canvas, context } = canvasAndContext;

          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: context,
            canvas: canvas as unknown as HTMLCanvasElement,
            viewport,
          }).promise;

          /**
           * Un PNG chico NO significa una página vacía.
           *
           * Una página de texto simple puede comprimir a menos de 16 KB.
           * Si el render terminó correctamente, conservamos siempre la imagen
           * y detectamos blancura desde los píxeles del canvas, no por tamaño.
           */
          images.push(canvas.toBuffer('image/png'));
          renderedPageNumbers.push(pageNumber);
          if (isCanvasNearlyBlank(context, canvas.width, canvas.height)) {
            // Pixel sampling can miss thin or anti-aliased text on a page.
            // A PDF page containing selectable text is never truly blank,
            // even when the renderer's sampled pixels look white.
            let hasText = true; // fail open if PDF.js cannot inspect contents
            try {
              const content = await page.getTextContent();
              hasText = content.items.some(item =>
                'str' in item && typeof item.str === 'string' &&
                item.str.trim().length > 0
              );
            } catch {
              // Preserve the page rather than silently discard evidence.
            }
            if (!hasText) blankPageNumbers.push(pageNumber);
          }
          pagesProcessed += 1;
        } catch (pageError) {
          logError('studentMaterialPdfRender.page', pageError, {
            page: pageNumber,
          });
        } finally {
          if (page) {
            try {
              await page.cleanup();
            } catch {
              // Liberación de memoria best-effort por página.
            }
          }

          if (canvasAndContext) {
            try {
              canvasFactory.destroy(canvasAndContext);
            } catch {
              // Liberación de memoria best-effort del canvas.
            }
          }
        }
      }

      try {
        await documentHandle.cleanup();
      } catch {
        // Liberación de memoria best-effort por lote.
      }
    }

    const coverageRatio =
      pageCount > 0
        ? Math.round((pagesProcessed / pageCount) * 100) / 100
        : 0;

    return {
      images,
      renderedPageNumbers,
      blankPageNumbers,
      pageCount,
      pagesProcessed,
      coverageRatio,
    };
  } catch (error) {
    logError('studentMaterialPdfRender.render', error, {
      pages: documentHandle?.numPages ?? null,
    });

    return {
      images: [],
      renderedPageNumbers: [],
      blankPageNumbers: [],
      pageCount: documentHandle?.numPages ?? 0,
      pagesProcessed: 0,
      coverageRatio: 0,
    };
  } finally {
    if (documentHandle) {
      // Esperar la liberación real del PDF.js anterior antes de abrir el
      // siguiente lote de páginas escaneadas.
      await documentHandle.destroy().catch(() => undefined);
    }
  }
}

function normalizeRequestedPages(
  pageNumbers: number[] | undefined,
  pageCount: number
) {
  if (!pageNumbers?.length) {
    return Array.from(
      { length: pageCount },
      (_, index) => index + 1
    );
  }

  return [
    ...new Set(
      pageNumbers.filter(
        (pageNumber) =>
          Number.isInteger(pageNumber) &&
          pageNumber >= 1 &&
          pageNumber <= pageCount
      )
    ),
  ];
}
