'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import type { PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';

type PdfRuntime = typeof import('pdfjs-dist');
const PDF_RUNTIME_URL = '/pdf-thumbnail-runtime-5.4.296.mjs';

/** PDF.js se sirve localmente, con la misma versión que el worker del visor existente. */
export default function PdfFirstPageThumbnail({ file }: { file: File | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!file) return;
    let active = true;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let renderTask: RenderTask | undefined;
    void (async () => {
      try {
        // La importación nativa evita incluir PDF.js en la carga inicial de Mi espacio.
        const runtime = (await import(/* webpackIgnore: true */ PDF_RUNTIME_URL)) as PdfRuntime;
        if (!active) return;
        runtime.GlobalWorkerOptions.workerSrc = '/react-pdf-worker-5.4.296.min.mjs';
        const data = new Uint8Array(await file.arrayBuffer());
        if (!active) return;
        loadingTask = runtime.getDocument({ data, isEvalSupported: false, useSystemFonts: true });
        const document = await loadingTask.promise;
        const page = await document.getPage(1);
        const canvas = canvasRef.current;
        if (!active || !canvas) return;
        const width = page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale: 192 / width });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        renderTask = page.render({ canvas, viewport });
        await renderTask.promise;
        if (active) setReady(true);
      } catch {
        // La miniatura es opcional: una página ilegible nunca bloquea el procesamiento.
      }
    })();
    return () => {
      active = false;
      renderTask?.cancel();
      void loadingTask?.destroy().catch(() => undefined);
    };
  }, [file]);
  return (
    <div
      className="journey-real-document"
      aria-label={ready ? 'Primera página de tu PDF' : 'Tu archivo PDF'}
      data-thumbnail-ready={ready}
    >
      <canvas ref={canvasRef} hidden={!ready} aria-hidden="true" />
      {!ready && (
        <div className="journey-thumbnail-fallback">
          <FileText size={32} aria-hidden="true" />
          <span>PDF</span>
        </div>
      )}
    </div>
  );
}
