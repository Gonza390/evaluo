'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, ChevronRight, CircleAlert, Loader2, RotateCcw, X } from 'lucide-react';
import { recordStudentMaterialStudyResultAction } from '@/lib/actions/study-errors';
import {
  generateInlineSummaryCheckHelpAction,
  generateReviewCheckAction,
  submitReviewCheckAction,
} from '@/lib/actions/study-error-review';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import type { ReviewQuestion } from '@/lib/study-error-review-contract';
import type { SummaryCheckQuestion } from '@/lib/student-materials/summary-checks';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  materialId: string;
  chapterIndex: number;
  topicTitle: string;
  questions: [SummaryCheckQuestion, SummaryCheckQuestion];
  recordResults: boolean;
  onContinue: (outcome: 'skipped' | 'completed') => void;
};

type Phase = 'choice' | 'questions' | 'result' | 'reinforce' | 'retry' | 'reinforce_done';

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function brief(value: string, max = 300) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;

  const partial = text.slice(0, max);
  const cut = partial.lastIndexOf(' ');
  return `${partial.slice(0, cut > 140 ? cut : max).trim()}…`;
}

function fallbackReinforcementText(question: SummaryCheckQuestion) {
  const explanation = question.explanation?.trim() ?? '';
  const genericExplanation =
    /^la respuesta conserva/i.test(explanation) ||
    /^esta idea aparece/i.test(explanation) ||
    /^según el material:/i.test(explanation);

  if (explanation && !genericExplanation) {
    return brief(explanation);
  }

  return brief(`La idea clave es: ${question.answer}`);
}

export function SummaryTopicCheckPopup({
  open,
  materialId,
  chapterIndex,
  topicTitle,
  questions,
  recordResults,
  onContinue,
}: Props) {
  const [phase, setPhase] = useState<Phase>('choice');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errorIds, setErrorIds] = useState<Record<string, string>>({});
  const [reinforceIndex, setReinforceIndex] = useState(0);
  const [reinforcementText, setReinforcementText] = useState('');
  const [reinforcementMessage, setReinforcementMessage] = useState<string | null>(null);
  const [reviewQuestion, setReviewQuestion] = useState<ReviewQuestion | null>(null);
  const [retrySelectedIndex, setRetrySelectedIndex] = useState<number | null>(null);
  const [retryResults, setRetryResults] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhase('choice');
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setErrorIds({});
    setReinforceIndex(0);
    setReinforcementText('');
    setReinforcementMessage(null);
    setReviewQuestion(null);
    setRetrySelectedIndex(null);
    setRetryResults({});
    setIsSubmitting(false);
    setSaveFailed(false);
    trackMarketingEvent('summary_topic_check_prompted', {
      material_id: materialId,
      chapter_index: chapterIndex,
      topic: topicTitle,
    });
  }, [chapterIndex, materialId, open, topicTitle]);

  const correctCount = useMemo(
    () =>
      questions.filter(
        (question) => normalize(answers[question.id] ?? '') === normalize(question.answer)
      ).length,
    [answers, questions]
  );

  const failedQuestions = useMemo(
    () =>
      questions.filter(
        (question) => normalize(answers[question.id] ?? '') !== normalize(question.answer)
      ),
    [answers, questions]
  );

  const failedTopics = useMemo(
    () =>
      Array.from(new Set(failedQuestions.map((question) => question.topic.trim()).filter(Boolean))),
    [failedQuestions]
  );

  const activeFailedQuestion = failedQuestions[reinforceIndex] ?? null;

  const resolvedRetryCount = useMemo(
    () => failedQuestions.filter((question) => retryResults[question.id] === true).length,
    [failedQuestions, retryResults]
  );

  if (!open) return null;

  const current = questions[questionIndex];
  const isPrevious = questionIndex === 1 && chapterIndex > 0;

  const skip = () => {
    trackMarketingEvent('summary_topic_check_skipped', {
      material_id: materialId,
      chapter_index: chapterIndex,
      topic: topicTitle,
      phase,
    });
    onContinue('skipped');
  };

  const start = () => {
    setPhase('questions');
    trackMarketingEvent('summary_topic_check_started', {
      material_id: materialId,
      chapter_index: chapterIndex,
      topic: topicTitle,
    });
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !current || isSubmitting) return;

    setIsSubmitting(true);
    const wasCorrect = normalize(selectedAnswer) === normalize(current.answer);
    const nextAnswers = { ...answers, [current.id]: selectedAnswer };
    setAnswers(nextAnswers);

    trackMarketingEvent('summary_topic_check_answered', {
      material_id: materialId,
      chapter_index: chapterIndex,
      topic: topicTitle,
      question_index: questionIndex,
      was_correct: wasCorrect,
      memory_question: isPrevious,
    });

    if (recordResults) {
      const result = await recordStudentMaterialStudyResultAction({
        materialId,
        sourceType: 'exercise',
        itemKey: `summary-check:${chapterIndex}:${current.id}`,
        wasCorrect,
        topic: current.topic || topicTitle,
        prompt: current.prompt,
        explanation: current.explanation,
        correctAnswer: current.answer,
        selectedAnswer,
        reference: current.reference,
      }).catch(() => ({ success: false, errorId: null }));

      if (!result.success) setSaveFailed(true);

      if (!wasCorrect && result.errorId) {
        setErrorIds((previous) => ({
          ...previous,
          [current.id]: result.errorId as string,
        }));
      }
    }

    if (questionIndex === questions.length - 1) {
      const finalCorrect = questions.filter(
        (question) => normalize(nextAnswers[question.id] ?? '') === normalize(question.answer)
      ).length;
      setPhase('result');
      trackMarketingEvent('summary_topic_check_completed', {
        material_id: materialId,
        chapter_index: chapterIndex,
        topic: topicTitle,
        correct: finalCorrect,
        total: questions.length,
      });
      setIsSubmitting(false);
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
    setIsSubmitting(false);
  };

  const resultCopy =
    correctCount === 2
      ? {
          title: 'Bien, seguí con el próximo tema.',
          detail: 'Entendiste los puntos principales de lo que acabás de leer.',
        }
      : correctCount === 1
        ? {
            title: 'Hay una idea que conviene reforzar.',
            detail: 'Podés corregirla ahora sin salir del resumen.',
          }
        : {
            title: 'Conviene reforzar este tema antes de seguir.',
            detail: 'Te mostramos brevemente qué revisar y te damos otra oportunidad.',
          };

  const prepareReinforcement = async (question: SummaryCheckQuestion, index: number) => {
    setReinforceIndex(index);
    setPhase('reinforce');
    setReviewQuestion(null);
    setRetrySelectedIndex(null);
    setReinforcementMessage(null);
    setReinforcementText('');
    setIsSubmitting(true);

    const fallback = fallbackReinforcementText(question);

    if (!recordResults) {
      setReinforcementText(fallback);
      setIsSubmitting(false);
      return;
    }

    const errorId = errorIds[question.id];
    if (!errorId) {
      setReinforcementText(fallback);
      setReinforcementMessage(
        'No pudimos vincular este error con el repaso automático. Igual podés seguir estudiando.'
      );
      setIsSubmitting(false);
      return;
    }

    const result = await generateInlineSummaryCheckHelpAction(errorId, materialId).catch(() => ({
      success: false,
      text: undefined,
      message: 'No pudimos conectar. Podés seguir leyendo y reintentar la ayuda.',
    }));
    if (result.success && result.text) {
      setReinforcementText(result.text);
    } else {
      setReinforcementText(fallback);
      setReinforcementMessage(
        result.message ??
          'No pudimos generar la explicación con IA. Te mostramos la ayuda disponible.'
      );
    }

    setIsSubmitting(false);
  };

  const startReinforcement = async () => {
    const firstFailed = failedQuestions[0];
    if (!firstFailed) return;

    trackMarketingEvent('summary_topic_check_reinforcement_started', {
      material_id: materialId,
      chapter_index: chapterIndex,
      topic: topicTitle,
      failed: failedQuestions.length,
    });

    await prepareReinforcement(firstFailed, 0);
  };

  const startRetry = async () => {
    if (!activeFailedQuestion || isSubmitting) return;

    setIsSubmitting(true);
    setReinforcementMessage(null);
    setRetrySelectedIndex(null);

    if (!recordResults) {
      setReviewQuestion({
        id: `demo:${activeFailedQuestion.id}`,
        question: activeFailedQuestion.prompt,
        options: activeFailedQuestion.options,
      });
      setPhase('retry');
      setIsSubmitting(false);
      return;
    }

    const errorId = errorIds[activeFailedQuestion.id];
    if (!errorId) {
      setReinforcementMessage(
        'No pudimos preparar una nueva pregunta para este error. Podés seguir estudiando.'
      );
      setIsSubmitting(false);
      return;
    }

    const result = await generateReviewCheckAction(errorId, materialId).catch(() => ({
      success: false,
      question: undefined,
      message: 'No pudimos conectar. Intentá nuevamente.',
    }));
    if (!result.success || !result.question) {
      setReinforcementMessage(
        result.message ?? 'No pudimos preparar una nueva pregunta. Intentá nuevamente.'
      );
      setIsSubmitting(false);
      return;
    }

    setReviewQuestion(result.question);
    setPhase('retry');
    setIsSubmitting(false);
  };

  const moveAfterRetry = async (wasCorrect: boolean) => {
    if (!activeFailedQuestion) return;

    setRetryResults((previous) => ({
      ...previous,
      [activeFailedQuestion.id]: wasCorrect,
    }));

    const nextIndex = reinforceIndex + 1;
    const nextFailed = failedQuestions[nextIndex];

    if (nextFailed) {
      await prepareReinforcement(nextFailed, nextIndex);
      return;
    }

    setPhase('reinforce_done');
  };

  const submitRetry = async () => {
    if (!activeFailedQuestion || !reviewQuestion || retrySelectedIndex === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    let wasCorrect = false;

    if (recordResults && !reviewQuestion.id.startsWith('demo:')) {
      const result = await submitReviewCheckAction(reviewQuestion.id, retrySelectedIndex).catch(
        () => ({
          success: false,
          correct: undefined,
          message: 'No pudimos guardar la respuesta. Revisá tu conexión y reintentá.',
        })
      );
      if (!result.success || typeof result.correct !== 'boolean') {
        setReinforcementMessage(
          result.message ?? 'No pudimos guardar esta respuesta. Intentá nuevamente.'
        );
        setIsSubmitting(false);
        return;
      }
      wasCorrect = result.correct;
    } else {
      const selected = reviewQuestion.options[retrySelectedIndex] ?? '';
      wasCorrect = normalize(selected) === normalize(activeFailedQuestion.answer);
    }

    trackMarketingEvent('summary_topic_check_retried', {
      material_id: materialId,
      chapter_index: chapterIndex,
      topic: topicTitle,
      was_correct: wasCorrect,
      reinforcement_index: reinforceIndex,
      generated_question: recordResults && !reviewQuestion.id.startsWith('demo:'),
    });

    await moveAfterRetry(wasCorrect);
    setIsSubmitting(false);
  };

  const finishReinforcement = () => {
    trackMarketingEvent('summary_topic_check_reinforcement_completed', {
      material_id: materialId,
      chapter_index: chapterIndex,
      topic: topicTitle,
      resolved: resolvedRetryCount,
      total_failed: failedQuestions.length,
    });
    onContinue('completed');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) skip();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        aria-labelledby="summary-topic-check-title"
        overlayClassName="z-[120] bg-foreground/45 backdrop-blur"
        className="border-border bg-background top-auto bottom-3 z-[120] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[520px] translate-y-0 overflow-y-auto overscroll-contain rounded-[24px] p-0 [overflow-wrap:anywhere] sm:top-1/2 sm:bottom-auto sm:max-w-[520px] sm:-translate-y-1/2"
      >
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-primary text-[10.5px] font-extrabold tracking-[0.15em] uppercase">
                Terminaste este tema
              </p>
              <DialogTitle asChild>
                <h2
                  id="summary-topic-check-title"
                  className="mt-1.5 text-[1.2rem] leading-tight font-bold tracking-[-0.035em] text-slate-950 sm:text-[1.35rem]"
                >
                  {topicTitle}
                </h2>
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={skip}
              aria-label="Seguir estudiando"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {saveFailed ? (
            <p
              role="alert"
              className="border-destructive text-foreground mt-4 border-l-2 pl-3 text-sm"
            >
              No pudimos guardar todas tus respuestas. Podés seguir repasando, pero estos resultados
              no quedaron registrados.
            </p>
          ) : null}

          {phase === 'choice' ? (
            <div className="mt-6">
              <h3 className="text-[1.05rem] font-bold text-slate-950">Practicá si entendiste</h3>
              <p className="mt-1 text-[13px] text-slate-500">
                2 preguntas rápidas · menos de 1 minuto
              </p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={start}
                  className="bg-primary hover:bg-primary/90 inline-flex h-11 items-center justify-center rounded-[13px] px-4 text-sm font-semibold text-white transition"
                >
                  Comprobar
                </button>
                <button
                  type="button"
                  onClick={skip}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[13px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Seguir estudiando
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'questions' && current ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-primary text-[11px] font-bold">
                  Pregunta {questionIndex + 1} de 2
                </span>
                <span className="text-[10.5px] font-semibold text-slate-400">
                  {isPrevious ? 'Recordando el tema anterior' : 'Sobre este tema'}
                </span>
              </div>

              <p className="mt-3 text-[15px] leading-6 font-semibold text-slate-900">
                {current.prompt}
              </p>

              <div className="mt-4 grid gap-2">
                {current.options.map((option) => {
                  const selected = selectedAnswer === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedAnswer(option)}
                      className={cn(
                        'rounded-[12px] border px-3.5 py-3 text-left text-[13px] leading-5 transition',
                        selected
                          ? 'border-primary bg-primary/5 ring-primary/10 text-slate-950 ring-1'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70'
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={skip}
                  className="text-[12.5px] font-semibold text-slate-400 transition hover:text-slate-700"
                >
                  Seguir estudiando
                </button>
                <button
                  type="button"
                  disabled={!selectedAnswer || isSubmitting}
                  onClick={submitAnswer}
                  className="bg-primary enabled:hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-1 rounded-[12px] px-4 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      {questionIndex === 1 ? 'Ver resultado' : 'Siguiente'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'result' ? (
            <div className="mt-6">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  correctCount === 2
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                )}
              >
                {correctCount === 2 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <CircleAlert className="h-5 w-5" />
                )}
              </div>

              <p className="mt-3 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                {correctCount}/2 correctas
              </p>
              <h3 className="mt-1 text-[1.08rem] font-bold text-slate-950">{resultCopy.title}</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-500">{resultCopy.detail}</p>

              {failedTopics.length > 0 ? (
                <div className="mt-4 rounded-[13px] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                  <p className="text-[10.5px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                    Para reforzar
                  </p>
                  <div className="mt-1.5 grid gap-1">
                    {failedTopics.map((topic) => (
                      <p key={topic} className="text-[13px] leading-5 font-semibold text-slate-800">
                        {topic}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {correctCount === 2 ? (
                <button
                  type="button"
                  onClick={() => onContinue('completed')}
                  className="bg-primary hover:bg-primary/90 mt-6 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[13px] px-4 text-sm font-semibold text-white transition"
                >
                  Seguir estudiando
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={startReinforcement}
                    className="bg-primary hover:bg-primary/90 inline-flex h-11 items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-semibold text-white transition"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reforzar ahora
                  </button>
                  <button
                    type="button"
                    onClick={() => onContinue('completed')}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[13px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Seguir estudiando
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {phase === 'reinforce' && activeFailedQuestion ? (
            <div className="mt-6">
              <div className="rounded-[16px] border border-amber-100 bg-amber-50/60 px-4 py-4">
                <p className="text-[10.5px] font-extrabold tracking-[0.12em] text-amber-700 uppercase">
                  Ojo con esta idea
                </p>
                <p className="mt-2 text-[14px] leading-6 font-semibold text-slate-900">
                  {activeFailedQuestion.topic || topicTitle}
                </p>

                {isSubmitting && !reinforcementText ? (
                  <div className="mt-2 flex items-center gap-2 text-[13px] text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparando una explicación con tu PDF…
                  </div>
                ) : (
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                    {reinforcementText || fallbackReinforcementText(activeFailedQuestion)}
                  </p>
                )}
              </div>

              {reinforcementMessage ? (
                <p className="mt-3 text-[12px] leading-5 text-amber-700">{reinforcementMessage}</p>
              ) : null}

              <p className="mt-4 text-[12.5px] leading-5 text-slate-500">
                Después te hacemos una pregunta nueva sobre la misma idea.
              </p>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isSubmitting || !reinforcementText}
                  onClick={startRetry}
                  className="bg-primary enabled:hover:bg-primary/90 inline-flex h-11 items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Comprobar de nuevo
                </button>
                <button
                  type="button"
                  onClick={() => onContinue('completed')}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[13px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Seguir estudiando
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'retry' && activeFailedQuestion && reviewQuestion ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-primary text-[11px] font-bold">Comprobalo de nuevo</span>
                <span className="text-[10.5px] font-semibold text-slate-400">
                  {reinforceIndex + 1} de {failedQuestions.length}
                </span>
              </div>

              <p className="mt-3 text-[15px] leading-6 font-semibold text-slate-900">
                {reviewQuestion.question}
              </p>

              <div className="mt-4 grid gap-2">
                {reviewQuestion.options.map((option, optionIndex) => {
                  const selected = retrySelectedIndex === optionIndex;
                  return (
                    <button
                      key={`${optionIndex}:${option}`}
                      type="button"
                      onClick={() => setRetrySelectedIndex(optionIndex)}
                      className={cn(
                        'rounded-[12px] border px-3.5 py-3 text-left text-[13px] leading-5 transition',
                        selected
                          ? 'border-primary bg-primary/5 ring-primary/10 text-slate-950 ring-1'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70'
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {reinforcementMessage ? (
                <p className="mt-3 text-[12px] leading-5 text-amber-700">{reinforcementMessage}</p>
              ) : null}

              <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={retrySelectedIndex === null || isSubmitting}
                  onClick={submitRetry}
                  className="bg-primary enabled:hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-1 rounded-[12px] px-4 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      Comprobar
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'reinforce_done' ? (
            <div className="mt-6">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  resolvedRetryCount === failedQuestions.length
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {resolvedRetryCount === failedQuestions.length ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
              </div>

              <h3 className="mt-3 text-[1.08rem] font-bold text-slate-950">
                {resolvedRetryCount === failedQuestions.length
                  ? 'Bien, corregiste lo que había fallado.'
                  : 'Listo. Ya repasaste este bloque.'}
              </h3>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                {resolvedRetryCount === failedQuestions.length
                  ? 'Podés seguir estudiando con la idea más clara.'
                  : saveFailed
                    ? 'Podés volver al material para repasar lo que todavía cuesta.'
                    : recordResults
                      ? 'Lo que todavía cuesta quedó guardado en Mis errores para volver después.'
                      : 'En tu propio PDF, lo que todavía cuesta quedaría en Mis errores para volver después.'}
              </p>

              <button
                type="button"
                onClick={finishReinforcement}
                className="bg-primary hover:bg-primary/90 mt-6 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[13px] px-4 text-sm font-semibold text-white transition"
              >
                Seguir estudiando
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
