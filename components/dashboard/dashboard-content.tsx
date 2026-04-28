'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { DashboardSubjectState } from '@/types/supabase';

type MateriaSummary = {
  id: string;
  nombre: string;
  carreraId: string | null;
  carreraNombre: string;
};

type SubjectDetailsMap = Record<
  string,
  {
    careerName: string;
  }
>;

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
      ? (JSON.parse(finishedSubjects) as DashboardSubjectState[])
      : [];

    return {
      lastSubject: lastSubject ? (JSON.parse(lastSubject) as DashboardSubjectState) : null,
      activeSubjects: activeSubjects ? (JSON.parse(activeSubjects) as DashboardSubjectState[]) : [],
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

function touchSubjectState(state: DashboardState, subject: DashboardSubjectState): DashboardState {
  const nextActiveSubjects = [
    subject,
    ...state.activeSubjects.filter((item) => item.id !== subject.id),
  ].slice(0, 6);

  return {
    ...state,
    lastSubject: subject,
    activeSubjects: nextActiveSubjects,
    analytics: {
      ...state.analytics,
      lastUpdatedAt: new Date().toISOString(),
    },
  };
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

async function fetchMateriaSummaries(): Promise<MateriaSummary[]> {
  const { data: materias, error: materiasError } = await supabase
    .from('materias')
    .select('id, nombre, carrera_id')
    .order('nombre');

  if (materiasError) {
    throw materiasError;
  }

  const carreraIds = Array.from(
    new Set(
      (materias ?? [])
        .map((materia) => materia.carrera_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  let carrerasMap = new Map<string, string>();

  if (carreraIds.length > 0) {
    const { data: carreras, error: carrerasError } = await supabase
      .from('carreras')
      .select('id, nombre')
      .in('id', carreraIds);

    if (carrerasError) {
      throw carrerasError;
    }

    carrerasMap = new Map((carreras ?? []).map((carrera) => [carrera.id, carrera.nombre]));
  }

  return (materias ?? []).map((materia) => ({
    id: materia.id,
    nombre: materia.nombre,
    carreraId: materia.carrera_id,
    carreraNombre: materia.carrera_id
      ? carrerasMap.get(materia.carrera_id) ?? 'Carrera'
      : 'Materia general',
  }));
}

export function DashboardContent() {
  const { user, loading: userLoading, getUserName } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();

  const [dashboardState, setDashboardState] = useState<DashboardState>(() => readLocalState());
  const [allMaterias, setAllMaterias] = useState<MateriaSummary[]>([]);
  const [allMateriasLoading, setAllMateriasLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exploreQuery, setExploreQuery] = useState('');
  const [recentResources, setRecentResources] = useState<DashboardRecentResource[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<Array<{ day: string; count: number }>>([]);
  const [subjectDetails, setSubjectDetails] = useState<SubjectDetailsMap>({});
  const [recommendedSubjects, setRecommendedSubjects] = useState<MateriaSummary[]>([]);
  const [favoriteSubjects, setFavoriteSubjects] = useState<MateriaSummary[]>([]);
  const [favoriteSuggestions, setFavoriteSuggestions] = useState<MateriaSummary[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [partialInsights, setPartialInsights] = useState<PartialStudyInsights | null>(null);

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
    let isMounted = true;

    async function loadSubjectDetails() {
      const subjectIds = dashboardState.activeSubjects.map((subject) => subject.id);

      if (subjectIds.length === 0) {
        if (isMounted) {
          setSubjectDetails({});
        }
        return;
      }

      try {
        const materias = await fetchMateriaSummaries();
        if (!isMounted) {
          return;
        }

        const nextDetails = materias.reduce<SubjectDetailsMap>((acc, materia) => {
          acc[materia.id] = { careerName: materia.carreraNombre };
          return acc;
        }, {});

        setSubjectDetails(nextDetails);
      } catch (error) {
        console.error('Error loading subject details:', error);
      }
    }

    void loadSubjectDetails();

    return () => {
      isMounted = false;
    };
  }, [dashboardState.activeSubjects]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendedSubjects() {
      if (!user || dashboardState.activeSubjects.length > 0) {
        if (isMounted) {
          setRecommendedSubjects([]);
        }
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('carrera_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profile?.carrera_id) {
          if (isMounted) {
            setRecommendedSubjects([]);
          }
          return;
        }

        const materias = await getMateriasByCarrera(profile.carrera_id);
        if (!isMounted) {
          return;
        }

        const carreraNombre =
          allMaterias.find((materia) => materia.carreraId === profile.carrera_id)?.carreraNombre ??
          'Carrera';

        setRecommendedSubjects(
          materias.slice(0, 3).map((materia) => ({
            id: materia.id,
            nombre: materia.nombre,
            carreraId: materia.carrera_id ?? profile.carrera_id,
            carreraNombre,
          }))
        );
      } catch (error) {
        console.error('Error loading recommended subjects:', error);
        if (isMounted) {
          setRecommendedSubjects([]);
        }
      }
    }

    void loadRecommendedSubjects();

    return () => {
      isMounted = false;
    };
  }, [allMaterias, dashboardState.activeSubjects.length, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadPartialInsights() {
      if (!user) {
        if (isMounted) setPartialInsights(null);
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
        if (isMounted) setPartialInsights(null);
        return;
      }

      const insights = await getPartialStudyInsights(materiaId, parcial);
      if (isMounted) {
        setPartialInsights(insights);
      }
    }

    void loadPartialInsights();

    return () => {
      isMounted = false;
    };
  }, [dashboardState.lastSubject?.id, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadFavoritesAndSuggestions() {
      if (!user) {
        if (isMounted) {
          setFavoriteSubjects([]);
          setFavoriteSuggestions([]);
        }
        return;
      }

      setFavoritesLoading(true);

      try {
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('user_favorites')
          .select('materia_id')
          .eq('user_id', user.id)
          .not('materia_id', 'is', null);

        if (favoritesError) {
          throw favoritesError;
        }

        const favoriteIds = Array.from(
          new Set((favoritesData ?? []).map((item) => item.materia_id).filter(Boolean))
        ) as string[];

        if (favoriteIds.length > 0) {
          const { data: materiasData, error: materiasError } = await supabase
            .from('materias')
            .select('id, nombre, carrera_id')
            .in('id', favoriteIds);

          if (materiasError) {
            throw materiasError;
          }

          const carreraIds = Array.from(
            new Set(
              (materiasData ?? [])
                .map((materia) => materia.carrera_id)
                .filter((id): id is string => typeof id === 'string' && id.length > 0)
            )
          );

          let carrerasMap = new Map<string, string>();
          if (carreraIds.length > 0) {
            const { data: carrerasData, error: carrerasError } = await supabase
              .from('carreras')
              .select('id, nombre')
              .in('id', carreraIds);

            if (carrerasError) {
              throw carrerasError;
            }

            carrerasMap = new Map((carrerasData ?? []).map((carrera) => [carrera.id, carrera.nombre]));
          }

          const normalizedFavorites = (materiasData ?? []).map((materia) => ({
            id: materia.id,
            nombre: materia.nombre,
            carreraId: materia.carrera_id,
            carreraNombre: materia.carrera_id
              ? carrerasMap.get(materia.carrera_id) ?? 'Carrera'
              : 'Materia general',
          }));

          if (isMounted) {
            setFavoriteSubjects(normalizedFavorites);
            setFavoriteSuggestions([]);
          }
        } else {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('carrera_id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          if (!profileData?.carrera_id) {
            if (isMounted) {
              setFavoriteSubjects([]);
              setFavoriteSuggestions([]);
            }
            return;
          }

          const suggested = await getMateriasByCarrera(profileData.carrera_id);
          const carreraNombre =
            allMaterias.find((materia) => materia.carreraId === profileData.carrera_id)?.carreraNombre ??
            'Carrera';

          if (isMounted) {
            setFavoriteSubjects([]);
            setFavoriteSuggestions(
              suggested.slice(0, 4).map((materia) => ({
                id: materia.id,
                nombre: materia.nombre,
                carreraId: materia.carrera_id ?? profileData.carrera_id,
                carreraNombre,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Error loading favorites dashboard section:', error);
        if (isMounted) {
          setFavoriteSubjects([]);
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
      const summaries = await fetchMateriaSummaries();
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

  const addSubject = (materia: MateriaSummary) => {
    if (dashboardState.activeSubjects.length >= 6) {
      toast({
        title: 'Limite alcanzado',
        description: 'Solo puedes tener hasta 6 materias activas.',
        variant: 'destructive',
      });
      return;
    }

    const newSubject = { id: materia.id, name: materia.nombre };
    const nextState = touchSubjectState(dashboardState, newSubject);

    persistDashboardState(nextState);
    setSubjectDetails((prev) => ({
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

  const removeSubject = (subjectId: string, subjectName: string) => {
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

  const goToSubject = (subject: DashboardSubjectState) => {
    persistDashboardState(touchSubjectState(dashboardState, subject));
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
  const partialProgressRingStyle = {
    background: `conic-gradient(#4F5DFF ${Math.max(0, Math.min(100, partialInsights?.coberturaPorcentaje ?? 0)) * 3.6}deg, #E6EAF2 ${Math.max(0, Math.min(100, partialInsights?.coberturaPorcentaje ?? 0)) * 3.6}deg)`,
  };
  const subjectAccentStyles = [
    'from-blue-500/15 to-cyan-500/10 border-blue-200/70',
    'from-indigo-500/15 to-violet-500/10 border-indigo-200/70',
    'from-emerald-500/15 to-teal-500/10 border-emerald-200/70',
  ];

  return (
    <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_right,rgba(79,93,255,0.14),transparent_38%),radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.10),transparent_30%),#F3F6FB] font-sans">
      <div className="w-full p-2 md:p-3">
        <div className="mx-auto max-w-6xl lg:[zoom:0.9]">
          <div className="mb-3 flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#4F46E5] bg-clip-text text-lg font-bold tracking-[-0.04em] text-transparent md:text-xl">
                {`¡Hola, ${getUserName()}!`}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Un resumen simple de lo ultimo que tocaste.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 xl:max-w-xl xl:items-end">
              <form onSubmit={handleExploreSubmit} className="w-full">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={exploreQuery}
                    onChange={(event) => setExploreQuery(event.target.value)}
                    placeholder="Buscar materias..."
                    className="h-9 rounded-lg border-slate-200/80 bg-white/90 pl-9 pr-16 text-sm shadow-sm shadow-slate-200/60 backdrop-blur focus-visible:ring-[#4F5DFF]/25"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 inline-flex h-6 -translate-y-1/2 items-center rounded-md bg-gradient-to-r from-[#0F172A] to-[#2563EB] px-2 text-[10px] font-semibold text-white transition hover:opacity-95"
                  >
                    Explorar
                  </button>
                </div>
              </form>
              {isSaving ? (
                <span className="text-xs text-slate-400">Sincronizando cambios...</span>
              ) : null}
            </div>
          </div>

          {dashboardError ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {dashboardError}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card
              id="materias-favoritas"
              className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-950">
                    Mis materias
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Ultimas 3 materias en las que entraste.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-xl border-slate-200 bg-white px-4 text-xs shadow-sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Anadir
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
                  <div className="grid gap-3 md:grid-cols-3">
                    {recentSubjects.map((subject, index) => (
                      <div
                        key={subject.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => goToSubject(subject)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            goToSubject(subject);
                          }
                        }}
                        className={`rounded-xl border bg-gradient-to-br p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${subjectAccentStyles[index % subjectAccentStyles.length]}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-slate-700 shadow-sm">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeSubject(subject.id, subject.name);
                            }}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
                            aria-label={`Eliminar ${subject.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <h3 className="mt-4 line-clamp-2 text-lg font-semibold text-slate-950">
                          {subject.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {subjectDetails[subject.id]?.careerName ?? 'Carrera'}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
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
                      Todavia no tienes materias recientes
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Anade una materia y la dejamos lista para volver rapido desde aca.
                    </p>
                    {recommendedSubjects.length > 0 ? (
                      <div className="mt-8">
                        <p className="mb-4 text-left text-sm font-semibold text-slate-900">
                          Materias recomendadas segun tu carrera
                        </p>
                        <div className="grid gap-3 md:grid-cols-3">
                          {recommendedSubjects.map((materia) => (
                            <button
                              key={materia.id}
                              type="button"
                              onClick={() => addSubject(materia)}
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
                                Anadir materia
                                <ArrowUpRight className="h-4 w-4" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-950">
                  Continua estudiando
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Los ultimos archivos que abriste.
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
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
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
                      Aun no abriste archivos
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Cuando abras resumenes o recursos, apareceran aca.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-950">
                  Radar de confianza
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Progreso en parcial y probabilidad estimada de aprobar.
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                {partialInsights ? (
                  <div className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-4">
                    <div className="relative grid h-32 w-32 place-items-center rounded-full" style={partialProgressRingStyle}>
                      <div className="grid h-24 w-24 place-items-center rounded-full bg-white">
                        <p className="text-2xl font-black text-slate-900">{partialInsights.coberturaPorcentaje}%</p>
                        <p className="text-[10px] text-slate-500">Progreso</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-700">
                        Parcial {partialInsights.parcial} · {partialInsights.preguntasRespondidasParcial}/{partialInsights.totalPreguntasParcial} preguntas respondidas
                      </p>
                      <p className="text-slate-700">
                        Modelos realizados: <span className="font-semibold">{partialInsights.modelosEstimadosRealizados}</span>
                      </p>
                      <p className="text-slate-700">
                        Promedio de acierto: <span className="font-semibold">{partialInsights.promedioAciertoPorcentaje}%</span>
                      </p>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                        Posibilidad de aprobar: <span className="font-bold">{partialInsights.probabilidadAprobar}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Inicia un simulador para activar el radar de confianza de tu parcial.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-950">
                  Materias favoritas
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Tus accesos directos guardados para entrar mas rapido.
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
                ) : favoriteSubjects.length > 0 ? (
                  favoriteSubjects.slice(0, 4).map((materia) => (
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
                      Aun no tienes materias favoritas
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Te sugerimos estas materias segun la carrera que mas usas.
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

            <Card className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur xl:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-950">
                    Tu progreso esta semana
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Frecuencia de ingreso durante los ultimos 7 dias.
                  </p>
                </div>
                <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                  {getWeeklyTotalLabel(weeklyProgress)}
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={weeklyProgress}
                      margin={{ top: 18, right: 12, left: -16, bottom: 0 }}
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
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#CBD5E1', fontSize: 11 }}
                        width={26}
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
            <DialogContent className="max-w-3xl rounded-xl">
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
                        onClick={() => addSubject(materia)}
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
