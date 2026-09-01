'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Download,
  FileText,
  Layers3,
  List,
  Share2,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface ReactPdfModule {
  Document: React.ComponentType<Record<string, unknown>>;
  Page: React.ComponentType<Record<string, unknown>>;
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
  };
}

interface LoadedPdfDocument {
  numPages: number;
}

interface ResumenMaterialCardProps {
  title: string;
  author: string;
  filePath: string;
  fileName?: string;
  pages?: number | null;
  createdAt?: string | null;
  rank?: number | null;
  userVote?: 1 | -1 | null;
  showVoting?: boolean;
  votingDisabled?: boolean;
  onStudy: () => void;
  onDownload: () => void | Promise<void>;
  onVote?: (vote: 1 | -1) => void | Promise<void>;
}

const ZOOM_LEVELS = [0.82, 0.92, 1, 1.08, 1.18] as const;

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function inferFileName(title: string, filePath: string, fileName?: string) {
  if (fileName) return fileName;

  const cleanPath = filePath.split('?')[0] ?? '';
  const lastSegment = cleanPath.split('/').filter(Boolean).at(-1);
  if (lastSegment) {
    try {
      return decodeURIComponent(lastSegment);
    } catch {
      return lastSegment;
    }
  }

  return `${title}.pdf`;
}

export function ResumenMaterialCard({
  title,
  author,
  filePath,
  fileName,
  pages,
  createdAt,
  rank,
  userVote = null,
  showVoting = false,
  votingDisabled = false,
  onStudy,
  onDownload,
  onVote,
}: ResumenMaterialCardProps) {
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [previewWidth, setPreviewWidth] = useState(310);
  const [previewPages, setPreviewPages] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(2);

  const previewUrl = useMemo(
    () => `/api/pdf-preview?path=${encodeURIComponent(filePath)}`,
    [filePath]
  );
  const displayFileName = useMemo(
    () => inferFileName(title, filePath, fileName),
    [fileName, filePath, title]
  );
  const formattedDate = formatDate(createdAt);
  const zoom = ZOOM_LEVELS[zoomIndex];

  useEffect(() => {
    let active = true;

    async function loadRuntime() {
      try {
        const mod = (await import('react-pdf')) as unknown as ReactPdfModule;
        mod.pdfjs.GlobalWorkerOptions.workerSrc = '/react-pdf-worker-5.4.296.min.mjs';
        if (active) setReactPdf(mod);
      } catch (error) {
        console.error('PDF card preview runtime error:', error);
        if (active) setPreviewError(true);
      }
    }

    void loadRuntime();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') return;

    const updateWidth = () => {
      setPreviewWidth(Math.max(220, viewport.clientWidth - 28));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const DocumentComponent = reactPdf?.Document ?? null;
  const PageComponent = reactPdf?.Page ?? null;
  const totalPagesLabel = pages || previewPages || '...';

  const shareMaterial = async () => {
    const shareUrl = window.location.href;
    const text = `Te comparto ${title} en Evaluo.`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Share material error:', error);
    }
  };

  return (
    <article className="pc-gigante-card overflow-hidden border-primary/20 p-5 sm:p-6 lg:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.16fr)_minmax(300px,0.84fr)] lg:gap-7">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-border bg-card shadow-[var(--shadow-soft)] sm:h-20 sm:w-20 sm:rounded-[1.6rem]">
              <Sparkles className="h-8 w-8 text-primary sm:h-9 sm:w-9" />
            </div>

            <div className="min-w-0 pt-1">
              <span className="inline-flex rounded-full border border-primary/35 bg-primary/5 px-3 py-2 text-[0.64rem] font-bold uppercase tracking-[0.16em] text-primary sm:text-[0.7rem]">
                Material de estudio completo
              </span>
              <p className="mt-3 text-xs font-semibold text-muted-foreground sm:text-sm">
                {pages ? `${pages} páginas · ` : ''}PDF
              </p>
            </div>
          </div>

          <h3 className="mt-6 text-[1.65rem] font-black leading-[1.06] tracking-tighter text-foreground sm:text-[2rem]">
            {title}
          </h3>

          <p className="mt-7 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Incluye para estudiar
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
            {[
              { label: 'Resumen', icon: BookOpen },
              { label: 'Glosario', icon: List },
              { label: 'Flashcards', icon: Layers3 },
              { label: 'Ejercicios', icon: ClipboardCheck },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex min-h-16 items-center gap-3 rounded-[1.15rem] border border-border bg-card px-3.5 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)] sm:min-h-18 sm:px-4"
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[0.68rem] font-black uppercase text-primary-foreground">
                  {author
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('') || 'EV'}
                </div>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  Subido por <span className="font-semibold text-foreground">{author}</span>
                </p>
              </div>
              {formattedDate ? (
                <span className="text-xs font-medium text-muted-foreground">{formattedDate}</span>
              ) : null}
            </div>

            {showVoting ? (
              <div className="mt-3 flex items-center gap-2">
                {typeof rank === 'number' ? (
                  <span className="mr-auto rounded-full bg-muted px-2.5 py-1 text-[0.68rem] font-semibold text-muted-foreground">
                    {rank >= 0 ? '+' : ''}{rank} ranking
                  </span>
                ) : <span className="mr-auto" />}
                <button
                  type="button"
                  onClick={() => void onVote?.(1)}
                  disabled={votingDisabled}
                  aria-label="Me sirve este material"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-50 ${
                    userVote === 1
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void onVote?.(-1)}
                  disabled={votingDisabled}
                  aria-label="No me sirve este material"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-50 ${
                    userVote === -1
                      ? 'border-destructive/35 bg-destructive/10 text-destructive'
                      : 'border-border text-muted-foreground hover:border-destructive/30 hover:text-destructive'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onStudy}
            className="mt-5 inline-flex min-h-14 w-full items-center justify-between rounded-[1.15rem] bg-primary px-5 py-3.5 text-left text-sm font-bold text-primary-foreground shadow-[var(--shadow-card)] transition hover:brightness-95 sm:text-base"
          >
            <span>Estudiar este apunte</span>
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void shareMaterial()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.05rem] border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </button>
            <button
              type="button"
              onClick={() => void onDownload()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.05rem] border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>
        </div>

        <aside className="order-last flex min-w-0 flex-col rounded-[1.55rem] border border-border bg-muted/45 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Vista previa del PDF
            </p>
            <span className="rounded-full bg-card px-2.5 py-1 text-[0.68rem] font-semibold text-muted-foreground shadow-[var(--shadow-soft)]">
              1 / {totalPagesLabel}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 rounded-[1rem] border border-border bg-card p-2 shadow-[var(--shadow-soft)]">
            <button
              type="button"
              onClick={() => setZoomIndex((value) => Math.max(0, value - 1))}
              disabled={zoomIndex === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted disabled:opacity-35"
              aria-label="Alejar vista previa"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-14 text-center text-xs font-semibold text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomIndex((value) => Math.min(ZOOM_LEVELS.length - 1, value + 1))}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted disabled:opacity-35"
              aria-label="Acercar vista previa"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={previewViewportRef}
            className="mt-3 flex min-h-[330px] flex-1 items-start justify-center overflow-auto rounded-[1.15rem] bg-secondary p-3 sm:min-h-[390px]"
          >
            {previewError ? (
              <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-5 text-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">Vista previa no disponible</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Podés abrir el apunte para ver el PDF completo.
                </p>
              </div>
            ) : DocumentComponent && PageComponent ? (
              <DocumentComponent
                file={previewUrl}
                loading={
                  <div className="h-[360px] w-full animate-pulse rounded-xl bg-card" />
                }
                onLoadSuccess={(documentProxy: unknown) => {
                  const document = documentProxy as LoadedPdfDocument;
                  setPreviewPages(document.numPages);
                  setPreviewError(false);
                }}
                onLoadError={(error: unknown) => {
                  console.error('PDF card preview load error:', error);
                  setPreviewError(true);
                }}
              >
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
                  <PageComponent
                    pageNumber={1}
                    width={previewWidth * zoom}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
              </DocumentComponent>
            ) : (
              <div className="h-[360px] w-full animate-pulse rounded-xl bg-card" />
            )}
          </div>

          <div className="mt-3 flex items-center gap-2.5 rounded-[1rem] border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
            <div className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-[0.6rem] font-black text-destructive">
              PDF
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground sm:text-sm">{displayFileName}</p>
              <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                {pages ? `${pages} páginas` : 'Documento PDF'}
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-label="Archivo verificado" />
          </div>
        </aside>
      </div>
    </article>
  );
}
