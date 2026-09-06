'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  use,
  Suspense,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Flame,
  GraduationCap,
  Heart,
  PlayCircle,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { getDashboardMateriaRoute, getMateriaRoute, getSimulatorRoute } from '@/lib/routes';
import {
  getBestPartialStudyInsights,
  getDashboardLastAttempts,
  getDashboardState,
  getPartialStudyInsights,
  saveDashboardState,
  type DashboardLastAttempt,
  type DashboardState,
  type PartialStudyInsights,
} from '@/lib/actions/dashboard';
import { hasUpcomingExam } from '@/lib/actions/calendario';
import { getMateriasByCarrera } from '@/services/api';
import { readRecentResources, type DashboardRecentResource } from '@/lib/dashboard-client';
import {
  DEMO_MIGRATION_FLAG_KEY,
  listPersistedSimulatorStates,
  migrateDemoToFullSnapshots,
  type SimuladorPersistedState,
} from '@/lib/simulator-persistence';
import {
  fetchDashboardAcademicProfile,
  fetchDashboardMateriaDetailsByIds,
  fetchDashboardFavoriteMateriaIds,
  fetchDashboardMateriasByIds,
  mapDashboardMateriaDetails,
  searchDashboardMateriaSummaries,
  touchDashboardMateriaState,
  type DashboardAcademicProfile,
  type DashboardMateriaDetailsMap,
  type DashboardMateriaSummary,
} from '@/lib/data/dashboard';
import type { DashboardBootstrapData, DashboardDeferredData } from '@/lib/data/dashboard-bootstrap';
import { useShellData } from '@/components/ShellDataProvider';
import { logError } from '@/lib/observability';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import type { DashboardMateriaState } from '@/lib/dashboard-state';
import { StudyRecommendationsPanel } from '@/components/dashboard/study-recommendations-panel';
import { GuidedTour, type GuidedTourStep } from '@/components/ui/guided-tour';

type MateriaSummary = DashboardMateriaSummary;
type MateriaDetailsMap = DashboardMateriaDetailsMap;

type SimuladorInProgressSnapshot = SimuladorPersistedState;

function getDashboardTourStorageKey(userId: string) {
  return `evaluo_dashboard_tour_seen:${userId}`;
}

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
    logError('dashboard.readLocalState', error);
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
    return 'Trabajo práctico';
  }

  return type;
}

function normalizeHeroTitle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Tu materia';
  const lower = trimmed.toLocaleLowerCase('es-AR');
  return lower.replace(/\b\p{L}/gu, (char) => char.toLocaleUpperCase('es-AR'));
}

const DASHBOARD_PANEL_CLASS = 'surface-panel';

function DeferredBootstrapHydrator({
  dataPromise,
  onResolve,
}: {
  dataPromise: Promise<DashboardDeferredData>;
  onResolve: (data: DashboardDeferredData) => void;
}) {
  const data = use(dataPromise);

  useEffect(() => {
    onResolve(data);
  }, [data, onResolve]);

  return null;
}

export function DashboardContent({
  initialBootstrap,
  deferredBootstrap,
}: {
  initialBootstrap?: DashboardBootstrapData;
  deferredBootstrap?: Promise<DashboardDeferredData>;
}) {
  const { user, loading: userLoading, getUserName } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();
  const hasServerBootstrap = Boolean(initialBootstrap);

  const [dashboardState, setDashboardState] = useState<DashboardState>(
    initialBootstrap?.state ?? DEFAULT_STATE
  );
  const [allMaterias, setAllMaterias] = useState<MateriaSummary[]>([]);
  const [allMateriasLoading, setAllMateriasLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(!hasServerBootstrap);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [recentResources, setRecentResources] = useState<DashboardRecentResource[]>([]);
  const [materiaDetails, setMateriaDetails] = useState<MateriaDetailsMap>(
    initialBootstrap?.materiaDetails ?? {}
  );
  const [recommendedMaterias, setRecommendedMaterias] = useState<MateriaSummary[]>(
    initialBootstrap?.recommendedMaterias ?? []
  );
  const [favoriteMaterias, setFavoriteMaterias] = useState<MateriaSummary[]>(
    initialBootstrap?.favoriteMaterias ?? []
  );
  const [favoriteSuggestions, setFavoriteSuggestions] = useState<MateriaSummary[]>(
    initialBootstrap?.favoriteSuggestions ?? []
  );
  const [academicProfile, setAcademicProfile] = useState<DashboardAcademicProfile | null>(
    initialBootstrap?.academicProfile ?? null
  );
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [partialInsights, setPartialInsights] = useState<PartialStudyInsights | null>(
    initialBootstrap?.partialInsights ?? null
  );
  const [partialInsightMateriaName, setPartialInsightMateriaName] = useState<string | null>(
    initialBootstrap?.partialInsightMateriaName ?? null
  );
  const [simuladorInProgress, setSimuladorInProgress] =
    useState<SimuladorInProgressSnapshot | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showDashboardTour, setShowDashboardTour] = useState(false);
  const [dashboardTourStepIndex, setDashboardTourStepIndex] = useState(0);
  const [heroNavigationPending, setHeroNavigationPending] = useState(false);
  const dashboardTourDismissedRef = useRef(false);
  const heroTourRef = useRef<HTMLDivElement | null>(null);
  const checklistTourRef = useRef<HTMLDivElement | null>(null);
  const tabsTourRef = useRef<HTMLDivElement | null>(null);
  const [subjectInsights, setSubjectInsights] = useState<
    Record<string, PartialStudyInsights | null>
  >(() => {
    const seed: Record<string, PartialStudyInsights | null> = {};
    if (initialBootstrap?.partialInsights) {
      seed[initialBootstrap.partialInsights.materiaId] = initialBootstrap.partialInsights;
    }
    return seed;
  });
  const [progressLoading, setProgressLoading] = useState(false);
  const [lastAttempts, setLastAttempts] = useState<Record<string, DashboardLastAttempt | null>>({});
  const [hasExamEvent, setHasExamEvent] = useState(false);
  const { streak } = useShellData();
  const streakDays = streak?.streakDays ?? 0;

  const applyDeferredBootstrap = useCallback((data: DashboardDeferredData) => {
    setMateriaDetails((current) => ({ ...current, ...data.materiaDetails }));
    if (data.academicProfile) setAcademicProfile(data.academicProfile);
    setRecommendedMaterias((current) => (current.length > 0 ? current : data.recommendedMaterias));
    setFavoriteMaterias((current) => (current.length > 0 ? current : data.favoriteMaterias));
    setFavoriteSuggestions((current) => (current.length > 0 ? current : data.favoriteSuggestions));
    setPartialInsights(data.partialInsights);
    setPartialInsightMateriaName(data.partialInsightMateriaName);
    if (data.partialInsights) {
      setSubjectInsights((current) => ({
        ...current,
        [data.partialInsights!.materiaId]: data.partialInsights,
      }));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void hasUpcomingExam().then((hasExam) => {
      if (active) setHasExamEvent(hasExam);
    });
    return () => {
      active = false;
    };
  }, [user]);

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
        }
        return;
      }

      setDashboardLoading(true);
      setDashboardError(null);

      if (hasServerBootstrap) {
        if (isMounted) {
          setRecentResources(readRecentResources().slice(0, 3));
          setDashboardLoading(false);
        }
        return;
      }

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
      const cameFromDemo = window.localStorage.getItem(DEMO_MIGRATION_FLAG_KEY) === '1';

      if (cameFromDemo) {
        migrateDemoToFullSnapshots(user.id);
        setShowWelcomeModal(true);
        trackMarketingEvent('post_signup_landing', {
          destination: 'dashboard',
          origin: 'simulator_demo',
        });
      }

      const found = listPersistedSimulatorStates(user.id);
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

      if (subjectIds.every((subjectId) => materiaDetails[subjectId])) {
        return;
      }

      try {
        const materias = await fetchDashboardMateriaDetailsByIds(subjectIds);
        if (!isMounted) {
          return;
        }
        setMateriaDetails(mapDashboardMateriaDetails(materias));
      } catch (error) {
        logError('dashboard.loadMateriaDetails', error, { subjectIds });
      }
    }

    void loadMateriaDetails();

    return () => {
      isMounted = false;
    };
  }, [dashboardState.activeSubjects]);

  const insightsFetchingRef = useRef(false);

  const refreshSubjectInsights = useCallback(async () => {
    if (userLoading || !user) {
      return;
    }

    if (insightsFetchingRef.current) {
      return;
    }

    const subjectIds = [
      ...(dashboardState.lastSubject ? [dashboardState.lastSubject.id] : []),
      ...dashboardState.activeSubjects.map((subject) => subject.id),
    ];
    const uniqueIds = [...new Set(subjectIds)].slice(0, 4);

    if (uniqueIds.length === 0) {
      setSubjectInsights({});
      setProgressLoading(false);
      return;
    }

    insightsFetchingRef.current = true;
    setProgressLoading(true);

    try {
      const [insightResults, attempts] = await Promise.all([
        Promise.all(
          uniqueIds.map(async (materiaId) => ({
            materiaId,
            insight: await getBestPartialStudyInsights(materiaId),
          }))
        ),
        getDashboardLastAttempts(uniqueIds),
      ]);
      const next: Record<string, PartialStudyInsights | null> = {};
      for (const result of insightResults) {
        next[result.materiaId] = result.insight;
      }
      setSubjectInsights((current) => ({ ...current, ...next }));
      setLastAttempts(attempts);
    } finally {
      insightsFetchingRef.current = false;
      setProgressLoading(false);
    }
  }, [user, userLoading, dashboardState.lastSubject, dashboardState.activeSubjects]);

  useEffect(() => {
    void refreshSubjectInsights();
  }, [refreshSubjectInsights]);

  useEffect(() => {
    const refreshWhenRelevant = () => {
      if (document.visibilityState === 'visible') {
        void refreshSubjectInsights();
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === 'evaluo_last_simulador_context' ||
        (event.key && event.key.startsWith('evaluo_simulador_in_progress:'))
      ) {
        refreshWhenRelevant();
      }
    };

    document.addEventListener('visibilitychange', refreshWhenRelevant);
    window.addEventListener('pageshow', refreshWhenRelevant);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenRelevant);
      window.removeEventListener('pageshow', refreshWhenRelevant);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshSubjectInsights]);

  useEffect(() => {
    let isMounted = true;

    async function loadAcademicProfile() {
      if (!user) {
        if (isMounted) {
          setAcademicProfile(null);
        }
        return;
      }

      if (academicProfile) {
        return;
      }

      try {
        const profile = await fetchDashboardAcademicProfile(user.id);
        if (isMounted) {
          setAcademicProfile(profile);
        }
      } catch (error) {
        logError('dashboard.loadAcademicProfile', error, { userId: user.id });
        if (isMounted) {
          setAcademicProfile(null);
        }
      }
    }

    void loadAcademicProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendedMaterias() {
      if (!user || dashboardState.activeSubjects.length > 0) {
        if (isMounted) {
          setRecommendedMaterias([]);
        }
        return;
      }

      if (recommendedMaterias.length > 0) {
        return;
      }

      try {
        const carreraId = academicProfile?.carreraId ?? null;

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
        logError('dashboard.loadRecommendedMaterias', error, {
          userId: user.id,
          carreraId: academicProfile?.carreraId ?? null,
        });
        if (isMounted) {
          setRecommendedMaterias([]);
        }
      }
    }

    void loadRecommendedMaterias();

    return () => {
      isMounted = false;
    };
  }, [academicProfile?.carreraId, allMaterias, dashboardState.activeSubjects.length, user]);

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

      if (partialInsights && partialInsightMateriaName) {
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

      if (favoriteMaterias.length > 0 || favoriteSuggestions.length > 0) {
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
          const carreraId = academicProfile?.carreraId ?? null;

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
        logError('dashboard.loadFavoritesSection', error, {
          userId: user.id,
          carreraId: academicProfile?.carreraId ?? null,
        });
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
  }, [academicProfile?.carreraId, allMaterias, user]);

  useEffect(() => {
    if (!showAddModal) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        void loadAllMaterias(deferredSearchTerm);
      },
      deferredSearchTerm.trim().length > 0 ? 180 : 0
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [deferredSearchTerm, showAddModal]);

  const persistDashboardState = (nextState: DashboardState) => {
    setDashboardState(nextState);
    writeLocalState(nextState);

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

  const loadAllMaterias = async (query = '') => {
    setAllMateriasLoading(true);
    try {
      const summaries = await searchDashboardMateriaSummaries(
        query,
        24,
        academicProfile?.carreraId
      );
      setAllMaterias(summaries);
    } catch (error) {
      logError('dashboard.loadMaterias', error, { query });
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
        description: 'Solo podés tener hasta 6 materias activas.',
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
      title: 'Materia agregada',
      description: materia.nombre,
    });
  };

  const removeMateria = (subjectId: string, subjectName: string) => {
    const nextActiveSubjects = dashboardState.activeSubjects.filter(
      (subject) => subject.id !== subjectId
    );
    const nextLastSubject =
      dashboardState.lastSubject?.id === subjectId
        ? (nextActiveSubjects[0] ?? null)
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

  const recentSubjects = dashboardState.activeSubjects.slice(0, 3);
  const nextStudyAction = useMemo(() => {
    if (simuladorInProgress) {
      const href =
        simuladorInProgress.mode === 'errores'
          ? `/simulador/errores/${simuladorInProgress.materiaId}?parcial=${simuladorInProgress.parcial}`
          : `/simulador/${simuladorInProgress.materiaId}/${simuladorInProgress.parcial}`;

      return {
        title: 'Retomá donde dejaste',
        description: 'Tenés un intento en curso. Volvé exactamente donde lo dejaste.',
        cta: 'Continuar preparación',
        onClick: () => router.push(href),
      };
    }

    if (dashboardState.lastSubject) {
      return {
        title: 'Continuá con tu última materia',
        description: `Volvé a ${dashboardState.lastSubject.name} y elegí la próxima actividad de estudio.`,
        cta: 'Continuar preparación',
        onClick: () => goToMateria(dashboardState.lastSubject as DashboardMateriaState),
      };
    }

    if (recommendedMaterias[0]) {
      return {
        title: 'Empezá por una materia recomendada',
        description: `Te sugerimos arrancar con ${recommendedMaterias[0].nombre} para activar tu recorrido.`,
        cta: 'Agregar recomendada',
        onClick: () => addMateria(recommendedMaterias[0]),
      };
    }

    return {
      title: 'Explorá tu plan de estudio',
      description: 'Buscá una materia y armá tu espacio para volver rápido a lo importante.',
      cta: 'Ir a explorar',
      onClick: () => router.push('/explorar'),
    };
  }, [dashboardState.lastSubject, recommendedMaterias, router, simuladorInProgress]);

  const primarySubjectId =
    dashboardState.lastSubject?.id ??
    dashboardState.activeSubjects[0]?.id ??
    simuladorInProgress?.materiaId ??
    partialInsights?.materiaId ??
    '';
  const hasAnySubject =
    dashboardState.activeSubjects.length > 0 || Boolean(dashboardState.lastSubject);
  const isNewUser =
    Boolean(user) &&
    !dashboardLoading &&
    !hasAnySubject &&
    !partialInsights &&
    !simuladorInProgress;
  const onboardingMilestones = [
    {
      id: 'materia',
      label: 'Elegí tu primera materia',
      description:
        'Agregá una materia de tu carrera para activar resúmenes, pregunteros y simulacros.',
      done: hasAnySubject,
      locked: false,
      action: () => setShowAddModal(true),
      actionLabel: 'Elegir materia',
    },
    {
      id: 'practica',
      label: 'Respondé 5 preguntas de práctica',
      description:
        'Empezá una práctica corta para conocer la dinámica sin completar todo el parcial.',
      done: (partialInsights?.preguntasRespondidasParcial ?? 0) >= 5,
      locked: !hasAnySubject,
      action: () => router.push(getSimulatorRoute(primarySubjectId, 1)),
      actionLabel: 'Practicar ahora',
    },
    {
      id: 'practica_completa',
      label: 'Completá tu primera práctica',
      description: 'Volvé a la misma práctica, terminá el parcial y revisá el resultado completo.',
      done: (partialInsights?.modelosEstimadosRealizados ?? 0) >= 1,
      locked: !hasAnySubject,
      action: () => router.push(getSimulatorRoute(primarySubjectId, 1)),
      actionLabel: 'Completar práctica',
    },
    {
      id: 'calendario',
      label: 'Cargá tu parcial en el calendario',
      description:
        'Con la fecha de tu examen, Evaluo te dice qué practicar cada día antes de rendir.',
      done: hasExamEvent,
      locked: !hasAnySubject,
      action: () => router.push('/calendario'),
      actionLabel: 'Agregar fecha',
    },
  ];
  const onboardingProgress = onboardingMilestones.filter((milestone) => milestone.done).length;
  const showOnboardingChecklist = Boolean(user) && !dashboardLoading && onboardingProgress < 4;
  const currentMilestone =
    onboardingMilestones.find((milestone) => !milestone.done) ?? onboardingMilestones[0];

  const dashboardTourSteps: GuidedTourStep[] = [
    {
      title: 'Este es tu tablero',
      description:
        'Acá ves tu cobertura de estudio y tu próxima actividad. Cuanto más practicás, más avanzás.',
      target: { type: 'ref', ref: heroTourRef },
    },
    {
      title: 'Seguí tu primer recorrido',
      description:
        'Elegí tu primera materia, respondé 5 preguntas, completá la práctica y cargá la fecha del parcial. Cada paso desbloquea el siguiente.',
      target: { type: 'ref', ref: checklistTourRef },
    },
    {
      title: 'Navegá desde el menú',
      description:
        'Desde el menú entrás a tus materiales, simuladores, calendario y resultados. En Mi espacio subís un PDF y la IA lo convierte en resúmenes, glosario, tarjetas y ejercicios.',
      target: {
        type: 'selector',
        selector: '[data-tour-nav-espacio]',
        mobileSelector: '[data-tour-nav-mobile]',
      },
    },
    {
      title: 'Tu progreso en detalle',
      description:
        'En Progreso ves el detalle de cada materia y tu nivel de preparación. También tenés Recientes, Favoritas y Recursos.',
      target: { type: 'ref', ref: tabsTourRef },
    },
  ];

  const closeDashboardTour = useCallback(() => {
    dashboardTourDismissedRef.current = true;
    setShowDashboardTour(false);
    if (typeof window !== 'undefined' && user) {
      window.localStorage.setItem(getDashboardTourStorageKey(user.id), 'done');
    }
  }, [user]);

  const handleDashboardTourNext = useCallback(() => {
    if (dashboardTourStepIndex >= dashboardTourSteps.length - 1) {
      closeDashboardTour();
      return;
    }
    setDashboardTourStepIndex((current) => current + 1);
  }, [dashboardTourStepIndex, dashboardTourSteps.length, closeDashboardTour]);

  const handleDashboardTourPrevious = useCallback(() => {
    if (dashboardTourStepIndex === 0) {
      return;
    }
    setDashboardTourStepIndex((current) => current - 1);
  }, [dashboardTourStepIndex]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !user ||
      dashboardLoading ||
      showWelcomeModal ||
      dashboardTourDismissedRef.current
    ) {
      return;
    }
    if (onboardingProgress >= onboardingMilestones.length) {
      return;
    }
    if (window.localStorage.getItem(getDashboardTourStorageKey(user.id)) === 'done') {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDashboardTourStepIndex(0);
      setShowDashboardTour(true);
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [user, dashboardLoading, showWelcomeModal, onboardingProgress]);

  const heroSubjectName = normalizeHeroTitle(
    partialInsightMateriaName ??
      dashboardState.lastSubject?.name ??
      recommendedMaterias[0]?.nombre ??
      'Tu materia'
  );
  const heroCoverage = Math.max(0, Math.min(100, partialInsights?.coberturaPorcentaje ?? 0));
  const hasStartedPracticing = (partialInsights?.preguntasRespondidasParcial ?? 0) > 0;
  const heroPrimaryAction = simuladorInProgress
    ? nextStudyAction.onClick
    : partialInsights
      ? () => router.push(`/simulador/${partialInsights.materiaId}/${partialInsights.parcial}`)
      : nextStudyAction.onClick;
  const heroPrimaryLabel = simuladorInProgress
    ? 'Continuar preparación'
    : hasStartedPracticing
      ? 'Seguir practicando'
      : nextStudyAction.cta;
  const heroPrimaryDestination = simuladorInProgress
    ? simuladorInProgress.mode === 'errores'
      ? 'error_practice'
      : 'simulator_resume'
    : partialInsights
      ? 'simulator_practice'
      : dashboardState.lastSubject
        ? 'subject'
        : 'explore';
  const handleHeroPrimaryAction = useCallback(() => {
    if (heroNavigationPending) {
      return;
    }
    setHeroNavigationPending(true);
    trackMarketingEvent('cta_click', {
      location: 'dashboard_hero',
      cta_name: heroPrimaryLabel,
      destination: heroPrimaryDestination,
    });
    heroPrimaryAction();
    window.setTimeout(() => setHeroNavigationPending(false), 8_000);
  }, [heroNavigationPending, heroPrimaryAction, heroPrimaryDestination, heroPrimaryLabel]);
  const subjectAccentStyles = [
    'from-blue-500/15 to-cyan-500/10 border-blue-200/70',
    'from-indigo-500/15 to-violet-500/10 border-indigo-200/70',
    'from-emerald-500/15 to-teal-500/10 border-emerald-200/70',
  ];

  const progressSubjects = useMemo(() => {
    const seen = new Set<string>();
    const subjects: { id: string; name: string; insight: PartialStudyInsights | null }[] = [];

    const candidates = [
      ...(dashboardState.lastSubject ? [dashboardState.lastSubject] : []),
      ...dashboardState.activeSubjects,
    ];

    for (const subject of candidates) {
      if (seen.has(subject.id)) {
        continue;
      }
      seen.add(subject.id);
      subjects.push({
        id: subject.id,
        name: subject.name,
        insight: subjectInsights[subject.id] ?? null,
      });
    }

    return subjects.sort((a, b) => {
      if (a.insight && !b.insight) return -1;
      if (!a.insight && b.insight) return 1;
      if (!a.insight && !b.insight) return 0;
      return (a.insight?.coberturaPorcentaje ?? 0) - (b.insight?.coberturaPorcentaje ?? 0);
    });
  }, [dashboardState.lastSubject, dashboardState.activeSubjects, subjectInsights]);

  const resumeSimulator = simuladorInProgress
    ? {
        href:
          simuladorInProgress.mode === 'errores'
            ? `/simulador/errores/${simuladorInProgress.materiaId}?parcial=${simuladorInProgress.parcial}`
            : `/simulador/${simuladorInProgress.materiaId}/${simuladorInProgress.parcial}`,
        parcial: simuladorInProgress.parcial,
        questionLabel: `${Math.min(
          simuladorInProgress.currentQuestionIndex + 1,
          simuladorInProgress.preguntas.length
        )} de ${simuladorInProgress.preguntas.length}`,
        subjectName:
          [dashboardState.lastSubject, ...dashboardState.activeSubjects].find(
            (subject) => subject && subject.id === simuladorInProgress.materiaId
          )?.name ?? null,
      }
    : null;

  const emptyStateGuide = (
    <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-center">
      <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
      <h3 className="mt-3 text-base font-semibold text-slate-900">
        Todavía no tenés materias recientes
      </h3>
      <p className="mt-1 text-sm text-slate-500">Empezá a estudiar en 4 pasos:</p>
      <ol className="mx-auto mt-5 max-w-md space-y-2.5 text-left">
        {[
          {
            title: 'Elegí tu materia',
            description:
              'Agregá una materia de tu carrera para activar resúmenes, pregunteros y simulacros.',
          },
          {
            title: 'Probá 5 preguntas',
            description: 'Conocé la dinámica con una práctica corta y corrección inmediata.',
          },
          {
            title: 'Completá la práctica',
            description: 'Terminá el parcial y revisá el resultado completo.',
          },
          {
            title: 'Agendá tu parcial',
            description: 'Cargá la fecha para recibir un próximo paso concreto.',
          },
        ].map((step, index) => (
          <li
            key={step.title}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{step.title}:</span> {step.description}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button size="sm" className="rounded-xl" onClick={() => setShowAddModal(true)}>
          Elegir mi primera materia
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-slate-200 bg-white"
          onClick={() => {
            const sampleMateriaId = recommendedMaterias[0]?.id ?? dashboardState.lastSubject?.id;
            if (sampleMateriaId) {
              router.push(getSimulatorRoute(sampleMateriaId, 1));
            } else {
              router.push('/explorar');
            }
          }}
        >
          Probá preguntas de muestra
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-slate-200 bg-white"
          onClick={() => router.push('/explorar')}
        >
          Explorar materias
        </Button>
      </div>
      {recommendedMaterias.length > 0 ? (
        <div className="mx-auto mt-6 max-w-md border-t border-slate-200 pt-4 text-left">
          <p className="text-sm font-semibold text-slate-900">Empezá con una materia recomendada</p>
          <div className="mt-2 space-y-2">
            {recommendedMaterias.map((materia) => (
              <div
                key={materia.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{materia.nombre}</p>
                  <p className="truncate text-xs text-slate-500">{materia.carreraNombre}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 rounded-xl border-slate-200 bg-white px-3"
                  onClick={() => {
                    addMateria(materia);
                    router.push(getMateriaRoute(materia.id));
                  }}
                >
                  Empezar
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  if (dashboardLoading && recentSubjects.length === 0) {
    return (
      <div className="animate-page-enter flex-1 overflow-auto bg-white font-sans">
        <div className="w-full p-2 md:p-3">
          <div className="mx-auto max-w-6xl">
            <div className={`${DASHBOARD_PANEL_CLASS} mb-4 px-5 py-5`}>
              <div className="h-7 w-56 animate-pulse rounded-lg bg-white" />
              <div className="mt-3 h-4 w-80 animate-pulse rounded-lg bg-white" />
              <div className="mt-5 h-10 animate-pulse rounded-xl bg-white" />
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="surface-card h-28 animate-pulse rounded-[var(--radius-card)] bg-white/90"
                />
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
    <div className="animate-page-enter flex-1 overflow-x-hidden overflow-y-auto bg-white font-sans">
      {deferredBootstrap ? (
        <Suspense fallback={null}>
          <DeferredBootstrapHydrator
            dataPromise={deferredBootstrap}
            onResolve={applyDeferredBootstrap}
          />
        </Suspense>
      ) : null}
      <div className="w-full px-2.5 py-2 sm:p-3">
        <div className="mx-auto max-w-6xl">
          <div className="animate-study-reveal mb-5 grid gap-4 px-1 py-1 sm:px-0 sm:py-0 xl:grid-cols-[1fr_minmax(320px,460px)] xl:items-start">
            <div className="min-w-0">
              <h1 className="text-heading text-[1.82rem] font-bold tracking-[-0.06em] sm:text-[2rem]">
                {`\u00A1Hola, ${getUserName()}!`}
                <span className="ml-2 inline-block" aria-hidden="true">
                  {'\uD83D\uDC4B'}
                </span>
              </h1>
              {academicProfile?.carreraNombre ? (
                <p className="mt-1 text-sm font-medium text-slate-600 sm:text-[15px]">
                  {academicProfile.universidadNombre
                    ? `${academicProfile.carreraNombre} · ${academicProfile.universidadNombre}`
                    : academicProfile.carreraNombre}
                </p>
              ) : null}
              <p className="mt-1 text-base font-medium text-slate-500 sm:text-[17px]">
                {'\u00BFQu\u00E9 vas a estudiar hoy?'}
              </p>
            </div>

            <div className="flex w-full items-center justify-end gap-2">
              {isSaving ? (
                <span className="pl-1 text-xs text-slate-500">Sincronizando cambios...</span>
              ) : null}
            </div>
          </div>
          {dashboardError ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {dashboardError}
            </div>
          ) : null}

          <div
            ref={heroTourRef}
            data-tour-target-hero
            className="animate-study-reveal mb-5 overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,var(--brand)_0%,#4F46E5_45%,var(--brand-2)_100%)] px-4.5 py-4 text-white shadow-[0_22px_50px_rgba(37,99,235,0.22)] sm:px-6 sm:py-4"
          >
            <div className="mx-auto grid max-w-[1000px] gap-5 xl:grid-cols-[1.18fr_0.82fr] xl:items-center">
              <div
                className={
                  isNewUser ? 'min-w-0' : 'grid gap-4 lg:grid-cols-[0.52fr_0.95fr] lg:items-center'
                }
              >
                {isNewUser ? (
                  <div className="max-w-[620px] min-w-0">
                    <p className="text-[12px] font-bold tracking-[0.14em] text-white/85 uppercase">
                      Primeros pasos
                    </p>
                    <h2 className="mt-2 text-[1.5rem] leading-[1.08] font-bold tracking-[-0.05em] text-white sm:text-[1.85rem]">
                      Armemos tu espacio de estudio
                    </h2>
                    <p className="mt-3 max-w-[500px] text-[0.95rem] leading-6 font-medium text-white/85">
                      Elegí tu primera materia y activá materiales y prácticas de tu cátedra. Te
                      acompañamos con 4 pasos para que arranques desde hoy.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="text-brand h-12 w-full rounded-xl bg-white px-6 text-[13px] font-semibold shadow-[0_12px_24px_rgba(17,24,39,0.16)] hover:bg-white/95 sm:w-auto"
                      >
                        Elegir mi primera materia
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => router.push('/explorar')}
                        className="h-12 w-full rounded-xl border border-white/25 bg-white/10 px-6 text-[13px] font-semibold text-white hover:bg-white/20 sm:w-auto"
                      >
                        Explorar materias
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="max-w-[520px] min-w-0">
                      <h2 className="max-w-full text-[1.48rem] leading-[1.06] font-bold tracking-[-0.05em] text-white sm:max-w-[230px] sm:text-[1.62rem]">
                        {simuladorInProgress
                          ? 'Retomá donde dejaste'
                          : hasStartedPracticing
                            ? 'Tu próxima actividad'
                            : nextStudyAction.title}
                      </h2>
                      <p className="mt-3 max-w-full text-[0.9rem] leading-6 font-medium text-white/88 sm:max-w-[230px]">
                        {simuladorInProgress
                          ? 'Tenés un intento en curso. Tu progreso está guardado y podés continuar desde la última pregunta.'
                          : hasStartedPracticing
                            ? `Seguí practicando ${heroSubjectName} para reforzar lo que todavía te cuesta.`
                            : nextStudyAction.description}
                      </p>
                      <Button
                        onClick={handleHeroPrimaryAction}
                        disabled={heroNavigationPending}
                        aria-busy={heroNavigationPending}
                        className="text-brand mt-4 h-10 w-full rounded-xl bg-white px-4.5 text-[12.5px] font-semibold shadow-[0_12px_24px_rgba(17,24,39,0.14)] hover:bg-white/95 sm:h-9 sm:w-auto"
                      >
                        {heroNavigationPending ? 'Preparando simulador…' : heroPrimaryLabel}
                      </Button>
                    </div>
                    <div className="min-w-0 pl-0 sm:pl-4 lg:pl-6">
                      <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-center">
                        <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `conic-gradient(#FFFFFF 0deg ${heroCoverage * 3.6}deg, rgba(255,255,255,0.2) ${heroCoverage * 3.6}deg 360deg)`,
                            }}
                          />
                          <div className="bg-brand relative flex h-[76px] w-[76px] items-center justify-center rounded-full">
                            <p className="text-[24px] leading-none font-bold text-white">
                              {heroCoverage}%
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="max-w-[300px] text-[12px] leading-5 font-semibold tracking-[0.01em] text-white/90 uppercase sm:max-w-[330px]">
                            {heroSubjectName}
                          </p>
                          {partialInsights ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-white/14 bg-white/10 px-2 py-0.5 text-[12px] font-semibold tracking-[0.08em] text-white/88 uppercase">
                                Parcial {partialInsights.parcial}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className={`mt-3.5 grid max-w-[360px] gap-2 min-[480px]:max-w-[430px] sm:gap-2 ${partialInsights ? 'grid-cols-3' : 'grid-cols-2'}`}
                      >
                        <div className="rounded-[18px] border border-white/12 bg-white/8 px-2.5 py-1.5 text-center backdrop-blur sm:rounded-2xl sm:px-3 sm:py-2">
                          <p className="text-[15px] font-bold text-white sm:text-[17px]">
                            {partialInsights?.preguntasRespondidasParcial?.toLocaleString(
                              'es-AR'
                            ) ?? 0}
                          </p>
                          <p className="mt-0.5 text-[12px] leading-4 text-white/85 sm:mt-1 sm:text-[12px] sm:leading-4">
                            Preguntas practicadas
                          </p>
                          <p className="mt-1 text-[10.5px] leading-3.5 text-white/70">
                            Respondé más para subir tu cobertura
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-white/12 bg-white/8 px-2.5 py-1.5 text-center backdrop-blur sm:rounded-2xl sm:px-3 sm:py-2">
                          <p className="text-[15px] font-bold text-white sm:text-[17px]">
                            {partialInsights?.preguntasAcertadasParcial?.toLocaleString('es-AR') ??
                              0}
                          </p>
                          <p className="mt-0.5 text-[12px] leading-4 text-white/85 sm:mt-1 sm:text-[12px] sm:leading-4">
                            Preguntas acertadas
                          </p>
                          <p className="mt-1 text-[10.5px] leading-3.5 text-white/70">
                            Repasá tus errores para acertar más
                          </p>
                        </div>
                        {partialInsights ? (
                          <div className="rounded-[18px] border border-emerald-300/40 bg-emerald-400/15 px-2.5 py-1.5 text-center backdrop-blur sm:rounded-2xl sm:px-3 sm:py-2">
                            <p className="text-[15px] font-bold text-white sm:text-[17px]">
                              {partialInsights.probabilidadAprobar}%
                            </p>
                            <p className="mt-0.5 text-[12px] leading-4 text-white/88 sm:mt-1 sm:text-[12px] sm:leading-4">
                              Nivel de preparación
                            </p>
                            <p className="mt-1 text-[10.5px] leading-3.5 text-emerald-100/80">
                              Cubrí los temas del parcial para subirlo
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative hidden items-center justify-center xl:flex xl:justify-end">
                <div className="absolute inset-x-10 bottom-1 h-8 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),rgba(255,255,255,0))] blur-2xl" />
                <Image
                  src="/imagentarjetadashboard.webp"
                  alt="Estudiante usando Evaluo"
                  width={1024}
                  height={1536}
                  sizes="(max-width: 1279px) 180px, 18vw"
                  priority
                  className="relative z-10 h-auto w-full max-w-[180px] object-contain sm:max-w-[200px] xl:max-w-[220px]"
                />
              </div>
            </div>
          </div>

          <div className="animate-study-reveal mb-5 flex items-start justify-between gap-4">
            {showOnboardingChecklist ? (
              <Card
                ref={checklistTourRef}
                data-tour-target-checklist
                className="ml-auto w-full max-w-[400px] rounded-2xl border-slate-200 bg-white/90 p-4 backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-950">
                        Completá tu primer recorrido
                      </h2>
                      <span
                        role="status"
                        aria-live="polite"
                        className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[12px] font-bold text-blue-700"
                      >
                        Paso {onboardingProgress + 1}/{onboardingMilestones.length}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] transition-all duration-500"
                        style={{
                          width: `${(onboardingProgress / onboardingMilestones.length) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 truncate text-xs font-semibold text-slate-700">
                      {currentMilestone.label}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={currentMilestone.action}
                    className="shrink-0 px-3.5 text-xs font-semibold"
                  >
                    {currentMilestone.actionLabel}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="mt-2 truncate text-xs text-slate-500">
                  {currentMilestone.description}
                </p>
              </Card>
            ) : null}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Card
              id="materias-favoritas"
              className="surface-card rounded-[var(--radius-card)] bg-white/90 backdrop-blur"
            >
              <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-950">
                    Tu espacio de estudio
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Recientes, favoritas y últimos recursos en un solo lugar.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 w-full rounded-xl border-slate-200 bg-white px-4 text-xs shadow-sm sm:h-9 sm:w-auto"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <Tabs defaultValue="progreso">
                  <TabsList ref={tabsTourRef} data-tour-target-tabs className="justify-start">
                    <TabsTrigger value="progreso">Progreso</TabsTrigger>
                    <TabsTrigger value="recientes">Recientes</TabsTrigger>
                    <TabsTrigger value="favoritas">Favoritas</TabsTrigger>
                    <TabsTrigger value="recursos">Recursos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="progreso" className="pt-4">
                    {progressLoading ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white"
                          />
                        ))}
                      </div>
                    ) : progressSubjects.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {progressSubjects.map((subject) => {
                          const insight = subject.insight;
                          const lastAttempt = lastAttempts[subject.id] ?? null;
                          const lastAttemptNota =
                            lastAttempt && lastAttempt.totalQuestions > 0
                              ? Math.round(
                                  (lastAttempt.correctAnswers / lastAttempt.totalQuestions) * 100
                                ) / 10
                              : null;
                          const lastAttemptAprobado =
                            lastAttemptNota !== null && lastAttemptNota >= 7;
                          const hasErrores =
                            (insight?.preguntasRespondidasParcial ?? 0) >
                            (insight?.preguntasAcertadasParcial ?? 0);
                          return (
                            <div
                              key={subject.id}
                              className="flex flex-col rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"
                            >
                              {insight ? (
                                <>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <h4 className="truncate text-sm font-semibold text-slate-900">
                                        {subject.name}
                                      </h4>
                                      <p className="mt-0.5 text-xs text-slate-500">
                                        Parcial {insight.parcial}
                                      </p>
                                    </div>
                                    <span
                                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                        insight.probabilidadAprobar >= 70
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : insight.probabilidadAprobar >= 40
                                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                                            : 'border-rose-200 bg-rose-50 text-rose-700'
                                      }`}
                                    >
                                      {insight.probabilidadAprobar}% de preparación
                                    </span>
                                  </div>
                                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                                    <div
                                      className={`h-full rounded-full ${
                                        insight.coberturaPorcentaje >= 70
                                          ? 'bg-emerald-500'
                                          : insight.coberturaPorcentaje >= 40
                                            ? 'bg-amber-500'
                                            : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${insight.coberturaPorcentaje}%` }}
                                    />
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                    <span>
                                      {insight.preguntasRespondidasParcial} de{' '}
                                      {insight.totalPreguntasParcial} preguntas
                                    </span>
                                    <span className="font-semibold text-slate-700">
                                      {insight.coberturaPorcentaje}% cubierto
                                    </span>
                                  </div>
                                  {lastAttemptNota !== null ? (
                                    <div
                                      className={`mt-3 flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs ${
                                        lastAttemptAprobado
                                          ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700'
                                          : 'border-rose-200 bg-rose-50/60 text-rose-700'
                                      }`}
                                    >
                                      <span>Último simulacro</span>
                                      <span className="font-semibold">
                                        {lastAttemptNota} ·{' '}
                                        {lastAttemptAprobado ? 'Aprobado' : 'Desaprobado'}
                                      </span>
                                    </div>
                                  ) : null}
                                  {lastAttempt?.previousAttempt &&
                                  lastAttempt.previousAttempt.totalQuestions > 0
                                    ? (() => {
                                        const currentScore =
                                          lastAttempt.totalQuestions > 0
                                            ? (lastAttempt.correctAnswers /
                                                lastAttempt.totalQuestions) *
                                              100
                                            : 0;
                                        const previousScore =
                                          (lastAttempt.previousAttempt.correctAnswers /
                                            lastAttempt.previousAttempt.totalQuestions) *
                                          100;
                                        const diff = currentScore - previousScore;
                                        const improved = diff > 0;
                                        const unchanged = Math.abs(diff) < 1;
                                        return (
                                          <div
                                            className={`mt-1.5 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                                              improved
                                                ? 'bg-emerald-50/60 text-emerald-700'
                                                : unchanged
                                                  ? 'bg-white text-slate-600'
                                                  : 'bg-rose-50/60 text-rose-700'
                                            }`}
                                          >
                                            <span>Vs. tu práctica anterior</span>
                                            <span className="font-semibold">
                                              {unchanged
                                                ? 'Sin cambios'
                                                : `${improved ? '+' : ''}${diff.toFixed(0)}% ${
                                                    improved ? 'mejor' : 'menos'
                                                  }`}
                                            </span>
                                          </div>
                                        );
                                      })()
                                    : null}
                                  <div className="mt-auto flex flex-col gap-2 pt-4">
                                    <Button
                                      size="sm"
                                      className="w-full rounded-xl"
                                      onClick={() =>
                                        router.push(
                                          getSimulatorRoute(insight.materiaId, insight.parcial)
                                        )
                                      }
                                    >
                                      Seguir practicando
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Button>
                                    {hasErrores ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full rounded-xl border-slate-200 bg-white"
                                        onClick={() =>
                                          router.push(
                                            `/simulador/errores/${insight.materiaId}?parcial=${insight.parcial}`
                                          )
                                        }
                                      >
                                        Repasá tus errores
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                      </Button>
                                    ) : null}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="min-w-0">
                                    <h4 className="truncate text-sm font-semibold text-slate-900">
                                      {subject.name}
                                    </h4>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Todavía no practicaste preguntas de esta materia.
                                    </p>
                                  </div>
                                  <div className="mt-auto pt-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full rounded-xl border-slate-200 bg-white"
                                      onClick={() => router.push(getSimulatorRoute(subject.id, 1))}
                                    >
                                      Empezar a practicar
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      emptyStateGuide
                    )}
                  </TabsContent>

                  <TabsContent value="recientes" className="pt-4">
                    {dashboardLoading ? (
                      <div className="grid gap-2.5 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white"
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
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/70 hover:text-slate-700"
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
                            <div className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-slate-700">
                              Abrir materia
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      emptyStateGuide
                    )}
                  </TabsContent>

                  <TabsContent value="favoritas" className="pt-4">
                    {favoritesLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white"
                          />
                        ))}
                      </div>
                    ) : favoriteMaterias.length > 0 ? (
                      <div className="space-y-3">
                        {favoriteMaterias.slice(0, 4).map((materia) => (
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
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {materia.nombre}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {materia.carreraNombre}
                              </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-center">
                        <Heart className="mx-auto h-8 w-8 text-slate-300" />
                        <h3 className="mt-3 text-base font-semibold text-slate-900">
                          {'A\u00FAn no ten\u00E9s materias favoritas'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {
                            'Te sugerimos estas materias seg\u00FAn la carrera que m\u00E1s us\u00E1s.'
                          }
                        </p>
                        {favoriteSuggestions.length > 0 ? (
                          <div className="mt-5 grid gap-2">
                            {favoriteSuggestions.map((materia) => (
                              <button
                                key={materia.id}
                                type="button"
                                onClick={() => router.push(getMateriaRoute(materia.id))}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                              >
                                <span className="truncate font-medium text-slate-800">
                                  {materia.nombre}
                                </span>
                                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recursos" className="pt-4">
                    {recentResources.length > 0 ? (
                      <div className="space-y-3">
                        {recentResources.slice(0, 3).map((resource) => (
                          <a
                            key={`${resource.type}-${resource.id}-${resource.openedAt}`}
                            href={resource.href ?? getDashboardMateriaRoute(resource.subjectId)}
                            target={resource.href ? '_blank' : undefined}
                            rel={resource.href ? 'noreferrer' : undefined}
                            className="animate-study-reveal flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-950">
                                {getResourceTypeLabel(resource.type)}
                              </p>
                              <p className="truncate text-sm text-slate-500">
                                {resource.subjectName}
                              </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-center">
                        <FileText className="mx-auto h-8 w-8 text-slate-300" />
                        <h3 className="mt-3 text-base font-semibold text-slate-900">
                          Aún no abriste archivos
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Cuando abras resúmenes o recursos, aparecerán acá.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <StudyRecommendationsPanel />
          </div>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="max-w-3xl rounded-xl px-4 sm:px-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Agregá una materia
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {academicProfile?.carreraNombre ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                    <p className="text-[12px] font-semibold tracking-[0.14em] text-blue-700 uppercase">
                      Tu carrera
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {academicProfile.carreraNombre}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-slate-600">
                      Las materias de tu carrera aparecen primero.
                    </p>
                  </div>
                ) : null}
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                      Buscando materias...
                    </div>
                  ) : allMaterias.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                      {searchTerm.trim().length > 0
                        ? 'No encontramos materias con ese nombre.'
                        : 'Empezá escribiendo o usá el listado sugerido.'}
                    </div>
                  ) : (
                    allMaterias.map((materia) => {
                      const isFromCareer =
                        academicProfile?.carreraId != null &&
                        materia.carreraId === academicProfile.carreraId;

                      return (
                        <button
                          key={materia.id}
                          type="button"
                          onClick={() => addMateria(materia)}
                          className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-semibold text-slate-950">
                              {materia.nombre}
                            </h3>
                            {isFromCareer ? (
                              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                Tu carrera
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{materia.carreraNombre}</p>
                        </button>
                      );
                    })
                  )}
                </div>

                <Button
                  className="h-11 w-full rounded-xl bg-slate-950 font-medium text-white hover:bg-slate-800"
                  onClick={() => void loadAllMaterias(searchTerm)}
                  disabled={allMateriasLoading}
                >
                  {allMateriasLoading ? 'Actualizando...' : 'Recargar listado'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
            <DialogContent className="max-w-md overflow-hidden rounded-[28px] border-slate-200 p-0">
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 px-6 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-white">
                  ¡Ya arrancaste tu preparación!
                </h2>
                <p className="mt-2 text-sm leading-6 text-indigo-100">
                  Guardamos tu simulador en tu cuenta. Acá vas a ver tu racha, tu progreso y todo tu
                  material de estudio.
                </p>
              </div>
              <div className="space-y-3 px-6 py-6">
                <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3">
                  <Flame className="h-5 w-5 shrink-0 text-orange-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {streakDays > 0
                        ? `Racha de ${streakDays} ${streakDays === 1 ? 'día' : 'días'}`
                        : 'Empezá tu racha hoy'}
                    </p>
                    <p className="text-xs text-slate-500">Estudiá cada día para mantenerla.</p>
                  </div>
                </div>
                {resumeSimulator ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
                    <PlayCircle className="h-5 w-5 shrink-0 text-indigo-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Retomá donde quedaste</p>
                      <p className="truncate text-xs text-slate-500">
                        {resumeSimulator.subjectName ?? 'Simulador'} · Parcial{' '}
                        {resumeSimulator.parcial} · Pregunta {resumeSimulator.questionLabel}
                      </p>
                    </div>
                  </div>
                ) : null}
                <Button
                  className="from-brand to-brand-2 h-11 w-full rounded-xl bg-gradient-to-r text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.20)]"
                  onClick={() => {
                    const destination = resumeSimulator ? resumeSimulator.href : '/explorar';
                    trackMarketingEvent('post_signup_landing_cta_clicked', {
                      cta: resumeSimulator ? 'continue' : 'explore',
                      destination,
                    });
                    setShowWelcomeModal(false);
                    router.push(destination);
                  }}
                >
                  {resumeSimulator ? 'Continuar el examen' : 'Explorar materias'}
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-700"
                  onClick={() => {
                    trackMarketingEvent('post_signup_landing_cta_clicked', {
                      cta: 'dismiss',
                      destination: 'dashboard',
                    });
                    setShowWelcomeModal(false);
                  }}
                >
                  Más tarde
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <GuidedTour
            open={showDashboardTour}
            stepIndex={dashboardTourStepIndex}
            steps={dashboardTourSteps}
            onNext={handleDashboardTourNext}
            onPrevious={handleDashboardTourPrevious}
            onClose={closeDashboardTour}
            ariaLabel="Guía del tablero"
          />
        </div>
      </div>
    </div>
  );
}
