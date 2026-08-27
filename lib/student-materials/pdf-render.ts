import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { logError } from '@/lib/observability';

const RENDER_SCALE = 1.6;
const DEFAULT_RENDER_BATCH_SIZE = 10;

// Fallback interno alto para evitar consumos patológicos en PDFs gigantes.
// NO es un límite normal de cobertura: el objetivo sigue siendo renderizar
// todas las páginas solicitadas.
const MAX_RENDER_PAGES_FALLBACK = 500;

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
  pageCount: number;
  pagesProcessed: number;
  coverageRatio: number;
};

export async function renderPdfPagesToPngs(
  buffer: Buffer,
  options?: { pageNumbers?: number[]; batchSize?: number; scale?: number }
): Promise<PdfRenderResult> {
  if (!buffer || buffer.length === 0) {
    return {
      images: [],
      renderedPageNumbers: [],
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
    const scale = Math.min(3, Math.max(1, options?.scale ?? RENDER_SCALE));

    const requestedPages = normalizeRequestedPages(
      options?.pageNumbers,
      pageCount
    );

    const pagesToRender = requestedPages.slice(0, MAX_RENDER_PAGES_FALLBACK);
    const images: Buffer[] = [];
    const renderedPageNumbers: number[] = [];
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
           * La versión anterior descartaba esos PNG y luego confundía
           * `images.length` con páginas procesadas, generando coverage falso.
           *
           * Si el render terminó correctamente, conservamos la imagen y el
           * número de página físico correspondiente para que los consumidores
           * multimodales no pierdan trazabilidad si falla una página aislada.
           */
          images.push(canvas.toBuffer('image/png'));
          renderedPageNumbers.push(pageNumber);
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
