'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  GraduationCap,
  Heart,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { getDashboardMateriaRoute, getMateriaRoute } from '@/lib/routes';
import {
  getDashboardState,
  getPartialStudyInsights,
  saveDashboardState,
  type DashboardState,
  type PartialStudyInsights,
} from '@/app/actions';
import { getMateriasByCarrera } from '@/services/api';
import {
  getWeeklyActivitySeries,
  pushActivityHit,
  readActivityLog,
  readRecentResources,
  type DashboardRecentResource,
} from '@/lib/dashboard-client';
import {
  fetchDashboardMateriaDetailsByIds,
  fetchDashboardFavoriteMateriaIds,
  fetchDashboardMateriasByIds,
  fetchDashboardProfileCarreraId,
  fetchDashboardMateriaSummaries,
  mapDashboardMateriaDetails,
  touchDashboardMateriaState,
  type DashboardMateriaDetailsMap,
  type DashboardMateriaSummary,
} from '@/lib/data/dashboard';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { DashboardMateriaState } from '@/types/supabase';

type MateriaSummary = DashboardMateriaSummary;
type MateriaDetailsMap = DashboardMateriaDetailsMap;

type SimuladorInProgressSnapshot = {
  version: 1;
  userId: string;
  materiaId: string;
  parcial: number;
  mode: 'regular' | 'errores';
  currentQuestionIndex: number;
  timeLeft: number;
  selectedAnswers: Record<number, number>;
  flaggedQuestions: number[];
  hasStarted: boolean;
  savedAt: string;
};

const STORAGE_KEYS = {
  lastSubject: 'evaluo_last_subject',
  activeSubjects: 'evaluo_active_subjects',
  finishedSubjects: 'evaluo_finished_subjects',
} as const;

const DEFAULT_STATE: DashboardState = {
  lastSubject: null,
  activeSubjects: [],
  finishedSubjects: [],
  analytics: {
    subjectsCompleted: 0,
    lastUpdatedAt: null,
  },
};

function readLocalState(): DashboardState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const lastSubject = localStorage.getItem(STORAGE_KEYS.lastSubject);
    const activeSubjects = localStorage.getItem(STORAGE_KEYS.activeSubjects);
    const finishedSubjects = localStorage.getItem(STORAGE_KEYS.finishedSubjects);
    const parsedFinishedSubjects = finishedSubjects
      ? (JSON.parse(finishedSubjects) as DashboardMateriaState[])
      : [];

    return {
      lastSubject: lastSubject ? (JSON.parse(lastSubject) as DashboardMateriaState) : null,
      activeSubjects: activeSubjects ? (JSON.parse(activeSubjects) as DashboardMateriaState[]) : [],
      finishedSubjects: parsedFinishedSubjects,
      analytics: {
        subjectsCompleted: parsedFinishedSubjects.length,
        lastUpdatedAt: null,
      },
    };
  } catch (error) {
    console.error('Invalid dashboard state in localStorage:', error);
    localStorage.removeItem(STORAGE_KEYS.lastSubject);
    localStorage.removeItem(STORAGE_KEYS.activeSubjects);
    localStorage.removeItem(STORAGE_KEYS.finishedSubjects);
    return DEFAULT_STATE;
  }
}

function writeLocalState(state: DashboardState) {
  if (typeof window === 'undefined') {
    return;
  }

  if (state.lastSubject) {
    localStorage.setItem(STORAGE_KEYS.lastSubject, JSON.stringify(state.lastSubject));
  } else {
    localStorage.removeItem(STORAGE_KEYS.lastSubject);
  }

  localStorage.setItem(STORAGE_KEYS.activeSubjects, JSON.stringify(state.activeSubjects));
  localStorage.setItem(STORAGE_KEYS.finishedSubjects, JSON.stringify(state.finishedSubjects));
}

function getResourceTypeLabel(type: DashboardRecentResource['type']) {
  if (type === 'TP') {
    return 'Trabajo practico';
  }

  return type;
}

function getWeeklyTotalLabel(series: Array<{ day: string; count: number }>) {
  const total = series.reduce((acc, item) => acc + item.count, 0);
  return `${total} ingresos`;
}

function normalizeHeroTitle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Tu materia';
  const lower = trimmed.toLocaleLowerCase('es-AR');
  return lower.replace(/\b\p{L}/gu, (char) => char.toLocaleUpperCase('es-AR'));
}

const DASHBOARD_PANEL_CLASS = 'surface-panel';

export function DashboardContent() {
  const { user, loading: userLoading, getUserName } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();

  const [dashboardState, setDashboardState] = useState<DashboardState>(DEFAULT_STATE);
  const [allMaterias, setAllMaterias] = useState<MateriaSummary[]>([]);
  const [allMateriasLoading, setAllMateriasLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exploreQuery, setExploreQuery] = useState('');
  const [recentResources, setRecentResources] = useState<DashboardRecentResource[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<Array<{ day: string; count: number }>>([]);
  const [materiaDetails, setMateriaDetails] = useState<MateriaDetailsMap>({});
  const [recommendedMaterias, setRecommendedMaterias] = useState<MateriaSummary[]>([]);
  const [favoriteMaterias, setFavoriteMaterias] = useState<MateriaSummary[]>([]);
  const [favoriteSuggestions, setFavoriteSuggestions] = useState<MateriaSummary[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [partialInsights, setPartialInsights] = useState<PartialStudyInsights | null>(null);
  const [partialInsightMateriaName, setPartialInsightMateriaName] = useState<string | null>(null);
  const [simuladorInProgress, setSimuladorInProgress] = useState<SimuladorInProgressSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncDashboard() {
      if (userLoading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          setDashboardLoading(false);
          setRecentResources(readRecentResources().slice(0, 3));
          setWeeklyProgress(getWeeklyActivitySeries(readActivityLog(), null));
        }
        return;
      }

      setDashboardLoading(true);
      setDashboardError(null);

      const remoteState = await getDashboardState();
      if (!isMounted) {
        return;
      }

      const hasRemoteData =
        remoteState.lastSubject !== null ||
        remoteState.activeSubjects.length > 0 ||
        remoteState.finishedSubjects.length > 0;

      const nextState = hasRemoteData ? remoteState : readLocalState();
      setDashboardState(nextState);
      writeLocalState(nextState);
      setRecentResources(readRecentResources().slice(0, 3));
      setWeeklyProgress(
        getWeeklyActivitySeries(readActivityLog(), nextState.analytics.lastUpdatedAt)
      );
      setDashboardLoading(false);
    }

    void syncDashboard();

    return () => {
      isMounted = false;
    };
  }, [user, userLoading]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) {
      setSimuladorInProgress(null);
      return;
    }

    try {
      const prefix = 'evaluo_simulador_in_progress:';
      const found: SimuladorInProgressSnapshot[] = [];

      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as SimuladorInProgressSnapshot;
        if (
          parsed &&
          parsed.version === 1 &&
          parsed.userId === user.id &&
          parsed.materiaId &&
          Number(parsed.parcial) > 0
        ) {
          found.push(parsed);
        }
      }

      found.sort((a, b) => {
        const aTime = new Date(a.savedAt || 0).getTime();
        const bTime = new Date(b.savedAt || 0).getTime();
        return bTime - aTime;
      });
      setSimuladorInProgress(found[0] ?? null);
    } catch {
      setSimuladorInProgress(null);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadMateriaDetails() {
      const subjectIds = dashboardState.activeSubjects.map((subject) => subject.id);

      if (subjectIds.length === 0) {
        if (isMounted) {
          setMateriaDetails({});
        }
        return;
      }

      try {
        const materias = await fetchDashboardMateriaDetailsByIds(subjectIds);
        if (!isMounted) {
          return;
        }
        setMateriaDetails(mapDashboardMateriaDetails(materias));
      } catch (error) {
        console.error('Error loading subject details:', error);
      }
    }

    void loadMateriaDetails();

    return () => {
      isMounted = false;
    };
  }, [dashboardState.activeSubjects]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendedMaterias() {
      if (!user || dashboardState.activeSubjects.length > 0) {
        if (isMounted) {
          setRecommendedMaterias([]);
        }
        return;
      }

      try {
        const carreraId = await fetchDashboardProfileCarreraId(user.id);

        if (!carreraId) {
          if (isMounted) {
            setRecommendedMaterias([]);
          }
          return;
        }

        const materias = await getMateriasByCarrera(carreraId);
        if (!isMounted) {
          return;
        }

        const carreraNombre =
          allMaterias.find((materia) => materia.carreraId === carreraId)?.carreraNombre ??
          'Carrera';

        setRecommendedMaterias(
          materias.slice(0, 3).map((materia) => ({
            id: materia.id,
            nombre: materia.nombre,
            carreraId: materia.carrera_id ?? carreraId,
            carreraNombre,
          }))
        );
      } catch (error) {
        console.error('Error loading recommended subjects:', error);
        if (isMounted) {
          setRecommendedMaterias([]);
        }
      }
    }

    void loadRecommendedMaterias();

    return () => {
      isMounted = false;
    };
  }, [allMaterias, dashboardState.activeSubjects.length, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadPartialInsights() {
      if (!user) {
        if (isMounted) {
          setPartialInsights(null);
          setPartialInsightMateriaName(null);
        }
        return;
      }

      let materiaId = dashboardState.lastSubject?.id ?? '';
      let parcial = 1;

      try {
        const raw = window.localStorage.getItem('evaluo_last_simulador_context');
        if (raw) {
          const parsed = JSON.parse(raw) as { materiaId?: string; parcial?: number };
          if (parsed.materiaId) materiaId = parsed.materiaId;
          if (parsed.parcial) parcial = Number(parsed.parcial) || 1;
        }
      } catch {
        // ignore parse errors
      }

      if (!materiaId) {
        if (isMounted) {
          setPartialInsights(null);
          setPartialInsightMateriaName(null);
        }
        return;
      }

      const [insights, materiaResponse] = await Promise.all([
        getPartialStudyInsights(materiaId, parcial),
        supabase.from('materias').select('nombre').eq('id', materiaId).maybeSingle(),
      ]);

      if (!isMounted) {
        return;
      }

      setPartialInsights(insights);
      setPartialInsightMateriaName(
        materiaResponse.data?.nombre ??
          dashboardState.lastSubject?.name ??
          allMaterias.find((materia) => materia.id === materiaId)?.nombre ??
          null
      );
    }

    void loadPartialInsights();

    return () => {
      isMounted = false;
    };
  }, [allMaterias, dashboardState.lastSubject?.id, dashboardState.lastSubject?.name, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadFavoritesAndSuggestions() {
      if (!user) {
        if (isMounted) {
          setFavoriteMaterias([]);
          setFavoriteSuggestions([]);
        }
        return;
      }

      setFavoritesLoading(true);

      try {
        const favoriteIds = await fetchDashboardFavoriteMateriaIds(user.id);

        if (favoriteIds.length > 0) {
          const normalizedFavorites = await fetchDashboardMateriasByIds(favoriteIds);

          if (isMounted) {
            setFavoriteMaterias(normalizedFavorites);
            setFavoriteSuggestions([]);
          }
        } else {
          const carreraId = await fetchDashboardProfileCarreraId(user.id);

          if (!carreraId) {
            if (isMounted) {
              setFavoriteMaterias([]);
              setFavoriteSuggestions([]);
            }
            return;
          }

          const suggested = await getMateriasByCarrera(carreraId);
          const carreraNombre =
            allMaterias.find((materia) => materia.carreraId === carreraId)?.carreraNombre ??
            'Carrera';

          if (isMounted) {
            setFavoriteMaterias([]);
            setFavoriteSuggestions(
              suggested.slice(0, 4).map((materia) => ({
                id: materia.id,
                nombre: materia.nombre,
                carreraId: materia.carrera_id ?? carreraId,
                carreraNombre,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Error loading favorites dashboard section:', error);
        if (isMounted) {
          setFavoriteMaterias([]);
          setFavoriteSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setFavoritesLoading(false);
        }
      }
    }

    void loadFavoritesAndSuggestions();

    return () => {
      isMounted = false;
    };
  }, [allMaterias, user]);

  useEffect(() => {
    if (!showAddModal || allMateriasLoading || allMaterias.length > 0) {
      return;
    }

    void loadAllMaterias();
  }, [allMaterias.length, allMateriasLoading, showAddModal]);

  const persistDashboardState = (nextState: DashboardState) => {
    setDashboardState(nextState);
    writeLocalState(nextState);
    pushActivityHit(nextState.analytics.lastUpdatedAt ?? new Date().toISOString());
    setWeeklyProgress(
      getWeeklyActivitySeries(readActivityLog(), nextState.analytics.lastUpdatedAt)
    );

    if (!user) {
      return;
    }

    startSaving(async () => {
      const result = await saveDashboardState(nextState);
      if (!result.success) {
        setDashboardError('No pudimos sincronizar tus cambios con la nube.');
      }
    });
  };

  const loadAllMaterias = async () => {
    setAllMateriasLoading(true);
    try {
      const summaries = await fetchDashboardMateriaSummaries();
      setAllMaterias(summaries);
    } catch (error) {
      console.error('Error loading materias:', error);
      toast({
        title: 'No pudimos cargar las materias',
        description: 'Intenta nuevamente en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setAllMateriasLoading(false);
    }
  };

  const addMateria = (materia: MateriaSummary) => {
    if (dashboardState.activeSubjects.length >= 6) {
      toast({
        title: 'Limite alcanzado',
        description: 'Solo puedes tener hasta 6 materias activas.',
        variant: 'destructive',
      });
      return;
    }

    const newSubject = { id: materia.id, name: materia.nombre };
    const nextState = touchDashboardMateriaState(dashboardState, newSubject);

    persistDashboardState(nextState);
    setMateriaDetails((prev) => ({
      ...prev,
      [materia.id]: {
        careerName: materia.carreraNombre,
      },
    }));
    setShowAddModal(false);
    toast({
      title: 'Materia anadida',
      description: materia.nombre,
    });
  };

  const removeMateria = (subjectId: string, subjectName: string) => {
    const nextActiveSubjects = dashboardState.activeSubjects.filter((subject) => subject.id !== subjectId);
    const nextLastSubject =
      dashboardState.lastSubject?.id === subjectId
        ? nextActiveSubjects[0] ?? null
        : dashboardState.lastSubject;

    persistDashboardState({
      ...dashboardState,
      lastSubject: nextLastSubject,
      activeSubjects: nextActiveSubjects,
      analytics: {
        ...dashboardState.analytics,
        lastUpdatedAt: new Date().toISOString(),
      },
    });

    toast({
      title: 'Materia eliminada',
      description: subjectName,
    });
  };

  const goToMateria = (subject: DashboardMateriaState) => {
    persistDashboardState(touchDashboardMateriaState(dashboardState, subject));
    router.push(getMateriaRoute(subject.id));
  };

  const handleExploreSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = exploreQuery.trim();
    router.push(trimmed ? `/explorar?q=${encodeURIComponent(trimmed)}` : '/explorar');
  };

  const filteredMaterias = useMemo(
    () =>
      allMaterias.filter((materia) =>
        materia.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allMaterias, searchTerm]
  );

  const recentSubjects = dashboardState.activeSubjects.slice(0, 3);
  const nextStudyAction = useMemo(() => {
    if (simuladorInProgress) {
      const href =
        simuladorInProgress.mode === 'errores'
          ? `/simulador/errores/${simuladorInProgress.materiaId}`
          : `/simulador/${simuladorInProgress.materiaId}/${simuladorInProgress.parcial}`;

      return {
        title: 'Retoma tu simulador',
        description: 'Tienes un intento en curso. Vuelve exactamente donde lo dejaste.',
        cta: 'Continuar simulador',
        onClick: () => router.push(href),
      };
    }

    if (dashboardState.lastSubject) {
      return {
        title: 'Sigue con tu ultima materia',
        description: `Vuelve a ${dashboardState.lastSubject.name} y continúa leyendo o practicando.`,
        cta: 'Abrir materia',
        onClick: () => goToMateria(dashboardState.lastSubject as DashboardMateriaState),
      };
    }

    if (recommendedMaterias[0]) {
      return {
        title: 'Empieza por una materia recomendada',
        description: `Te sugerimos arrancar con ${recommendedMaterias[0].nombre} para activar tu recorrido.`,
        cta: 'Añadir recomendada',
        onClick: () => addMateria(recommendedMaterias[0]),
      };
    }

    return {
      title: 'Explora tu plan de estudio',
      description: 'Busca una materia y arma tu espacio para volver rápido a lo importante.',
      cta: 'Ir a explorar',
      onClick: () => router.push('/explorar'),
    };
  }, [dashboardState.lastSubject, recommendedMaterias, router, simuladorInProgress]);

  const partialProgressRingStyle = {
    background: `conic-gradient(#4F5DFF ${Math.max(0, Math.min(100, partialInsights?.coberturaPorcentaje ?? 0)) * 3.6}deg, #E6EAF2 ${Math.max(0, Math.min(100, partialInsights?.coberturaPorcentaje ?? 0)) * 3.6}deg)`,
  };
  const heroSubjectName = normalizeHeroTitle(
    partialInsightMateriaName ??
      dashboardState.lastSubject?.name ??
      recommendedMaterias[0]?.nombre ??
      'Tu materia'
  );
  const heroCoverage = Math.max(0, Math.min(100, partialInsights?.coberturaPorcentaje ?? 0));
  const heroProgressLabel =
    partialInsights && partialInsights.totalPreguntasParcial > 0
      ? `${partialInsights.preguntasRespondidasParcial} de ${partialInsights.totalPreguntasParcial} preguntas trabajadas`
      : 'Todavía no hay respuestas suficientes para medir tu progreso.';
  const heroPrimaryAction = partialInsights
    ? () => router.push(`/simulador/${partialInsights.materiaId}/${partialInsights.parcial}`)
    : nextStudyAction.onClick;
  const heroPrimaryLabel = partialInsights ? 'Continuar con el simulador' : nextStudyAction.cta;
  const subjectAccentStyles = [
    'from-blue-500/15 to-cyan-500/10 border-blue-200/70',
    'from-indigo-500/15 to-violet-500/10 border-indigo-200/70',
    'from-emerald-500/15 to-teal-500/10 border-emerald-200/70',
  ];

  if (dashboardLoading && recentSubjects.length === 0) {
    return (
      <div className="animate-page-enter flex-1 overflow-auto bg-[#f7f9fc] font-sans">
        <div className="w-full p-2 md:p-3">
          <div className="mx-auto max-w-6xl lg:[zoom:0.9]">
            <div className={`${DASHBOARD_PANEL_CLASS} mb-4 px-5 py-5`}>
              <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-3 h-4 w-80 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-5 h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="surface-card h-28 animate-pulse rounded-[var(--radius-card)] bg-white/90" />
              ))}
            </div>
            <div className="mb-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="surface-card h-80 animate-pulse rounded-[var(--radius-card)] bg-white/90" />
              <div className="surface-card h-80 animate-pulse rounded-[var(--radius-card)] bg-white/90" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="surface-card h-72 animate-pulse rounded-[var(--radius-card)] bg-white/90" />
              <div className="surface-card h-72 animate-pulse rounded-[var(--radius-card)] bg-white/90" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-enter flex-1 overflow-auto bg-[#f7f9fc] font-sans">
      <div className="w-full p-2 sm:p-3">
        <div className="mx-auto max-w-6xl">
          <div className="animate-study-reveal mb-4 grid gap-4 px-1 py-1 sm:px-0 sm:py-0 xl:grid-cols-[1fr_minmax(320px,460px)] xl:items-start">
            <div className="min-w-0">
              <h1 className="text-[1.7rem] font-black tracking-[-0.06em] text-[#0F1B3D] sm:text-[2rem]">
                {`\u00A1Hola, ${getUserName()}!`}
                <span className="ml-2 inline-block" aria-hidden="true">{'\uD83D\uDC4B'}</span>
              </h1>
              <p className="mt-1 text-base font-medium text-slate-500 sm:text-[17px]">
                {'\u00BFQu\u00E9 vas a estudiar hoy?'}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2">
              <form onSubmit={handleExploreSubmit} className="w-full">
                <div className="group relative overflow-hidden rounded-2xl border border-[#E5EAF5] bg-white shadow-[0_14px_35px_rgba(148,163,184,0.10)] transition focus-within:border-[#C7D2FE] focus-within:shadow-[0_18px_40px_rgba(79,93,255,0.14)]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#4F5DFF]" />
                  <Input
                    value={exploreQuery}
                    onChange={(event) => setExploreQuery(event.target.value)}
                    placeholder="Buscar en Evaluo..."
                    className="h-12 border-0 bg-transparent pl-11 pr-28 text-sm text-slate-700 shadow-none focus-visible:ring-0 sm:h-14 sm:text-[15px]"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 inline-flex h-9 -translate-y-1/2 items-center rounded-xl bg-gradient-to-r from-[#4F5DFF] to-[#5E6BFF] px-4 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(79,93,255,0.26)] transition hover:opacity-95 sm:h-10 sm:text-sm"
                  >
                    Buscar
                  </button>
                </div>
              </form>
              {isSaving ? (
                <span className="pl-1 text-xs text-slate-400">Sincronizando cambios...</span>
              ) : null}
            </div>
          </div>
          {dashboardError ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {dashboardError}
            </div>
          ) : null}

          <div className="animate-study-reveal mb-4 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#4356FF_0%,#3E4AF1_34%,#305CFF_100%)] px-5 py-3 text-white shadow-[0_22px_50px_rgba(67,86,255,0.22)] sm:px-6 sm:py-4">
            <div className="mx-auto grid max-w-[1000px] gap-4 xl:grid-cols-[1.18fr_0.82fr] xl:items-center">
              <div className="grid gap-3 lg:grid-cols-[0.52fr_0.95fr] lg:items-center">
                <div className="min-w-0 max-w-[520px]">
                  <h2 className="max-w-[210px] text-[1.42rem] font-bold leading-[1.06] tracking-[-0.05em] text-white sm:max-w-[230px] sm:text-[1.62rem]">
                    {'Segu\u00ED as\u00ED, vas por muy buen camino \uD83D\uDCAA'}
                  </h2>
                  <p className="mt-3.5 max-w-[210px] text-[0.88rem] font-medium leading-6 text-white/82 sm:max-w-[230px]">
                    {'Cada minuto que estudias, te acerca a tu pr\u00F3xima meta.'}
                  </p>
                  <Button
                    onClick={heroPrimaryAction}
                    className="mt-5 h-9 rounded-xl bg-white px-4.5 text-[12.5px] font-semibold text-[#3042E8] shadow-[0_12px_24px_rgba(17,24,39,0.14)] hover:bg-white/95"
                  >
                    {heroPrimaryLabel}
                  </Button>
                </div>
                <div className="min-w-0 pl-2 sm:pl-4 lg:pl-6">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#FFFFFF 0deg ${heroCoverage * 3.6}deg, rgba(255,255,255,0.2) ${heroCoverage * 3.6}deg 360deg)`,
                        }}
                      />
                      <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#4356FF]">
                        <p className="text-[24px] font-black leading-none text-white">{heroCoverage}%</p>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="max-w-[300px] text-[12px] font-semibold uppercase leading-5 tracking-[0.01em] text-white/90 sm:max-w-[330px]">{heroSubjectName}</p>
                      <div className="mt-2 rounded-full bg-white/10 p-[3px] shadow-inner shadow-black/10">
                        <div className="h-[9px] overflow-hidden rounded-full bg-white/15">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#FFFFFF_0%,#D7DEFF_50%,#93C5FD_100%)] transition-all"
                            style={{ width: `${heroCoverage}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-5 text-white/78">
                        <span>{'\u00A1Vas muy bien!'}</span>
                        {partialInsights ? (
                          <span className="rounded-full border border-white/14 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/88">
                            Parcial {partialInsights.parcial}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid max-w-[430px] gap-2 min-[480px]:grid-cols-2">
                    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-center backdrop-blur">
                      <p className="text-[17px] font-black text-white">
                        {partialInsights?.preguntasRespondidasParcial?.toLocaleString('es-AR') ?? 0}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-white/68">
                        Preguntas practicadas
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-center backdrop-blur">
                      <p className="text-[17px] font-black text-white">
                        {partialInsights?.preguntasAcertadasParcial?.toLocaleString('es-AR') ?? 0}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-white/68">
                        Preguntas acertadas
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 max-w-[430px] text-[11px] leading-5 text-white/74">{heroProgressLabel}</p>
                </div>
              </div>

              <div className="relative flex items-center justify-center xl:justify-end">
                <div className="absolute inset-x-10 bottom-1 h-8 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),rgba(255,255,255,0))] blur-2xl" />
                <Image
                  src="/imagentarjetadashboard.png"
                  alt="Estudiante usando Evaluo"
                  width={1024}
                  height={1536}
                  sizes="(max-width: 1279px) 180px, 18vw"
                  className="relative z-10 h-auto w-full max-w-[180px] object-contain sm:max-w-[200px] xl:max-w-[220px]"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card
              id="materias-favoritas"
              className="surface-card rounded-[var(--radius-card)] bg-white/90 backdrop-blur"
            >
              <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-950">
                    Mis materias
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Últimas 3 materias en las que entraste.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 w-full rounded-xl border-slate-200 bg-white px-4 text-xs shadow-sm sm:h-9 sm:w-auto"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {dashboardLoading ? (
                  <div className="grid gap-2.5 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                ) : recentSubjects.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {recentSubjects.map((subject, index) => (
                      <div
                        key={subject.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => goToMateria(subject)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            goToMateria(subject);
                          }
                        }}
                        style={{ animationDelay: `${index * 110}ms` }}
                        className={`animate-study-reveal flex h-full min-h-[176px] cursor-pointer flex-col rounded-2xl border bg-gradient-to-br p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[188px] ${index === 0 ? 'animate-study-float' : ''} ${subjectAccentStyles[index % subjectAccentStyles.length]}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-slate-700 shadow-sm">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeMateria(subject.id, subject.name);
                            }}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
                            aria-label={`Eliminar ${subject.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <h3 className="mt-4 line-clamp-2 text-[1.05rem] font-semibold text-slate-950 sm:text-lg">
                          {subject.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {materiaDetails[subject.id]?.careerName ?? 'Carrera'}
                        </p>
                        <div className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                          Abrir materia
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      Todavía no tienes materias recientes
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Añade una materia y la dejamos lista para volver rápido desde acá.
                    </p>
                    {recommendedMaterias.length > 0 ? (
                      <div className="mt-8">
                        <p className="mb-4 text-left text-sm font-semibold text-slate-900">
                          Materias recomendadas según tu carrera
                        </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {recommendedMaterias.map((materia) => (
                            <button
                              key={materia.id}
                              type="button"
                              onClick={() => addMateria(materia)}
                              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <GraduationCap className="h-5 w-5" />
                              </div>
                              <h4 className="mt-4 line-clamp-2 text-base font-semibold text-slate-950">
                                {materia.nombre}
                              </h4>
                              <p className="mt-1 text-sm text-slate-500">{materia.carreraNombre}</p>
                              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                                Añadir materia
                                <ArrowUpRight className="h-4 w-4" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="mt-5 rounded-xl border-slate-200 bg-white"
                        onClick={() => router.push('/explorar')}
                      >
                        Explorar materias
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="animate-saas-lift-in bg-white/90 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-950">
                  Continúa estudiando
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Los últimos archivos que abriste.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {recentResources.length > 0 ? (
                  recentResources.slice(0, 3).map((resource) => (
                    <a
                      key={`${resource.type}-${resource.id}-${resource.openedAt}`}
                      href={resource.href ?? getDashboardMateriaRoute(resource.subjectId)}
                      target={resource.href ? '_blank' : undefined}
                      rel={resource.href ? 'noreferrer' : undefined}
                      className="animate-study-reveal flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-950">
                          {getResourceTypeLabel(resource.type)}
                        </p>
                        <p className="truncate text-sm text-slate-500">{resource.subjectName}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </a>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 text-center">
                    <FileText className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      Aún no abriste archivos
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Cuando abras resúmenes o recursos, aparecerán acá.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-950">
                  Radar de confianza
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Progreso en parcial y probabilidad estimada de aprobar.
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                {simuladorInProgress ? (
                  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
                    <p className="text-xs text-blue-700">
                      Tenés un simulador en curso. Retomá donde lo dejaste.
                    </p>
                    <Button
                      className="mt-2 h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold hover:bg-blue-700"
                      onClick={() => {
                        const href =
                          simuladorInProgress.mode === 'errores'
                            ? `/simulador/errores/${simuladorInProgress.materiaId}`
                            : `/simulador/${simuladorInProgress.materiaId}/${simuladorInProgress.parcial}`;
                        router.push(href);
                      }}
                    >
                      Continuar simulador en curso
                    </Button>
                  </div>
                ) : null}
                {partialInsights ? (
                  <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-[140px_minmax(0,1fr)] md:items-center">
                    <div className="relative mx-auto grid h-28 w-28 place-items-center rounded-full animate-saas-glow sm:h-32 sm:w-32" style={partialProgressRingStyle}>
                      <div className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-[0_10px_30px_rgba(79,93,255,0.12)] sm:h-24 sm:w-24">
                        <p className="text-2xl font-black text-slate-900">{partialInsights.coberturaPorcentaje}%</p>
                        <p className="text-[10px] text-slate-500">Progreso</p>
                      </div>
                      <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(74,222,128,0.16)]" />
                    </div>
                    <div className="space-y-2 text-sm leading-6">
                      <p className="text-slate-700">
                        Materia:{' '}
                        <span className="font-semibold">
                          {partialInsightMateriaName ?? 'Materia seleccionada'}
                        </span>
                      </p>
                      <p className="text-slate-700">
                        Parcial {partialInsights.parcial} ? {partialInsights.preguntasRespondidasParcial}/{partialInsights.totalPreguntasParcial} preguntas respondidas
                      </p>
                      <p className="text-slate-700">
                        Modelos realizados: <span className="font-semibold">{partialInsights.modelosEstimadosRealizados}</span>
                      </p>
                      <p className="text-slate-700">
                        Promedio de acierto: <span className="font-semibold">{partialInsights.promedioAciertoPorcentaje}%</span>
                      </p>
                      <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 animate-progress-sheen">
                        Posibilidad de aprobar: <span className="font-bold">{partialInsights.probabilidadAprobar}%</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-9 rounded-lg bg-slate-950 px-3 text-xs font-semibold hover:bg-slate-800"
                          onClick={() => router.push(`/simulador/${dashboardState.lastSubject?.id ?? simuladorInProgress?.materiaId ?? ''}/${partialInsights.parcial}`)}
                        >
                          Practicar parcial
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold"
                          onClick={() => {
                            const targetMateriaId = dashboardState.lastSubject?.id ?? simuladorInProgress?.materiaId;
                            if (targetMateriaId) {
                              router.push(`${getMateriaRoute(targetMateriaId)}?tab=resumenes`);
                            }
                          }}
                        >
                          Repasar resúmenes
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    <p>Inicia un simulador para activar el radar de confianza de tu parcial.</p>
                    <Button
                      variant="outline"
                      className="mt-4 rounded-xl border-slate-200 bg-white"
                      onClick={() => router.push('/explorar')}
                    >
                      Buscar una materia
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-950">
                  Materias favoritas
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Tus accesos directos guardados para entrar más rápido.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {favoritesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                ) : favoriteMaterias.length > 0 ? (
                  favoriteMaterias.slice(0, 4).map((materia) => (
                    <button
                      key={materia.id}
                      type="button"
                      onClick={() => router.push(getMateriaRoute(materia.id))}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-rose-50/30 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <Heart className="h-4 w-4 fill-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{materia.nombre}</p>
                        <p className="truncate text-xs text-slate-500">{materia.carreraNombre}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-center">
                    <Heart className="mx-auto h-8 w-8 text-slate-300" />
                    <h3 className="mt-3 text-base font-semibold text-slate-900">
                      {'A\u00FAn no tienes materias favoritas'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {'Te sugerimos estas materias seg\u00FAn la carrera que m\u00E1s usas.'}
                    </p>
                    {favoriteSuggestions.length > 0 ? (
                      <div className="mt-5 grid gap-2">
                        {favoriteSuggestions.map((materia) => (
                          <button
                            key={materia.id}
                            type="button"
                            onClick={() => router.push(getMateriaRoute(materia.id))}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                          >
                            <span className="truncate font-medium text-slate-800">{materia.nombre}</span>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="animate-saas-lift-in bg-white/90 backdrop-blur xl:col-span-2">
              <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-950">
                    Tu progreso esta semana
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Frecuencia de ingreso durante los ?ltimos 7 d?as.
                  </p>
                </div>
                <div className="w-fit rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                  {getWeeklyTotalLabel(weeklyProgress)}
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="h-[220px] w-full sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={weeklyProgress}
                      margin={{ top: 18, right: 8, left: -24, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="weekly-progress-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4F5DFF" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#4F5DFF" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#E2E8F0"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#CBD5E1', fontSize: 10 }}
                        width={22}
                      />
                      <Tooltip
                        cursor={{ stroke: '#CBD5E1', strokeDasharray: '4 4' }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) {
                            return null;
                          }

                          return (
                            <div className="rounded-xl bg-slate-950 px-3 py-2 text-center text-white shadow-sm">
                              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-300">
                                {label}
                              </p>
                              <p className="text-sm font-semibold">
                                {payload[0]?.value} ingresos
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#4F5DFF"
                        strokeWidth={2.5}
                        fill="url(#weekly-progress-fill)"
                        activeDot={{
                          r: 5,
                          fill: '#4F5DFF',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                        dot={({ cx, cy, index }) => (
                          <circle
                            key={`dot-${index}`}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill="#ffffff"
                            stroke="#4F5DFF"
                            strokeWidth={2}
                          />
                        )}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="max-w-3xl rounded-xl px-4 sm:px-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Agrega una materia
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar materias..."
                    className="h-12 rounded-xl border-slate-200 bg-white pl-10"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                <div className="grid max-h-96 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
                  {allMateriasLoading ? (
                    <div className="col-span-full py-10 text-center text-sm text-slate-500">
                      Cargando materias...
                    </div>
                  ) : filteredMaterias.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                      No encontramos materias con ese nombre.
                    </div>
                  ) : (
                    filteredMaterias.map((materia) => (
                      <button
                        key={materia.id}
                        type="button"
                        onClick={() => addMateria(materia)}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <h3 className="text-base font-semibold text-slate-950">{materia.nombre}</h3>
                        <p className="mt-1 text-sm text-slate-500">{materia.carreraNombre}</p>
                      </button>
                    ))
                  )}
                </div>

                <Button
                  className="h-11 w-full rounded-xl bg-slate-950 font-medium text-white hover:bg-slate-800"
                  onClick={() => void loadAllMaterias()}
                  disabled={allMateriasLoading}
                >
                  {allMateriasLoading ? 'Actualizando...' : 'Recargar listado'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}


