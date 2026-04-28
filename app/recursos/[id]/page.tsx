'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Eye, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { pushActivityHit, pushRecentResource } from '@/lib/dashboard-client';
import { useToast } from '@/hooks/use-toast';
import PdfViewer from '@/components/PdfViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Recurso {
  id: string;
  nombre: string;
  tipo: string | null;
  url_archivo: string | null;
  creado_at: string | null;
  materia_id: string | null;
}

function RecursoContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const id = params.id as string;
  const tipo = searchParams.get('tipo') || 'primer-parcial';
  const nombreMateria = searchParams.get('nombre') || 'Cargando materia...';

  const [recursosRecientes, setRecursosRecientes] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerDocument, setViewerDocument] = useState<{ title: string; url: string } | null>(null);

  const scrollRefRecientes = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchRecursos() {
      setLoading(true);
      try {
        const tipoDB = tipo;

        const { data, error } = await supabase
          .from('recursos')
          .select('*')
          .eq('materia_id', id)
          .eq('tipo', tipoDB)
          .order('creado_at', { ascending: false })
          .limit(8);

        if (error) {
          console.error('Error fetching recursos:', error);
        } else {
          setRecursosRecientes(data || []);
        }
      } catch (err) {
        console.error('Error in fetchRecursos:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void fetchRecursos();
    }
  }, [id, tipo]);

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right'
  ) => {
    if (!ref.current) return;

    const scrollAmount = 300;
    ref.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const requireDownloadSession = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      toast({
        variant: 'destructive',
        title: 'No pudimos validar tu sesion',
        description: 'Intenta nuevamente en unos segundos.',
        duration: 3000,
      });
      return null;
    }

    if (!sessionData.session) {
      toast({
        variant: 'destructive',
        title: 'Debes iniciar sesion para descargar este material',
        description: 'Te redirigimos para continuar.',
        duration: 2800,
      });
      router.push('/login');
      return null;
    }

    return sessionData.session;
  };

  const getPdfViewerUrl = async (resourcePath: string) => {
    const response = await fetch('/api/pdf-view-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: resourcePath }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { url?: string };
    return payload.url ?? null;
  };

  const getStorageObjectPath = (resourcePath: string) => {
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
  };

  const handleSecureDownload = async (recurso: Recurso) => {
    if (!recurso.url_archivo) return;

    const session = await requireDownloadSession();
    if (!session) {
      return;
    }

    const objectPath = getStorageObjectPath(recurso.url_archivo);
    if (!objectPath) {
      toast({
        variant: 'destructive',
        title: 'No pudimos preparar la descarga',
        description: 'El archivo no tiene una ruta valida en Storage.',
        duration: 3000,
      });
      return;
    }

    const downloadName = recurso.nombre.toLowerCase().endsWith('.pdf')
      ? recurso.nombre
      : `${recurso.nombre}.pdf`;

    const { data, error } = await supabase.storage
      .from('biblioteca')
      .createSignedUrl(objectPath, 60, { download: downloadName });

    if (error || !data?.signedUrl) {
      toast({
        variant: 'destructive',
        title: 'No pudimos generar la descarga segura',
        description: 'Intenta nuevamente en unos segundos.',
        duration: 3000,
      });
      return;
    }

    const resourceType = recurso.tipo?.includes('preguntero')
      ? 'Preguntero'
      : recurso.tipo?.toLowerCase().includes('tp')
        ? 'TP'
        : 'Recurso';

    pushRecentResource({
      id: recurso.id,
      title: recurso.nombre,
      subjectId: id,
      subjectName: nombreMateria,
      type: resourceType,
      href: data.signedUrl,
      openedAt: new Date().toISOString(),
    });
    pushActivityHit();

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  let tituloParcial = tipo === 'primer-parcial' ? 'Resumen Primer Parcial' : 'Resumen Segundo Parcial';
  if (tipo === 'preguntero-p1') {
    tituloParcial = 'Pregunteros: Primer Parcial';
  } else if (tipo === 'preguntero-p2') {
    tituloParcial = 'Pregunteros: Segundo Parcial';
  } else if (tipo === 'tp-p1') {
    tituloParcial = 'Trabajos Practicos: Parcial 1';
  } else if (tipo === 'tp-p2') {
    tituloParcial = 'Trabajos Practicos: Parcial 2';
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-center gap-4">
          <button
            className="-ml-2 flex items-center gap-2 rounded-lg p-2 text-lg font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-800"
            onClick={() => window.history.back()}
          >
            Volver
          </button>
          <div className="flex-1">
            <h1 className="mb-2 text-4xl leading-tight font-black text-slate-900 md:text-5xl">{tituloParcial}</h1>
          </div>
        </div>

        <div className="mb-16 h-8"></div>

        <section className="mb-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Mas recientes</h2>
            <div className="flex gap-2 text-slate-400">
              <span
                className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Anterior"
                onClick={() => handleScroll(scrollRefRecientes, 'left')}
              >
                {'<'}
              </span>
              <span
                className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Siguiente"
                onClick={() => handleScroll(scrollRefRecientes, 'right')}
              >
                {'>'}
              </span>
            </div>
          </div>

          <div
            ref={scrollRefRecientes}
            className="-ms-4 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {loading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="w-72 flex-shrink-0 snap-center">
                  <div className="animate-pulse flex h-[420px] flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="relative mb-4 aspect-[3/4] flex-1 overflow-hidden rounded-xl bg-slate-100"></div>
                    <div className="mb-2 h-4 w-3/4 rounded bg-slate-100"></div>
                    <div className="h-3 w-1/2 rounded bg-slate-50"></div>
                  </div>
                </div>
              ))
            ) : recursosRecientes.length > 0 ? (
              recursosRecientes.map((recurso) => (
                <div key={recurso.id} className="w-72 flex-shrink-0 snap-center transition-all hover:scale-[1.02]">
                  <div className="flex h-[420px] flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
                    <div className="relative mb-4 aspect-[3/4] flex-1 overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-slate-100">
                      <div className="absolute right-2 bottom-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm">
                        {(recurso.tipo ?? '').includes('preguntero') ? 'Preguntero' : 'Resumen'}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="mb-2 line-clamp-2 text-lg leading-tight font-bold text-blue-600" title={recurso.nombre}>
                      {recurso.nombre}
                    </h3>
                    <p className="mb-4 text-sm text-slate-500">
                      {recurso.creado_at ? new Date(recurso.creado_at).toLocaleDateString() : 'Sin fecha'}
                    </p>

                    <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      100%
                    </div>

                    {recurso.url_archivo ? (
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void (async () => {
                              if (!recurso.url_archivo) return;
                              const resourceType = recurso.tipo?.includes('preguntero')
                                ? 'Preguntero'
                                : recurso.tipo?.toLowerCase().includes('tp')
                                  ? 'TP'
                                  : 'Recurso';
                              const viewerUrl = await getPdfViewerUrl(recurso.url_archivo);
                              if (!viewerUrl) {
                                toast({
                                  variant: 'destructive',
                                  title: 'No pudimos abrir el visor',
                                  description: 'Intenta nuevamente en unos segundos.',
                                  duration: 2800,
                                });
                                return;
                              }

                              setViewerDocument({ title: recurso.nombre, url: viewerUrl });
                              pushRecentResource({
                                id: recurso.id,
                                title: recurso.nombre,
                                subjectId: id,
                                subjectName: nombreMateria,
                                type: resourceType,
                                href: viewerUrl,
                                openedAt: new Date().toISOString(),
                              });
                              pushActivityHit();
                            })();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSecureDownload(recurso)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F5DFF] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4050f0]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Descargar
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                No hay recursos recientes disponibles
              </div>
            )}
          </div>
        </section>
      </div>

      <Dialog open={Boolean(viewerDocument)} onOpenChange={(open) => !open && setViewerDocument(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-4">
            <DialogTitle className="truncate text-xl font-bold text-slate-900">
              {viewerDocument?.title || 'Vista previa del PDF'}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[75vh] bg-slate-100">
            {viewerDocument?.url ? (
              <PdfViewer
                url={viewerDocument.url}
                title={viewerDocument.title}
                className="h-full rounded-none border-0"
                heightClassName="h-[75vh]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No pudimos cargar la vista previa del documento.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando...</div>}>
      <RecursoContent />
    </Suspense>
  );
}
