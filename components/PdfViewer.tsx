'use client';

import 'react-pdf/dist/Page/TextLayer.css';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Minimize,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
  url: string;
  title?: string;
  className?: string;
  heightClassName?: string;
  forcePreviewLock?: boolean;
}

interface SearchResult {
  pageNumber: number;
  preview: string;
}

interface PdfTextContentItem {
  str?: string;
}

interface PdfPageLike {
  getTextContent: () => Promise<{ items: PdfTextContentItem[] }>;
}

interface LoadedPdfDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
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

interface PdfFileData {
  data: Uint8Array;
}

const ZOOM_LEVELS = [0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75] as const;
const PREVIEW_PAGE_LIMIT = 3;
const MOBILE_VIEWER_HEIGHT = 'h-[72vh] sm:h-[78vh] lg:h-[84vh]';

export default function PdfViewer({
  url,
  title = 'Vista de PDF',
  className,
  heightClassName = MOBILE_VIEWER_HEIGHT,
  forcePreviewLock = false,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageViewportRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [viewerWidth, setViewerWidth] = useState(960);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<LoadedPdfDocument | null>(null);
  const [documentBytes, setDocumentBytes] = useState<Uint8Array | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(true);
  const [viewerRuntimeError, setViewerRuntimeError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showPreviewGate, setShowPreviewGate] = useState(false);

  const zoom = ZOOM_LEVELS[zoomIndex];

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (active) {
          setHasSession(Boolean(session?.user));
        }
      } finally {
        if (active) {
          setSessionLoading(false);
        }
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session?.user));
      setSessionLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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
        console.error('React PDF runtime load error:', error);
        if (active) {
          setViewerRuntimeError('No pudimos inicializar el lector avanzado.');
        }
      }
    };

    void loadReactPdf();

    return () => {
      active = false;
    };
  }, []);

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
    setCurrentPage(1);
    setSearchQuery('');
    setSearchResults([]);
    setPdfDocument(null);
    setDocumentBytes(null);
    setShowPreviewGate(false);
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

        const arrayBuffer = await blob.arrayBuffer();
        if (!active) return;
        setDocumentBytes(new Uint8Array(arrayBuffer));
      } catch (error) {
        console.error('PdfViewer load error:', error);
        if (!active) return;
        setDocumentBytes(null);
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

  const canGoPrev = currentPage > 1;
  const previewPageLimit = useMemo(() => {
    if (numPages <= PREVIEW_PAGE_LIMIT) return numPages;
    return PREVIEW_PAGE_LIMIT;
  }, [numPages]);
  const visiblePageLimit = forcePreviewLock ? numPages : hasSession ? numPages : previewPageLimit;
  const isPreviewLocked =
    forcePreviewLock || (!sessionLoading && !hasSession && numPages > previewPageLimit);
  const canGoNext = currentPage < visiblePageLimit;

  const currentSearchResult = useMemo(
    () => searchResults.find((result) => result.pageNumber === currentPage) ?? null,
    [currentPage, searchResults]
  );

  const mainDocumentFile = useMemo<PdfFileData | null>(() => {
    if (!documentBytes) return null;
    return { data: documentBytes.slice() };
  }, [documentBytes]);

  const sidebarDocumentFile = useMemo<PdfFileData | null>(() => {
    if (!documentBytes) return null;
    return { data: documentBytes.slice() };
  }, [documentBytes]);

  const handleDocumentLoad = (documentProxy: unknown) => {
    const doc = documentProxy as LoadedPdfDocument;
    setPdfDocument(doc);
    setNumPages(doc.numPages);
    setCurrentPage((page) => Math.min(Math.max(1, page), doc.numPages));
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
    if (!hasSession && currentPage > visiblePageLimit && visiblePageLimit > 0) {
      setCurrentPage(visiblePageLimit);
    }
  }, [currentPage, hasSession, visiblePageLimit]);

  useEffect(() => {
    const viewport = pageViewportRef.current;
    if (!viewport) return;

    if ((hasSession && !forcePreviewLock) || sessionLoading || (!forcePreviewLock && numPages <= previewPageLimit)) {
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
  }, [hasSession, numPages, previewPageLimit, sessionLoading, zoom]);

  const runSearch = async () => {
    const query = searchQuery.trim().toLowerCase();
    if (!pdfDocument || !query) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      const results: SearchResult[] = [];

      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => item.str ?? '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        const normalized = pageText.toLowerCase();
        const matchIndex = normalized.indexOf(query);
        if (matchIndex >= 0) {
          const previewStart = Math.max(0, matchIndex - 45);
          const previewEnd = Math.min(pageText.length, matchIndex + query.length + 70);
          results.push({
            pageNumber,
            preview: pageText.slice(previewStart, previewEnd),
          });
        }
      }

      setSearchResults(results);
      if (results[0]) {
        setCurrentPage(results[0].pageNumber);
        requestAnimationFrame(() => scrollToPage(results[0].pageNumber));
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

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

  return (
    <div
      ref={containerRef}
      className={cn('surface-panel overflow-hidden', className)}
    >
      <div className="border-b border-slate-200 bg-white px-3 py-3 md:px-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-xs text-slate-500">Lector avanzado de Evaluo</p>
            </div>

            <div className="flex min-w-0 items-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void runSearch();
                  }
                }}
                placeholder="Buscar en el documento"
                className="w-full min-w-0 bg-transparent outline-none placeholder:text-slate-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void runSearch()}
                className="inline-flex h-9 shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                {loadingSearch ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoomIndex === 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[1rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
              aria-label="Alejar zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[1rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
              aria-label="Acercar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <div className="min-h-9 rounded-[1rem] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 sm:min-h-10">
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-[1rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
              aria-label="Página anterior"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-[1rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[1rem] border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:h-10 sm:w-10"
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[170px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-[#f8fafc] lg:block">
          <div className="max-h-[84vh] space-y-3 overflow-y-auto p-3">
            {DocumentComponent && PageComponent && sidebarDocumentFile && numPages > 0 ? (
              <DocumentComponent file={sidebarDocumentFile}>
                {Array.from({ length: visiblePageLimit }, (_, index) => {
                  const pageNumber = index + 1;
                  const active = pageNumber === currentPage;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNumber);
                        scrollToPage(pageNumber);
                      }}
                      className={`w-full rounded-2xl border p-2 text-left transition ${
                        active
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                        <PageComponent
                          pageNumber={pageNumber}
                          width={120}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                        />
                      </div>
                      <p className="mt-2 text-center text-[11px] font-semibold text-slate-600">
                        Página {pageNumber}
                      </p>
                    </button>
                  );
                })}
              </DocumentComponent>
            ) : null}
          </div>
        </aside>

        <div className="bg-[#eef2f7] p-2 sm:p-3">
          {searchResults.length > 0 ? (
            <div className="mb-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              <p className="font-semibold">
                {searchResults.length} resultado{searchResults.length === 1 ? '' : 's'} para "{searchQuery}"
              </p>
              {currentSearchResult ? (
                <p className="mt-1 text-xs text-indigo-700">
                  Página {currentSearchResult.pageNumber}: {currentSearchResult.preview}
                </p>
              ) : null}
            </div>
          ) : null}

          <div
            ref={pageViewportRef}
            className={cn(
              'overflow-auto rounded-[1rem] bg-white p-2 sm:rounded-[1.15rem] sm:p-3',
              heightClassName
            )}
          >
            {viewerRuntimeError ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                {viewerRuntimeError}
              </div>
            ) : documentLoading ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                Cargando documento...
              </div>
            ) : documentError || !mainDocumentFile ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                {documentError || 'No pudimos preparar el PDF.'}
              </div>
            ) : !DocumentComponent || !PageComponent ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                Inicializando lector...
              </div>
            ) : (
              <DocumentComponent
                file={mainDocumentFile}
                onLoadSuccess={handleDocumentLoad}
                loading={
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    Cargando páginas...
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

                    return (
                      <div
                        key={pageNumber}
                        ref={(node) => {
                          pageRefs.current[pageNumber] = node;
                        }}
                        data-page={pageNumber}
                        className="mx-auto w-fit max-w-full rounded-[0.95rem] border border-slate-100 bg-white shadow-sm"
                      >
                        <PageComponent
                          pageNumber={pageNumber}
                          width={Math.round(viewerWidth * zoom)}
                          renderAnnotationLayer={false}
                          renderTextLayer
                        />
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
                        <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
                          Accede al material completo
                        </p>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                          Ya viste una parte del documento. Inicia sesión para desbloquear la lectura completa, guardar tu progreso y seguir estudiando dentro de Evaluo.
                        </p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
                          <Link
                            href="/login"
                            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.2)] transition hover:opacity-95"
                          >
                            Continuar para leer completo
                          </Link>
                          <Link
                            href="/login"
                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Iniciar sesión
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
