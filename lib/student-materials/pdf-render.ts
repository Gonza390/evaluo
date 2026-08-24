import { createRequire } from 'node:module';
import path from 'node:path';
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
  getContext: (type: '2d') => {
    fillStyle: string;
    fillRect: (x: number, y: number, width: number, height: number) => void;
  };
  toBuffer: (mimeType: 'image/png') => Buffer;
};

type NapiCanvasModule = {
  createCanvas: (width: number, height: number) => PdfCanvas;
};

const requireFromHere = createRequire(import.meta.url);
let cachedNapiCanvas: NapiCanvasModule | null = null;

function getPdfCanvasRuntime(): NapiCanvasModule {
  if (cachedNapiCanvas) return cachedNapiCanvas;

  // PDF.js 5 usa @napi-rs/canvas internamente en Node para ImageData/Path2D.
  // Debemos renderizar sobre ESA MISMA implementación: mezclar sus imágenes
  // con node-canvas provoca `Image or Canvas expected` al ejecutar drawImage.
  const pdfjsEntry = requireFromHere.resolve('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfjsRoot = path.resolve(path.dirname(pdfjsEntry), '../..');
  const napiCanvasPath = path.join(pdfjsRoot, 'node_modules', '@napi-rs', 'canvas');

  cachedNapiCanvas = requireFromHere(napiCanvasPath) as NapiCanvasModule;
  return cachedNapiCanvas;
}

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
  if (!buffer || buffer.length === 0) {
    return {
      images: [],
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

    const requestedPages = normalizeRequestedPages(
      options?.pageNumbers,
      pageCount
    );

    const pagesToRender = requestedPages.slice(0, MAX_RENDER_PAGES_FALLBACK);
    const images: Buffer[] = [];
    let pagesProcessed = 0;
    const { createCanvas } = getPdfCanvasRuntime();

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

        try {
          page = await documentHandle.getPage(pageNumber);

          const viewport = page.getViewport({
            scale: RENDER_SCALE,
          });

          const canvas = createCanvas(
            Math.ceil(viewport.width),
            Math.ceil(viewport.height)
          );

          const context = canvas.getContext('2d');

          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext:
              context as unknown as CanvasRenderingContext2D,
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
           * Si el render terminó correctamente, conservamos la imagen.
           */
          images.push(canvas.toBuffer('image/png'));
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
