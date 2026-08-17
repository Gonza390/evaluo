'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/use-toast';
import {
  getCareerRoute,
  getMateriaRoute,
  getResourceRoute,
  getStudentMaterialRoute,
  getUniversityRoute,
} from '@/lib/routes';
import { getDashboardState, saveDashboardState } from '@/lib/actions/dashboard';
import {
  getSimulatorRatingsSummaryByMateria,
  getSimulatorUsageSummaryByMateria,
  type SimulatorRatingSummary,
  type SimulatorUsageSummary,
} from '@/lib/actions/simulador';
import { pushActivityHit, pushRecentResource } from '@/lib/dashboard-client';
import {
  fetchSharedStudentMaterialsByMateria,
  type StudentMaterial,
} from '@/lib/data/student-materials';
import { PdfCardThumbnail } from '@/components/materia/pdf-card-thumbnail';
import {
  fetchMateriaRecursos,
  fetchResourceVoteSummaries,
  getDefaultResourceVoteSummary,
  sortResourcesByVotes,
  upsertResourceVote,
  type ResourceVoteSummaryMap,
} from '@/lib/data/resources';
import { trackMateriaAnalyticsEvent } from '@/lib/materia-analytics';
import { logError } from '@/lib/observability';
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
  Zap,
  Eye,
  Download,
  Share2,
} from 'lucide-react';
import {
  buildResumenKey,
  formatResumenModulesLabel,
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
  initialContextError?: string | null;
  initialResumenes?: Resumen[];
  initialResumenesError?: string | null;
  initialSimulatorRatings?: Record<number, SimulatorRatingSummary>;
  initialSimulatorUsage?: Record<number, SimulatorUsageSummary>;
}

function getSeededRating(materiaId: string, parcial: number) {
  const seed = `${materiaId}:${parcial}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const normalized = (hash % 1000) / 1000;
  return Number((4.2 + normalized * 0.7).toFixed(1));
}

function getDisplayRating(
  materiaId: string,
  parcial: number,
  rating?: SimulatorRatingSummary
) {
  if (!rating || rating.total < 10) {
    const fallbackReviews = 10;
    return {
      value: getSeededRating(materiaId, parcial),
      reviews: fallbackReviews,
      estimated: true,
    };
  }

  const realValue = Number((1 + (rating.likes / Math.max(1, rating.total)) * 4).toFixed(1));
  return {
    value: realValue,
    reviews: rating.total,
    estimated: false,
  };
}

function getResourceCardDescription(recurso: RecursoArchivo) {
  const tipo = (recurso.tipo ?? '').toLowerCase();

  if (tipo.includes('tp')) {
    return 'Trabajo práctico publicado para esta materia.';
  }

  if (tipo.includes('preguntero')) {
    return 'Preguntero listo para practicar y repasar.';
  }

  return 'Archivo publicado dentro de esta materia.';
}

export default function MateriaContent({
  materiaId,
  materiaNombre,
  carreraId,
  carreraNombre: initialCarreraNombre,
  universidadId,
  universidadNombre: initialUniversidadNombre,
  initialContextError = null,
  initialResumenes = [],
  initialResumenesError = null,
  initialSimulatorRatings = {},
  initialSimulatorUsage = {},
}: MateriaContentProps) {
  const { user: authUser, loading: authLoading, isAuthenticated } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncedDashboardRef = useRef<string | null>(null);
  const skipInitialResumenesRef = useRef(initialResumenes.length > 0 || Boolean(initialResumenesError));
  const skipInitialSimulatorMetricsRef = useRef(
    Object.keys(initialSimulatorRatings).length > 0 || Object.keys(initialSimulatorUsage).length > 0
  );

  const nombre = materiaNombre || 'Materia';
  const carreraNombre = initialCarreraNombre || '';
  const universidadNombre = initialUniversidadNombre || '';
  const [activeTab, setActiveTab] = useState<'resumenes' | 'trabajos' | 'pregunteros'>('resumenes');
  const [activeUnidad, setActiveUnidad] = useState('1');
  const [sortBy] = useState<'recientes' | 'favoritos'>('recientes');
  const [resumenes, setResumenes] = useState<Resumen[]>(initialResumenes);
  const [resumenesLoading, setResumenesLoading] = useState(false);
  const [recursosPdf, setRecursosPdf] = useState<RecursoArchivo[]>([]);
  const [sharedStudentMaterials, setSharedStudentMaterials] = useState<StudentMaterial[]>([]);
  const [recursosLoading, setRecursosLoading] = useState(false);
  const [sharedStudentMaterialsLoading, setSharedStudentMaterialsLoading] = useState(false);
  const [isUserLogged, setIsUserLogged] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const contextError = initialContextError;
  const [busqueda, setBusqueda] = useState('');
  const [voteLoading, setVoteLoading] = useState<string>('');
  const [resourceVoteLoading, setResourceVoteLoading] = useState<string>('');
  const [resourceVotes, setResourceVotes] = useState<ResourceVoteSummaryMap>({});
  const [resumenesError, setResumenesError] = useState<string | null>(initialResumenesError);
  const [recursosError, setRecursosError] = useState<string | null>(null);
  const [sharedStudentMaterialsError, setSharedStudentMaterialsError] = useState<string | null>(null);
  const [simulatorRatings, setSimulatorRatings] = useState<Record<number, SimulatorRatingSummary>>(
    initialSimulatorRatings
  );
  const [simulatorUsage, setSimulatorUsage] = useState<Record<number, SimulatorUsageSummary>>(
    initialSimulatorUsage
  );

  const getResumenModuleId = useCallback((resumen: Resumen) => {
    const rawModuleId = resumen.module_id;
    if (typeof rawModuleId === 'number' && Number.isFinite(rawModuleId)) {
      return rawModuleId;
    }

    if (typeof rawModuleId === 'string') {
      const parsed = Number(rawModuleId);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return getModuleNumber(resumen.title) ?? 0;
  }, []);
  const isLongTitle = isLongMateriaTitle(nombre);
  const heroImage = getMateriaHeroImage(nombre);
  const topRatedResource = useMemo(
    () =>
      [...recursosPdf].sort(
        (a, b) =>
          ((resourceVotes[b.id]?.likes ?? 0) - (resourceVotes[b.id]?.dislikes ?? 0)) -
          ((resourceVotes[a.id]?.likes ?? 0) - (resourceVotes[a.id]?.dislikes ?? 0))
      )[0] ?? null,
    [recursosPdf, resourceVotes]
  );
  const handleSharePreguntero = useCallback(
    async (targetParcial: number) => {
      const shareUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/simulador/${materiaId}/${targetParcial}`
          : `/simulador/${materiaId}/${targetParcial}`;
      const shareTitle =
        targetParcial === 3
          ? `Examen Integrador de ${nombre}`
          : `Preguntero Parcial ${targetParcial} de ${nombre}`;
      const shareText =
        targetParcial === 3
          ? `Te comparto el examen integrador de ${nombre} en Evaluo.`
          : `Te comparto el preguntero del Parcial ${targetParcial} de ${nombre} en Evaluo.`;

      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: 'Link copiado',
                        description: 'Ya podés compartir este preguntero.',
          });
        }
    } catch (error) {
      logError('materia.sharePreguntero', error, { materiaId, targetParcial });
      toast({
          title: 'No pudimos compartirlo',
          description: 'Intenta nuevamente en unos segundos.',
          variant: 'destructive',
        });
      }
    },
    [materiaId, nombre, toast]
  );
  const emitMateriaEvent = useCallback(
    async (
      eventName:
        | 'materia_tab_viewed'
        | 'materia_resumen_opened'
        | 'materia_resource_opened'
        | 'materia_simulator_cta_clicked',
      metadata: Record<string, unknown>
    ) => {
      if (typeof window === 'undefined') return;

      await trackMateriaAnalyticsEvent(eventName, {
        userId: authUser?.id ?? null,
        materiaId,
        carreraId,
        universidadId,
        metadata,
      });
    },
    [authUser?.id, carreraId, materiaId, universidadId]
  );
  const loadResumenes = useCallback(async () => {
    setResumenesLoading(true);
    setResumenesError(null);
    try {
      let query = supabase
        .from('resumenes')
        .select('id, title, author_name, file_url, module_id, score, created_at')
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
        logError('materia.loadResumenes.query', error, { materiaId, activeUnidad });
      }

      if (recursosResult.error) {
        logError('materia.loadResumenes.recursos', recursosResult.error, { materiaId, activeUnidad });
      }

      const recursosResumenSource = recursosResult.data ?? [];
      const moduleMap = new Map<string, number[]>();

      for (const recurso of recursosResumenSource) {
        const moduleNumber = recurso.etiqueta ? getModuleNumber(recurso.etiqueta) : null;
        if (!moduleNumber) continue;
        const key = recurso.url_archivo?.trim().toLowerCase() || recurso.nombre.trim().toLowerCase();
        if (!key) continue;
        const currentModules = moduleMap.get(key) ?? [];
        moduleMap.set(key, [...currentModules, moduleNumber]);
      }

      const recursoResumenes = recursosResumenSource
        .filter((recurso: RecursoResumenRow) => {
          const moduleNumber = recurso.etiqueta ? getModuleNumber(recurso.etiqueta) : null;
          return String(moduleNumber ?? '') === activeUnidad;
        })
        .map((recurso: RecursoResumenRow): Resumen => {
          const key = recurso.url_archivo?.trim().toLowerCase() || recurso.nombre.trim().toLowerCase();
          const modulesLabel = formatResumenModulesLabel(moduleMap.get(key) ?? []);

          return {
            id: `recurso-${recurso.id}`,
            title: recurso.nombre,
            author_name: modulesLabel,
              file_url: recurso.url_archivo,
              module_id: activeUnidad,
              score: null,
              created_at: recurso.creado_at,
              pages: recurso.paginas,
            };
        });

      const dedupedResumenes = new Map<string, Resumen>();

      for (const resumen of [...(data ?? []), ...recursoResumenes]) {
        const key = buildResumenKey(resumen);
        const existing = dedupedResumenes.get(key);

        if (!existing || scoreResumenCompleteness(resumen) > scoreResumenCompleteness(existing)) {
          dedupedResumenes.set(key, resumen);
        }
      }

      const mergedResumenes = Array.from(dedupedResumenes.values());
      setResumenes(mergedResumenes);
    } catch (error) {
      logError('materia.loadResumenes', error, { materiaId, activeUnidad });
      setResumenes([]);
      setResumenesError(getResumenesErrorMessage());
    } finally {
      setResumenesLoading(false);
    }
  }, [activeUnidad, materiaId, sortBy]);

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
      logError('materia.loadFavoriteStatus', error, { materiaId });
    }
  };

  const toggleFavorite = async () => {
    if (favoritesLoading) return;

    if (!authUser) {
      toast({
        title: 'Iniciá sesión para guardar favoritos',
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
      logError('materia.toggleFavorite', error, { materiaId, nextValue });
      toast({
        variant: 'destructive',
        title: 'No pudimos guardar el favorito',
        description: 'Inténtalo nuevamente en unos segundos.',
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
      logError('materia.voteResumen', error, { materiaId, resumenId, voteType });
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

      setRecursosPdf(resources);
    } catch (error) {
      logError('materia.loadRecursosPdf', error, { materiaId });
      setRecursosPdf([]);
      setRecursosError(getRecursosErrorMessage());
    } finally {
      setRecursosLoading(false);
    }
  }, [materiaId]);

  const loadSharedStudentMaterials = useCallback(async () => {
    setSharedStudentMaterialsLoading(true);
    setSharedStudentMaterialsError(null);

    try {
      const materials = await fetchSharedStudentMaterialsByMateria(supabase, materiaId, 6);
      setSharedStudentMaterials(materials);
    } catch (error) {
      logError('materia.loadSharedStudentMaterials', error, { materiaId });
      setSharedStudentMaterials([]);
      setSharedStudentMaterialsError(
        'No pudimos cargar los PDFs compartidos por estudiantes en este momento.'
      );
    } finally {
      setSharedStudentMaterialsLoading(false);
    }
  }, [materiaId]);

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
        logError('materia.loadResourceVotes', error, { materiaId, resourceIds });
      }
    },
    [authUser?.id]
  );

  useEffect(() => {
    let active = true;

    async function syncAuthState() {
      if (authUser) {
        if (active) {
          setIsUserLogged(true);
        }
        await loadFavoriteStatus();
        return;
      }

      if (active) {
        setIsUserLogged(false);
        setIsFavorite(false);
      }
    }

    void syncAuthState();

    return () => {
      active = false;
    };
  }, [authUser]);

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

  const handleTabChange = useCallback(
    (nextTab: 'resumenes' | 'trabajos' | 'pregunteros') => {
      setActiveTab(nextTab);
      void emitMateriaEvent('materia_tab_viewed', { tab: nextTab });

      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', nextTab);
      if (carreraId) {
        params.set('carreraId', carreraId);
      }

      const query = params.toString();
      router.replace(query ? `/explorar/materia/${materiaId}?${query}` : `/explorar/materia/${materiaId}`, {
        scroll: false,
      });
    },
    [carreraId, emitMateriaEvent, materiaId, router, searchParams]
  );

  useEffect(() => {
    let mounted = true;

    async function loadSimulatorRatings() {
      if (skipInitialSimulatorMetricsRef.current) {
        skipInitialSimulatorMetricsRef.current = false;
        return;
      }

      const [summary, usage] = await Promise.all([
        getSimulatorRatingsSummaryByMateria(materiaId),
        getSimulatorUsageSummaryByMateria(materiaId),
      ]);
      if (!mounted) return;
      setSimulatorRatings(
        summary.reduce<Record<number, SimulatorRatingSummary>>((acc, item) => {
          acc[item.parcial] = item;
          return acc;
        }, {})
      );
      setSimulatorUsage(
        usage.reduce<Record<number, SimulatorUsageSummary>>((acc, item) => {
          acc[item.parcial] = item;
          return acc;
        }, {})
      );
    }

    void loadSimulatorRatings();

    return () => {
      mounted = false;
    };
  }, [materiaId]);

  useEffect(() => {
    if (activeTab === 'resumenes') {
      if (skipInitialResumenesRef.current && activeUnidad === '1' && sortBy === 'recientes') {
        skipInitialResumenesRef.current = false;
        return;
      }
      void loadResumenes();
    }
  }, [activeTab, loadResumenes]);

  useEffect(() => {
    if (activeTab === 'pregunteros') {
      void loadRecursosPdf();
    }
  }, [activeTab, loadRecursosPdf]);

  useEffect(() => {
    if (activeTab === 'resumenes') {
      void loadSharedStudentMaterials();
    }
  }, [activeTab, loadSharedStudentMaterials]);

  useEffect(() => {
    void emitMateriaEvent('materia_tab_viewed', { tab: activeTab, source: 'state_sync' });
  }, [activeTab, emitMateriaEvent]);

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
        .filter((resumen) => {
          const moduleId = getResumenModuleId(resumen);
          return moduleId === 0 || moduleId === Number(activeUnidad);
        })
        .filter((resumen) => resumen.title.toLowerCase().includes(busqueda.toLowerCase()))
        .sort((a, b) => {
          const aResourceId = a.id.startsWith('recurso-') ? a.id.replace('recurso-', '') : null;
          const bResourceId = b.id.startsWith('recurso-') ? b.id.replace('recurso-', '') : null;
          const aScore = aResourceId ? (resourceVotes[aResourceId]?.score ?? 0) : (a.score ?? 0);
          const bScore = bResourceId ? (resourceVotes[bResourceId]?.score ?? 0) : (b.score ?? 0);
          if (bScore !== aScore) return bScore - aScore;
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        }),
    [activeUnidad, busqueda, getResumenModuleId, resourceVotes, resumenes]
  );
  const resumenesCountByUnidad = useMemo(() => {
    const counts = new Map<number, number>();

    for (const resumen of resumenes) {
      const moduleId = getResumenModuleId(resumen);
      if (moduleId >= 1 && moduleId <= 4) {
        counts.set(moduleId, (counts.get(moduleId) ?? 0) + 1);
      }
    }

    return counts;
  }, [getResumenModuleId, resumenes]);
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

  const renderResumenCards = (className = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3') => (
    <div className={className}>
      {resumenesFiltrados.map((resumen, index) => {
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
              className="surface-card overflow-hidden p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-[22px] bg-[#eef4ff] p-2.5">
                  <PdfCardThumbnail
                    resourcePath={resumen.file_url}
                    title={resumen.title}
                    shouldLoad={index < 2}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[18px] font-semibold tracking-[-0.035em] text-[#2563eb]">
                        {resumen.title}
                      </h3>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {getResumenRating(
                        resumen.score,
                        `${resumen.id}:${resumen.title}:${resumen.file_url ?? ''}`
                      ).map((filled, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${filled ? 'fill-current text-yellow-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    {resumen.created_at ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(resumen.created_at).toLocaleDateString('es-AR')}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                {resumen.author_name || 'Resumen disponible para esta materia.'}
              </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {resumenUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      void emitMateriaEvent('materia_resumen_opened', {
                        tab: activeTab,
                        resumen_id: resumen.id,
                        resumen_title: resumen.title,
                        modulo: activeUnidad,
                        action: 'read',
                      });
                      const nestedResourceId = resumen.id.startsWith('recurso-')
                        ? resumen.id.replace('recurso-', '')
                        : undefined;
                      const baseRoute = getResourceRoute(
                        materiaId,
                        'resumen-modulo',
                        nombre,
                        nestedResourceId
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

                      void emitMateriaEvent('materia_resumen_opened', {
                        tab: activeTab,
                        resumen_id: resumen.id,
                        resumen_title: resumen.title,
                        modulo: activeUnidad,
                        action: 'download',
                      });

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
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
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
  );

  const renderResourceCards = (className = 'grid grid-cols-1 gap-3 md:grid-cols-2') => (
    <div className={className}>
      {recursosFiltrados.map((recurso, index) => {
        const voteSummary = resourceVotes[recurso.id] ?? getDefaultResourceVoteSummary();
        return (
          <article
            key={recurso.id}
            className="surface-card overflow-hidden p-4"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-[22px] bg-[#eef4ff] p-2.5">
                <PdfCardThumbnail
                  resourcePath={recurso.url_archivo}
                  title={recurso.nombre}
                  shouldLoad={index < 2}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[18px] font-semibold tracking-[-0.035em] text-[#2563eb]">
                      {recurso.nombre}
                    </p>
                  </div>
                  <div className="inline-flex items-center justify-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{voteSummary.likes}</span>
                    <ThumbsDown className="ml-1 h-3 w-3" />
                    <span>{voteSummary.dislikes}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              {getResourceCardDescription(recurso)}
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {isUserLogged ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void voteResource(recurso.id, 1)}
                    disabled={resourceVoteLoading === recurso.id}
                    className={`inline-flex flex-1 items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-semibold transition sm:flex-none ${
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
                    className={`inline-flex flex-1 items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-semibold transition sm:flex-none ${
                      voteSummary.userVote === -1
                        ? 'border-rose-300 bg-rose-50 text-rose-600'
                        : 'border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'
                    }`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const tipoRuta = recurso.tipo ?? (activeTab === 'trabajos' ? 'tp-p1' : 'preguntero-p1');
                    void emitMateriaEvent('materia_resource_opened', {
                      tab: activeTab,
                      resource_id: recurso.id,
                      resource_name: recurso.nombre,
                      resource_tipo: tipoRuta,
                      action: 'read',
                    });
                    router.push(getResourceRoute(materiaId, tipoRuta, nombre, recurso.id));
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Leer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void emitMateriaEvent('materia_resource_opened', {
                      tab: activeTab,
                      resource_id: recurso.id,
                      resource_name: recurso.nombre,
                      resource_tipo: recurso.tipo ?? (activeTab === 'trabajos' ? 'tp-p1' : 'preguntero-p1'),
                      action: 'download',
                    });
                    void handleSecureDownload(recurso);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4F5DFF] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4050f0]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
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
      logError('materia.voteResource', error, { resourceId, voteType, materiaId });
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

  const handleShareMateria = async () => {
    const sharePath = getMateriaRoute(materiaId, carreraId);
    const shareUrl =
      typeof window !== 'undefined' ? new URL(sharePath, window.location.origin).toString() : sharePath;

    try {
      if (navigator.share) {
        await navigator.share({
          title: nombre,
          text: `Te comparto esta materia en Evaluo: ${nombre}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copiado',
                        description: 'Ya podés compartir esta materia con quien quieras.',
          duration: 2500,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copiado',
                        description: 'Ya podés compartir esta materia con quien quieras.',
          duration: 2500,
        });
      } catch {
        toast({
          variant: 'destructive',
          title: 'No pudimos compartir la materia',
          description: 'Inténtalo nuevamente en unos segundos.',
          duration: 3000,
        });
      }
    }
  };

  const getRecursoPublicUrl = (resourcePath: string) => {
    if (/^https?:\/\//i.test(resourcePath)) {
      return resourcePath;
    }

    const { data } = supabase.storage.from('biblioteca').getPublicUrl(resourcePath);
    return data.publicUrl;
  };

  const requireDownloadSession = async () => {
    if (authLoading) {
      toast({
        title: 'Validando sesión',
        description: 'Espera un segundo e intenta nuevamente.',
        duration: 2200,
      });
      return null;
    }

    if (!isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Debes iniciar sesión para descargar este material',
        description: 'Te redirigimos para continuar.',
        duration: 2800,
      });
      router.push('/login');
      return null;
    }

    return authUser;
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

    pushRecentResource({
      id: recurso.id,
      title: recurso.nombre,
      subjectId: materiaId,
      subjectName: nombre,
      type: (recurso.tipo ?? '').toLowerCase().includes('tp') ? 'TP' : 'Preguntero',
      href: `/recursos/${recurso.id}`,
      openedAt: new Date().toISOString(),
    });
    pushActivityHit();

    window.open(payload.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="animate-page-enter min-h-full bg-[#F5F7FB]">
      <div className="w-full border-b border-[#E8EDF5] bg-[#F8FAFC]">
      <div className="mx-auto flex min-h-14 max-w-7xl overflow-x-hidden px-4 py-2.5 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm leading-6">
            <Link
              href="/explorar"
              className="flex items-center gap-1 text-slate-500 transition-colors hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="sm:hidden">Volver</span>
              <span className="hidden sm:inline">Universidades</span>
            </Link>
            {universidadNombre ? (
              <>
                <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
                <Link
                  href={universidadId ? getUniversityRoute(universidadId) : '/explorar'}
                  className="hidden max-w-[140px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:block sm:max-w-none"
                >
                  {universidadNombre}
                </Link>
              </>
            ) : null}
            {carreraNombre ? (
              <>
                <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
                <Link
                  href={carreraId ? getCareerRoute(carreraId) : '/materias'}
                  className="hidden max-w-[160px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:block sm:max-w-none"
                >
                  {carreraNombre}
                </Link>
              </>
            ) : null}
            <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            <span className="max-w-[190px] truncate font-medium text-slate-700 sm:max-w-none">
              {nombre}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative min-h-[238px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div
          className="absolute inset-0 hidden h-full w-full bg-cover bg-center lg:block"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#0F172A_0%,#0F172A_28%,rgba(15,23,42,0.94)_42%,rgba(15,23,42,0.76)_56%,rgba(15,23,42,0.42)_70%,rgba(15,23,42,0.16)_84%,rgba(15,23,42,0.04)_100%)] lg:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.18),transparent_24%)] lg:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0F172A]/32 via-transparent to-[#0F172A]/10 lg:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/88 to-[#1E293B]/55 lg:hidden" />

        <div className="relative mx-auto flex h-full max-w-7xl overflow-x-hidden px-4 py-4 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="mx-auto flex min-w-0 flex-1 items-center justify-center gap-3 sm:gap-6 lg:max-w-3xl">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/5 sm:flex sm:h-24 sm:w-24">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white sm:h-[80px] sm:w-[80px]">
                  <GraduationCap className="h-5 w-5 sm:h-9 sm:w-9" />
                </div>
              </div>

              <div className="min-w-0 flex-1 text-center lg:text-left">
                <p className="text-xs text-white/70 sm:text-sm">Materia</p>
                <h1
                  className={`tracking-[-0.05em] text-white drop-shadow-lg ${
                    isLongTitle ? 'text-[20px] font-bold leading-tight sm:text-[34px]' : 'text-[22px] font-bold leading-tight sm:text-[42px]'
                  }`}
                >
                  {nombre}
                </h1>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[12px] text-white/80 sm:mt-6 sm:gap-3 sm:text-sm lg:justify-start">
                  {carreraNombre ? (
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                      <BookOpen className="hidden h-4 w-4 shrink-0 sm:block" />
                      <span>{carreraNombre}</span>
                    </div>
                  ) : null}
                  {universidadNombre ? (
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                      <Users className="hidden h-4 w-4 shrink-0 sm:block" />
                      <span>{universidadNombre}</span>
                    </div>
                  ) : null}
                  {topRatedResource ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/90">
                      <Trophy className="h-4 w-4 shrink-0 text-amber-300" />
                      Material destacado
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-end">
              <button
                onClick={() => void handleShareMateria()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 sm:h-auto sm:w-auto sm:px-5 sm:py-3"
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>
              <button
                onClick={toggleFavorite}
                disabled={favoritesLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 disabled:opacity-60 sm:h-auto sm:w-auto sm:px-5 sm:py-3"
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current text-yellow-400' : ''}`} />
                {isFavorite ? 'Guardada' : 'Guardar'}
              </button>
              <Link
                href={`/explorar/materia/${materiaId}?tab=pregunteros${carreraId ? `&carreraId=${carreraId}` : ''}`}
                className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5] sm:h-auto sm:w-auto sm:px-5 sm:py-3"
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
          <div className="grid grid-cols-3 gap-2 py-2.5 sm:flex sm:gap-6 sm:py-0">
            {[
              { id: 'resumenes', label: 'Resúmenes', mobileLabel: 'Resúmenes' },
              { id: 'trabajos', label: 'Trabajos prácticos', mobileLabel: 'TPs' },
              { id: 'pregunteros', label: 'Pregunteros', mobileLabel: 'Tests' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as typeof activeTab)}
                className={`relative min-h-[48px] rounded-xl px-2 py-2 text-[12px] font-medium leading-4 transition-all duration-300 sm:min-h-0 sm:rounded-none sm:px-0 sm:py-4 sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-[#EEF2FF] text-[#2563EB] shadow-[0_12px_30px_rgba(37,99,235,0.12)] sm:bg-transparent sm:shadow-none sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#2563EB] sm:after:content-[""]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 sm:hover:bg-transparent'
                }`}
              >
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        {contextError ? (
          <div className="surface-card mb-6 rounded-[var(--radius-card)] border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-none">
            {contextError}
          </div>
        ) : null}
        {activeTab === 'resumenes' ? (
          <div className="animate-tab-panel space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="section-title text-[1.55rem] text-slate-900 sm:text-[2rem]">Biblioteca de resúmenes</h2>
                <p className="section-copy mt-1 text-sm text-slate-500">
                  Material curado por módulo para estudiar con más claridad.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar resumen..."
                    className="h-11 w-full rounded-full border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#4F5DFF] focus:outline-none focus:ring-2 focus:ring-[#4F5DFF]/20 sm:h-10 sm:w-72"
                  />
                </div>
              </div>
            </div>

	            <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
	              {unidades.map((unidad) => {
	                const realResumenesCount = resumenesCountByUnidad.get(unidad.id) ?? 0;

	                return (
	                  <button
	                    key={unidad.id}
	                    onClick={() => setActiveUnidad(String(unidad.id))}
	                    className={`surface-card rounded-[var(--radius-card)] p-4 text-left transition ${activeUnidad === String(unidad.id) ? 'border-[#4F5DFF] bg-[#EEF2FF] shadow-[var(--shadow-card)]' : 'hover:border-slate-300'}`}
	                  >
	                    <p className="text-sm font-semibold text-slate-900">{unidad.nombre}</p>
	                    <p className="mt-2 text-xs leading-5 text-slate-500">{unidad.descripcion}</p>
	                    <p className="mt-3 text-xs font-medium text-[#4F5DFF]">{realResumenesCount} resúmenes</p>
	                  </button>
	                );
	              })}
	            </div>

            <div className="space-y-3 sm:hidden">
              <div className="surface-card overflow-hidden rounded-[var(--radius-card)] border-slate-200/90 bg-white px-4 py-3 shadow-none">
                <p className="text-xs font-semibold text-slate-900">Módulo activo</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Cambia de módulo para ver solo los resúmenes que necesitas ahora.
                </p>
              </div>
	              {unidades.map((unidad) => {
	                const isActiveModule = activeUnidad === String(unidad.id);
	                const realResumenesCount = resumenesCountByUnidad.get(unidad.id) ?? 0;

	                return (
	                  <div key={unidad.id} className="space-y-3">
                    <button
                      onClick={() => setActiveUnidad(String(unidad.id))}
                      className={`surface-card w-full rounded-[var(--radius-card)] p-4 text-left transition ${isActiveModule ? 'border-[#4F5DFF] bg-[#EEF2FF] shadow-[var(--shadow-card)]' : 'hover:border-slate-300'}`}
                    >
	                      <p className="text-sm font-semibold text-slate-900">{unidad.nombre}</p>
	                      <p className="mt-2 text-xs leading-5 text-slate-500">{unidad.descripcion}</p>
	                      <p className="mt-3 text-xs font-medium text-[#4F5DFF]">
	                        {realResumenesCount} resúmenes
	                      </p>
	                    </button>

                    {isActiveModule ? (
                      resumenesLoading ? (
                        <div className="surface-panel p-6 text-center text-sm text-slate-500">
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
                        renderResumenCards('grid gap-4')
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="hidden sm:block">
            {resumenesLoading ? (
              <div className="surface-panel p-10 text-center text-slate-500">
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
              renderResumenCards()
            )}
            </div>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">
                    Apuntes compartidos por estudiantes
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    PDFs subidos desde el espacio personal de alumnos y clasificados en esta materia.
                  </p>
                </div>

                <Link
                  href="/dashboard/materiales"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
                >
                  Subir mi PDF
                </Link>
              </div>

              {sharedStudentMaterialsLoading ? (
                <div className="surface-panel p-6 text-center text-sm text-slate-500">
                  Estamos cargando los apuntes compartidos...
                </div>
              ) : sharedStudentMaterialsError ? (
                <MateriaSectionState
                  icon={FileText}
                  title="No pudimos cargar los PDFs compartidos"
                  description={sharedStudentMaterialsError}
                  tone="warning"
                  actionLabel="Reintentar carga"
                  onAction={() => void loadSharedStudentMaterials()}
                />
              ) : sharedStudentMaterials.length === 0 ? (
                <MateriaSectionState
                  icon={FileText}
                  title="Todavía no hay PDFs de estudiantes en esta materia"
                  description="Cuando alguien comparta apuntes desde su espacio personal, aparecerán acá listos para abrir."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sharedStudentMaterials.map((material) => (
                    <article
                      key={material.id}
                      className="surface-card overflow-hidden p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-[18px] font-semibold tracking-[-0.035em] text-[#2563EB]">
                            {material.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            {material.file_name}
                          </p>
                        </div>
                        {material.page_count ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                            {material.page_count} páginas
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        Compartido dentro de {nombre} el{' '}
                        {new Date(material.created_at).toLocaleDateString('es-AR')}.
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          href={getStudentMaterialRoute(material.id)}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Abrir PDF
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : activeTab === 'pregunteros' || activeTab === 'trabajos' ? (
          <div className="animate-tab-panel space-y-8">
            {activeTab === 'pregunteros' ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {[
                  { parcial: 1, titulo: 'Parcial 1', icon: Zap },
                  { parcial: 2, titulo: 'Parcial 2', icon: Trophy },
                  { parcial: 3, titulo: 'Examen Integrador (50 Preguntas)', icon: Sparkles },
                ].map((simulador) => {
                  const rating = simulatorRatings[simulador.parcial];
                  const usage = simulatorUsage[simulador.parcial];
                  const displayRating = getDisplayRating(materiaId, simulador.parcial, rating);
                  return (
                    <article
                      key={`${simulador.parcial}-${simulador.titulo}`}
                      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ${
                        simulador.parcial === 3 ? 'md:col-span-2' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Preguntero</p>
                          <h3 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{simulador.titulo}</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {simulador.parcial === 3
                               ? `Preguntero completo del examen integrador ${nombre} con todos los modelos de exámenes que podés llegar a rendir.`
                              : 'Preguntero de examen con 30 preguntas por modelo.'}
                          </p>
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            {displayRating.value.toFixed(1)}/5 · {displayRating.reviews} reseñas
                          </div>
                        </div>
                        <div className="flex shrink-0 items-start gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSharePreguntero(simulador.parcial)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#C7D2FE] hover:text-[#4F5DFF]"
                            aria-label={`Compartir ${simulador.titulo}`}
                            title="Compartir"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <div
                            className="inline-flex h-9 min-w-[58px] items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-slate-500"
                            title="Vistas reales de este parcial"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-[12px] font-semibold text-slate-600">
                              {usage?.views?.toLocaleString('es-AR') ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/simulador/${materiaId}/${simulador.parcial}`}
                        onClick={() =>
                          void emitMateriaEvent('materia_simulator_cta_clicked', {
                            tab: activeTab,
                            parcial: simulador.parcial,
                            label: simulador.titulo,
                          })
                        }
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F5DFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4050f0] sm:w-auto"
                      >
                        Iniciar Preguntero
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
                renderResourceCards()
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

