const SCAN_SAMPLE_LIMIT = 8;
const SCAN_NATIVE_TEXT_THRESHOLD = 90;
const SCAN_SAMPLE_RATIO = 0.75;
const CLIENT_VISION_RENDER_SCALE = 2.2;

export type ClientVisionPlan = {
  shouldPreRender: boolean;
  pageCount: number;
  pageNumbers: number[];
};

function getSamplePageNumbers(pageCount: number) {
  const sampleCount = Math.min(SCAN_SAMPLE_LIMIT, pageCount);
  if (sampleCount <= 0) return [];
  if (sampleCount === pageCount) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  return [
    ...new Set(
      Array.from({ length: sampleCount }, (_, index) =>
        Math.max(
          1,
          Math.min(
            pageCount,
            Math.round(1 + (index * (pageCount - 1)) / Math.max(1, sampleCount - 1))
          )
        )
      )
    ),
  ];
}

function countSelectableTextCharacters(items: unknown[]) {
  return items.reduce((total, item) => {
    if (!item || typeof item !== 'object' || !('str' in item)) return total;
    const value = (item as { str?: unknown }).str;
    return total + (typeof value === 'string' ? value.replace(/\s+/g, '').length : 0);
  }, 0);
}

async function loadPdf(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/react-pdf-worker-5.4.296.min.mjs';

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  });

  return { pdfjs, loadingTask, documentHandle: await loadingTask.promise };
}

export async function inspectPdfForClientVision(
  file: File,
  maxPages: number
): Promise<ClientVisionPlan> {
  let documentHandle: Awaited<ReturnType<typeof loadPdf>>['documentHandle'] | null = null;

  try {
    const loaded = await loadPdf(file);
    documentHandle = loaded.documentHandle;
    const pageCount = documentHandle.numPages;

    if (pageCount <= 0 || pageCount > maxPages) {
      return { shouldPreRender: false, pageCount, pageNumbers: [] };
    }

    const samplePageNumbers = getSamplePageNumbers(pageCount);
    let lowTextPages = 0;

    for (const pageNumber of samplePageNumbers) {
      const page = await documentHandle.getPage(pageNumber);
      try {
        const content = await page.getTextContent();
        const selectableCharacters = countSelectableTextCharacters(content.items ?? []);
        if (selectableCharacters < SCAN_NATIVE_TEXT_THRESHOLD) {
          lowTextPages += 1;
        }
      } finally {
        try {
          page.cleanup();
        } catch {
          // Liberación best-effort del proxy de página.
        }
      }
    }

    const ratio =
      samplePageNumbers.length > 0 ? lowTextPages / samplePageNumbers.length : 0;
    const shouldPreRender = ratio >= SCAN_SAMPLE_RATIO;

    return {
      shouldPreRender,
      pageCount,
      pageNumbers: shouldPreRender
        ? Array.from({ length: pageCount }, (_, index) => index + 1)
        : [],
    };
  } finally {
    if (documentHandle) {
      await documentHandle.destroy().catch(() => undefined);
    }
  }
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No pudimos preparar una página del PDF para OCR.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export async function renderPdfPagesForClientVision(input: {
  file: File;
  pageNumbers: number[];
  onPage: (pageNumber: number, blob: Blob) => Promise<void>;
}) {
  let documentHandle: Awaited<ReturnType<typeof loadPdf>>['documentHandle'] | null = null;
  const completed: number[] = [];

  try {
    const loaded = await loadPdf(input.file);
    documentHandle = loaded.documentHandle;

    for (const pageNumber of input.pageNumbers) {
      if (
        !Number.isInteger(pageNumber) ||
        pageNumber < 1 ||
        pageNumber > documentHandle.numPages
      ) {
        continue;
      }

      const page = await documentHandle.getPage(pageNumber);
      const viewport = page.getViewport({ scale: CLIENT_VISION_RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d', { alpha: false });

      if (!context) {
        try {
          page.cleanup();
        } catch {
          // Liberación best-effort del proxy de página.
        }
        continue;
      }

      try {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({
          canvasContext: context,
          canvas,
          viewport,
        }).promise;

        const blob = await canvasToPngBlob(canvas);
        await input.onPage(pageNumber, blob);
        completed.push(pageNumber);
      } finally {
        try {
          page.cleanup();
        } catch {
          // Liberación best-effort del proxy de página.
        }
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    return completed;
  } finally {
    if (documentHandle) {
      await documentHandle.destroy().catch(() => undefined);
    }
  }
}
