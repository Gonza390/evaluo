'use client';

import { studentMaterialFileKind } from '@/lib/student-materials/file-rules';

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Cuenta las páginas de un PDF en el navegador para avisar antes de subirlo.
 * Es una ayuda: si pdf.js tarda, falla o el archivo no es PDF, devuelve null y
 * la subida sigue igual. El servidor vuelve a validar el archivo real.
 * pdf.js se importa recién acá, para no sumarlo al JS inicial de las landings.
 */
export async function countPdfPagesInBrowser(
  file: File,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<number | null> {
  if (studentMaterialFileKind(file.name) !== 'pdf') return null;

  const cleanup: { destroy: (() => void) | null } = { destroy: null };
  const count = (async () => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = '/react-pdf-worker-5.4.296.min.mjs';
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      verbosity: 0,
    });
    cleanup.destroy = () => { void loadingTask.destroy().catch(() => undefined); };
    const documentHandle = await loadingTask.promise;
    const pages = documentHandle.numPages;
    void documentHandle.destroy().catch(() => undefined);
    return Number.isInteger(pages) && pages > 0 ? pages : null;
  })();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    const result = await Promise.race([count.catch(() => null), timeout]);
    if (result === null) cleanup.destroy?.();
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/** Mismo margen que el servidor: una portada de Studocu se quita antes de contar. */
export function exceedsFreePdfPageLimit(pageCount: number | null, maxPages: number) {
  return pageCount !== null && pageCount > maxPages + 1;
}
