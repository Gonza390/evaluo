'use client';

import 'react-pdf/dist/Page/TextLayer.css';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Minimize,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { logError } from '@/lib/observability';
import {
  PDF_ESTIMATED_PAGE_HEIGHT,
  PDF_PREVIEW_PAGE_LIMIT,
  PDF_VIRTUALIZATION_WINDOW,
  PDF_VIRTUALIZATION_WINDOW_MOBILE,
} from '@/lib/pdf-preview';
import { cn } from '@/lib/utils';

interface LoadedPdfDocument {
  numPages: number;
}

interface ReactPdfModule {
  Document: React.ComponentType<Record<string, unknown>>;
  Page: React.ComponentType<Record<string, unknown>>;
  pdfjs: {
    version?: string;
    GlobalWorkerOptions: {
      workerSrc: string;
    };
  };
}

interface PdfViewerProps {
  url: string;
  title?: string;
  subtitle?: string | null;
  className?: string;
  heightClassName?: string;
  pageMaxWidthClassName?: string;
  forcePreviewLock?: boolean;
  showSidebarThumbnails?: boolean;
  theme?: 'default' | 'study';
}

const ZOOM_LEVELS = [0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75] as const;
const MOBILE_VIEWER_HEIGHT = 'h-[72vh] sm:h-[78vh] lg:h-[84vh]';

function getPdfViewerStorageKey(url: string) {
  return `evaluo_pdf_viewer:${url}`;
}

function readPersistedPdfView(url: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getPdfViewerStorageKey(url));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      pageNumber?: number;
      zoomIndex?: number;
    };

    return {
      pageNumber:
        typeof parsed.pageNumber === 'number' && Number.isFinite(parsed.pageNumber)
          ? parsed.pageNumber
          : 1,
      zoomIndex:
        typeof parsed.zoomIndex === 'number' && Number.isFinite(parsed.zoomIndex)
          ? parsed.zoomIndex
          : 2,
    };
  } catch {
    return null;
  }
}

export default function PdfViewer({
  url,
  title = 'Vista de PDF',
  subtitle = null,
  className,
  heightClassName = MOBILE_VIEWER_HEIGHT,
  pageMaxWidthClassName,
  forcePreviewLock = false,
  showSidebarThumbnails = true,
  theme = 'default',
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageViewportRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const previewGateTrackedRef = useRef(false);
  const shouldRestoreSavedPageRef = useRef(false);

  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [viewerWidth, setViewerWidth] = useState(960);
  const [documentSourceBlob, setDocumentSourceBlob] = useState<Blob | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(true);
  const [viewerRuntimeError, setViewerRuntimeError] = useState<string | null>(null);
  const [showPreviewGate, setShowPreviewGate] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const { isAuthenticated, loading: userLoading } = useUser();
  const isStudyTheme = theme === 'study';

  const zoom = ZOOM_LEVELS[zoomIndex];

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsCompactViewport(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    let active = true;

    const loadReactPdf = async () => {
      try {
        const mod = (await import('react-pdf')) as unknown as ReactPdfModule;
        mod.pdfjs.GlobalWorkerOptions.workerSrc = '/react-pdf-worker-5.4.296.min.mjs';

        if (active) {
          setReactPdf(mod);
        }
      } catch (error) {
        logError('pdfViewer.loadReactPdf', error, { url });
        if (active) {
          setViewerRuntimeError('No pudimos inicializar el lector avanzado.');
        }
      }
    };

    void loadReactPdf();

    return () => {
      active = false;
    };
  }, [url]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const target = pageViewportRef.current;
    if (!target || typeof ResizeObserver === 'undefined') return;

    const updateWidth = () => {
      const width = Math.max(280, target.clientWidth - 24);
      setViewerWidth(width);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const persistedView = readPersistedPdfView(url);

    setCurrentPage(1);
    setZoomIndex(persistedView?.zoomIndex ?? 2);
    setDocumentSourceBlob(null);
    setShowPreviewGate(false);
    shouldRestoreSavedPageRef.current = (persistedView?.pageNumber ?? 1) > 1;
    pageRefs.current = {};
  }, [url]);

  useEffect(() => {
    let active = true;

    const loadPdfBinary = async () => {
      setDocumentLoading(true);
      setDocumentError(null);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (blob.type && !blob.type.includes('pdf')) {
          throw new Error('El archivo no tiene formato PDF.');
        }

        if (!active) return;
        setDocumentSourceBlob(blob);
      } catch (error) {
        logError('pdfViewer.loadBinary', error, { url });
        if (!active) return;
        setDocumentSourceBlob(null);
        setDocumentError('No pudimos preparar el archivo PDF para mostrarlo.');
      } finally {
        if (active) {
          setDocumentLoading(false);
        }
      }
    };

    void loadPdfBinary();

    return () => {
      active = false;
    };
  }, [url]);

  useEffect(() => {
    const root = pageViewportRef.current;
    if (!root || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const topEntry = visibleEntries[0];
        const pageValue = topEntry?.target.getAttribute('data-page');
        if (!pageValue) return;

        const parsed = Number(pageValue);
        if (!Number.isNaN(parsed)) {
          setCurrentPage(parsed);
        }
      },
      {
        root,
        threshold: [0.35, 0.6, 0.8],
      }
    );

    Object.values(pageRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [numPages, zoom]);

  const previewPageLimit = useMemo(() => {
    if (numPages <= PDF_PREVIEW_PAGE_LIMIT) return numPages;
    return PDF_PREVIEW_PAGE_LIMIT;
  }, [numPages]);

  const visiblePageLimit = forcePreviewLock ? numPages : isAuthenticated ? numPages : previewPageLimit;
  const isPreviewLocked =
    forcePreviewLock || (!userLoading && !isAuthenticated && numPages > previewPageLimit);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < visiblePageLimit;
  const documentFile = documentSourceBlob;

  const handleDocumentLoad = (documentProxy: unknown) => {
    const doc = documentProxy as LoadedPdfDocument;
    const persistedView = readPersistedPdfView(url);

    setNumPages(doc.numPages);
    setCurrentPage(() => {
      const requestedPage = persistedView?.pageNumber ?? 1;
      return Math.min(Math.max(1, requestedPage), doc.numPages);
    });
  };

  const scrollToPage = (pageNumber: number) => {
    const node = pageRefs.current[pageNumber];
    if (!node) return;

    node.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    if (!isAuthenticated && currentPage > visiblePageLimit && visiblePageLimit > 0) {
      setCurrentPage(visiblePageLimit);
    }
  }, [currentPage, isAuthenticated, visiblePageLimit]);

  useEffect(() => {
    if (numPages <= 0 || currentPage <= 1 || !shouldRestoreSavedPageRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      scrollToPage(currentPage);
      shouldRestoreSavedPageRef.current = false;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [currentPage, numPages]);

  useEffect(() => {
    const viewport = pageViewportRef.current;
    if (!viewport) return;

    if ((isAuthenticated && !forcePreviewLock) || userLoading || (!forcePreviewLock && numPages <= previewPageLimit)) {
      setShowPreviewGate(false);
      return;
    }

    const handleScroll = () => {
      const threshold = 120;
      const reachedPreviewEnd =
        viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - threshold;
      setShowPreviewGate(reachedPreviewEnd);
    };

    handleScroll();
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [forcePreviewLock, isAuthenticated, numPages, previewPageLimit, userLoading, zoom]);

  useEffect(() => {
    if (!isPreviewLocked || !showPreviewGate || previewGateTrackedRef.current) {
      return;
    }

    previewGateTrackedRef.current = true;
    trackMarketingEvent('pdf_gate_viewed', {
      location: 'pdf_preview_gate',
      resource_title: title,
      preview_pages: previewPageLimit,
    });
  }, [isPreviewLocked, previewPageLimit, showPreviewGate, title]);

  useEffect(() => {
    if (!showPreviewGate) {
      previewGateTrackedRef.current = false;
    }
  }, [showPreviewGate]);

  useEffect(() => {
    if (typeof window === 'undefined' || numPages <= 0) {
      return;
    }

    try {
      window.localStorage.setItem(
        getPdfViewerStorageKey(url),
        JSON.stringify({
          pageNumber: currentPage,
          zoomIndex,
        })
      );
    } catch {
      // Ignore persistence failures in restricted environments.
    }
  }, [currentPage, numPages, url, zoomIndex]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement === containerRef.current) {
      await document.exitFullscreen();
      return;
    }

    await containerRef.current.requestFullscreen();
  };

  const zoomOut = () => setZoomIndex((current) => Math.max(0, current - 1));
  const zoomIn = () => setZoomIndex((current) => Math.min(ZOOM_LEVELS.length - 1, current + 1));

  const DocumentComponent = reactPdf?.Document ?? null;
  const PageComponent = reactPdf?.Page ?? null;

  const estimatedPageHeight = useMemo(
    () => Math.max(480, Math.round((viewerWidth * zoom || PDF_ESTIMATED_PAGE_HEIGHT) * 1.42)),
    [viewerWidth, zoom]
  );

  const virtualizationWindow = isCompactViewport
    ? PDF_VIRTUALIZATION_WINDOW_MOBILE
    : PDF_VIRTUALIZATION_WINDOW;

  const renderedPageNumbers = useMemo(() => {
    const pages = new Set<number>();
    const start = Math.max(1, currentPage - virtualizationWindow);
    const end = Math.min(visiblePageLimit, currentPage + virtualizationWindow);

    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
      pages.add(pageNumber);
    }

    if (visiblePageLimit > 0) {
      pages.add(1);
      pages.add(visiblePageLimit);
    }

    return pages;
  }, [currentPage, visiblePageLimit, virtualizationWindow]);

  const renderedSidebarPages = useMemo(() => {
    const pages = new Set<number>();
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(visiblePageLimit, currentPage + 1);

    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
      pages.add(pageNumber);
    }

    if (visiblePageLimit > 0) {
      pages.add(1);
      pages.add(visiblePageLimit);
    }

    return pages;
  }, [currentPage, visiblePageLimit]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'surface-panel w-full min-w-0 max-w-full overflow-hidden',
        isStudyTheme && 'border-white/8 bg-[#111214] text-slate-100',
        className
      )}
    >
      <div
        className={cn(
          'border-b border-slate-200 bg-white px-3 py-3 md:px-4',
          isStudyTheme && 'border-white/8 bg-[#111214]'
        )}
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="min-w-0">
            <p className={cn('truncate text-sm font-semibold text-slate-900', isStudyTheme && 'text-slate-100')}>
              {title}
            </p>
            {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 xl:justify-end">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoomIndex === 0}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-[1rem]',
                isStudyTheme && 'border-white/8 text-slate-300 hover:bg-white/6'
              )}
              aria-label="Alejar zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-[1rem]',
                isStudyTheme && 'border-white/8 text-slate-300 hover:bg-white/6'
              )}
              aria-label="Acercar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <div
              className={cn(
                'min-h-8 rounded-[0.9rem] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 sm:min-h-10 sm:rounded-[1rem] sm:px-3 sm:py-2 sm:text-xs',
                isStudyTheme && 'border-white/8 bg-white/3 text-slate-100'
              )}
            >
              {currentPage} / {numPages || '...'}
            </div>

            <button
              type="button"
              onClick={() => {
                const nextPage = Math.max(1, currentPage - 1);
                setCurrentPage(nextPage);
                scrollToPage(nextPage);
              }}
              disabled={!canGoPrev}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-[1rem]',
                isStudyTheme && 'border-white/8 text-slate-300 hover:bg-white/6'
              )}
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const nextPage = Math.min(numPages, currentPage + 1);
                setCurrentPage(nextPage);
                scrollToPage(nextPage);
              }}
              disabled={!canGoNext}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-[1rem]',
                isStudyTheme && 'border-white/8 text-slate-300 hover:bg-white/6'
              )}
              aria-label="Pagina siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {!isCompactViewport ? (
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-[1rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:h-10 sm:w-10',
                  isStudyTheme && 'border-white/8 text-slate-300 hover:bg-white/6'
                )}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cn('grid gap-0', showSidebarThumbnails ? 'lg:grid-cols-[170px_minmax(0,1fr)]' : 'grid-cols-1')}>
        {showSidebarThumbnails ? (
          <aside
            className={cn(
              'hidden border-r border-slate-200 bg-[#f8fafc] lg:block',
              isStudyTheme && 'border-white/8 bg-[#111214]'
            )}
          >
            <div className="max-h-[84vh] space-y-3 overflow-y-auto p-3">
              {DocumentComponent && PageComponent && documentFile && numPages > 0 ? (
                <DocumentComponent file={documentFile}>
                  {Array.from({ length: visiblePageLimit }, (_, index) => {
                    const pageNumber = index + 1;
                    const active = pageNumber === currentPage;
                    const shouldRenderThumbnail = renderedSidebarPages.has(pageNumber);

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => {
                          setCurrentPage(pageNumber);
                          scrollToPage(pageNumber);
                        }}
                        className={cn(
                          'w-full rounded-2xl border p-2 text-left transition',
                          active
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50',
                          isStudyTheme &&
                            (active
                              ? 'border-amber-500/30 bg-[#2A2118]'
                              : 'border-white/8 bg-white/4 hover:bg-white/8')
                        )}
                      >
                        <div
                          className={cn(
                            'overflow-hidden rounded-xl border border-slate-100 bg-white',
                            isStudyTheme && 'border-white/8 bg-[#18191C]'
                          )}
                        >
                          {shouldRenderThumbnail ? (
                            <PageComponent
                              pageNumber={pageNumber}
                              width={120}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                            />
                          ) : (
                            <div
                              className={cn(
                                'flex h-[170px] items-center justify-center bg-slate-50 text-[11px] font-medium text-slate-400',
                                isStudyTheme && 'bg-[#18191C] text-slate-500'
                              )}
                            >
                              Pagina {pageNumber}
                            </div>
                          )}
                        </div>
                        <p
                          className={cn(
                            'mt-2 text-center text-[11px] font-semibold text-slate-600',
                            isStudyTheme && 'text-slate-400'
                          )}
                        >
                          Pagina {pageNumber}
                        </p>
                      </button>
                    );
                  })}
                </DocumentComponent>
              ) : null}
            </div>
          </aside>
        ) : null}

        <div className={cn('bg-[#eef2f7] p-2 sm:p-3', isStudyTheme && 'bg-[#17181C]')}>
          <div
            ref={pageViewportRef}
            className={cn(
              'min-w-0 max-w-full overflow-auto rounded-[1rem] bg-white p-2 sm:rounded-[1.15rem] sm:p-3',
              isStudyTheme && 'bg-[#0F1012]',
              heightClassName
            )}
          >
            {viewerRuntimeError ? (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center text-sm text-slate-500',
                  isStudyTheme && 'text-slate-400'
                )}
              >
                {viewerRuntimeError}
              </div>
            ) : documentLoading ? (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center text-sm text-slate-500',
                  isStudyTheme && 'text-slate-400'
                )}
              >
                Cargando documento...
              </div>
            ) : documentError || !documentFile ? (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center text-sm text-slate-500',
                  isStudyTheme && 'text-slate-400'
                )}
              >
                {documentError || 'No pudimos preparar el PDF.'}
              </div>
            ) : !DocumentComponent || !PageComponent ? (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center text-sm text-slate-500',
                  isStudyTheme && 'text-slate-400'
                )}
              >
                Inicializando lector...
              </div>
            ) : (
              <DocumentComponent
                file={documentFile}
                onLoadSuccess={handleDocumentLoad}
                loading={
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    Cargando paginas...
                  </div>
                }
                error={
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    No pudimos renderizar este PDF.
                  </div>
                }
              >
                <div className="space-y-6">
                  {Array.from({ length: visiblePageLimit || 0 }, (_, index) => {
                    const pageNumber = index + 1;
                    const shouldRenderPage = renderedPageNumbers.has(pageNumber);

                    return (
                      <div
                        key={pageNumber}
                        ref={(node) => {
                          pageRefs.current[pageNumber] = node;
                        }}
                        data-page={pageNumber}
                        className={cn(
                          'mx-auto w-full max-w-full rounded-[0.95rem] border border-slate-100 bg-white shadow-sm',
                          pageMaxWidthClassName,
                          isStudyTheme && 'border-white/8 bg-white shadow-[0_10px_34px_rgba(0,0,0,0.28)]'
                        )}
                        style={{ minHeight: `${estimatedPageHeight}px` }}
                      >
                        {shouldRenderPage ? (
                          <PageComponent
                            pageNumber={pageNumber}
                            width={Math.round(viewerWidth * zoom)}
                            renderAnnotationLayer={false}
                            renderTextLayer={!isCompactViewport}
                          />
                        ) : (
                          <div
                            className={cn(
                              'flex h-full min-h-[inherit] items-center justify-center rounded-[0.95rem] bg-[linear-gradient(180deg,#fafcff_0%,#f3f6fb_100%)] text-sm font-medium text-slate-400',
                              isStudyTheme && 'bg-[linear-gradient(180deg,#1B1C21_0%,#131418_100%)] text-slate-500'
                            )}
                          >
                            Preparando pagina {pageNumber}...
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isPreviewLocked && showPreviewGate ? (
                    <div className="sticky bottom-3 z-10 mx-auto mt-6 flex w-full max-w-2xl justify-center px-1 sm:bottom-4 sm:px-3">
                      <div className="absolute inset-x-5 -top-10 h-14 rounded-full bg-gradient-to-t from-white via-white/80 to-transparent blur-2xl" />
                      <div className="surface-panel relative w-full overflow-hidden rounded-[var(--radius-panel)] border-indigo-200/80 bg-white/96 p-6 text-center backdrop-blur xl:p-7">
                        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                          Preview disponible
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-indigo-600">
                            {previewPageLimit} paginas
                          </span>
                        </div>
                        <p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
                          Accede al material completo
                        </p>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                          Ya viste una parte del documento. Inicia sesion para desbloquear la lectura completa, guardar tu progreso y seguir estudiando dentro de Evaluo.
                        </p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
                          <Link
                            href="/login?mode=signup"
                            onClick={() =>
                              trackMarketingEvent('pdf_gate_cta_clicked', {
                                location: 'pdf_preview_gate',
                                resource_title: title,
                                preview_pages: previewPageLimit,
                                cta_name: 'crear_cuenta_para_leer',
                                destination: '/login?mode=signup',
                              })
                            }
                            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.2)] transition hover:opacity-95"
                          >
                            Crear cuenta y seguir leyendo
                          </Link>
                          <Link
                            href="/login"
                            onClick={() =>
                              trackMarketingEvent('pdf_gate_cta_clicked', {
                                location: 'pdf_preview_gate',
                                resource_title: title,
                                preview_pages: previewPageLimit,
                                cta_name: 'iniciar_sesion_para_leer',
                                destination: '/login',
                              })
                            }
                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Iniciar sesion
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </DocumentComponent>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
