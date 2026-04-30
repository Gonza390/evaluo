'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/use-toast';
import { getCareerRoute, getResourceRoute, getUniversityRoute } from '@/lib/routes';
import { getDashboardState, saveDashboardState } from '@/app/actions';
import { pushActivityHit, pushRecentResource } from '@/lib/dashboard-client';
import {
  fetchMateriaRecursos,
  fetchResourceVoteSummaries,
  getDefaultResourceVoteSummary,
  sortResourcesByVotes,
  upsertResourceVote,
  type ResourceVoteSummaryMap,
} from '@/lib/data/resources';
import {
  ArrowLeft,
  FileText,
  Star,
  BookOpen,
  Clock,
  ChevronRight,
  Users,
  Search,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Trophy,
  Crown,
  Zap,
  Eye,
  Download,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  buildResumenKey,
  getMateriaContextErrorMessage,
  getMateriaHeroImage,
  getModuleNumber,
  getRecursosErrorMessage,
  getResumenesErrorMessage,
  getResumenRating,
  isLongMateriaTitle,
  type RecursoArchivo,
  type RecursoResumenRow,
  type Resumen,
  scoreResumenCompleteness,
  unidades,
} from './materia-content.helpers';
import { MateriaSectionState } from './materia-section-state';

interface MateriaContentProps {
  materiaId: string;
  materiaNombre?: string;
  carreraId?: string;
  carreraNombre?: string;
  universidadId?: string;
  universidadNombre?: string;
}


export default function MateriaContent({
  materiaId,
  materiaNombre,
  carreraId,
  carreraNombre: initialCarreraNombre,
  universidadId,
  universidadNombre: initialUniversidadNombre,
}: MateriaContentProps) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncedDashboardRef = useRef<string | null>(null);

  const [nombre, setNombre] = useState(materiaNombre || 'Cargando...');
  const [carreraNombre, setCarreraNombre] = useState(initialCarreraNombre || '');
  const [universidadNombre, setUniversidadNombre] = useState(initialUniversidadNombre || '');
  const [cargaHoraria] = useState(6);
  const [modalidad] = useState('Obligatoria');
  const [activeTab, setActiveTab] = useState<'resumenes' | 'trabajos' | 'pregunteros'>('resumenes');
  const [activeUnidad, setActiveUnidad] = useState('1');
  const [sortBy] = useState<'recientes' | 'favoritos'>('recientes');
  const [resumenes, setResumenes] = useState<Resumen[]>([]);
  const [resumenesLoading, setResumenesLoading] = useState(false);
  const [recursosPdf, setRecursosPdf] = useState<RecursoArchivo[]>([]);
  const [recursosLoading, setRecursosLoading] = useState(false);
  const [isUserLogged, setIsUserLogged] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [voteLoading, setVoteLoading] = useState<string>('');
  const [resourceVoteLoading, setResourceVoteLoading] = useState<string>('');
  const [resourceVotes, setResourceVotes] = useState<ResourceVoteSummaryMap>({});
  const [resumenesError, setResumenesError] = useState<string | null>(null);
  const [recursosError, setRecursosError] = useState<string | null>(null);
  const isLongTitle = isLongMateriaTitle(nombre);
  const heroImage = getMateriaHeroImage(nombre);

  const loadResumenes = useCallback(async () => {
    setResumenesLoading(true);
    setResumenesError(null);
    try {
      let query = supabase
        .from('resumenes')
        .select('*')
        .eq('materia_id', materiaId)
        .eq('module_id', Number(activeUnidad));

      query =
        sortBy === 'favoritos'
          ? query.order('score', { ascending: false })
          : query.order('created_at', { ascending: false });

      const [{ data, error }, recursosResult] = await Promise.all([
        query.limit(12),
        supabase
          .from('recursos')
          .select('id, nombre, url_archivo, creado_at, etiqueta, paginas')
          .eq('materia_id', materiaId)
          .eq('tipo', 'resumen-modulo'),
      ]);

      if (error) {
        console.error('Load resumenes error:', error);
      }

      if (recursosResult.error) {
        console.error('Load recursos resumen error:', recursosResult.error);
      }

      const recursoResumenes = (recursosResult.data ?? [])
        .filter((recurso: RecursoResumenRow) => {
          const moduleNumber = recurso.etiqueta ? getModuleNumber(recurso.etiqueta) : null;
          return String(moduleNumber ?? '') === activeUnidad;
        })
        .map(
          (recurso: RecursoResumenRow): Resumen => ({
            id: `recurso-${recurso.id}`,
            title: recurso.nombre,
            author_name: 'Biblioteca Evaluo',
            file_url: recurso.url_archivo,
            module_id: activeUnidad,
            score: 100,
            created_at: recurso.creado_at,
            pages: recurso.paginas,
          })
        );

      const dedupedResumenes = new Map<string, Resumen>();

      for (const resumen of [...(data ?? []), ...recursoResumenes]) {
        const key = buildResumenKey(resumen);
        const existing = dedupedResumenes.get(key);

        if (!existing || scoreResumenCompleteness(resumen) > scoreResumenCompleteness(existing)) {
          dedupedResumenes.set(key, resumen);
        }
      }

      const mergedResumenes = Array.from(dedupedResumenes.values());
      const resumenesWithFile = mergedResumenes.filter((resumen) => Boolean(resumen.file_url));

      if (!authUser) {
        setResumenes(mergedResumenes);
        return;
      }

      const existingChecks = await Promise.all(
        resumenesWithFile.map(async (resumen) => ({
          resumen,
          exists: await checkResourceExists(resumen.file_url!),
        }))
      );

      const validResumenes = mergedResumenes.filter((resumen) => {
        if (!resumen.file_url) return true;
        const match = existingChecks.find((item) => item.resumen.id === resumen.id);
        return match?.exists ?? false;
      });

      setResumenes(validResumenes);
    } catch (error) {
      console.error('Load resumenes error:', error);
      setResumenes([]);
      setResumenesError(getResumenesErrorMessage());
    } finally {
      setResumenesLoading(false);
    }
  }, [activeUnidad, authUser, materiaId, sortBy]);

  const loadFavoriteStatus = async () => {
    if (!authUser) return;
    try {
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('materia_id', materiaId)
        .maybeSingle();
      setIsFavorite(Boolean(data));
    } catch (error) {
      console.error('Favorite status error:', error);
    }
  };

  const toggleFavorite = async () => {
    if (favoritesLoading) return;

    if (!authUser) {
      toast({
        title: 'Inicia sesion para guardar favoritos',
        description: 'Te llevamos al login para guardar esta materia.',
        duration: 2500,
      });
      router.push('/login');
      return;
    }

    const nextValue = !isFavorite;
    setIsFavorite(nextValue);
    setFavoritesLoading(true);

    try {
      if (nextValue) {
        await supabase.from('user_favorites').insert({ user_id: authUser.id, materia_id: materiaId });
        toast({
          title: 'Materia guardada',
          description: 'La agregamos a tus favoritos.',
          duration: 2500,
        });
      } else {
        await supabase.from('user_favorites').delete().eq('user_id', authUser.id).eq('materia_id', materiaId);
        toast({
          title: 'Materia removida',
          description: 'Ya no aparece en tus favoritos.',
          duration: 2500,
        });
      }
    } catch (error) {
      setIsFavorite(!nextValue);
      console.error('Favorite toggle error:', error);
      toast({
        variant: 'destructive',
        title: 'No pudimos guardar el favorito',
        description: 'Intentalo nuevamente en unos segundos.',
        duration: 3000,
      });
    } finally {
      setFavoritesLoading(false);
    }
  };

  const voteResumen = async (resumenId: string, voteType: 1 | -1) => {
    if (!authUser) return;

    setVoteLoading(resumenId);
    try {
      await supabase
        .from('resumen_votes')
        .upsert({ user_id: authUser.id, resumen_id: resumenId, vote_type: voteType });
      await loadResumenes();
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setVoteLoading('');
    }
  };

  const loadRecursosPdf = useCallback(async () => {
    setRecursosLoading(true);
    setRecursosError(null);
    try {
      const resources = (await fetchMateriaRecursos(supabase, materiaId)).filter((resource) => {
        const tipo = (resource.tipo ?? '').toLowerCase();
        return tipo.includes('pdf') || tipo.includes('preguntero') || tipo.includes('tp');
      });

      if (!authUser) {
        setRecursosPdf(resources);
        return;
      }

      const checkedResources = await Promise.all(
        resources.map(async (resource) => ({
          resource,
          exists: resource.url_archivo ? await checkResourceExists(resource.url_archivo) : false,
        }))
      );

      setRecursosPdf(checkedResources.filter((item) => item.exists).map((item) => item.resource));
    } catch (error) {
      console.error('Load recursos error:', error);
      setRecursosPdf([]);
      setRecursosError(getRecursosErrorMessage());
    } finally {
      setRecursosLoading(false);
    }
  }, [authUser, materiaId]);

  const loadResourceVotes = useCallback(
    async (resourceIds: string[]) => {
      if (resourceIds.length === 0) {
        setResourceVotes({});
        return;
      }

      try {
        const summaries = await fetchResourceVoteSummaries(supabase, resourceIds, authUser?.id);
        setResourceVotes(summaries);
      } catch (error) {
        console.error('Load resource votes error:', error);
      }
    },
    [authUser?.id]
  );

  useEffect(() => {
    const initData = async () => {
      setContextError(null);
      if (authUser) {
        setIsUserLogged(true);
        await loadFavoriteStatus();
      } else {
        setIsUserLogged(false);
        setIsFavorite(false);
      }

      try {
        if (!materiaNombre) {
          const { data: materiaData, error: materiaError } = await supabase
            .from('materias')
            .select('nombre, carrera_id')
            .eq('id', materiaId)
            .single();

          if (materiaError) throw materiaError;

          if (materiaData) {
            setNombre(materiaData.nombre || 'Materia');

            const targetCarreraId = carreraId ?? materiaData.carrera_id ?? null;
            if (!initialCarreraNombre && targetCarreraId) {
              const { data: carreraData, error: carreraError } = await supabase
                .from('carreras')
                .select('nombre, universidad_id')
                .eq('id', targetCarreraId)
                .single();

              if (carreraError) throw carreraError;

              if (carreraData) {
                setCarreraNombre(carreraData.nombre || '');

                const targetUniversidadId = universidadId ?? carreraData.universidad_id ?? null;
                if (!initialUniversidadNombre && targetUniversidadId) {
                  const { data: universidadData, error: universidadError } = await supabase
                    .from('universidades')
                    .select('nombre')
                    .eq('id', targetUniversidadId)
                    .single();

                  if (universidadError) throw universidadError;
                  if (universidadData?.nombre) {
                    setUniversidadNombre(universidadData.nombre);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Init materia context error:', error);
        setContextError(getMateriaContextErrorMessage());
      } finally {
        setLoading(false);
      }
    };

    void initData();
  }, [authUser, carreraId, initialCarreraNombre, initialUniversidadNombre, materiaId, materiaNombre, universidadId]);

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery === 'resumenes' || tabFromQuery === 'trabajos' || tabFromQuery === 'pregunteros') {
      setActiveTab(tabFromQuery);
    }

    const moduleFromQuery = searchParams.get('modulo');
    if (moduleFromQuery && ['1', '2', '3', '4'].includes(moduleFromQuery)) {
      setActiveUnidad(moduleFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'resumenes') {
      void loadResumenes();
    }
  }, [activeTab, loadResumenes]);

  useEffect(() => {
    if (activeTab === 'pregunteros') {
      void loadRecursosPdf();
    }
  }, [activeTab, loadRecursosPdf]);

  useEffect(() => {
    const resourceResumenIds = resumenes
      .filter((resumen) => resumen.id.startsWith('recurso-'))
      .map((resumen) => resumen.id.replace('recurso-', ''));
    const recursoIds = recursosPdf.map((resource) => resource.id);
    const allIds = Array.from(new Set([...resourceResumenIds, ...recursoIds]));
    void loadResourceVotes(allIds);
  }, [loadResourceVotes, recursosPdf, resumenes]);

  useEffect(() => {
    async function syncDashboardSubject() {
      if (!authUser || !materiaId || !nombre || nombre === 'Cargando...') {
        return;
      }

      const syncKey = `${authUser.id}:${materiaId}:${nombre}`;
      if (syncedDashboardRef.current === syncKey) {
        return;
      }

      syncedDashboardRef.current = syncKey;

      const currentSubject = { id: materiaId, name: nombre };
      const currentState = await getDashboardState();
      const nextState = {
        ...currentState,
        lastSubject: currentSubject,
        activeSubjects: [
          currentSubject,
          ...currentState.activeSubjects.filter((subject) => subject.id !== materiaId),
        ].slice(0, 6),
        analytics: {
          ...currentState.analytics,
          lastUpdatedAt: new Date().toISOString(),
        },
      };

      pushActivityHit(nextState.analytics.lastUpdatedAt ?? new Date().toISOString());
      await saveDashboardState(nextState);
    }

    void syncDashboardSubject();
  }, [authUser, materiaId, nombre]);

  const resumenesFiltrados = useMemo(
    () =>
      [...resumenes]
        .filter((resumen) => resumen.title.toLowerCase().includes(busqueda.toLowerCase()))
        .sort((a, b) => {
          const aResourceId = a.id.startsWith('recurso-') ? a.id.replace('recurso-', '') : null;
          const bResourceId = b.id.startsWith('recurso-') ? b.id.replace('recurso-', '') : null;
          const aScore = aResourceId ? (resourceVotes[aResourceId]?.score ?? 0) : (a.score ?? 0);
          const bScore = bResourceId ? (resourceVotes[bResourceId]?.score ?? 0) : (b.score ?? 0);
          if (bScore !== aScore) return bScore - aScore;
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        }),
    [busqueda, resourceVotes, resumenes]
  );
  const recursosFiltrados = useMemo(
    () =>
      sortResourcesByVotes(
        recursosPdf.filter(
          (recurso) =>
            recurso.materia_id === materiaId &&
            Boolean(recurso.url_archivo) &&
            (activeTab === 'trabajos'
              ? (recurso.tipo ?? '').toLowerCase().includes('tp')
              : (recurso.tipo ?? '').toLowerCase().includes('preguntero'))
        ),
        resourceVotes
      ),
    [activeTab, materiaId, recursosPdf, resourceVotes]
  );

  const voteResource = async (resourceId: string, voteType: 1 | -1) => {
    if (!authUser) return;

    setResourceVoteLoading(resourceId);
    try {
      await upsertResourceVote(supabase, {
        userId: authUser.id,
        resourceId,
        voteType,
      });
      await loadResourceVotes([resourceId, ...Object.keys(resourceVotes)]);
    } catch (error) {
      console.error('Resource vote error:', error);
      toast({
        variant: 'destructive',
        title: 'No pudimos guardar tu voto',
        description: 'Intentá nuevamente en unos segundos.',
        duration: 3000,
      });
    } finally {
      setResourceVoteLoading('');
    }
  };

  const getRecursoPublicUrl = (resourcePath: string) => {
    if (/^https?:\/\//i.test(resourcePath)) {
      return resourcePath;
    }

    const { data } = supabase.storage.from('biblioteca').getPublicUrl(resourcePath);
    return data.publicUrl;
  };

  const checkResourceExists = async (resourcePath: string) => {
    const response = await fetch('/api/pdf-view-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: resourcePath }),
    });

    return response.ok;
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

  const handleSecureDownload = async (recurso: RecursoArchivo) => {
    if (!recurso.url_archivo) {
      toast({
        variant: 'destructive',
        title: 'No pudimos preparar la descarga',
        description: 'El recurso no tiene archivo asociado.',
        duration: 3000,
      });
      return;
    }

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

    pushRecentResource({
      id: recurso.id,
      title: recurso.nombre,
      subjectId: materiaId,
      subjectName: nombre,
      type: (recurso.tipo ?? '').toLowerCase().includes('tp') ? 'TP' : 'Preguntero',
      href: data.signedUrl,
      openedAt: new Date().toISOString(),
    });
    pushActivityHit();

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600">Preparando materia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <div className="w-full border-b border-[#E8EDF5] bg-[#F8FAFC]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center px-4 py-3 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm leading-6">
            <Link
              href="/explorar"
              className="flex items-center gap-1 text-slate-500 transition-colors hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Universidades</span>
            </Link>
            {universidadNombre ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <Link
                  href={universidadId ? getUniversityRoute(universidadId) : '/explorar'}
                  className="max-w-[140px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:max-w-none"
                >
                  {universidadNombre}
                </Link>
              </>
            ) : null}
            {carreraNombre ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <Link
                  href={carreraId ? getCareerRoute(carreraId) : '/materias'}
                  className="max-w-[160px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:max-w-none"
                >
                  {carreraNombre}
                </Link>
              </>
            ) : null}
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="max-w-[190px] truncate font-medium text-slate-700 sm:max-w-none">
              {nombre}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative min-h-[300px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div
          className="absolute inset-0 hidden h-full w-full bg-cover bg-center lg:block"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#0F172A_0%,#0F172A_28%,rgba(15,23,42,0.94)_42%,rgba(15,23,42,0.76)_56%,rgba(15,23,42,0.42)_70%,rgba(15,23,42,0.16)_84%,rgba(15,23,42,0.04)_100%)] lg:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.18),transparent_24%)] lg:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0F172A]/32 via-transparent to-[#0F172A]/10 lg:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/88 to-[#1E293B]/55 lg:hidden" />

        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-6 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/5 sm:h-24 sm:w-24">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/20 text-white sm:h-[80px] sm:w-[80px]">
                  <GraduationCap className="h-8 w-8 sm:h-9 sm:w-9" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/70">Materia</p>
                <h1
                  className={`tracking-[-0.05em] text-white drop-shadow-lg ${
                    isLongTitle ? 'text-[24px] font-bold leading-tight sm:text-[34px]' : 'text-[28px] font-bold leading-tight sm:text-[42px]'
                  }`}
                >
                  {nombre}
                </h1>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/80 sm:gap-6">
                  {carreraNombre ? (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span>{carreraNombre}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{cargaHoraria} horas semanales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{modalidad}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <button
                onClick={toggleFavorite}
                disabled={favoritesLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 disabled:opacity-60 sm:w-auto"
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current text-yellow-400' : ''}`} />
                {isFavorite ? 'Guardada' : 'Guardar'}
              </button>
              <Link
                href={`/explorar/materia/${materiaId}?tab=pregunteros${carreraId ? `&carreraId=${carreraId}` : ''}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F5DFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4050f0] sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                Ir a Pregunteros
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-3 gap-2 py-3 sm:flex sm:gap-6 sm:py-0">
            {[
              { id: 'resumenes', label: 'Resumenes' },
              { id: 'trabajos', label: 'Trabajos practicos' },
              { id: 'pregunteros', label: 'Pregunteros' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:rounded-none sm:px-0 sm:py-4 sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-[#EEF2FF] text-[#4F5DFF] sm:bg-transparent sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#4F5DFF] sm:after:content-[""]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {contextError ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {contextError}
          </div>
        ) : null}
        {activeTab === 'resumenes' ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Biblioteca de resumenes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Material curado por modulo para estudiar con mas claridad.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar resumen..."
                    className="h-10 w-full rounded-full border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#4F5DFF] focus:outline-none focus:ring-2 focus:ring-[#4F5DFF]/20 sm:w-72"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {unidades.map((unidad) => (
                <button
                  key={unidad.id}
                  onClick={() => setActiveUnidad(String(unidad.id))}
                  className={`rounded-2xl border p-4 text-left transition ${activeUnidad === String(unidad.id) ? 'border-[#4F5DFF] bg-[#EEF2FF]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <p className="text-sm font-semibold text-slate-900">{unidad.nombre}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{unidad.descripcion}</p>
                  <p className="mt-3 text-xs font-medium text-[#4F5DFF]">
                    {unidad.resumenesCount} resumenes estimados
                  </p>
                </button>
              ))}
            </div>

            {resumenesLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                Estamos preparando tus resúmenes...
              </div>
            ) : resumenesError ? (
              <MateriaSectionState
                icon={FileText}
                title="No pudimos cargar este módulo"
                description={resumenesError}
                tone="warning"
                actionLabel="Reintentar carga"
                onAction={() => void loadResumenes()}
              />
            ) : resumenesFiltrados.length === 0 ? (
              <MateriaSectionState
                icon={FileText}
                title="Todavía no hay resúmenes para este módulo"
                description="Probá con otro módulo o volvé más tarde cuando terminemos de publicar este contenido."
              />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {resumenesFiltrados.map((resumen) => {
                  const resumenUrl = resumen.file_url ? getRecursoPublicUrl(resumen.file_url) : null;
                  const resourceId = resumen.id.startsWith('recurso-')
                    ? resumen.id.replace('recurso-', '')
                    : null;
                  const resourceVoteSummary = resourceId
                    ? (resourceVotes[resourceId] ?? getDefaultResourceVoteSummary())
                    : null;

                  return (
                    <article
                      key={resumen.id}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                    >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">{resumen.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {resumen.author_name || 'Autor no especificado'}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {getResumenRating(resumen.score).map((filled, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${filled ? 'fill-current text-yellow-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      {resumen.pages ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4" />
                          <span>{resumen.pages} paginas</span>
                        </div>
                      ) : null}
                      {resumen.created_at ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(resumen.created_at).toLocaleDateString('es-AR')}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {resumenUrl ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const resourceId = resumen.id.startsWith('recurso-')
                                ? resumen.id.replace('recurso-', '')
                                : undefined;
                              const baseRoute = getResourceRoute(
                                materiaId,
                                'resumen-modulo',
                                nombre,
                                resourceId
                              );
                              const separator = baseRoute.includes('?') ? '&' : '?';
                              router.push(`${baseRoute}${separator}modulo=${activeUnidad}`);
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            Leer
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const storagePath = resumen.file_url;
                              if (!storagePath) {
                                return;
                              }

                              await handleSecureDownload({
                                id: resumen.id,
                                nombre: resumen.title,
                                tipo: 'resumen',
                                url_archivo: storagePath,
                                creado_at: resumen.created_at,
                                materia_id: materiaId,
                              });
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#4F5DFF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4050f0]"
                          >
                            <Download className="h-4 w-4" />
                            Descargar
                          </button>
                        </>
                      ) : null}

                      {isUserLogged ? (
                        <div className="ml-auto flex items-center gap-2">
                          {resourceVoteSummary ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              {resourceVoteSummary.score >= 0 ? '+' : ''}
                              {resourceVoteSummary.score} ranking
                            </span>
                          ) : null}
                          <button
                            onClick={() =>
                              resourceId ? void voteResource(resourceId, 1) : void voteResumen(resumen.id, 1)
                            }
                            disabled={voteLoading === resumen.id || resourceVoteLoading === resourceId}
                            className={`rounded-full border p-2 transition disabled:opacity-60 ${
                              resourceVoteSummary?.userVote === 1
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                                : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              resourceId ? void voteResource(resourceId, -1) : void voteResumen(resumen.id, -1)
                            }
                            disabled={voteLoading === resumen.id || resourceVoteLoading === resourceId}
                            className={`rounded-full border p-2 transition disabled:opacity-60 ${
                              resourceVoteSummary?.userVote === -1
                                ? 'border-rose-300 bg-rose-50 text-rose-600'
                                : 'border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600'
                            }`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'pregunteros' || activeTab === 'trabajos' ? (
          <div className="space-y-8">
            {activeTab === 'pregunteros' ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[
                  { parcial: 1, titulo: 'Parcial 1', icon: Zap },
                  { parcial: 2, titulo: 'Parcial 2', icon: Trophy },
                  { parcial: 1, titulo: 'Premium Parcial 1 (50 preguntas)', icon: Crown, premium: true },
                  { parcial: 2, titulo: 'Premium Parcial 2 (50 preguntas)', icon: Crown, premium: true },
                ].map((simulador) => {
                  const Icon = simulador.icon;
                  return (
                    <article
                      key={`${simulador.parcial}-${simulador.titulo}`}
                      className={
                        simulador.premium
                          ? 'rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-indigo-50 p-6 shadow-[0_12px_36px_rgba(99,102,241,0.18)]'
                          : 'rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]'
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Simulador</p>
                          <h3 className="mt-1 text-2xl font-bold text-slate-900">{simulador.titulo}</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {simulador.premium
                              ? 'Basado en ultimos examenes validados. Acceso exclusivo para usuarios premium.'
                              : '30 preguntas al azar de la materia actual para entrenar examen real.'}
                          </p>
                          {simulador.premium ? (
                            <span className="mt-3 inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                              Solo Premium
                            </span>
                          ) : null}
                        </div>
                        <div
                          className={
                            simulador.premium
                              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-indigo-100 text-amber-700'
                              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600'
                          }
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <Link
                        href={
                          simulador.premium
                            ? `/simulador/premium/${materiaId}/${simulador.parcial}`
                            : `/simulador/${materiaId}/${simulador.parcial}`
                        }
                        className={
                          simulador.premium
                            ? 'mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-violet-700'
                            : 'mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4F5DFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4050f0]'
                        }
                      >
                        {simulador.premium ? 'Iniciar Simulador Premium' : 'Iniciar Simulador Aleatorio'}
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : null}

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {activeTab === 'trabajos' ? 'Trabajos prácticos PDF' : 'Modelos de examen y pregunteros PDF'}
              </h2>

              {recursosLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                  Estamos reuniendo los pregunteros disponibles...
                </div>
              ) : recursosError ? (
                <MateriaSectionState
                  icon={FileText}
                  title={activeTab === 'trabajos' ? 'No pudimos cargar los trabajos prácticos' : 'No pudimos cargar los pregunteros'}
                  description={recursosError}
                  tone="warning"
                  actionLabel="Reintentar carga"
                  onAction={() => void loadRecursosPdf()}
                />
              ) : recursosFiltrados.length === 0 ? (
                <MateriaSectionState
                  icon={FileText}
                  title={activeTab === 'trabajos' ? 'Todavía no hay trabajos prácticos publicados' : 'Todavía no hay pregunteros publicados'}
                  description={
                    activeTab === 'trabajos'
                      ? 'Cuando publiquemos trabajos prácticos para esta materia, los vas a ver acá.'
                      : 'Cuando publiquemos material nuevo para esta materia, lo vas a ver acá.'
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {recursosFiltrados.map((recurso) => {
                    const voteSummary = resourceVotes[recurso.id] ?? getDefaultResourceVoteSummary();
                    return (
                      <article
                        key={recurso.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 shrink-0 text-rose-600" />
                            <p className="truncate text-sm font-semibold text-slate-900">{recurso.nombre}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <div className="hidden items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 md:inline-flex">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{voteSummary.likes}</span>
                            <ThumbsDown className="ml-1 h-3 w-3" />
                            <span>{voteSummary.dislikes}</span>
                          </div>
                          {isUserLogged ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void voteResource(recurso.id, 1)}
                                disabled={resourceVoteLoading === recurso.id}
                                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                                  voteSummary.userVote === 1
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                                    : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
                                }`}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void voteResource(recurso.id, -1)}
                                disabled={resourceVoteLoading === recurso.id}
                                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                                  voteSummary.userVote === -1
                                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                                    : 'border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'
                                }`}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              const tipoRuta = recurso.tipo ?? (activeTab === 'trabajos' ? 'tp-p1' : 'preguntero-p1');
                              router.push(getResourceRoute(materiaId, tipoRuta, nombre, recurso.id));
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Leer
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
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

