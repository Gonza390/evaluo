'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import PdfViewer from '@/components/PdfViewer';
import { supabase } from '@/lib/supabase';
import { pushActivityHit, pushRecentResource } from '@/lib/dashboard-client';
import { useToast } from '@/hooks/use-toast';
import { getSimulatorRoute } from '@/lib/routes';
import {
  fetchMateriaRecursos,
  fetchResourceViewCounts,
  fetchResourceVoteSummaries,
  getDefaultResourceVoteSummary,
  registerResourceView,
  sortResourcesByVotes,
  upsertResourceVote,
  type ResourceViewCountMap,
  type ResourceVoteSummaryMap,
} from '@/lib/data/resources';

interface Recurso {
  id: string;
  nombre: string;
  tipo: string | null;
  url_archivo: string | null;
  creado_at: string | null;
  materia_id: string | null;
  etiqueta?: string | null;
}

function getSectionTitle(tipo: string) {
  if (tipo === 'resumen-modulo') return 'Resúmenes por módulo';
  if (tipo === 'preguntero-p1') return 'Pregunteros del Parcial 1';
  if (tipo === 'preguntero-p2') return 'Pregunteros del Parcial 2';
  if (tipo === 'tp-p1') return 'Trabajos prácticos del Parcial 1';
  if (tipo === 'tp-p2') return 'Trabajos prácticos del Parcial 2';
  if (tipo === 'primer-parcial') return 'Resúmenes del Primer Parcial';
  if (tipo === 'segundo-parcial') return 'Resúmenes del Segundo Parcial';
  return 'Biblioteca de apuntes';
}

function getReaderLabel(tipo: string) {
  if (tipo.includes('preguntero')) return 'Preguntero';
  if (tipo.includes('tp')) return 'TP';
  return 'Resumen';
}

function getStorageObjectPath(resourcePath: string) {
  if (!/^https?:\/\//i.test(resourcePath)) {
    return resourcePath.replace(/^\/+/, '');
  }

  try {
    const parsedUrl = new URL(resourcePath);
    const marker = '/storage/v1/object/';
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const objectPath = parsedUrl.pathname.slice(markerIndex + marker.length);
    const segments = objectPath.split('/').filter(Boolean);
    const bucketIndex = segments.findIndex((segment) => segment === 'biblioteca');
    if (bucketIndex < 0) return null;

    return decodeURIComponent(segments.slice(bucketIndex + 1).join('/'));
  } catch {
    return null;
  }
}

function RecursoContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const materiaId = params.id as string;
  const tipo = searchParams.get('tipo') || 'primer-parcial';
  const nombreMateria = searchParams.get('nombre') || 'Tu materia';
  const selectedResourceQuery = searchParams.get('resource');
  const moduloQuery = searchParams.get('modulo');

  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerIsPreview, setViewerIsPreview] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [resourceVotes, setResourceVotes] = useState<ResourceVoteSummaryMap>({});
  const [resourceViews, setResourceViews] = useState<ResourceViewCountMap>({});
  const [voteLoading, setVoteLoading] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (mounted) {
          setCurrentUserId(data.user?.id ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setCurrentUserId(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    async function fetchRecursos() {
      setLoading(true);
      setReaderError(null);

      try {
        let rows = (await fetchMateriaRecursos(supabase, materiaId)).filter(
          (resource) => resource.tipo === tipo
        ) as Recurso[];
        if (tipo === 'resumen-modulo' && moduloQuery) {
          rows = rows.filter((item) => (item.etiqueta ?? '').toLowerCase().includes(`modulo ${moduloQuery}`));
        }

        setRecursos(rows);

        const preferredResource =
          rows.find((item) => item.id === selectedResourceQuery) ??
          rows.find((item) => Boolean(item.url_archivo)) ??
          rows[0];

        setSelectedResourceId(preferredResource?.id ?? null);
      } catch (error) {
        console.error('Error in fetchRecursos:', error);
        setReaderError('No pudimos cargar esta colección de documentos.');
      } finally {
        setLoading(false);
      }
    }

    if (materiaId) {
      void fetchRecursos();
    }
  }, [materiaId, moduloQuery, selectedResourceQuery, tipo]);

  useEffect(() => {
    const resourceIds = recursos.map((resource) => resource.id);
    if (resourceIds.length === 0) {
      setResourceVotes({});
      setResourceViews({});
      return;
    }

    void Promise.all([
      fetchResourceVoteSummaries(supabase, resourceIds, currentUserId ?? undefined),
      fetchResourceViewCounts(supabase, resourceIds),
    ])
      .then(([summaries, views]) => {
        setResourceVotes(summaries);
        setResourceViews(views);
      })
      .catch((error) => console.error('Error fetching resource vote summaries:', error));
  }, [currentUserId, recursos]);

  const sortedRecursos = useMemo(
    () => sortResourcesByVotes(recursos, resourceVotes),
    [recursos, resourceVotes]
  );

  const selectedResource = useMemo(
    () => sortedRecursos.find((resource) => resource.id === selectedResourceId) ?? null,
    [selectedResourceId, sortedRecursos]
  );

  useEffect(() => {
    async function hydrateViewer() {
      if (!selectedResource?.url_archivo) {
        setViewerUrl(null);
        setViewerIsPreview(false);
        return;
      }

      setViewerLoading(true);
      setReaderError(null);

      try {
        const response = await fetch('/api/pdf-view-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: selectedResource.url_archivo }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            setViewerUrl(null);
            setReaderError('Inicia sesion para acceder al documento completo.');
            return;
          }

          setViewerUrl(null);
          setReaderError('No pudimos preparar la vista del documento.');
          return;
        }

        const payload = (await response.json()) as { url?: string; preview?: boolean };
        const signedViewerUrl = payload.url ?? null;
        setViewerUrl(signedViewerUrl);
        setViewerIsPreview(Boolean(payload.preview));

        if (signedViewerUrl) {
          let sessionKey = '';

          try {
            sessionKey =
              window.sessionStorage.getItem('evaluo_pdf_view_session') ??
              `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            window.sessionStorage.setItem('evaluo_pdf_view_session', sessionKey);

            const viewKey = `evaluo_resource_viewed:${selectedResource.id}`;
            if (!window.sessionStorage.getItem(viewKey)) {
              await registerResourceView(supabase, {
                resourceId: selectedResource.id,
                userId: currentUserId,
                sessionKey,
              });
              window.sessionStorage.setItem(viewKey, '1');
              setResourceViews((prev) => ({
                ...prev,
                [selectedResource.id]: (prev[selectedResource.id] ?? 0) + 1,
              }));
            }
          } catch (error) {
            console.error('Error registering resource view:', error);
          }

          pushRecentResource({
            id: selectedResource.id,
            title: selectedResource.nombre,
            subjectId: materiaId,
            subjectName: nombreMateria,
            type: getReaderLabel(tipo),
            href: signedViewerUrl,
            openedAt: new Date().toISOString(),
          });
          pushActivityHit();
        }
      } catch (error) {
        console.error('Error hydrating viewer:', error);
        setViewerUrl(null);
        setViewerIsPreview(false);
        setReaderError('No pudimos abrir la vista del documento.');
      } finally {
        setViewerLoading(false);
      }
    }

    void hydrateViewer();
  }, [currentUserId, materiaId, nombreMateria, selectedResource, tipo]);

  const selectedIndex = sortedRecursos.findIndex((resource) => resource.id === selectedResourceId);
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex >= 0 && selectedIndex < sortedRecursos.length - 1;
  const parcial = tipo.includes('p2') || tipo === 'segundo-parcial' ? 2 : 1;

  const voteResource = async (resourceId: string, voteType: 1 | -1) => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Necesitás iniciar sesión para votar',
        description: 'Entrá con tu cuenta para guardar tu feedback.',
        duration: 2800,
      });
      router.push('/login');
      return;
    }

    setVoteLoading(resourceId);
    try {
      await upsertResourceVote(supabase, { userId, resourceId, voteType });
      const refreshed = await fetchResourceVoteSummaries(
        supabase,
        sortedRecursos.map((resource) => resource.id),
        userId
      );
      setResourceVotes(refreshed);
    } catch (error) {
      console.error('Error voting resource:', error);
      toast({
        variant: 'destructive',
        title: 'No pudimos guardar tu voto',
        description: 'Intentá nuevamente en unos segundos.',
        duration: 3000,
      });
    } finally {
      setVoteLoading('');
    }
  };

  const requireDownloadSession = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      toast({
        variant: 'destructive',
        title: 'No pudimos validar tu sesión',
        description: 'Intentá nuevamente en unos segundos.',
        duration: 3000,
      });
      return null;
    }

    if (!sessionData.session) {
      toast({
        variant: 'destructive',
        title: 'Necesitás iniciar sesión para descargar este material',
        description: 'Te redirigimos para continuar.',
        duration: 2800,
      });
      router.push('/login');
      return null;
    }

    return sessionData.session;
  };

  const handleSecureDownload = async (recurso: Recurso) => {
    if (!recurso.url_archivo) return;

    const session = await requireDownloadSession();
    if (!session) return;

    const objectPath = getStorageObjectPath(recurso.url_archivo);
    if (!objectPath) {
      toast({
        variant: 'destructive',
        title: 'No pudimos preparar la descarga',
        description: 'El archivo no tiene una ruta válida en Storage.',
        duration: 3000,
      });
      return;
    }

    const downloadName = recurso.nombre.toLowerCase().endsWith('.pdf')
      ? recurso.nombre
      : `${recurso.nombre}.pdf`;

    const response = await fetch('/api/pdf-download-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: objectPath, downloadName }),
    });

    if (!response.ok) {
      toast({
        variant: 'destructive',
        title: 'No pudimos generar la descarga segura',
        description: 'Intenta nuevamente en unos segundos.',
        duration: 3000,
      });
      return;
    }

    const payload = (await response.json()) as { url?: string };
    if (!payload.url) {
      toast({
        variant: 'destructive',
        title: 'No pudimos generar la descarga segura',
        description: 'Intenta nuevamente en unos segundos.',
        duration: 3000,
      });
      return;
    }

    window.open(payload.url, '_blank', 'noopener,noreferrer');
    /*
    const { data, error } = await supabase.storage
      .from('biblioteca')
      .createSignedUrl(objectPath, 60, { download: downloadName });

    if (error || !data?.signedUrl) {
      toast({
        variant: 'destructive',
        title: 'No pudimos generar la descarga segura',
        description: 'Intentá nuevamente en unos segundos.',
        duration: 3000,
      });
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    */
  };

  const goToResource = (direction: 'prev' | 'next') => {
    const nextIndex = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
    const nextResource = sortedRecursos[nextIndex];
    if (!nextResource) return;

    setSelectedResourceId(nextResource.id);
    sidebarRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="animate-page-enter min-h-screen bg-[#f3f6fb]">
      <div className="mx-auto max-w-[1520px] px-4 py-5 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>

          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            Lector Evaluo
          </div>
        </div>

        <section className="surface-panel animate-saas-lift-in mb-4 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{nombreMateria}</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
                {selectedResource?.nombre || getSectionTitle(tipo)}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Leé el documento en una vista limpia, navegá entre materiales relacionados y practicá este mismo bloque cuando quieras.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <div className="surface-card rounded-[var(--radius-card)] bg-slate-50 px-4 py-3 shadow-none">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Colección</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{getSectionTitle(tipo)}</p>
              </div>
              <div className="surface-card rounded-[var(--radius-card)] bg-slate-50 px-4 py-3 shadow-none">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Documentos</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{sortedRecursos.length}</p>
              </div>
              <div className="surface-card rounded-[var(--radius-card)] bg-slate-50 px-4 py-3 shadow-none">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Vistas</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {selectedResource ? (resourceViews[selectedResource.id] ?? 0) : 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="surface-panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {getReaderLabel(tipo)}
                  </span>
                  {selectedResource?.creado_at ? (
                    <span className="text-xs font-medium text-slate-500">
                      Publicado el {new Date(selectedResource.creado_at).toLocaleDateString('es-AR')}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 truncate text-xl font-black text-slate-900 lg:text-2xl">
                  {selectedResource?.nombre || 'Seleccioná un documento'}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToResource('prev')}
                  disabled={!canGoPrev}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Documento anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToResource('next')}
                  disabled={!canGoNext}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Documento siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => selectedResource && void handleSecureDownload(selectedResource)}
                  disabled={!selectedResource}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </button>
                <Link
                  href={getSimulatorRoute(materiaId, parcial)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <GraduationCap className="h-4 w-4" />
                  Ir al simulador
                </Link>
                {selectedResource ? (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                      <Eye className="h-3.5 w-3.5 text-sky-600" />
                      <span>{selectedResource ? (resourceViews[selectedResource.id] ?? 0) : 0}</span>
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{(resourceVotes[selectedResource.id] ?? getDefaultResourceVoteSummary()).likes}</span>
                      <ThumbsDown className="ml-1 h-3.5 w-3.5 text-rose-600" />
                      <span>{(resourceVotes[selectedResource.id] ?? getDefaultResourceVoteSummary()).dislikes}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void voteResource(selectedResource.id, 1)}
                      disabled={voteLoading === selectedResource.id}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition disabled:opacity-60 ${
                        (resourceVotes[selectedResource.id] ?? getDefaultResourceVoteSummary()).userVote === 1
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void voteResource(selectedResource.id, -1)}
                      disabled={voteLoading === selectedResource.id}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition disabled:opacity-60 ${
                        (resourceVotes[selectedResource.id] ?? getDefaultResourceVoteSummary()).userVote === -1
                          ? 'border-rose-300 bg-rose-50 text-rose-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="bg-[#f3f6fb] p-2">
              {loading || viewerLoading ? (
                <div className="flex h-[74vh] sm:h-[80vh] lg:h-[86vh] flex-col items-center justify-center gap-4 rounded-[1.15rem] bg-white text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Estamos preparando el visor</p>
                    <p className="mt-1 text-xs text-slate-500">Cargando el documento y sus accesos seguros.</p>
                  </div>
                </div>
              ) : readerError ? (
                <div className="flex h-[74vh] sm:h-[80vh] lg:h-[86vh] flex-col items-center justify-center gap-4 rounded-[1.15rem] bg-white px-6 text-center">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <div>
                    <p className="text-base font-semibold text-slate-900">No pudimos abrir este documento</p>
                    <p className="mt-2 text-sm text-slate-500">{readerError}</p>
                  </div>
                </div>
              ) : viewerUrl ? (
                <PdfViewer
                  url={viewerUrl}
                  title={selectedResource?.nombre || 'Documento Evaluo'}
                  className="animate-saas-lift-in border-0 shadow-none"
                  heightClassName="h-[74vh] sm:h-[80vh] lg:h-[86vh]"
                  forcePreviewLock={viewerIsPreview}
                />
                ) : (
                <div className="flex h-[74vh] sm:h-[80vh] lg:h-[86vh] flex-col items-center justify-center gap-4 rounded-[1.15rem] bg-white px-6 text-center">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <div>
                    <p className="text-base font-semibold text-slate-900">Todavía no hay documento listo para leer</p>
                    <p className="mt-2 text-sm text-slate-500">Elegí otro material desde la columna lateral.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_14px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Biblioteca</p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">Más documentos de esta sección</h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <BookOpen className="h-3.5 w-3.5" />
                  {sortedRecursos.length}
                </div>
              </div>

              <div ref={sidebarRef} className="mt-5 max-h-[74vh] space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="animate-pulse rounded-2xl border border-slate-100 p-4">
                      <div className="h-28 rounded-xl bg-slate-100"></div>
                      <div className="mt-3 h-4 w-3/4 rounded bg-slate-100"></div>
                      <div className="mt-2 h-3 w-1/2 rounded bg-slate-50"></div>
                    </div>
                  ))
                ) : sortedRecursos.length > 0 ? (
                  sortedRecursos.map((recurso, index) => {
                    const active = recurso.id === selectedResourceId;
                    const voteSummary = resourceVotes[recurso.id] ?? getDefaultResourceVoteSummary();

                    return (
                      <button
                        key={recurso.id}
                        type="button"
                        onClick={() => setSelectedResourceId(recurso.id)}
                        className={`animate-saas-lift-in w-full rounded-2xl border p-4 text-left transition ${
                          active
                            ? 'border-indigo-300 bg-indigo-50 shadow-[0_10px_30px_rgba(79,93,255,0.12)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                              <Eye className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-bold text-slate-900">{recurso.nombre}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {recurso.creado_at ? new Date(recurso.creado_at).toLocaleDateString('es-AR') : 'Sin fecha'}
                              </p>
                              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                <Eye className="h-3 w-3 text-sky-600" />
                                <span>{resourceViews[recurso.id] ?? 0}</span>
                                <ThumbsUp className="h-3 w-3 text-emerald-600" />
                                <span>{voteSummary.likes}</span>
                                <ThumbsDown className="h-3 w-3 text-rose-600" />
                                <span>{voteSummary.dislikes}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                        </div>

                        <div className="mt-4 rounded-[1.25rem] bg-gradient-to-b from-slate-50 to-slate-100 p-4">
                          <div className="aspect-[3/4] rounded-[1rem] border border-white/80 bg-white/80 shadow-inner" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">No encontramos materiales publicados</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      Cuando subamos nuevos documentos para esta sección, los vas a ver acá.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Cargando lector...</p>
          </div>
        </div>
      }
    >
      <RecursoContent />
    </Suspense>
  );
}
