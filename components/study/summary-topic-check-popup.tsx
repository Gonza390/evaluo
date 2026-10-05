'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, CircleAlert, X } from 'lucide-react';
import { recordStudentMaterialStudyResultAction } from '@/lib/actions/study-errors';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
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

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<'choice' | 'questions' | 'result'>('choice');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setPhase('choice');
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    trackMarketingEvent('summary_topic_check_prompted', {
      material_id: materialId,
      chapter_index: chapterIndex,
      topic: topicTitle,
    });
  }, [chapterIndex, materialId, open, topicTitle]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        trackMarketingEvent('summary_topic_check_skipped', {
          material_id: materialId,
          chapter_index: chapterIndex,
          topic: topicTitle,
          phase,
        });
        onContinue('skipped');
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [chapterIndex, materialId, onContinue, open, phase, topicTitle]);

  const correctCount = useMemo(
    () =>
      questions.filter(
        (question) => normalize(answers[question.id] ?? '') === normalize(question.answer)
      ).length,
    [answers, questions]
  );

  if (!mounted || !open) return null;

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

  const submitAnswer = () => {
    if (!selectedAnswer || !current) return;

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
      void recordStudentMaterialStudyResultAction({
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
      });
    }

    if (questionIndex === questions.length - 1) {
      const finalCorrect =
        questions.filter(
          (question) =>
            normalize(nextAnswers[question.id] ?? '') === normalize(question.answer)
        ).length;
      setPhase('result');
      trackMarketingEvent('summary_topic_check_completed', {
        material_id: materialId,
        chapter_index: chapterIndex,
        topic: topicTitle,
        correct: finalCorrect,
        total: questions.length,
      });
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
  };

  const failedQuestions = questions.filter(
    (question) => normalize(answers[question.id] ?? '') !== normalize(question.answer)
  );
  const failedTopics = Array.from(
    new Set(
      failedQuestions
        .map((question) => question.topic.trim())
        .filter(Boolean)
    )
  );

  const resultCopy =
    correctCount === 2
      ? {
          title: 'Bien, seguí con el próximo tema.',
          detail: 'Entendiste los puntos principales de lo que acabás de leer.',
        }
      : correctCount === 1
        ? {
            title: 'Hay una idea que conviene reforzar.',
            detail: 'Podés seguir o revisar este error antes de avanzar.',
          }
        : {
            title: 'Conviene repasar este tema antes de seguir.',
            detail: 'Volvé al contenido y después intentá comprobarlo nuevamente más adelante.',
          };

  const reviewCurrentTopic = () => {
    onContinue('completed');
    window.requestAnimationFrame(() => {
      const section = document.querySelector<HTMLElement>(
        `[data-summary-reading-section="${chapterIndex}"]`
      );
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const reviewError = () => {
    if (!recordResults) {
      reviewCurrentTopic();
      return;
    }
    router.push(`/dashboard/explicaciones?material=${encodeURIComponent(materialId)}`);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-topic-check-title"
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_26px_80px_rgba(15,23,42,0.26)]"
      >
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10.5px] font-extrabold tracking-[0.15em] text-[#2563EB] uppercase">
                Terminaste este tema
              </p>
              <h2
                id="summary-topic-check-title"
                className="mt-1.5 text-[1.2rem] leading-tight font-bold tracking-[-0.035em] text-slate-950 sm:text-[1.35rem]"
              >
                {topicTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={skip}
              aria-label="Seguir estudiando"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {phase === 'choice' ? (
            <div className="mt-6">
              <h3 className="text-[1.05rem] font-bold text-slate-950">Practicá si entendiste</h3>
              <p className="mt-1 text-[13px] text-slate-500">2 preguntas rápidas · menos de 1 minuto</p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex h-11 items-center justify-center rounded-[13px] bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
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
                <span className="text-[11px] font-bold text-[#2563EB]">
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
                          ? 'border-[#2563EB] bg-[#F4F7FF] text-slate-950 ring-1 ring-[#2563EB]/10'
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
                  disabled={!selectedAnswer}
                  onClick={submitAnswer}
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-[12px] bg-[#2563EB] px-4 text-[13px] font-semibold text-white transition enabled:hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {questionIndex === 1 ? 'Ver resultado' : 'Siguiente'}
                  <ChevronRight className="h-3.5 w-3.5" />
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
                    {failedTopics.length === 1 ? 'Para reforzar' : 'Para reforzar'}
                  </p>
                  <div className="mt-1.5 grid gap-1">
                    {failedTopics.map((topic) => (
                      <p key={topic} className="text-[13px] font-semibold leading-5 text-slate-800">
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
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[13px] bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                >
                  Seguir estudiando
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : correctCount === 1 ? (
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => onContinue('completed')}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[13px] bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                  >
                    Seguir estudiando
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={reviewError}
                    className="inline-flex h-11 items-center justify-center rounded-[13px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Repasar este error
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={reviewCurrentTopic}
                    className="inline-flex h-11 items-center justify-center rounded-[13px] bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                  >
                    Repasar este tema
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
        </div>
      </section>
    </div>,
    document.body
  );
}
