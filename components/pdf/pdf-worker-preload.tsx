const PDF_WORKER_URL = '/react-pdf-worker-5.4.296.min.mjs';

export function PdfWorkerPreload() {
  return (
    <link
      rel="preload"
      as="script"
      href={PDF_WORKER_URL}
      type="module"
      crossOrigin="anonymous"
    />
  );
}
