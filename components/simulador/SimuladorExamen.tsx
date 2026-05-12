'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  checkProfileStatus,
  finalizarSimuladorAction,
  getWrongAnswersExplanations,
  getPreguntasSimuladorErrores,
  getPreguntasSimuladorPremium,
  getPreguntasSimulador,
  registrarRespuestaUsuario,
  type Pregunta,
} from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileCompletionModal } from '@/components/profile-completion-modal';
import { ElegantLoader } from '@/components/ui/elegant-loader';
import { Spinner } from '@/components/ui/spinner';
import { useUser } from '@/hooks/useUser';
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
  mode?: 'regular' | 'errores';
  premiumOnly?: boolean;
}

type EstadoExamen = 'loading' | 'resume_choice' | 'playing' | 'finished' | 'error' | 'profile_incomplete';

const TOTAL_QUESTIONS = 30;
const EXAM_TIME_SECONDS = 30 * 60;
const optionLabels = ['a', 'b', 'c', 'd'];
type SimuladorPersistedState = {
  version: 2;
  userId: string;
  materiaId: string;
  parcial: number;
  mode: 'regular' | 'errores';
  preguntas: Pregunta[];
  currentQuestionIndex: number;
  timeLeft: number;
  selectedAnswers: Record<number, number | number[]>;
  flaggedQuestions: number[];
  hasStarted: boolean;
  savedAt: string;
};

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

function dedupeOptionsForView(options: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const option of options) {
    const clean = option.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clean);
  }
  return unique;
}

function parseCorrectAnswers(raw: string): string[] {
  return raw
    .split(/\s*(?:\||;)\s*/g)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function isMultiAnswer(raw: string): boolean {
  return parseCorrectAnswers(raw).length > 1;
}

function normalizeForCompare(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
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
      title: `Buen dominio del Modulo ${suggestedModule}`,
      description: 'No detectamos un patron fuerte de error en este intento.',
      recommendation: `Si queres consolidarlo mas, repasa una vez el Modulo ${suggestedModule} y vuelve a intentar.`,
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
      title: `Te costaron mas las preguntas de aplicacion del Modulo ${suggestedModule}`,
      description: 'Tus errores aparecen mas en consignas donde hay que aplicar criterios a casos o situaciones concretas.',
      recommendation: `Repasa ejemplos resueltos y luego vuelve a practicar el Modulo ${suggestedModule} con foco en aplicacion practica.`,
    };
  }

  return {
    title: `Fallaste mas en preguntas teoricas del Modulo ${suggestedModule}`,
    description: 'Tus errores se concentran mas en definiciones, criterios base y preguntas de marco conceptual.',
    recommendation: `Te conviene reforzar primero los conceptos clave del Modulo ${suggestedModule} antes del proximo intento.`,
  };
}

function resolveExamParcial(parcial: number, preguntas: Pregunta[]): number {
  const questionParcial = preguntas.find((pregunta) => pregunta.parcial === 1 || pregunta.parcial === 2)?.parcial;
  return questionParcial === 2 ? 2 : Number(parcial) === 2 ? 2 : 1;
}

export default function SimuladorExamen({
  materiaId,
  parcial,
  universidadId,
  carreraId,
  mode = 'regular',
  premiumOnly = false,
}: SimuladorExamenProps) {
  const { user, loading: userLoading, getUserName, getUserInitials } = useUser();

  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [estado, setEstado] = useState<EstadoExamen>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME_SECONDS);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | number[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [aciertosFinales, setAciertosFinales] = useState(0);
  const [respondidasFinales, setRespondidasFinales] = useState(0);
  const [materiaNombre, setMateriaNombre] = useState('');
  const [wrongExplanations, setWrongExplanations] = useState<
    Array<{ preguntaId: string; enunciado: string; explicacion: string; provider: string; source: string }>
  >([]);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [explanationsMetrics, setExplanationsMetrics] = useState<{ cacheHits: number; generatedCount: number } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<Record<string, 1 | -1 | undefined>>({});
  const [feedbackVotes, setFeedbackVotes] = useState<Record<string, 1 | -1>>({});
  const [showResultsFace, setShowResultsFace] = useState(false);
  const [isMobileResults, setIsMobileResults] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [resumeSnapshot, setResumeSnapshot] = useState<SimuladorPersistedState | null>(null);
  const storageKey = useMemo(
    () => `evaluo_simulador_in_progress:${mode}:${materiaId}:${parcial}`,
    [mode, materiaId, parcial]
  );

  const preguntasDisponibles = preguntas.length;
  const preguntaActual = preguntas[currentQuestionIndex];
  const shuffledMetaByQuestion = useMemo<ShuffledQuestionMeta[]>(() => {
    return preguntas.map((question, index) => {
      const rawOptions = Array.isArray(question.opciones)
        ? dedupeOptionsForView(question.opciones)
        : [];
      const seed = `${question.id}:${index}:${question.respuesta_correcta}`;
      const { values, indexMap } = seededShuffle(rawOptions, seed);
      return { options: values, displayedToOriginal: indexMap };
    });
  }, [preguntas]);
  const preguntaActualShuffled = shuffledMetaByQuestion[currentQuestionIndex];
  const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);
  const unansweredCount = Math.max(0, preguntasDisponibles - answeredCount);
  const progressPercent = preguntasDisponibles
    ? Math.round((answeredCount / preguntasDisponibles) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressRingStyle = {
    background: `conic-gradient(#2563EB ${progressPercent * 3.6}deg, #E6EAF2 ${progressPercent * 3.6}deg)`,
  };

  const hydrateSavedExam = useCallback((saved: SimuladorPersistedState) => {
    setPreguntas(saved.preguntas.slice(0, TOTAL_QUESTIONS));
    setCurrentQuestionIndex(
      Math.max(0, Math.min(saved.currentQuestionIndex ?? 0, Math.max(0, saved.preguntas.length - 1)))
    );
    setTimeLeft(Math.max(0, Math.min(saved.timeLeft ?? EXAM_TIME_SECONDS, EXAM_TIME_SECONDS)));
    setSelectedAnswers(saved.selectedAnswers ?? {});
    setFlaggedQuestions(Array.isArray(saved.flaggedQuestions) ? saved.flaggedQuestions : []);
    setHasStarted(Boolean(saved.hasStarted));
    setResumeSnapshot(saved);
  }, []);

  const computeCorrectAnswers = useCallback(() => {
    return Object.entries(selectedAnswers).reduce((acc, [index, optionIndex]) => {
      const pregunta = preguntas[Number(index)];
      if (!pregunta) return acc;
      const meta = shuffledMetaByQuestion[Number(index)];
      if (!meta) return acc;
      const correctAnswers = parseCorrectAnswers(pregunta.respuesta_correcta);
      if (correctAnswers.length > 1) {
        const selectedIdx = Array.isArray(optionIndex) ? optionIndex : [];
        const selectedValues = selectedIdx
          .map((idx) => meta.displayedToOriginal[idx])
          .filter((idx) => typeof idx === 'number')
          .map((idx) => normalizeForCompare(pregunta.opciones[idx]));
        const expected = correctAnswers.map(normalizeForCompare);
        const isSame =
          selectedValues.length === expected.length &&
          selectedValues.every((value) => expected.includes(value));
        return isSame ? acc + 1 : acc;
      }
      const selectedSingle = Array.isArray(optionIndex) ? optionIndex[0] : optionIndex;
      const originalIndex = meta.displayedToOriginal[selectedSingle];
      const selectedOption = typeof originalIndex === 'number' ? pregunta.opciones[originalIndex] : '';
      return normalizeForCompare(selectedOption) === normalizeForCompare(correctAnswers[0] ?? '') ? acc + 1 : acc;
    }, 0);
  }, [preguntas, selectedAnswers, shuffledMetaByQuestion]);

  const isCorrectAnswer = useCallback(
    (questionIndex: number, optionIndex: number | number[]) => {
      const pregunta = preguntas[questionIndex];
      if (!pregunta) return false;
      const meta = shuffledMetaByQuestion[questionIndex];
      if (!meta) return false;
      const correctAnswers = parseCorrectAnswers(pregunta.respuesta_correcta);
      if (correctAnswers.length > 1) {
        const selectedIdx = Array.isArray(optionIndex) ? optionIndex : [];
        const selectedValues = selectedIdx
          .map((idx) => meta.displayedToOriginal[idx])
          .filter((idx) => typeof idx === 'number')
          .map((idx) => normalizeForCompare(pregunta.opciones[idx]));
        const expected = correctAnswers.map(normalizeForCompare);
        return (
          selectedValues.length === expected.length &&
          selectedValues.every((value) => expected.includes(value))
        );
      }
      const selectedSingle = Array.isArray(optionIndex) ? optionIndex[0] : optionIndex;
      const originalIndex = meta.displayedToOriginal[selectedSingle];
      return normalizeForCompare(pregunta.opciones[originalIndex] ?? '') === normalizeForCompare(correctAnswers[0] ?? '');
    },
    [preguntas, shuffledMetaByQuestion]
  );

  const isCorrectChoice = useCallback(
    (questionIndex: number, optionIndex: number) => {
      const pregunta = preguntas[questionIndex];
      if (!pregunta) return false;
      const meta = shuffledMetaByQuestion[questionIndex];
      if (!meta) return false;

      const originalIndex = meta.displayedToOriginal[optionIndex];
      if (typeof originalIndex !== 'number') return false;

      const selectedOption = pregunta.opciones[originalIndex] ?? '';
      const expected = parseCorrectAnswers(pregunta.respuesta_correcta).map(normalizeForCompare);

      return expected.includes(normalizeForCompare(selectedOption));
    },
    [preguntas, shuffledMetaByQuestion]
  );

  const finalizarExamen = useCallback(
    async (trigger: 'manual' | 'timer' = 'manual') => {
      if (!userId || isFinishing || estado !== 'playing') return;

      setIsFinishing(true);

      const correctas = computeCorrectAnswers();
      const respondidas = Object.keys(selectedAnswers).length;
      setAciertosFinales(correctas);
      setRespondidasFinales(respondidas);
      setShowResultsFace(false);
      setEstado('finished');
      setIsFinishing(false);
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore storage errors
      }

      const registros = Object.entries(selectedAnswers).map(([index, optionIndex]) => {
        const questionIndex = Number(index);
        const pregunta = preguntas[questionIndex];
        const meta = shuffledMetaByQuestion[questionIndex];
        if (!pregunta || !meta) return null;
        const esCorrecta = isCorrectAnswer(questionIndex, optionIndex);

        return registrarRespuestaUsuario({
          usuario_id: userId,
          pregunta_id: pregunta.id,
          materia_id: pregunta.materia_id,
          es_correcta: esCorrecta,
        });
      });

      void Promise.allSettled([
        finalizarSimuladorAction({
          usuario_id: userId,
          materia_id: materiaId,
          parcial,
          total_preguntas: preguntasDisponibles,
          respuestas_correctas: correctas,
          tiempo_restante: trigger === 'timer' ? 0 : timeLeft,
        }),
        ...registros.filter(Boolean),
      ]).catch((error) => {
        console.error('Error registrando resultado del simulador:', error);
      });
    },
    [
      computeCorrectAnswers,
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
    ]
  );

  const loadFreshQuestions = useCallback(async () => {
    const data =
      mode === 'errores'
        ? await getPreguntasSimuladorErrores(materiaId)
        : premiumOnly
        ? await getPreguntasSimuladorPremium(materiaId, parcial)
        : await getPreguntasSimulador(materiaId, parcial, universidadId, carreraId);

    if (data && data.length > 0) {
      setPreguntas(data.slice(0, TOTAL_QUESTIONS));
      setCurrentQuestionIndex(0);
      setTimeLeft(EXAM_TIME_SECONDS);
      setSelectedAnswers({});
      setFlaggedQuestions([]);
      setHasStarted(false);
      setResumeSnapshot(null);
      setEstado('playing');
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore storage errors
      }
      return true;
    }

    setEstado('error');
    return false;
  }, [carreraId, materiaId, mode, parcial, premiumOnly, storageKey, universidadId]);

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
          setEstado('error');
          return;
        }

        setUserId(user.id);

        const status = await checkProfileStatus(user.id);
        if (!status.isComplete) {
          setEstado('profile_incomplete');
          return;
        }

        const { data: materiaData } = await supabase
          .from('materias')
          .select('nombre')
          .eq('id', materiaId)
          .maybeSingle();

        if (materiaData?.nombre) {
          setMateriaNombre(materiaData.nombre);
        }

        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const saved = JSON.parse(raw) as SimuladorPersistedState;
            const valid =
              saved.version === 2 &&
              saved.userId === user.id &&
              saved.materiaId === materiaId &&
              saved.parcial === parcial &&
              saved.mode === mode &&
              Array.isArray(saved.preguntas) &&
              saved.preguntas.length > 0;

            if (valid) {
              hydrateSavedExam(saved);
              setEstado('resume_choice');
              return;
            }
          }
        } catch {
          // ignore localStorage parse errors
        }

        await loadFreshQuestions();
      } catch (error) {
        console.error('Error inicializando simulador:', error);
        setEstado('error');
      }
    }

    void inicializar();
  }, [hydrateSavedExam, loadFreshQuestions, materiaId, mode, parcial, storageKey, user, userLoading]);

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
      try {
        window.localStorage.setItem(
          'evaluo_last_simulador_context',
          JSON.stringify({ materiaId, parcial })
        );
      } catch {
        // ignore storage errors
      }
    }
  }, [estado, materiaId, parcial]);

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
      hasStarted,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [
    currentQuestionIndex,
    estado,
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
      const limitedWrongQuestionIds = wrongQuestionIds.slice(0, 3);

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
  }, [estado, isCorrectAnswer, materiaId, parcial, preguntas, selectedAnswers, userId]);

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
      console.error('Explanation feedback error:', error);
    } finally {
      setFeedbackLoading((prev) => {
        const next = { ...prev };
        delete next[preguntaId];
        return next;
      });
    }
  };

  const continueSavedExam = () => {
    if (!resumeSnapshot) return;
    hydrateSavedExam(resumeSnapshot);
    setEstado('playing');
  };

  const startNewExam = async () => {
    setEstado('loading');
    await loadFreshQuestions();
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (!preguntaActual) return;
    if (!isMultiAnswer(preguntaActual.respuesta_correcta)) {
      if (selectedAnswers[currentQuestionIndex] !== undefined) return;
      setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionIndex }));
      return;
    }

    const maxAllowed = parseCorrectAnswers(preguntaActual.respuesta_correcta).length;
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
    if (index < 0 || index >= TOTAL_QUESTIONS || index >= preguntasDisponibles) return;
    setCurrentQuestionIndex(index);
  };

  const goNext = () => {
    if (currentQuestionIndex < Math.min(TOTAL_QUESTIONS, preguntasDisponibles) - 1) {
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
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

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
    return (
      <div className="flex min-h-[600px] items-center justify-center p-6">
        <Card className="max-w-md rounded-2xl border border-red-100 bg-white/90 p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            {premiumOnly ? 'Aun no hay set premium cargado' : 'Estamos preparando este parcial'}
          </h2>
          <p className="mb-3 text-gray-600">
            {premiumOnly
              ? 'Estamos actualizando las ultimas preguntas validadas para este parcial premium.'
              : 'Estamos procesando el material oficial de esta materia para que Tutor Evaluo te enseñe con calidad.'}
          </p>
          <p className="mb-6 text-sm text-slate-500">
            {premiumOnly
              ? 'Volve en unas horas o probá el simulador regular mientras se actualiza este premium.'
              : 'Volve en unas horas o proba con Tecnologia y Modelos Globales.'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={reiniciarSimulador} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="rounded-xl">
              Volver a la materia
            </Button>
          </div>
        </Card>
      </div>
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
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Respondidas</p>
              <p className="font-bold text-slate-900">{Object.keys(resumeSnapshot?.selectedAnswers ?? {}).length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Tiempo restante</p>
              <p className="font-bold text-slate-900">{formatTime(resumeSnapshot?.timeLeft ?? EXAM_TIME_SECONDS)}</p>
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
    const totalPreguntasExamen = Math.max(1, preguntasDisponibles || TOTAL_QUESTIONS);
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
    const frontTitle = porcentaje >= 85 ? '¡Excelente trabajo!' : porcentaje >= 60 ? 'Buen trabajo' : 'Segui, vas a poder';
    const frontMessage = `Completaste el simulacro de ${materiaNombre || `Materia ${materiaId}`} con un ${porcentaje}%`;
    const examSummaryCards: ExamSummaryCard[] = [
      {
        label: 'Ahora',
        title: `Repasa el Modulo ${suggestedModule}`,
        description: recommendationMessage,
        href: `/explorar/materia/${materiaId}?tab=resumenes&modulo=${suggestedModule}`,
        cta: 'Abrir resumenes',
      },
      {
        label: 'Despues',
        title: 'Practica tus errores',
        description:
          erroresPendientes > 0
            ? `Tenes ${erroresPendientes} respuestas para revisar y convertir en puntos rapidos.`
            : 'Aunque aprobaste, repasar tus errores te ayuda a fijar mejor el parcial.',
        href: `/simulador/errores/${materiaId}`,
        cta: 'Practicar errores',
      },
      {
        label: 'Luego',
        title: 'Vuelve a rendir desde cero',
        description:
          aprobado
            ? 'Haz un nuevo intento cuando quieras medir si ya podes sostener el resultado.'
            : 'Despues del repaso, toma un nuevo modelo y compara si subiste la nota.',
        onClick: reiniciarSimulador,
        cta: 'Intentar de nuevo',
      },
    ];

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
                    {needsMotivation ? 'Todavia podes levantarlo' : 'Resultado del simulador'}
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
                    <Button variant="ghost" onClick={() => window.history.back()} className="h-12 rounded-xl px-4 text-base font-semibold text-[#5D65F6] hover:bg-[#EEF0FF] hover:text-[#4C55E6]">
                      Volver a la materia
                    </Button>
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
                      No aprobaste esta vez, pero ya identificamos por donde empezar. Con un repaso enfocado en el Modulo {suggestedModule} y otro intento, esta nota puede subir rapido.
                    </p>
                  ) : null}
                </div>

                <div className="relative flex justify-center lg:justify-end">
                  <Image
                    src={needsMotivation ? '/simulador-resultado-motivacional.webp' : '/simulador-resultado.webp'}
                    alt={needsMotivation ? 'Resultado motivacional del simulador' : 'Resultado final del simulador'}
                    width={1024}
                    height={1536}
                    priority
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
                          {materiaNombre || `Materia ${materiaId}`} · Parcial {resolvedParcial}
                        </p>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                        Revisa donde fallaste, que tema te conviene reforzar y como encarar el proximo intento.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                        <Button variant="outline" onClick={() => setShowResultsFace(false)} className="rounded-xl px-5">
                          Volver a la tarjeta
                        </Button>
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
                      Revision rapida por tema
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">{patternMessage}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {needsMotivation
                        ? `Todavia no alcanzaste el 60%, pero ya tenes una ruta clara: ${recommendationMessage}`
                        : recommendationMessage}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{errorFocus.description}</p>
                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                      <Button asChild className={cn('rounded-xl', needsMotivation ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700')}>
                        <Link href={`/explorar/materia/${materiaId}?tab=resumenes&modulo=${suggestedModule}`}>
                          Repasar resumenes
                        </Link>
                      </Button>
                      <div className={cn('rounded-xl border bg-white px-4 py-3 text-sm', needsMotivation ? 'border-rose-200 text-rose-800' : 'border-indigo-200 text-indigo-800')}>
                        Recomendacion de este intento: enfocate en Modulo {suggestedModule}.
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-left shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                    <h3 className="text-lg font-bold text-slate-900">Tutor Evaluo: por que fallaste y como mejorarlo</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Con tu plan gratuito accedes a 3 explicaciones inteligentes por simulador.
                    </p>
                    {loadingExplanations ? (
                      <p className="mt-3 text-sm text-slate-600">Generando explicaciones personalizadas...</p>
                    ) : wrongExplanations.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                        <p className="text-sm font-semibold text-emerald-900">No hubo errores para revisar.</p>
                        <p className="mt-1 text-sm text-emerald-800">
                          Excelente trabajo. Si queres consolidarlo todavia mas, intenta otro modelo o repasa el modulo sugerido.
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
                    {wrongExplanations.length > 0 ? (
                      <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                        <p className="text-sm font-semibold text-indigo-900">
                          Queres ver explicaciones de todas tus respuestas incorrectas?
                        </p>
                        <p className="mt-1 text-xs text-indigo-800">
                          Pasate a Premium y desbloquea la correccion completa de todas tus respuestas incorrectas, con recomendaciones personalizadas para subir tu nota mas rapido.
                        </p>
                        <Button
                          className="mt-3 h-8 rounded-lg bg-indigo-600 px-3 text-xs font-semibold hover:bg-indigo-700"
                          onClick={() => window.location.assign('/pricing')}
                        >
                          Quiero pasarme a Premium
                        </Button>
                        {explanationsMetrics ? (
                          <p className="mt-2 text-[11px] text-indigo-700">
                            Ahorro inteligente: {explanationsMetrics.cacheHits} explicaciones reutilizadas y {explanationsMetrics.generatedCount} nuevas en este intento.
                          </p>
                        ) : null}
                      </div>
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

  const maxIndex = Math.max(0, Math.min(TOTAL_QUESTIONS, preguntasDisponibles) - 1);
  const isCurrentFlagged = flaggedQuestions.includes(currentQuestionIndex);
  const isLastQuestion = currentQuestionIndex === maxIndex;

  if (estado === 'playing' && !hasStarted) {
    return (
      <div className="flex min-h-[600px] items-center justify-center bg-[#F5F7FB] p-6">
        <Card className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-extrabold text-slate-900">Antes de comenzar</h2>
          <p className="mt-3 text-slate-600">
            Contamos con mas de 30 modelos de examen para practicar. No todos son iguales:
            cada intento mezcla preguntas distintas para entrenarte de forma real.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Preguntas</p>
              <p className="font-bold text-slate-900">{preguntasDisponibles}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Tiempo</p>
              <p className="font-bold text-slate-900">{formatTime(EXAM_TIME_SECONDS)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">Parcial</p>
              <p className="font-bold text-slate-900">{parcial}</p>
            </div>
          </div>
          <Button onClick={() => setHasStarted(true)} className="mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-700">
            Comenzar simulador
          </Button>
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
                {materiaNombre || `Materia ${materiaId}`} · Parcial {parcial}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
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
            {currentQuestionIndex + 1}/{TOTAL_QUESTIONS}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-3 lg:py-6">
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)_14rem] lg:gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_15.5rem] xl:gap-5">
          <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">Pregunta {currentQuestionIndex + 1} de 30</p>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <Flag className="h-3.5 w-3.5" /> {flaggedQuestions.length}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: TOTAL_QUESTIONS }, (_, index) => {
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

          <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
            <div className="mb-6 hidden items-center justify-between lg:flex">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <Clock3 className="h-4 w-4 text-slate-500" />
                <span className="font-mono text-sm font-bold text-slate-800">{formatTime(timeLeft)}</span>
              </div>

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
            </div>

            <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Pregunta {currentQuestionIndex + 1}</p>
              <h2 className="mt-2 text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
                {preguntaActual?.enunciado}
              </h2>
              {preguntaActual && isMultiAnswer(preguntaActual.respuesta_correcta) ? (
                <p className="mt-2 text-xs font-semibold text-indigo-700">
                  Selecciona {parseCorrectAnswers(preguntaActual.respuesta_correcta).length} opciones correctas.
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              {preguntaActualShuffled?.options?.map((opcion, idx) => {
                const answerValue = selectedAnswers[currentQuestionIndex];
                const multi = Boolean(preguntaActual && isMultiAnswer(preguntaActual.respuesta_correcta));
                const selected = Array.isArray(answerValue) ? answerValue.includes(idx) : answerValue === idx;
                const questionAnswered = multi
                  ? Array.isArray(answerValue) &&
                    answerValue.length === parseCorrectAnswers(preguntaActual?.respuesta_correcta ?? '').length
                  : answerValue !== undefined;
                const optionIsCorrect = isCorrectChoice(currentQuestionIndex, idx);
                const selectedIsWrong = selected && questionAnswered && !optionIsCorrect;

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

            <div className="mt-6 hidden items-center justify-between lg:flex">
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
                {isLastQuestion ? 'Finalizar' : 'Siguiente'}
                {!isLastQuestion ? <ChevronRight className="ml-1 h-4 w-4" /> : null}
              </Button>
            </div>
          </main>

          <aside className="mt-6 hidden space-y-3 lg:mt-0 lg:block">
            <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
                  style={{ width: `${Math.max(0, Math.min(100, (timeLeft / EXAM_TIME_SECONDS) * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">de {formatTime(EXAM_TIME_SECONDS)}</p>
            </Card>

            <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-800">Progreso del examen</p>

              <div className="mt-3 flex justify-center">
                <div className="relative grid h-24 w-24 place-items-center rounded-full" style={progressRingStyle}>
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-white">
                    <span className="text-2xl font-black text-slate-800">{progressPercent}%</span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-slate-500">
                {answeredCount} de {preguntasDisponibles || TOTAL_QUESTIONS} preguntas
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={goPrevious}
              disabled={currentQuestionIndex === 0}
              className="h-10 flex-1 rounded-xl"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <button
              onClick={() => toggleFlag()}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition',
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
              className="h-10 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              {isLastQuestion ? 'Finalizar' : 'Siguiente'}
              {!isLastQuestion ? <ChevronRight className="ml-1 h-4 w-4" /> : null}
            </Button>
          </div>

          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: TOTAL_QUESTIONS }, (_, index) => {
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
                    'relative h-7 rounded-md border text-[10px] font-semibold',
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
            className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
