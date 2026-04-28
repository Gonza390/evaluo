'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  checkProfileStatus,
  finalizarSimuladorAction,
  getWrongAnswersExplanations,
  getPreguntasSimuladorErrores,
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
}

type EstadoExamen = 'loading' | 'playing' | 'finished' | 'error' | 'profile_incomplete';

const TOTAL_QUESTIONS = 30;
const EXAM_TIME_SECONDS = 30 * 60;
const optionLabels = ['a', 'b', 'c', 'd'];

export default function SimuladorExamen({
  materiaId,
  parcial,
  universidadId,
  carreraId,
  mode = 'regular',
}: SimuladorExamenProps) {
  const { user, loading: userLoading, getUserName, getUserInitials } = useUser();

  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [estado, setEstado] = useState<EstadoExamen>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME_SECONDS);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [aciertosFinales, setAciertosFinales] = useState(0);
  const [respondidasFinales, setRespondidasFinales] = useState(0);
  const [materiaNombre, setMateriaNombre] = useState('');
  const [wrongExplanations, setWrongExplanations] = useState<
    Array<{ preguntaId: string; enunciado: string; explicacion: string; provider: string; source: string }>
  >([]);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const preguntasDisponibles = preguntas.length;
  const preguntaActual = preguntas[currentQuestionIndex];
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

  const computeCorrectAnswers = useCallback(() => {
    return Object.entries(selectedAnswers).reduce((acc, [index, optionIndex]) => {
      const pregunta = preguntas[Number(index)];
      if (!pregunta) return acc;
      return pregunta.opciones[optionIndex] === pregunta.respuesta_correcta ? acc + 1 : acc;
    }, 0);
  }, [preguntas, selectedAnswers]);

  const isCorrectAnswer = useCallback(
    (questionIndex: number, optionIndex: number) => {
      const pregunta = preguntas[questionIndex];
      if (!pregunta) return false;
      return pregunta.opciones[optionIndex] === pregunta.respuesta_correcta;
    },
    [preguntas]
  );

  const finalizarExamen = useCallback(
    async (trigger: 'manual' | 'timer' = 'manual') => {
      if (!userId || isFinishing || estado !== 'playing') return;

      setIsFinishing(true);

      const correctas = computeCorrectAnswers();
      const respondidas = Object.keys(selectedAnswers).length;
      setAciertosFinales(correctas);
      setRespondidasFinales(respondidas);

      await finalizarSimuladorAction({
        usuario_id: userId,
        materia_id: materiaId,
        parcial,
        total_preguntas: preguntasDisponibles,
        respuestas_correctas: correctas,
        tiempo_restante: trigger === 'timer' ? 0 : timeLeft,
      });

      const registros = Object.entries(selectedAnswers).map(([index, optionIndex]) => {
        const questionIndex = Number(index);
        const pregunta = preguntas[questionIndex];
        const seleccion = pregunta?.opciones[optionIndex];
        if (!pregunta || !seleccion) return null;

        return registrarRespuestaUsuario({
          usuario_id: userId,
          pregunta_id: pregunta.id,
          materia_id: pregunta.materia_id,
          es_correcta: seleccion === pregunta.respuesta_correcta,
        });
      });

      await Promise.all(registros.filter(Boolean));

      setEstado('finished');
      setIsFinishing(false);
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
    ]
  );

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

        const data =
          mode === 'errores'
            ? await getPreguntasSimuladorErrores(materiaId)
            : await getPreguntasSimulador(materiaId, parcial, universidadId, carreraId);
        if (data && data.length > 0) {
          setPreguntas(data.slice(0, TOTAL_QUESTIONS));
          setEstado('playing');
        } else {
          setEstado('error');
        }
      } catch (error) {
        console.error('Error inicializando simulador:', error);
        setEstado('error');
      }
    }

    void inicializar();
  }, [carreraId, materiaId, mode, parcial, universidadId, user, userLoading]);

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
    async function loadExplanations() {
      if (estado !== 'finished' || !userId) return;

      const wrongQuestionIds = Object.entries(selectedAnswers)
        .filter(([index, optionIndex]) => !isCorrectAnswer(Number(index), optionIndex))
        .map(([index]) => preguntas[Number(index)]?.id)
        .filter((id): id is string => Boolean(id));

      if (wrongQuestionIds.length === 0) {
        setWrongExplanations([]);
        return;
      }

      setLoadingExplanations(true);
      const response = await getWrongAnswersExplanations({
        materia_id: materiaId,
        parcial,
        wrong_question_ids: wrongQuestionIds,
      });

      if (response.success) {
        setWrongExplanations(response.explanations ?? []);
      }
      setLoadingExplanations(false);
    }

    void loadExplanations();
  }, [estado, isCorrectAnswer, materiaId, parcial, preguntas, selectedAnswers, userId]);

  const handleSelectAnswer = (optionIndex: number) => {
    if (!preguntaActual) return;
    if (selectedAnswers[currentQuestionIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionIndex }));
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
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Estamos preparando este parcial</h2>
          <p className="mb-3 text-gray-600">
            Estamos procesando el material oficial de esta materia para que la IA te enseñe con calidad.
          </p>
          <p className="mb-6 text-sm text-slate-500">
            Vuelve en unas horas o probá con <span className="font-semibold">Tecnologia y Modelos Globales</span>.
          </p>
          <Button onClick={reiniciarSimulador} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  if (estado === 'finished') {
    const totalRespondidas = respondidasFinales || 1;
    const nota = respondidasFinales > 0 ? (aciertosFinales / totalRespondidas) * 10 : 0;
    const aprobado = nota >= 7;

    return (
      <div className="flex min-h-[600px] items-center justify-center bg-[#F5F7FB] p-6">
        <Card className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-blue-600 to-sky-400" />
          <Trophy className={cn('mx-auto mb-5 h-20 w-20', aprobado ? 'text-amber-500' : 'text-slate-400')} />
          <h2 className="text-3xl font-bold text-slate-900">Simulador finalizado</h2>
          <p className="mt-2 text-slate-600">Revisa tu resultado y vuelve a intentarlo cuando quieras.</p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aciertos</p>
              <p className="mt-1 text-3xl font-black text-slate-900">
                {aciertosFinales}
                <span className="text-base font-semibold text-slate-500"> / {respondidasFinales}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nota</p>
              <p className={cn('mt-1 text-3xl font-black', aprobado ? 'text-emerald-600' : 'text-orange-600')}>
                {nota.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={reiniciarSimulador} className="rounded-xl bg-indigo-600 px-7 py-5 hover:bg-indigo-700">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="rounded-xl px-7 py-5">
              Volver a la materia
            </Button>
            <Button asChild variant="outline" className="rounded-xl px-7 py-5">
              <Link href={`/simulador/errores/${materiaId}`}>Practicar mis errores</Link>
            </Button>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left">
            <h3 className="text-lg font-bold text-slate-900">Tutor IA: por que fallaste y como mejorarlo</h3>
            {loadingExplanations ? (
              <p className="mt-3 text-sm text-slate-600">Generando explicaciones personalizadas...</p>
            ) : wrongExplanations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                No hay respuestas incorrectas para explicar. Excelente trabajo.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {wrongExplanations.map((item) => (
                  <div key={item.preguntaId} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800">{item.enunciado}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.explicacion}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Fuente IA: {item.provider} · {item.source === 'cache' ? 'cache' : 'nuevo'}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await fetch('/api/explanations/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ pregunta_id: item.preguntaId, voto: 1 }),
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Me ayudo
                      </button>
                      <button
                        onClick={async () => {
                          await fetch('/api/explanations/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ pregunta_id: item.preguntaId, voto: -1 }),
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        No me ayudo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
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
            </div>

            <div className="space-y-3">
              {preguntaActual?.opciones?.map((opcion, idx) => {
                const selected = selectedAnswers[currentQuestionIndex] === idx;
                const questionAnswered = selectedAnswers[currentQuestionIndex] !== undefined;
                const optionIsCorrect = isCorrectAnswer(currentQuestionIndex, idx);
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
                      questionAnswered && optionIsCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100',
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
