'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  checkProfileStatus,
  corregirPreguntaDemo,
  finalizarSimuladorAction,
  getWrongAnswersExplanations,
  getPreguntasSimuladorErrores,
  getPreguntasSimuladorDemo,
  getPreguntasSimuladorUltimoIntentoPremium,
  getPreguntasSimuladorPremium,
  getPreguntasSimulador,
  registrarRespuestaUsuario,
  submitSimulatorRatingAction,
  type GradedPreguntaResult,
  type Pregunta,
} from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ProfileCompletionModal } from '@/components/profile-completion-modal';
import { SimulatorLoginGate } from '@/components/simulador/SimulatorLoginGate';
import { SimulatorPremiumUpsell } from '@/components/simulador/SimulatorPremiumUpsell';
import { StudyStatePanel } from '@/components/study-state-panel';
import { ElegantLoader } from '@/components/ui/elegant-loader';
import { Spinner } from '@/components/ui/spinner';
import { useUser } from '@/hooks/useUser';
import { usePremium } from '@/hooks/usePremium';
import { buildShareReferralUrl } from '@/lib/attribution';
import { getMateriaRoute } from '@/lib/routes';
import {
  trackSimulatorAbandonEvent,
  trackSimulatorLifecycleEvent,
  trackSimulatorLoginGateEvent,
  trackSimulatorShareEvent,
} from '@/lib/simulator-analytics';
import {
  clearPersistedSimulatorState,
  readPersistedSimulatorState,
  saveLastSimulatorContext,
  type SimuladorPersistedState,
  writePersistedSimulatorState,
} from '@/lib/simulator-persistence';
import {
  dedupeOptionsForView,
  normalizeForCompare,
  shouldAutoResumeSimulator,
} from '@/lib/simulator-core';
import { DEMO_TOTAL_QUESTIONS } from '@/lib/simulator-demo';
import { logError } from '@/lib/observability';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  LogOut,
  RefreshCcw,
  BookOpen,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trophy,
} from 'lucide-react';

interface SimuladorExamenProps {
  materiaId: string;
  parcial: number;
  universidadId?: string;
  carreraId?: string;
  mode?: 'regular' | 'errores' | 'ultimo_intento';
  premiumOnly?: boolean;
  demoMode?: boolean;
}

type EstadoExamen = 'loading' | 'resume_choice' | 'playing' | 'demo_gate' | 'finished' | 'error' | 'profile_incomplete';

const TOTAL_QUESTIONS = 30;
const MIXED_TOTAL_QUESTIONS = 50;
const EXAM_TIME_SECONDS = 30 * 60;
const SIMULATOR_AUTO_RESUME_WINDOW_MINUTES = 15;
const optionLabels = ['a', 'b', 'c', 'd'];

type ShuffledQuestionMeta = {
  options: string[];
  displayedToOriginal: number[];
};

type ExamSummaryCard =
  | {
      label: string;
      title: string;
      description: string;
      cta: string;
      href: string;
    }
  | {
      label: string;
      title: string;
      description: string;
      cta: string;
      onClick: () => void;
    };

type ErrorFocusInsight = {
  title: string;
  description: string;
  recommendation: string;
};

type SimulatorTourStep = {
  id: 'timer' | 'progress' | 'questions' | 'mark' | 'navigation';
  title: string;
  description: string;
};

type SimulatorTourDirection = 'forward' | 'backward';

const SIMULATOR_TOUR_PARAM = 'simulatorTour';

const SIMULATOR_TOUR_STEPS: SimulatorTourStep[] = [
  {
    id: 'timer',
    title: 'Tiempo restante',
    description: 'Acá vas a ver el tiempo que tenés para realizar este examen.',
  },
  {
    id: 'progress',
    title: 'Progreso del examen',
    description: 'Acá puedes seguir cuántas preguntas respondiste, cuántas te faltan y tu avance total.',
  },
  {
    id: 'questions',
    title: 'Mapa de preguntas',
    description: 'Desde este panel puedes moverte entre preguntas, ver dónde estás y finalizar el examen cuando quieras.',
  },
  {
    id: 'mark',
    title: 'Marcar preguntas',
    description: 'Si tienes dudas, marca la pregunta para identificarla rápido y volver a revisarla antes de finalizar.',
  },
  {
    id: 'navigation',
    title: 'Navegación del examen',
    description: 'Con estos botones avanzas o vuelves entre preguntas y sigues tu conteo de respuestas.',
  },
];

function getSimulatorTourStorageKey(materiaId: string, parcial: number, mode: string) {
  return `evaluo_simulator_tour:v1:${mode}:${materiaId}:${parcial}`;
}

function seededShuffle<T>(items: T[], seedInput: string): { values: T[]; indexMap: number[] } {
  const values = items.map((value, index) => ({ value, index }));
  let seed = 0;
  for (let i = 0; i < seedInput.length; i += 1) {
    seed = (seed * 31 + seedInput.charCodeAt(i)) >>> 0;
  }

  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  return {
    values: values.map((item) => item.value),
    indexMap: values.map((item) => item.index),
  };
}

function pickDeterministicItem<T>(items: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return items[hash % items.length];
}

function getSuggestedModule(parcial: number, seed: string) {
  const normalizedParcial = Number(parcial) === 2 ? 2 : 1;
  const modules = normalizedParcial === 1 ? [1, 2] : [3, 4];
  return pickDeterministicItem(modules, seed);
}

function inferErrorFocus(preguntasErradas: Pregunta[], suggestedModule: number): ErrorFocusInsight {
  if (preguntasErradas.length === 0) {
    return {
      title: `Buen dominio del Módulo ${suggestedModule}`,
      description: 'No detectamos un patrón fuerte de error en este intento.',
      recommendation: `Si quieres consolidarlo más, repasa una vez el Módulo ${suggestedModule} y vuelve a intentar.`,
    };
  }

  const theoryKeywords = [
    'concepto',
    'defina',
    'definir',
    'segun',
    'indique',
    'mencione',
    'verdadero',
    'falso',
    'afirmacion',
    'caracteristica',
  ];
  const appliedKeywords = [
    'caso',
    'situacion',
    'aplique',
    'resolver',
    'resuelva',
    'calcule',
    'procedimiento',
    'paciente',
    'empresa',
    'ejemplo',
  ];

  let theoryCount = 0;
  let appliedCount = 0;

  for (const pregunta of preguntasErradas) {
    const normalized = normalizeForCompare(pregunta.enunciado);
    if (theoryKeywords.some((keyword) => normalized.includes(keyword))) theoryCount += 1;
    if (appliedKeywords.some((keyword) => normalized.includes(keyword))) appliedCount += 1;
  }

  if (appliedCount > theoryCount) {
    return {
      title: `Te costaron más las preguntas de aplicación del Módulo ${suggestedModule}`,
      description: 'Tus errores aparecen más en consignas donde hay que aplicar criterios a casos o situaciones concretas.',
      recommendation: `Repasa ejemplos resueltos y luego vuelve a practicar el Módulo ${suggestedModule} con foco en aplicación práctica.`,
    };
  }

  return {
    title: `Fallaste más en preguntas teóricas del Módulo ${suggestedModule}`,
    description: 'Tus errores se concentran más en definiciones, criterios base y preguntas de marco conceptual.',
    recommendation: `Te conviene reforzar primero los conceptos clave del Módulo ${suggestedModule} antes del próximo intento.`,
  };
}

function resolveExamParcial(parcial: number, preguntas: Pregunta[]): number {
  const questionParcial = preguntas.find((pregunta) => pregunta.parcial === 1 || pregunta.parcial === 2)?.parcial;
  return questionParcial === 2 ? 2 : Number(parcial) === 2 ? 2 : 1;
}

function getQuestionLimit(parcial: number) {
  return Number(parcial) === 3 ? MIXED_TOTAL_QUESTIONS : TOTAL_QUESTIONS;
}

function getExamDurationSeconds(parcial: number) {
  return Number(parcial) === 3 ? 50 * 60 : EXAM_TIME_SECONDS;
}

function getParcialLabel(parcial: number) {
  return Number(parcial) === 3 ? 'Mixto (Parcial 1 + 2)' : `Parcial ${parcial}`;
}

function SimulatorTourCard({
  step,
  stepIndex,
  totalSteps,
  direction,
  onNext,
  onPrevious,
  onClose,
  className,
}: {
  step: SimulatorTourStep;
  stepIndex: number;
  totalSteps: number;
  direction: SimulatorTourDirection;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  className: string;
}) {
  const progressWidth = `${((stepIndex + 1) / totalSteps) * 100}%`;

  return (
    <div
      key={`${step.id}-${direction}`}
      className={cn(
        'absolute z-[80] w-[320px] rounded-[26px] border border-[#DCE6FF] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)] max-sm:fixed max-sm:inset-x-4 max-sm:bottom-[5.75rem] max-sm:top-auto max-sm:w-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-[24px] max-sm:p-4',
        direction === 'forward' ? 'animate-simulator-tour-forward' : 'animate-simulator-tour-backward',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
            Paso {stepIndex + 1} de {totalSteps}
          </p>
          <h3 className="mt-2 text-[1.05rem] font-bold text-slate-950 max-sm:text-[0.98rem]">{step.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-600 max-sm:h-8 max-sm:w-8"
          aria-label="Cerrar guía"
        >
          ×
        </button>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EFFC]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#5B7BFF] transition-all duration-300"
          style={{ width: progressWidth }}
        />
      </div>

      <p className="mt-4 text-[0.95rem] leading-7 text-slate-600 max-sm:text-[0.9rem] max-sm:leading-6">{step.description}</p>

      <div className="mt-5 flex items-center justify-between gap-2 max-sm:flex-col max-sm:items-stretch">
        <div className="flex items-center gap-2 max-sm:grid max-sm:grid-cols-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={stepIndex === 0}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] max-sm:w-full"
        >
          {stepIndex === totalSteps - 1 ? 'Entendido' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}

export default function SimuladorExamen({
  materiaId,
  parcial,
  universidadId,
  carreraId,
  mode = 'regular',
  premiumOnly = false,
  demoMode = false,
}: SimuladorExamenProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: userLoading, getUserName, getUserInitials } = useUser();
  const { isPremium } = usePremium();
  const { toast } = useToast();
  const resolvedDemoMode = demoMode && !user;

  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [estado, setEstado] = useState<EstadoExamen>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const examDurationSeconds = getExamDurationSeconds(parcial);
  const questionLimit = getQuestionLimit(parcial);
  const [timeLeft, setTimeLeft] = useState(examDurationSeconds);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | number[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [aciertosFinales, setAciertosFinales] = useState(0);
  const [respondidasFinales, setRespondidasFinales] = useState(0);
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<number, GradedPreguntaResult>>(
    {}
  );
  const gradedQuestionRef = useRef<Set<number>>(new Set());
  const [materiaNombre, setMateriaNombre] = useState('');
  const [wrongExplanations, setWrongExplanations] = useState<
    Array<{ preguntaId: string; enunciado: string; explicacion: string; provider: string; source: string }>
  >([]);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [explanationsMetrics, setExplanationsMetrics] = useState<{ cacheHits: number; generatedCount: number } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<Record<string, 1 | -1 | undefined>>({});
  const [feedbackVotes, setFeedbackVotes] = useState<Record<string, 1 | -1>>({});
  const [simulatorVote, setSimulatorVote] = useState<1 | -1 | null>(null);
  const [simulatorVoteLoading, setSimulatorVoteLoading] = useState(false);
  const [showResultsFace, setShowResultsFace] = useState(false);
  const [isMobileResults, setIsMobileResults] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSimulatorTour, setShowSimulatorTour] = useState(false);
  const [simulatorTourStepIndex, setSimulatorTourStepIndex] = useState(0);
  const [simulatorTourDirection, setSimulatorTourDirection] = useState<SimulatorTourDirection>('forward');
  const [resumeSnapshot, setResumeSnapshot] = useState<SimuladorPersistedState | null>(null);
  const questionsTourTargetRef = useRef<HTMLDivElement | null>(null);
  const markTourTargetRef = useRef<HTMLDivElement | null>(null);
  const navigationTourTargetRef = useRef<HTMLDivElement | null>(null);
  const timerTourTargetRef = useRef<HTMLDivElement | null>(null);
  const progressTourTargetRef = useRef<HTMLDivElement | null>(null);
  const simulatorLifecycleRef = useRef({
    estado: 'loading' as EstadoExamen,
    hasStarted: false,
    currentQuestionIndex: 0,
    answeredCount: 0,
    preguntasDisponibles: 0,
    timeLeft: examDurationSeconds,
    userId: null as string | null,
      outcomeTracked: false,
  });
  const latestSimulatorSnapshotRef = useRef({
    preguntas: [] as Pregunta[],
    currentQuestionIndex: 0,
    timeLeft: examDurationSeconds,
    selectedAnswers: {} as Record<number, number | number[]>,
    flaggedQuestions: [] as number[],
    feedbackByQuestion: {} as Record<number, GradedPreguntaResult>,
    hasStarted: false,
  });
  const loginGateTrackedRef = useRef(false);
  const storageKey = useMemo(
    () =>
      `evaluo_simulador_in_progress:${resolvedDemoMode ? 'demo' : 'full'}:${mode}:${materiaId}:${parcial}`,
    [resolvedDemoMode, mode, materiaId, parcial]
  );

  const preguntasDisponibles = preguntas.length;
  const preguntaActual = preguntas[currentQuestionIndex];
  const shuffledMetaByQuestion = useMemo<ShuffledQuestionMeta[]>(() => {
    return preguntas.map((question, index) => {
      const rawOptions = Array.isArray(question.opciones)
        ? dedupeOptionsForView(question.opciones)
        : [];
      const seed = `${question.id}:${index}`;
      const { values, indexMap } = seededShuffle(rawOptions, seed);
      return { options: values, displayedToOriginal: indexMap };
    });
  }, [preguntas]);
  const preguntaActualShuffled = shuffledMetaByQuestion[currentQuestionIndex];
  const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);
  const unansweredCount = Math.max(0, preguntasDisponibles - answeredCount);
  const demoCheckpointIndex = resolvedDemoMode
    ? Math.min(DEMO_TOTAL_QUESTIONS, Math.max(1, preguntasDisponibles)) - 1
    : DEMO_TOTAL_QUESTIONS - 1;
  const progressPercent = preguntasDisponibles
    ? Math.round((answeredCount / preguntasDisponibles) * 100)
    : 0;
  const simulatorEventContext = useMemo(
    () => ({
      userId,
      materiaId,
      parcial,
      carreraId,
      universidadId,
      mode,
      premiumOnly,
      path: typeof window === 'undefined' ? '' : window.location.pathname,
    }),
    [carreraId, materiaId, mode, parcial, premiumOnly, universidadId, userId]
  );
  const shouldShowSimulatorTour = searchParams.get(SIMULATOR_TOUR_PARAM) === '1';
  const simulatorTourStorageKey = useMemo(
    () => getSimulatorTourStorageKey(materiaId, parcial, mode),
    [materiaId, mode, parcial]
  );
  const currentTourStep = SIMULATOR_TOUR_STEPS[simulatorTourStepIndex] ?? SIMULATOR_TOUR_STEPS[0];
  const guidedSearchParams = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(SIMULATOR_TOUR_PARAM, '1');
    return params.toString();
  }, [searchParams]);
  const loginHref = `/login?next=${encodeURIComponent(`${pathname}${guidedSearchParams ? `?${guidedSearchParams}` : ''}`)}`;
  const signupHref = `/login?mode=signup&next=${encodeURIComponent(`${pathname}${guidedSearchParams ? `?${guidedSearchParams}` : ''}`)}`;

  const emitSimulatorEvent = useCallback(
    async (
      eventName: 'simulator_started' | 'simulator_resumed' | 'simulator_finished' | 'simulator_abandoned',
      overrides?: Partial<{
        questionIndex: number;
        answered: number;
        progress: number;
        timeLeft: number;
      }>
    ) => {
      if (typeof window === 'undefined') return;
      await trackSimulatorLifecycleEvent(eventName, simulatorEventContext, {
        questionIndex: overrides?.questionIndex ?? currentQuestionIndex + 1,
        answeredCount: overrides?.answered ?? answeredCount,
        progressPercent: overrides?.progress ?? progressPercent,
        timeLeft: overrides?.timeLeft ?? timeLeft,
      });
    },
    [answeredCount, currentQuestionIndex, progressPercent, simulatorEventContext, timeLeft]
  );

  const emitLoginGateEvent = useCallback(
    async (eventName: 'simulator_login_gate_viewed' | 'simulator_login_gate_cta_clicked', cta?: 'login' | 'signup') => {
      if (typeof window === 'undefined') return;
      await trackSimulatorLoginGateEvent(
        eventName,
        simulatorEventContext,
        {
          answeredCount,
          progressPercent,
          timeLeft,
        },
        cta
      );
    },
    [answeredCount, progressPercent, simulatorEventContext, timeLeft]
  );

  useEffect(() => {
    simulatorLifecycleRef.current = {
      estado,
      hasStarted,
      currentQuestionIndex,
      answeredCount,
      preguntasDisponibles,
      timeLeft,
      userId,
      outcomeTracked: simulatorLifecycleRef.current.outcomeTracked,
    };
  }, [answeredCount, currentQuestionIndex, estado, hasStarted, preguntasDisponibles, timeLeft, userId]);

  useEffect(() => {
    latestSimulatorSnapshotRef.current = {
      preguntas,
      currentQuestionIndex,
      timeLeft,
      selectedAnswers,
      flaggedQuestions,
      feedbackByQuestion,
      hasStarted,
    };
  }, [currentQuestionIndex, feedbackByQuestion, flaggedQuestions, hasStarted, preguntas, selectedAnswers, timeLeft]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressRingStyle = {
    background: `conic-gradient(#2563EB ${progressPercent * 3.6}deg, #E6EAF2 ${progressPercent * 3.6}deg)`,
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user || resolvedDemoMode || !shouldShowSimulatorTour || estado !== 'playing' || !hasStarted) {
      setShowSimulatorTour(false);
      return;
    }

    const alreadySeen = window.localStorage.getItem(simulatorTourStorageKey) === 'done';
    if (alreadySeen) {
      setShowSimulatorTour(false);
      return;
    }

    setSimulatorTourStepIndex(0);
    setSimulatorTourDirection('forward');
    setShowSimulatorTour(true);
  }, [estado, hasStarted, resolvedDemoMode, shouldShowSimulatorTour, simulatorTourStorageKey, user]);

  const closeSimulatorTour = useCallback(() => {
    setShowSimulatorTour(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(simulatorTourStorageKey, 'done');
      const params = new URLSearchParams(window.location.search);
      params.delete(SIMULATOR_TOUR_PARAM);
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      window.history.replaceState({}, '', nextUrl);
    }
  }, [pathname, simulatorTourStorageKey]);

  const handleSimulatorTourNext = useCallback(() => {
    if (simulatorTourStepIndex >= SIMULATOR_TOUR_STEPS.length - 1) {
      closeSimulatorTour();
      return;
    }

    setSimulatorTourDirection('forward');
    setSimulatorTourStepIndex((current) => current + 1);
  }, [closeSimulatorTour, simulatorTourStepIndex]);

  const handleSimulatorTourPrevious = useCallback(() => {
    if (simulatorTourStepIndex === 0) return;
    setSimulatorTourDirection('backward');
    setSimulatorTourStepIndex((current) => current - 1);
  }, [simulatorTourStepIndex]);

  const persistSimulatorSnapshot = useCallback(
    (overrides?: Partial<Omit<SimuladorPersistedState, 'version' | 'userId' | 'materiaId' | 'parcial' | 'mode' | 'savedAt'>>) => {
      if (!userId) return;

      const snapshot = latestSimulatorSnapshotRef.current;
      const preguntasToPersist = overrides?.preguntas ?? snapshot.preguntas;

      if (!preguntasToPersist.length) return;

      writePersistedSimulatorState(storageKey, {
        version: 2,
        userId,
        materiaId,
        parcial,
        mode,
        preguntas: preguntasToPersist,
        currentQuestionIndex: overrides?.currentQuestionIndex ?? snapshot.currentQuestionIndex,
        timeLeft: overrides?.timeLeft ?? snapshot.timeLeft,
        selectedAnswers: overrides?.selectedAnswers ?? snapshot.selectedAnswers,
        flaggedQuestions: overrides?.flaggedQuestions ?? snapshot.flaggedQuestions,
        feedback: overrides?.feedback ?? snapshot.feedbackByQuestion,
        hasStarted: overrides?.hasStarted ?? snapshot.hasStarted,
        savedAt: new Date().toISOString(),
      });
    },
    [materiaId, mode, parcial, storageKey, userId]
  );

  useEffect(() => {
    if (!showSimulatorTour) return;

    const tourTargets: Record<SimulatorTourStep['id'], HTMLElement | null> = {
      timer: timerTourTargetRef.current,
      progress: progressTourTargetRef.current,
      questions: questionsTourTargetRef.current,
      mark: markTourTargetRef.current,
      navigation: navigationTourTargetRef.current,
    };

    const target = tourTargets[currentTourStep.id];
    if (!target) return;

    const timeoutId = window.setTimeout(() => {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 60);

    return () => window.clearTimeout(timeoutId);
  }, [currentTourStep.id, showSimulatorTour]);

  const hydrateSavedExam = useCallback((saved: SimuladorPersistedState) => {
    const limitedQuestions = saved.preguntas.slice(0, questionLimit);
    gradedQuestionRef.current = new Set(Object.keys(saved.feedback ?? {}).map(Number));
    setPreguntas(limitedQuestions);
    setCurrentQuestionIndex(
      Math.max(0, Math.min(saved.currentQuestionIndex ?? 0, Math.max(0, limitedQuestions.length - 1)))
    );
      setTimeLeft(Math.max(0, Math.min(saved.timeLeft ?? examDurationSeconds, examDurationSeconds)));
    setSelectedAnswers(saved.selectedAnswers ?? {});
    setFlaggedQuestions(Array.isArray(saved.flaggedQuestions) ? saved.flaggedQuestions : []);
    setFeedbackByQuestion(saved.feedback ?? {});
    setHasStarted(Boolean(saved.hasStarted));
    setResumeSnapshot(saved);
  }, [questionLimit]);

  // La corrección vive en el servidor (registrarRespuestaUsuario / corregirPreguntaDemo).
  // feedbackByQuestion[questionIndex] = resultado devuelto por el servidor.
  const isCorrectAnswer = useCallback(
    (questionIndex: number, _optionIndex: number | number[]) => {
      return feedbackByQuestion[questionIndex]?.correct === true;
    },
    [feedbackByQuestion]
  );

  const isCorrectChoice = useCallback(
    (questionIndex: number, displayedOptionIndex: number) => {
      const feedback = feedbackByQuestion[questionIndex];
      if (!feedback) return false;
      const meta = shuffledMetaByQuestion[questionIndex];
      if (!meta) return false;
      const originalIndex = meta.displayedToOriginal[displayedOptionIndex];
      if (typeof originalIndex !== 'number') return false;
      return feedback.correct_indexes.includes(originalIndex);
    },
    [feedbackByQuestion, shuffledMetaByQuestion]
  );

  // Corrige en el servidor cada pregunta en cuanto queda respondida.
  useEffect(() => {
    if (estado !== 'playing') return;

    for (const [index, optionIndex] of Object.entries(selectedAnswers)) {
      const questionIndex = Number(index);
      const pregunta = preguntas[questionIndex];
      if (!pregunta) continue;
      const isMulti = pregunta.correctCount > 1;
      const answered = isMulti
        ? Array.isArray(optionIndex) && optionIndex.length === pregunta.correctCount
        : optionIndex !== undefined;
      if (!answered || gradedQuestionRef.current.has(questionIndex)) continue;

      gradedQuestionRef.current.add(questionIndex);
      const meta = shuffledMetaByQuestion[questionIndex];
      if (!meta) continue;

      const selectedIndexes = Array.isArray(optionIndex) ? optionIndex : [optionIndex];
      const respuestaSeleccionada = selectedIndexes
        .map((selectedIndex) => meta.options[selectedIndex])
        .filter((option): option is string => typeof option === 'string');

      const gradingCall = resolvedDemoMode
        ? corregirPreguntaDemo({
            pregunta_id: pregunta.id,
            materia_id: pregunta.materia_id,
            respuesta_seleccionada: respuestaSeleccionada,
          })
        : userId
          ? registrarRespuestaUsuario({
              usuario_id: userId,
              pregunta_id: pregunta.id,
              materia_id: pregunta.materia_id,
              respuesta_seleccionada: respuestaSeleccionada,
            })
          : Promise.resolve(null);

      void gradingCall.then((result) => {
        if (!result?.success) return;
        const graded = result as { success: true; correct: boolean; correct_indexes: number[] };
        setFeedbackByQuestion((prev) => ({
          ...prev,
          [questionIndex]: { correct: graded.correct, correct_indexes: graded.correct_indexes },
        }));
      }).catch((error) => {
        logError('simulador.corregirRespuesta', error, { questionIndex, preguntaId: pregunta.id });
      });
    }
  }, [estado, preguntas, resolvedDemoMode, selectedAnswers, shuffledMetaByQuestion, userId]);

  const finalizarExamen = useCallback(
    async (trigger: 'manual' | 'timer' = 'manual') => {
      if (isFinishing || estado !== 'playing') return;
      if (!resolvedDemoMode && !userId) return;

      setIsFinishing(true);
      setShowResultsFace(false);
      setEstado('finished');
      clearPersistedSimulatorState(storageKey);
      simulatorLifecycleRef.current.outcomeTracked = true;

      if (!resolvedDemoMode) {
        void emitSimulatorEvent('simulator_finished', {
          questionIndex: Math.min(preguntasDisponibles, currentQuestionIndex + 1),
          answered: Object.keys(selectedAnswers).length,
          progress: preguntasDisponibles > 0 ? Math.round((Object.keys(selectedAnswers).length / preguntasDisponibles) * 100) : 0,
          timeLeft: trigger === 'timer' ? 0 : timeLeft,
        });
      }

      const respuestaPayload = () =>
        Object.entries(selectedAnswers)
          .map(([index, optionIndex]) => {
            const questionIndex = Number(index);
            const pregunta = preguntas[questionIndex];
            const meta = shuffledMetaByQuestion[questionIndex];
            if (!pregunta || !meta) return null;
            const selectedIndexes = Array.isArray(optionIndex) ? optionIndex : [optionIndex];
            const respuestaSeleccionada = selectedIndexes
              .map((selectedIndex) => meta.options[selectedIndex])
              .filter((option): option is string => typeof option === 'string');
            return { pregunta_id: pregunta.id, respuesta_seleccionada: respuestaSeleccionada };
          })
          .filter((entry): entry is { pregunta_id: string; respuesta_seleccionada: string[] } =>
            Boolean(entry)
          );

      if (resolvedDemoMode || !userId) {
        // Demo: se corrige cada respuesta en el servidor (sin sesión).
        const gradedResults = await Promise.all(
          respuestaPayload().map(async (entry) => {
            const result = await corregirPreguntaDemo({
              pregunta_id: entry.pregunta_id,
              materia_id: materiaId,
              respuesta_seleccionada: entry.respuesta_seleccionada,
            });
            return { pregunta_id: entry.pregunta_id, result };
          })
        );
        const feedbackMap: Record<number, GradedPreguntaResult> = {};
        let correctas = 0;
        for (const { pregunta_id, result } of gradedResults) {
          if (!result?.success) continue;
          const questionIndex = preguntas.findIndex((pregunta) => pregunta.id === pregunta_id);
          if (questionIndex < 0) continue;
          feedbackMap[questionIndex] = {
            correct: result.correct,
            correct_indexes: result.correct_indexes,
          };
          if (result.correct) correctas += 1;
        }
        setFeedbackByQuestion((prev) => ({ ...prev, ...feedbackMap }));
        setAciertosFinales(correctas);
        setRespondidasFinales(Object.keys(selectedAnswers).length);
        setIsFinishing(false);
        return;
      }

      // Modo autenticado: el intento se re-corrige entero en el servidor.
      // Valor provisional desde los feedbacks ya corregidos en vivo (el servidor
      // re-corrige y sus cifras son las que mandan).
      const provisionalCorrectas = Object.values(feedbackByQuestion).filter(
        (feedback) => feedback.correct
      ).length;
      setAciertosFinales(provisionalCorrectas);
      setRespondidasFinales(Object.keys(selectedAnswers).length);

      const response = await finalizarSimuladorAction({
        usuario_id: userId,
        materia_id: materiaId,
        parcial,
        total_preguntas: preguntasDisponibles,
        answered_questions: Object.keys(selectedAnswers).length,
        tiempo_restante: trigger === 'timer' ? 0 : timeLeft,
        premium_only: premiumOnly,
        mode,
        respuestas: respuestaPayload(),
      });

      if (response.success) {
        setAciertosFinales(response.summary.respuestas_correctas);
        setRespondidasFinales(response.summary.answered_questions);

        if (response.resultados) {
          const feedbackMap: Record<number, GradedPreguntaResult> = {};
          for (const [preguntaId, resultado] of Object.entries(response.resultados)) {
            const questionIndex = preguntas.findIndex((pregunta) => pregunta.id === preguntaId);
            if (questionIndex < 0) continue;
            feedbackMap[questionIndex] = resultado;
          }
          setFeedbackByQuestion((prev) => ({ ...prev, ...feedbackMap }));
        }
      }

      setIsFinishing(false);
    },
    [
      resolvedDemoMode,
      estado,
      isFinishing,
      materiaId,
      parcial,
      preguntas,
      preguntasDisponibles,
      selectedAnswers,
      timeLeft,
      userId,
      shuffledMetaByQuestion,
      storageKey,
      currentQuestionIndex,
      emitSimulatorEvent,
      premiumOnly,
    ]
  );

  const loadFreshQuestions = useCallback(async () => {
    const data =
      mode === 'errores'
        ? await getPreguntasSimuladorErrores(materiaId, parcial)
        : mode === 'ultimo_intento'
        ? await getPreguntasSimuladorUltimoIntentoPremium(materiaId, parcial)
        : premiumOnly
        ? await getPreguntasSimuladorPremium(materiaId, parcial)
        : resolvedDemoMode
        ? await getPreguntasSimuladorDemo(materiaId, parcial)
        : await getPreguntasSimulador(materiaId, parcial, universidadId, carreraId);

    if (data && data.length > 0) {
      simulatorLifecycleRef.current.outcomeTracked = false;
      gradedQuestionRef.current.clear();
      setPreguntas(data.slice(0, questionLimit));
      setCurrentQuestionIndex(0);
      setTimeLeft(examDurationSeconds);
      setSelectedAnswers({});
      setFlaggedQuestions([]);
      setFeedbackByQuestion({});
      setHasStarted(false);
      setResumeSnapshot(null);
      setEstado('playing');
      clearPersistedSimulatorState(storageKey);
      return true;
    }

    setEstado('error');
    return false;
  }, [carreraId, materiaId, mode, parcial, premiumOnly, questionLimit, resolvedDemoMode, storageKey, universidadId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobileResults(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    async function inicializar() {
      try {
        setEstado('loading');

        if (userLoading) return;
        if (!user) {
          if (!resolvedDemoMode) {
            setEstado('error');
            return;
          }
          setUserId(null);
        } else {
          setUserId(user.id);

          if (!resolvedDemoMode) {
            const status = await checkProfileStatus(user.id);
            if (!status.isComplete) {
              setEstado('profile_incomplete');
              return;
            }
          }
        }

        const { data: materiaData } = await supabase
          .from('materias')
          .select('nombre')
          .eq('id', materiaId)
          .maybeSingle();

        if (materiaData?.nombre) {
          setMateriaNombre(materiaData.nombre);
        }

        const saved = readPersistedSimulatorState(storageKey);
        if (saved) {
          const valid =
            saved.version === 2 &&
            (resolvedDemoMode ? saved.userId === null : user && saved.userId === user.id) &&
            saved.materiaId === materiaId &&
            saved.parcial === parcial &&
            saved.mode === mode &&
            Array.isArray(saved.preguntas) &&
            saved.preguntas.length > 0;

          if (valid) {
            hydrateSavedExam(saved);
            if (saved.hasStarted && shouldAutoResumeSimulator(saved.savedAt)) {
              setEstado('playing');
            } else {
              setEstado('resume_choice');
            }
            return;
          }
        }

        await loadFreshQuestions();
      } catch (error) {
        logError('simulador.inicializar', error, {
          materiaId,
          parcial,
          mode,
          userId: user?.id ?? null,
        });
        setEstado('error');
      }
    }

    void inicializar();
  }, [examDurationSeconds, resolvedDemoMode, hydrateSavedExam, loadFreshQuestions, materiaId, mode, parcial, storageKey, user, userLoading]);

  useEffect(() => {
    if (estado !== 'playing' || !hasStarted) return;
    if (timeLeft <= 0) {
      void finalizarExamen('timer');
      return;
    }

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [estado, finalizarExamen, hasStarted, timeLeft]);

  useEffect(() => {
    if (estado === 'playing') {
      saveLastSimulatorContext(materiaId, parcial);
    }
  }, [estado, materiaId, parcial]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const emitAbandonIfNeeded = (source: 'pagehide' | 'beforeunload' | 'visibilitychange' | 'unmount') => {
      const snapshot = simulatorLifecycleRef.current;
      if (snapshot.estado === 'playing' && snapshot.userId) {
        persistSimulatorSnapshot();
      }
      if (snapshot.outcomeTracked) return;
      if (snapshot.estado !== 'playing' || !snapshot.hasStarted || !snapshot.userId) return;

      simulatorLifecycleRef.current.outcomeTracked = true;
      void trackSimulatorAbandonEvent(
        simulatorEventContext,
        {
          questionIndex: snapshot.currentQuestionIndex + 1,
          answeredCount: snapshot.answeredCount,
          progressPercent: snapshot.preguntasDisponibles
            ? Math.round((snapshot.answeredCount / snapshot.preguntasDisponibles) * 100)
            : 0,
          timeLeft: snapshot.timeLeft,
        },
        source
      );
    };

    const handlePageHide = () => emitAbandonIfNeeded('pagehide');
    const handleBeforeUnload = () => emitAbandonIfNeeded('beforeunload');
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        emitAbandonIfNeeded('visibilitychange');
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      emitAbandonIfNeeded('unmount');
    };
  }, [persistSimulatorSnapshot, simulatorEventContext]);

  useEffect(() => {
    if (estado !== 'playing' || !userId) return;
    const payload: SimuladorPersistedState = {
      version: 2,
      userId,
      materiaId,
      parcial,
      mode,
      preguntas,
      currentQuestionIndex,
      timeLeft,
      selectedAnswers,
      flaggedQuestions,
      feedback: feedbackByQuestion,
      hasStarted,
      savedAt: new Date().toISOString(),
    };
    writePersistedSimulatorState(storageKey, payload);
  }, [
    currentQuestionIndex,
    estado,
    feedbackByQuestion,
    flaggedQuestions,
    hasStarted,
    materiaId,
    mode,
    parcial,
    preguntas,
    selectedAnswers,
    storageKey,
    timeLeft,
    userId,
  ]);

  useEffect(() => {
    async function loadExplanations() {
      if (estado !== 'finished' || !userId) return;

      const wrongQuestionIds = Object.entries(selectedAnswers)
        .filter(([index, optionIndex]) => !isCorrectAnswer(Number(index), optionIndex))
        .map(([index]) => preguntas[Number(index)]?.id)
        .filter((id): id is string => Boolean(id));
      const limitedWrongQuestionIds = isPremium
        ? wrongQuestionIds
        : wrongQuestionIds.slice(0, 3);

      if (limitedWrongQuestionIds.length === 0) {
        setWrongExplanations([]);
        return;
      }

      setLoadingExplanations(true);
      const response = await getWrongAnswersExplanations({
        materia_id: materiaId,
        parcial,
        wrong_question_ids: limitedWrongQuestionIds,
      });

      if (response.success) {
        setWrongExplanations(response.explanations ?? []);
        setExplanationsMetrics(response.metrics ?? null);
      }
      setLoadingExplanations(false);
    }

    void loadExplanations();
  }, [estado, isCorrectAnswer, isPremium, materiaId, parcial, preguntas, selectedAnswers, userId]);

  const handleExplanationFeedback = async (preguntaId: string, voto: 1 | -1) => {
    setFeedbackLoading((prev) => ({ ...prev, [preguntaId]: voto }));

    try {
      const response = await fetch('/api/explanations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta_id: preguntaId, voto }),
      });

      if (!response.ok) {
        throw new Error('No se pudo guardar tu feedback.');
      }

      setFeedbackVotes((prev) => ({ ...prev, [preguntaId]: voto }));
    } catch (error) {
      logError('simulador.explanationFeedback', error, { preguntaId, voto });
    } finally {
      setFeedbackLoading((prev) => {
        const next = { ...prev };
        delete next[preguntaId];
        return next;
      });
    }
  };

  const handleSimulatorVote = async (voteType: 1 | -1) => {
    if (!user) {
      toast({
        title: 'Inicia sesión para valorar el simulador',
        description: 'Te llevamos al login para guardar tu opinión.',
      });
      window.location.assign('/login');
      return;
    }

    setSimulatorVote(voteType);
    setSimulatorVoteLoading(true);

    try {
      const response = await submitSimulatorRatingAction({
        materia_id: materiaId,
        parcial,
        vote_type: voteType,
      });

      if (!response.success) {
        throw new Error(response.message || 'No se pudo guardar tu valoración.');
      }

      toast({
        title: voteType === 1 ? 'Gracias por tu like' : 'Gracias por tu feedback',
        description: 'Tu valoración nos ayuda a mejorar este simulador.',
      });
    } catch (error) {
      logError('simulador.vote', error, { materiaId, parcial, voteType });
      setSimulatorVote(null);
      toast({
        title: 'No pudimos guardar tu valoración',
        description: 'Inténtalo nuevamente en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setSimulatorVoteLoading(false);
    }
  };

  const continueSavedExam = () => {
    if (!resumeSnapshot) return;
    simulatorLifecycleRef.current.outcomeTracked = false;
    hydrateSavedExam(resumeSnapshot);
    setEstado('playing');
    void emitSimulatorEvent('simulator_resumed', {
      questionIndex: resumeSnapshot.currentQuestionIndex + 1,
      answered: Object.keys(resumeSnapshot.selectedAnswers ?? {}).length,
      progress: resumeSnapshot.preguntas.length
        ? Math.round((Object.keys(resumeSnapshot.selectedAnswers ?? {}).length / resumeSnapshot.preguntas.length) * 100)
        : 0,
      timeLeft: resumeSnapshot.timeLeft,
    });
  };

  const isQuestionAnswered = useCallback(
    (questionIndex: number) => {
      const answerValue = selectedAnswers[questionIndex];
      if (answerValue === undefined) return false;

      const pregunta = preguntas[questionIndex];
      if (!pregunta || pregunta.correctCount <= 1) {
        return true;
      }

      return Array.isArray(answerValue) && answerValue.length === pregunta.correctCount;
    },
    [preguntas, selectedAnswers]
  );

  const startNewExam = async () => {
    loginGateTrackedRef.current = false;
    simulatorLifecycleRef.current.outcomeTracked = false;
    setEstado('loading');
    await loadFreshQuestions();
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (!preguntaActual) return;
    if (preguntaActual.correctCount <= 1) {
      if (selectedAnswers[currentQuestionIndex] !== undefined) return;
      setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionIndex }));
      return;
    }

    const maxAllowed = preguntaActual.correctCount;
    setSelectedAnswers((prev) => {
      const currentValue = prev[currentQuestionIndex];
      const current = Array.isArray(currentValue) ? currentValue : [];
      const exists = current.includes(optionIndex);
      const next = exists
        ? current.filter((idx) => idx !== optionIndex)
        : current.length < maxAllowed
        ? [...current, optionIndex]
        : current;
      return { ...prev, [currentQuestionIndex]: next };
    });
  };

  const toggleFlag = (questionIndex = currentQuestionIndex) => {
    setFlaggedQuestions((prev) =>
      prev.includes(questionIndex)
        ? prev.filter((idx) => idx !== questionIndex)
        : [...prev, questionIndex]
    );
  };

  const goToQuestion = (index: number) => {
    if (index < 0 || index >= questionLimit || index >= preguntasDisponibles) return;
    setCurrentQuestionIndex(index);
  };

  const goNext = () => {
    if (resolvedDemoMode && currentQuestionIndex >= demoCheckpointIndex) {
      if (isQuestionAnswered(demoCheckpointIndex)) {
        setEstado('demo_gate');
      }
      return;
    }

    if (currentQuestionIndex < Math.min(questionLimit, preguntasDisponibles) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const reiniciarSimulador = () => {
    setShowResultsFace(false);
    loginGateTrackedRef.current = false;
    simulatorLifecycleRef.current.outcomeTracked = false;
    clearPersistedSimulatorState(storageKey);
    window.location.reload();
  };

  useEffect(() => {
    if (estado !== 'playing' || !resolvedDemoMode || !hasStarted) return;
    if (currentQuestionIndex !== demoCheckpointIndex) return;
    if (!isQuestionAnswered(demoCheckpointIndex)) return;

    setEstado('demo_gate');
  }, [currentQuestionIndex, demoCheckpointIndex, estado, hasStarted, isQuestionAnswered, resolvedDemoMode]);

  useEffect(() => {
    if (estado !== 'demo_gate') {
      loginGateTrackedRef.current = false;
      return;
    }
    if (loginGateTrackedRef.current) return;

    loginGateTrackedRef.current = true;
    void emitLoginGateEvent('simulator_login_gate_viewed');
  }, [emitLoginGateEvent, estado]);

  if (estado === 'profile_incomplete') {
    return (
      <div className="flex min-h-[600px] items-center justify-center p-6">
        <ProfileCompletionModal userId={userId!} isOpen={true} onComplete={reiniciarSimulador} />
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4 text-emerald-500" />
          <p className="text-xl font-medium text-emerald-600">Completando tu perfil...</p>
        </div>
      </div>
    );
  }

  if (estado === 'loading') {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="loader-card w-full max-w-md">
          <ElegantLoader variant="global" size="lg" text="Preparando simulador..." />
        </div>
      </div>
    );
  }

  if (estado === 'error') {
    const isLastAttemptMode = mode === 'ultimo_intento';
    return (
      <div className="flex min-h-[600px] items-center justify-center p-6">
        <StudyStatePanel
          icon={AlertCircle}
          tone="warning"
          className="w-full max-w-xl"
          title={
            isLastAttemptMode
              ? 'Todavía no tienes errores guardados de tu último intento'
              : premiumOnly
                ? 'Aún no hay un set premium cargado'
                : 'Estamos preparando este parcial'
          }
          description={
            isLastAttemptMode
              ? 'Termina un simulador, guarda tus errores y luego podrás practicar solo esas preguntas en este modo.'
              : premiumOnly
                ? 'Estamos actualizando las últimas preguntas validadas para este parcial premium.'
                : 'Estamos procesando el material oficial de esta materia para que Evaluo te enseñe con la mejor calidad posible.'
          }
          secondaryText={
            isLastAttemptMode
              ? 'Cuando falles preguntas en un intento, este acceso te armará un simulador con ese set exacto.'
              : premiumOnly
                ? 'Vuelve en unas horas o prueba el simulador regular mientras se actualiza este premium.'
                : 'Vuelve en unas horas o entra a otra materia mientras terminamos de prepararlo.'
          }
          primaryActionLabel="Reintentar"
          onPrimaryAction={reiniciarSimulador}
          secondaryActionLabel="Volver a la materia"
          onSecondaryAction={() => window.history.back()}
        />
      </div>
    );
  }

  if (estado === 'demo_gate') {
    return (
      <SimulatorLoginGate
        answeredCount={answeredCount}
        questionLimit={questionLimit}
        loginHref={loginHref}
        signupHref={signupHref}
        onLoginClick={() => void emitLoginGateEvent('simulator_login_gate_cta_clicked', 'login')}
        onSignupClick={() =>
          void emitLoginGateEvent('simulator_login_gate_cta_clicked', 'signup')
        }
      />
    );
  }

  if (estado === 'resume_choice') {
    return (
      <div className="flex min-h-[600px] items-center justify-center bg-[#F5F7FB] p-6">
        <Card className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-extrabold text-slate-900">Tenés un simulador en curso</h2>
          <p className="mt-3 text-slate-600">
            Guardamos este intento con las mismas preguntas para que puedas retomarlo sin cambios.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Si vuelves dentro de {SIMULATOR_AUTO_RESUME_WINDOW_MINUTES} minutos, el simulador se retoma automáticamente.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Respondidas</p>
              <p className="font-bold text-slate-900">{Object.keys(resumeSnapshot?.selectedAnswers ?? {}).length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Tiempo restante</p>
              <p className="font-bold text-slate-900">{formatTime(resumeSnapshot?.timeLeft ?? examDurationSeconds)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Preguntas</p>
              <p className="font-bold text-slate-900">{resumeSnapshot?.preguntas?.length ?? 0}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={continueSavedExam} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Continuar simulador
            </Button>
            <Button variant="outline" onClick={() => void startNewExam()} className="rounded-xl">
              Comenzar uno nuevo
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (estado === 'finished') {
    const totalPreguntasExamen = Math.max(1, preguntasDisponibles || questionLimit);
    const nota = (aciertosFinales / totalPreguntasExamen) * 10;
    const aprobado = nota >= 7;
    const porcentaje = Math.round((aciertosFinales / totalPreguntasExamen) * 100);
    const needsMotivation = porcentaje < 60;
    const wrongQuestions = Object.entries(selectedAnswers)
      .filter(([index, optionIndex]) => !isCorrectAnswer(Number(index), optionIndex))
      .map(([index]) => preguntas[Number(index)])
      .filter((pregunta): pregunta is Pregunta => Boolean(pregunta));
    const resolvedParcial = resolveExamParcial(parcial, preguntas);
    const reviewSeed = `${materiaId}:${resolvedParcial}:${respondidasFinales}:${aciertosFinales}:${wrongExplanations.length}`;
    const suggestedModule = getSuggestedModule(resolvedParcial, reviewSeed);
    const errorFocus = inferErrorFocus(wrongQuestions, suggestedModule);
    const patternMessage = errorFocus.title;
    const recommendationMessage = errorFocus.recommendation;
    const erroresPendientes = Math.max(0, respondidasFinales - aciertosFinales);
    const frontTitle = porcentaje >= 85 ? '¡Excelente trabajo!' : porcentaje >= 60 ? 'Buen trabajo' : 'Seguí, vas a poder';
    const frontMessage = `Completaste el simulacro de ${materiaNombre || `Materia ${materiaId}`} con un ${porcentaje}%`;
    const shareSimulatorResult = async () => {
      if (!userId || typeof window === 'undefined') return;

      const shareUrl = buildShareReferralUrl(`/simulador/${materiaId}/${resolvedParcial}`, userId);
      const shareText = `Hice mi simulador de ${materiaNombre || `Materia ${materiaId}`} en Evaluo. Probalo vos también.`;

      await trackSimulatorShareEvent(
        {
          ...simulatorEventContext,
          parcial: resolvedParcial,
        },
        {
          result_pct: porcentaje,
          share_url: shareUrl,
        }
      );

      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Mi resultado en Evaluo',
            text: shareText,
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: 'Link copiado',
            description: 'Ya puedes compartir tu resultado con un compañero.',
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        logError('simulador.shareResult', error, { materiaId, parcial: resolvedParcial, userId });
        toast({
          title: 'No pudimos compartir el resultado',
          description: 'Intenta nuevamente en unos segundos.',
          variant: 'destructive',
        });
      }
    };
    const examSummaryCards: ExamSummaryCard[] = [
      {
        label: 'Ahora',
        title: `Repasa el Módulo ${suggestedModule}`,
        description: recommendationMessage,
        href: `/explorar/materia/${materiaId}?tab=resumenes&modulo=${suggestedModule}`,
        cta: 'Abrir resúmenes',
      },
      {
        label: 'Después',
        title: 'Practica tus errores',
        description:
          erroresPendientes > 0
            ? `Tienes ${erroresPendientes} respuestas para revisar y convertir en puntos rápidos.`
            : 'Aunque aprobaste, repasar tus errores te ayuda a fijar mejor el parcial.',
        href: `/simulador/errores/${materiaId}?parcial=${resolvedParcial}`,
        cta: 'Practicar errores',
      },
      ...(erroresPendientes > 0
        ? [
            {
              label: 'Premium',
              title: 'Simula solo este intento',
              description: 'Genera un simulador premium únicamente con las preguntas que fallaste en este examen.',
              href: `/simulador/ultimo-intento/${materiaId}/${resolvedParcial}`,
              cta: 'Simular mis errores',
            } satisfies ExamSummaryCard,
          ]
        : []),
      {
        label: 'Luego',
        title: 'Vuelve a rendir desde cero',
        description:
          aprobado
            ? 'Haz un nuevo intento cuando quieras medir si ya puedes sostener el resultado.'
            : 'Después del repaso, toma un nuevo modelo y compara si subiste la nota.',
        onClick: reiniciarSimulador,
        cta: 'Intentar de nuevo',
      },
    ];

    if (resolvedDemoMode) {
      return (
          <div className="flex min-h-[680px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_28%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)] p-4 sm:p-6">
            <Card className="w-full max-w-4xl overflow-hidden rounded-[34px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
              <div className="grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-12">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF0FF] px-4 py-2 text-sm font-semibold text-[#5B5FEF] ring-1 ring-[#D9DBFF]">
                    <Trophy className="h-4 w-4" />
                    Simulador de muestra
                  </div>
                  <h2 className="mt-6 text-[2rem] font-bold leading-[1.02] tracking-[-0.05em] text-[#0F1B3D] sm:text-[2.7rem]">
                    Terminaste tu prueba gratis
                  </h2>
                  <p className="mt-4 max-w-[420px] text-lg leading-8 text-slate-600">
                    Respondiste {respondidasFinales} de {totalPreguntasExamen} preguntas y obtuviste un {porcentaje}% de aciertos en {materiaNombre || 'esta materia'}.
                  </p>
                  <div className="mt-6 inline-flex items-end gap-3 rounded-[28px] border border-[#D9DBFF] bg-white/90 px-5 py-4 shadow-[0_18px_45px_rgba(99,102,241,0.12)]">
                    <span className={cn('text-[3rem] font-black leading-none tracking-[-0.07em]', porcentaje >= 60 ? 'text-[#4F46E5]' : 'text-rose-600')}>
                      {porcentaje}%
                    </span>
                    <span className="pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      aciertos
                    </span>
                  </div>
                  <p className="mt-6 max-w-[460px] text-sm leading-7 text-slate-600">
                    Crea tu cuenta o inicia sesión para desbloquear el simulador completo, guardar tu progreso y ver correcciones inteligentes de tus errores.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={loginHref}
                      onClick={() => void emitLoginGateEvent('simulator_login_gate_cta_clicked', 'login')}
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-6 text-base font-semibold text-white shadow-[0_16px_35px_rgba(99,102,241,0.30)] hover:opacity-95"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href={signupHref}
                      onClick={() => void emitLoginGateEvent('simulator_login_gate_cta_clicked', 'signup')}
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-base font-semibold text-[#5D65F6] hover:bg-[#EEF0FF]"
                    >
                      Crear cuenta
                    </Link>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Aciertos</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {aciertosFinales}
                      <span className="text-sm font-semibold text-slate-500"> / {totalPreguntasExamen}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nota estimada</p>
                    <p className={cn('mt-2 text-2xl font-black', aprobado ? 'text-emerald-600' : 'text-amber-600')}>
                      {nota.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Qué desbloqueas al continuar</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Resultado final, guardado del intento, recomendaciones de repaso y práctica enfocada en tus errores.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
      );
    }

    return (
        <div className="flex min-h-[700px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_28%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)] p-4 sm:p-6">
        <div className="w-full max-w-6xl [perspective:2200px]">
          <div
            className={cn(
              'relative',
              isMobileResults ? 'min-h-[1080px]' : 'transition-transform duration-700 [transform-style:preserve-3d]'
            )}
            style={isMobileResults ? undefined : { transform: showResultsFace ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <Card className={cn(
              'relative w-full overflow-hidden rounded-[34px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]',
              isMobileResults
                ? showResultsFace
                  ? 'pointer-events-none translate-y-6 opacity-0 transition-all duration-500'
                  : 'translate-y-0 opacity-100 transition-all duration-500'
                : 'min-h-[620px] [backface-visibility:hidden]'
            )}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6366F1]/50 to-transparent" />
              <div className="absolute inset-0 overflow-hidden">
                {['left-12 top-24 bg-[#5B5FEF]', 'left-40 top-12 bg-[#F97316]', 'left-64 top-36 bg-[#FBBF24]', 'right-16 top-20 bg-[#7C3AED]', 'right-36 top-36 bg-[#60A5FA]', 'right-60 top-10 bg-[#F97316]', 'left-80 top-20 bg-[#93C5FD]'].map((item) => (
                  <span
                    key={item}
                    className={cn('absolute h-4 w-1.5 rotate-12 rounded-full opacity-80', item)}
                  />
                ))}
              </div>

              <div className="relative grid min-h-[540px] gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-[620px] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-14 lg:py-12">
                <div className="max-w-[430px]">
                  <div className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm', needsMotivation ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-[#EEF0FF] text-[#5B5FEF] ring-1 ring-[#D9DBFF]')}>
                    {needsMotivation ? <Star className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                    {needsMotivation ? 'Todavía puedes levantarlo' : 'Resultado del simulador'}
                  </div>
                  <h2 className="mt-6 text-[2.1rem] font-bold leading-[1.02] tracking-[-0.05em] text-[#0F1B3D] sm:text-[3rem]">
                    {frontTitle}
                  </h2>
                  <p className="mt-4 max-w-[360px] text-lg leading-8 text-slate-600 sm:text-[24px] sm:leading-9">
                    {frontMessage}
                  </p>
                  <div className="mt-6 inline-flex items-end gap-3 rounded-[28px] border border-[#D9DBFF] bg-white/90 px-5 py-4 shadow-[0_18px_45px_rgba(99,102,241,0.12)]">
                    <span className={cn('text-[3.1rem] font-black leading-none tracking-[-0.07em]', porcentaje >= 85 ? 'text-[#4F46E5]' : porcentaje >= 60 ? 'text-[#2563EB]' : 'text-rose-600')}>
                      {porcentaje}%
                    </span>
                    <span className="pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      resultado
                    </span>
                  </div>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                      onClick={() => setShowResultsFace(true)}
                      className="h-12 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-6 text-base font-semibold shadow-[0_16px_35px_rgba(99,102,241,0.30)] hover:opacity-95"
                    >
                      Ver resultados
                    </Button>
                    {userId ? (
                      <Button
                        variant="outline"
                        onClick={() => void shareSimulatorResult()}
                        className="h-12 rounded-xl border-slate-200 px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Compartir mi resultado
                      </Button>
                    ) : null}
                    <Button variant="ghost" onClick={() => window.history.back()} className="h-12 rounded-xl px-4 text-base font-semibold text-[#5D65F6] hover:bg-[#EEF0FF] hover:text-[#4C55E6]">
                      Volver a la materia
                    </Button>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-slate-600">¿Te sirvió este simulador?</p>
                    <button
                      type="button"
                      onClick={() => void handleSimulatorVote(1)}
                      disabled={simulatorVoteLoading}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                        simulatorVote === 1
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Me gustó
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSimulatorVote(-1)}
                      disabled={simulatorVoteLoading}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                        simulatorVote === -1
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No me gustó
                    </button>
                  </div>
                  <div className="mt-6 grid max-w-[360px] grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Aciertos</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">
                        {aciertosFinales}
                        <span className="text-sm font-semibold text-slate-500"> / {totalPreguntasExamen}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nota</p>
                      <p className={cn('mt-2 text-2xl font-black', aprobado ? 'text-emerald-600' : 'text-amber-600')}>
                        {nota.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  {needsMotivation ? (
                    <p className="mt-6 max-w-[390px] text-sm leading-7 text-slate-600">
                      No aprobaste esta vez, pero ya identificamos por dónde empezar. Con un repaso enfocado en el Módulo {suggestedModule} y otro intento, esta nota puede subir rápido.
                    </p>
                  ) : null}
                </div>

                <div className="relative flex justify-center lg:justify-end">
                  <Image
                    src={needsMotivation ? '/simulador-resultado-motivacional.webp' : '/simulador-resultado.webp'}
                    alt={needsMotivation ? 'Resultado motivacional del simulador' : 'Resultado final del simulador'}
                    width={1024}
                    height={1536}
                    className="h-auto w-full max-w-[560px] object-contain"
                  />
                </div>
              </div>
            </Card>

            <Card className={cn(
              'overflow-hidden rounded-[34px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]',
              isMobileResults
                ? showResultsFace
                  ? 'relative mt-4 translate-y-0 opacity-100 transition-all duration-500'
                  : 'pointer-events-none absolute inset-0 -translate-y-6 opacity-0 transition-all duration-500'
                : 'absolute inset-0 min-h-[620px] w-full [backface-visibility:hidden] [transform:rotateY(180deg)]'
            )}>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)]" />
              <div className="relative h-full overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                <div className="mx-auto max-w-5xl">
                  <div className="rounded-[28px] border border-slate-200 bg-white/90 px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-sm font-semibold text-[#5D65F6]">Resultados del simulador</p>
                        <h3 className="mt-1 text-[2rem] font-bold tracking-[-0.04em] text-slate-900 sm:text-[2.35rem]">
                          Tu revision completa
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-[15px]">
                          {materiaNombre || `Materia ${materiaId}`} · {getParcialLabel(parcial)}
                        </p>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                        Revisa dónde fallaste, qué tema te conviene reforzar y cómo encarar el próximo intento.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                        <Button variant="outline" onClick={() => setShowResultsFace(false)} className="rounded-xl px-5">
                          Volver a la tarjeta
                        </Button>
                        {userId ? (
                          <Button variant="outline" onClick={() => void shareSimulatorResult()} className="rounded-xl px-5">
                            Compartir mi resultado
                          </Button>
                        ) : null}
                        <Button variant="outline" onClick={() => window.history.back()} className="rounded-xl px-5">
                          Volver a la materia
                        </Button>
                        <Button onClick={reiniciarSimulador} className="rounded-xl bg-indigo-600 px-5 hover:bg-indigo-700">
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Intentar de nuevo
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {examSummaryCards.map((card) => (
                      <div key={card.label} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {card.label}
                        </p>
                        <h3 className="mt-2 text-[17px] font-semibold text-slate-900">{card.title}</h3>
                        <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600">{card.description}</p>
                        {'href' in card ? (
                          <Link href={card.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
                            {card.cta}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        ) : (
                          <button type="button" onClick={card.onClick} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
                            {card.cta}
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={cn('mt-6 rounded-[28px] p-6 text-left shadow-[0_14px_30px_rgba(15,23,42,0.04)]', needsMotivation ? 'border border-rose-200 bg-rose-50' : 'border border-indigo-200 bg-indigo-50/70')}>
                    <p className={cn('text-xs font-semibold uppercase tracking-wide', needsMotivation ? 'text-rose-700' : 'text-indigo-700')}>
                      Revisión rápida por tema
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">{patternMessage}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {needsMotivation
                        ? `Todavía no alcanzaste el 60%, pero ya tienes una ruta clara: ${recommendationMessage}`
                        : recommendationMessage}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{errorFocus.description}</p>
                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                      <Button asChild className={cn('rounded-xl', needsMotivation ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700')}>
                        <Link href={`/explorar/materia/${materiaId}?tab=resumenes&modulo=${suggestedModule}`}>
                          Repasar resúmenes
                        </Link>
                      </Button>
                      <div className={cn('rounded-xl border bg-white px-4 py-3 text-sm', needsMotivation ? 'border-rose-200 text-rose-800' : 'border-indigo-200 text-indigo-800')}>
                        Recomendación de este intento: enfócate en Módulo {suggestedModule}.
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-left shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                    <h3 className="text-lg font-bold text-slate-900">Tutor Evaluo: por qué fallaste y cómo mejorarlo</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Con tu plan gratuito accedes a 3 explicaciones inteligentes por simulador.
                    </p>
                    {loadingExplanations ? (
                      <p className="mt-3 text-sm text-slate-600">Generando explicaciones personalizadas...</p>
                    ) : wrongExplanations.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                        <p className="text-sm font-semibold text-emerald-900">No hubo errores para revisar.</p>
                        <p className="mt-1 text-sm text-emerald-800">
                          Excelente trabajo. Si quieres consolidarlo todavía más, intenta otro modelo o repasa el módulo sugerido.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {wrongExplanations.map((item) => (
                          <div key={item.preguntaId} className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-sm font-semibold text-slate-800">{item.enunciado}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{item.explicacion}</p>
                            <div className="mt-3 flex items-center gap-2">
                              {(() => {
                                const currentVote = feedbackVotes[item.preguntaId];
                                const currentLoading = feedbackLoading[item.preguntaId];

                                return (
                                  <>
                                    <button
                                      onClick={() => void handleExplanationFeedback(item.preguntaId, 1)}
                                      disabled={Boolean(currentLoading)}
                                      className={cn(
                                        'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition',
                                        currentVote === 1
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                                        currentLoading === 1 && 'opacity-70'
                                      )}
                                    >
                                      <ThumbsUp className="h-3.5 w-3.5" />
                                      Me ayudo
                                    </button>
                                    <button
                                      onClick={() => void handleExplanationFeedback(item.preguntaId, -1)}
                                      disabled={Boolean(currentLoading)}
                                      className={cn(
                                        'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition',
                                        currentVote === -1
                                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                                          : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                                        currentLoading === -1 && 'opacity-70'
                                      )}
                                    >
                                      <ThumbsDown className="h-3.5 w-3.5" />
                                      No me ayudo
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isPremium && wrongExplanations.length > 0 ? (
                      explanationsMetrics ? (
                        <SimulatorPremiumUpsell
                          cacheHits={explanationsMetrics.cacheHits}
                          generatedCount={explanationsMetrics.generatedCount}
                          onUpgrade={() => window.location.assign('/pricing')}
                        />
                      ) : null
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const accessibleQuestionCount = resolvedDemoMode
    ? Math.min(DEMO_TOTAL_QUESTIONS, preguntasDisponibles)
    : Math.min(questionLimit, preguntasDisponibles);
  const maxIndex = Math.max(0, accessibleQuestionCount - 1);
  const isCurrentFlagged = flaggedQuestions.includes(currentQuestionIndex);
  const isLastQuestion = currentQuestionIndex === Math.max(0, Math.min(questionLimit, preguntasDisponibles) - 1);
  const isDemoCheckpointQuestion = resolvedDemoMode && currentQuestionIndex === demoCheckpointIndex;

  if (estado === 'playing' && !hasStarted) {
    const returnToMateriaHref = getMateriaRoute(materiaId, carreraId);

    return (
        <div className="flex min-h-[600px] items-center justify-center bg-[#F5F7FB] p-6">
          <Card className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {`Antes de comenzar el Preguntero de ${materiaNombre || `Materia ${materiaId}`}`}
            </h2>
            <p className="mt-3 text-slate-600">
              Contamos con múltiples modelos de examen para practicar. No todos son iguales:
              cada intento mezcla los diferentes modelos que tiene la universidad para que puedas entender cada modelo de examen.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-xs text-slate-500">Preguntas</p>
                <p className="font-bold text-slate-900">{preguntasDisponibles}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-xs text-slate-500">Tiempo</p>
                <p className="font-bold text-slate-900">{formatTime(examDurationSeconds)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-xs text-slate-500">Parcial</p>
                <p className="font-bold text-slate-900">{getParcialLabel(parcial)}</p>
              </div>
            </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  onClick={() => {
                    simulatorLifecycleRef.current.outcomeTracked = false;
                    setHasStarted(true);
                    persistSimulatorSnapshot({ hasStarted: true });
                    if (!resolvedDemoMode) {
                      void emitSimulatorEvent('simulator_started', {
                        questionIndex: 1,
                        answered: 0,
                        progress: 0,
                        timeLeft: examDurationSeconds,
                      });
                    }
                  }}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  Comenzar simulador
                </Button>
                <Link
                  href={returnToMateriaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <BookOpen className="h-4 w-4 text-[#4F5DFF]" />
                  Ver resúmenes y material de la materia
                </Link>
              </div>
            </Card>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F9] pb-36 lg:pb-8">
      <header className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-[30px] font-black tracking-[-0.04em] text-[#0F1B3D]">
              Evaluo
            </Link>

            <div>
              <p className="text-2xl font-semibold text-slate-900">Simulador de Examen</p>
              <p className="text-sm text-slate-500">
                {materiaNombre || `Materia ${materiaId}`} · {getParcialLabel(parcial)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const snapshot = simulatorLifecycleRef.current;
                if (!resolvedDemoMode && !snapshot.outcomeTracked && snapshot.hasStarted) {
                  simulatorLifecycleRef.current.outcomeTracked = true;
                  void emitSimulatorEvent('simulator_abandoned', {
                    questionIndex: snapshot.currentQuestionIndex + 1,
                    answered: snapshot.answeredCount,
                    progress: snapshot.preguntasDisponibles
                      ? Math.round((snapshot.answeredCount / snapshot.preguntasDisponibles) * 100)
                      : 0,
                    timeLeft: snapshot.timeLeft,
                  });
                }
                window.history.back();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Abandonar examen
            </button>

            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {getUserInitials()}
              </div>
              <span className="max-w-[130px] truncate text-sm font-medium text-slate-700">
                {getUserName()}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Clock3 className="h-4 w-4 text-slate-500" />
            <span className="font-mono text-sm font-bold text-slate-800">{formatTime(timeLeft)}</span>
          </div>
              <p className="text-sm font-semibold text-slate-700">
            {currentQuestionIndex + 1}/{questionLimit}
              </p>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-3 py-3 lg:py-6">
        {showSimulatorTour ? (
          <div className="pointer-events-none absolute inset-x-0 top-[88px] z-[60] hidden h-[calc(100%-88px)] bg-white/18 backdrop-blur-[3px] lg:block" />
        ) : null}
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)_14rem] lg:gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_15.5rem] xl:gap-5">
          <aside
            ref={questionsTourTargetRef}
            className={cn(
              'relative hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block',
              showSimulatorTour &&
                currentTourStep.id === 'questions' &&
                'z-[70] ring-1 ring-[#BFD4FF] shadow-[0_24px_70px_rgba(15,23,42,0.16)]'
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">Pregunta {currentQuestionIndex + 1} de {questionLimit}</p>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <Flag className="h-3.5 w-3.5" /> {flaggedQuestions.length}
              </div>
            </div>
            {showSimulatorTour && currentTourStep.id === 'questions' ? (
              <SimulatorTourCard
                step={currentTourStep}
                stepIndex={simulatorTourStepIndex}
                totalSteps={SIMULATOR_TOUR_STEPS.length}
                direction={simulatorTourDirection}
                onNext={handleSimulatorTourNext}
                onPrevious={handleSimulatorTourPrevious}
                onClose={closeSimulatorTour}
                className="left-full top-1/2 ml-6 -translate-y-1/2 pointer-events-auto"
              />
            ) : null}

            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: questionLimit }, (_, index) => {
                const isCurrent = currentQuestionIndex === index;
                const isAnswered = selectedAnswers[index] !== undefined;
                const isFlagged = flaggedQuestions.includes(index);
                const isDisabled = index > maxIndex;

                return (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    disabled={isDisabled}
                    className={cn(
                      'relative h-8 rounded-lg border text-[11px] font-semibold transition',
                      isDisabled && 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300',
                      !isDisabled && 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                      isAnswered && !isDisabled && 'bg-blue-50 text-blue-700',
                      isCurrent && !isDisabled && 'border-blue-500 ring-2 ring-blue-100'
                    )}
                  >
                    {index + 1}
                    {isFlagged ? <Star className="absolute -right-1 -top-1 h-3 w-3 fill-orange-400 text-orange-500" /> : null}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => void finalizarExamen('manual')}
              disabled={isFinishing}
              className="mt-4 w-full rounded-lg bg-slate-900 py-4 text-sm text-white hover:bg-slate-800"
            >
              Finalizar
            </Button>
          </aside>

          <main
            className={cn(
              'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6',
              showSimulatorTour &&
                (currentTourStep.id === 'mark' || currentTourStep.id === 'navigation') &&
                'relative z-[70] ring-1 ring-[#BFD4FF] shadow-[0_24px_70px_rgba(15,23,42,0.16)]'
            )}
          >
            <div className="mb-6 hidden items-center justify-between lg:flex">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <Clock3 className="h-4 w-4 text-slate-500" />
                <span className="font-mono text-sm font-bold text-slate-800">{formatTime(timeLeft)}</span>
              </div>

              <div ref={markTourTargetRef} className="relative">
              <button
                onClick={() => toggleFlag()}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition',
                  isCurrentFlagged
                    ? 'border-orange-200 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                )}
              >
                <Star className={cn('h-4 w-4', isCurrentFlagged && 'fill-orange-400 text-orange-500')} />
                Marcar
              </button>
              {showSimulatorTour && currentTourStep.id === 'mark' ? (
                <SimulatorTourCard
                  step={currentTourStep}
                  stepIndex={simulatorTourStepIndex}
                  totalSteps={SIMULATOR_TOUR_STEPS.length}
                  direction={simulatorTourDirection}
                  onNext={handleSimulatorTourNext}
                  onPrevious={handleSimulatorTourPrevious}
                  onClose={closeSimulatorTour}
                  className="right-0 top-full mt-4 pointer-events-auto"
                />
              ) : null}
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Pregunta {currentQuestionIndex + 1}</p>
              <h2 className="mt-2 text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
                {preguntaActual?.enunciado}
              </h2>
              {preguntaActual && preguntaActual.correctCount > 1 ? (
                <p className="mt-2 text-xs font-semibold text-indigo-700">
                  Selecciona {preguntaActual.correctCount} opciones correctas.
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              {preguntaActualShuffled?.options?.map((opcion, idx) => {
                const answerValue = selectedAnswers[currentQuestionIndex];
                const multi = Boolean(preguntaActual && preguntaActual.correctCount > 1);
                const selected = Array.isArray(answerValue) ? answerValue.includes(idx) : answerValue === idx;
                const questionAnswered = multi
                  ? Array.isArray(answerValue) &&
                    answerValue.length === (preguntaActual?.correctCount ?? 0)
                  : answerValue !== undefined;
                const gradedFeedback = feedbackByQuestion[currentQuestionIndex];
                const optionIsCorrect = gradedFeedback
                  ? isCorrectChoice(currentQuestionIndex, idx)
                  : false;
                const selectedIsWrong =
                  selected && questionAnswered && gradedFeedback !== undefined && !optionIsCorrect;

                return (
                  <button
                    key={`${currentQuestionIndex}-${idx}`}
                    onClick={() => handleSelectAnswer(idx)}
                    disabled={questionAnswered}
                    className={cn(
                      'w-full rounded-lg border p-3.5 text-left transition',
                      !questionAnswered && 'border-slate-200 bg-[#FBFCFF] hover:border-slate-300 hover:bg-white',
                      questionAnswered && 'border-slate-200 bg-white',
                      selected && !questionAnswered && 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-100',
                      questionAnswered &&
                        optionIsCorrect &&
                        'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100',
                      selectedIsWrong && 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-100'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold uppercase',
                          selected
                            ? 'border-blue-500 bg-white text-blue-600'
                            : 'border-slate-300 bg-white text-slate-500'
                        )}
                      >
                        {optionLabels[idx] ?? idx + 1}
                      </span>
                      <span className="text-sm leading-5 sm:text-[15px]">{opcion}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div ref={navigationTourTargetRef} className="relative mt-6 hidden items-center justify-between lg:flex">
              <Button
                variant="outline"
                onClick={goPrevious}
                disabled={currentQuestionIndex === 0}
                className="rounded-xl px-5"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <p className="text-sm text-slate-500">
                Respondidas: <span className="font-semibold text-slate-800">{answeredCount}</span> / {preguntasDisponibles}
              </p>
              <Button
                onClick={() => (isLastQuestion ? void finalizarExamen('manual') : goNext())}
                disabled={isFinishing}
                className="rounded-xl bg-indigo-600 px-5 hover:bg-indigo-700"
              >
                {isDemoCheckpointQuestion ? 'Continuar' : isLastQuestion ? 'Finalizar' : 'Siguiente'}
                {!isLastQuestion || isDemoCheckpointQuestion ? <ChevronRight className="ml-1 h-4 w-4" /> : null}
              </Button>
              {showSimulatorTour && currentTourStep.id === 'navigation' ? (
                <SimulatorTourCard
                  step={currentTourStep}
                  stepIndex={simulatorTourStepIndex}
                  totalSteps={SIMULATOR_TOUR_STEPS.length}
                  direction={simulatorTourDirection}
                  onNext={handleSimulatorTourNext}
                  onPrevious={handleSimulatorTourPrevious}
                  onClose={closeSimulatorTour}
                  className="right-0 bottom-full mb-4 pointer-events-auto"
                />
              ) : null}
            </div>
          </main>

          <aside className="mt-6 hidden space-y-3 lg:mt-0 lg:block">
            <Card
              ref={timerTourTargetRef}
              className={cn(
                'relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
                showSimulatorTour &&
                  currentTourStep.id === 'timer' &&
                  'z-[70] ring-1 ring-[#BFD4FF] shadow-[0_24px_70px_rgba(15,23,42,0.16)]'
              )}
            >
              <div className="flex items-center gap-2 text-slate-700">
                <Clock3 className="h-3.5 w-3.5" />
                <p className="text-xs font-semibold">Tiempo restante</p>
              </div>
              <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-slate-900">
                {formatTime(timeLeft)}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, (timeLeft / examDurationSeconds) * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">de {formatTime(examDurationSeconds)}</p>
              {showSimulatorTour && currentTourStep.id === 'timer' ? (
                <SimulatorTourCard
                  step={currentTourStep}
                  stepIndex={simulatorTourStepIndex}
                  totalSteps={SIMULATOR_TOUR_STEPS.length}
                  direction={simulatorTourDirection}
                  onNext={handleSimulatorTourNext}
                  onPrevious={handleSimulatorTourPrevious}
                  onClose={closeSimulatorTour}
                  className="right-full top-3 mr-4 pointer-events-auto"
                />
              ) : null}
            </Card>

            <Card
              ref={progressTourTargetRef}
              className={cn(
                'relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
                showSimulatorTour &&
                  currentTourStep.id === 'progress' &&
                  'z-[70] ring-1 ring-[#BFD4FF] shadow-[0_24px_70px_rgba(15,23,42,0.16)]'
              )}
            >
              <p className="text-xs font-semibold text-slate-800">Progreso del examen</p>

              <div className="mt-3 flex justify-center">
                <div className="relative grid h-24 w-24 place-items-center rounded-full" style={progressRingStyle}>
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-white">
                    <span className="text-2xl font-black text-slate-800">{progressPercent}%</span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-slate-500">
                {answeredCount} de {preguntasDisponibles || questionLimit} preguntas
              </p>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Respondidas</span>
                  <span className="font-semibold">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Sin responder</span>
                  <span className="font-semibold">{unansweredCount}</span>
                </div>
                <div className="flex items-center justify-between text-orange-500">
                  <span>Marcadas</span>
                  <span className="font-semibold">{flaggedQuestions.length}</span>
                </div>
              </div>
              {showSimulatorTour && currentTourStep.id === 'progress' ? (
                <SimulatorTourCard
                  step={currentTourStep}
                  stepIndex={simulatorTourStepIndex}
                  totalSteps={SIMULATOR_TOUR_STEPS.length}
                  direction={simulatorTourDirection}
                  onNext={handleSimulatorTourNext}
                  onPrevious={handleSimulatorTourPrevious}
                  onClose={closeSimulatorTour}
                  className="right-full top-3 mr-4 pointer-events-auto"
                />
              ) : null}
            </Card>

            <Card className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
              <p className="text-xs font-semibold text-blue-700">Consejo</p>
              <p className="mt-2 text-xs leading-5 text-blue-700">
                Leé cada pregunta atentamente antes de seleccionar tu respuesta.
              </p>
            </Card>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/98 px-2.5 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={goPrevious}
              disabled={currentQuestionIndex === 0}
              className="h-10 flex-1 rounded-xl px-3 text-[13px]"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <button
              onClick={() => toggleFlag()}
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition',
                isCurrentFlagged
                  ? 'border-orange-200 bg-orange-50 text-orange-600'
                  : 'border-slate-200 bg-white text-slate-600'
              )}
              aria-label="Marcar pregunta"
            >
              <Star className={cn('h-4 w-4', isCurrentFlagged && 'fill-orange-400 text-orange-500')} />
            </button>
            <Button
              onClick={() => (isLastQuestion ? void finalizarExamen('manual') : goNext())}
              disabled={isFinishing}
              className="h-10 flex-1 rounded-xl bg-indigo-600 px-3 text-[13px] hover:bg-indigo-700"
            >
              {isDemoCheckpointQuestion ? 'Continuar' : isLastQuestion ? 'Finalizar' : 'Siguiente'}
              {!isLastQuestion || isDemoCheckpointQuestion ? <ChevronRight className="ml-1 h-4 w-4" /> : null}
            </Button>
          </div>

          <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Mapa rápido
            </p>
            <p className="text-[12px] font-medium text-slate-500">
              {currentQuestionIndex + 1} de {questionLimit}
            </p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: questionLimit }, (_, index) => {
              const isCurrent = currentQuestionIndex === index;
              const isAnswered = selectedAnswers[index] !== undefined;
              const isFlagged = flaggedQuestions.includes(index);
              const isDisabled = index > maxIndex;

              return (
                <button
                  key={`mobile-${index}`}
                  onClick={() => goToQuestion(index)}
                  disabled={isDisabled}
                  className={cn(
                    'relative h-8 min-w-8 shrink-0 rounded-lg border px-1 text-[10px] font-semibold',
                    isDisabled && 'border-slate-100 bg-slate-50 text-slate-300',
                    !isDisabled && 'border-slate-200 bg-white text-slate-700',
                    isAnswered && !isDisabled && 'bg-blue-50 text-blue-700',
                    isCurrent && !isDisabled && 'border-blue-500 ring-1 ring-blue-200'
                  )}
                >
                  {index + 1}
                  {isFlagged ? (
                    <Star className="absolute -right-1 -top-1 h-2.5 w-2.5 fill-orange-400 text-orange-500" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => void finalizarExamen('manual')}
            disabled={isFinishing}
            className="mt-1.5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
