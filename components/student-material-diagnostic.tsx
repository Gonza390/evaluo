'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PedagogicalArtifacts, StudyQuestion } from '@/lib/student-materials/pedagogy';
import { cn } from '@/lib/utils';
import { recordStudentMaterialStudyResultAction } from '@/lib/actions/study-errors';

type Props = {
  artifacts: PedagogicalArtifacts;
  materialId: string;
  onReviewTopics: (topics: string[]) => void;
  onExit: () => void;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEligible(question: StudyQuestion) {
  if (question.type !== 'multiple_choice') return false;
  if (question.kind === 'confusion') return false;
  if (!question.prompt.trim() || !question.answer.trim() || question.options.length < 3) return false;
  const answer = normalize(question.answer);
  return question.options.some((option) => normalize(option) === answer);
}

function selectDiagnosticQuestions(artifacts: PedagogicalArtifacts, target = 6) {
  const preferredIds = new Set(artifacts.miniExamQuestionIds);
  const candidates = artifacts.questions
    .filter(isEligible)
    .map((question, index) => ({
      question,
      index,
      preferred: preferredIds.has(question.id) ? 1 : 0,
    }))
    .sort((left, right) => right.preferred - left.preferred || left.index - right.index)
    .map(({ question }) => question);

  const selected: StudyQuestion[] = [];
  const selectedIds = new Set<string>();
  const topics = new Set<string>();

  for (const question of candidates) {
    const topic = normalize(question.topic ?? question.reference.sectionTitle ?? '');
    if (!topic || topics.has(topic)) continue;
    selected.push(question);
    selectedIds.add(question.id);
    topics.add(topic);
    if (selected.length >= target) return selected;
  }

  for (const question of candidates) {
    if (selectedIds.has(question.id)) continue;
    selected.push(question);
    selectedIds.add(question.id);
    if (selected.length >= target) break;
  }

  return selected;
}

export function StudentMaterialDiagnostic({ artifacts, materialId, onReviewTopics, onExit }: Props) {
  const questions = useMemo(() => selectDiagnosticQuestions(artifacts), [artifacts]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const result = useMemo(() => {
    const wrong = questions.filter(
      (question) => normalize(selectedAnswers[question.id] ?? '') !== normalize(question.answer)
    );
    const correct = questions.length - wrong.length;
    const reviewTopics = Array.from(
      new Set(
        wrong
          .map((question) => question.topic || question.reference.sectionTitle)
          .filter((value): value is string => Boolean(value))
      )
    );

    return { correct, wrong, reviewTopics };
  }, [questions, selectedAnswers]);

  const reset = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setFinished(false);
  };

  if (questions.length < 3) {
    return (
      <div className="mx-auto max-w-3xl px-1 py-6 sm:px-2">
        <p className="text-sm font-semibold text-slate-900">Todavía no hay preguntas suficientes para un diagnóstico útil.</p>
        <p className="mt-1 text-[13px] leading-5 text-slate-500">
          Podés seguir con la práctica normal del material.
        </p>
        <Button type="button" variant="outline" onClick={onExit} className="mt-5">
          Ir a práctica
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-3xl px-1 py-3 sm:px-2 sm:py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">Diagnóstico listo</p>
        <h2 className="mt-2 text-[1.65rem] font-bold tracking-[-0.05em] text-slate-950">
          Ya sabemos por dónde empezar
        </h2>

        <div className="mt-5 border-y border-slate-200 py-4">
          <p className="text-3xl font-bold tracking-[-0.055em] text-slate-950">
            {result.correct}/{questions.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">respuestas correctas</p>
        </div>

        <div className="mt-5">
          {result.reviewTopics.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-slate-900">Te conviene repasar primero</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {result.reviewTopics.slice(0, 3).join(', ')}.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">Buen dominio inicial</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                No detectamos un tema claramente débil en estas preguntas.
              </p>
            </>
          )}
        </div>

        <div className="mt-6">
          <Button
            type="button"
            onClick={() => onReviewTopics(result.reviewTopics)}
            className="h-11 w-full rounded-[14px]"
          >
            {result.reviewTopics.length > 0 ? 'Repasar en el resumen' : 'Ir al resumen'}
          </Button>
          <button
            type="button"
            onClick={reset}
            className="mt-2 inline-flex h-9 w-full items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Rehacer diagnóstico
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const selectedAnswer = selectedAnswers[current.id] ?? '';
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  const goNext = () => {
    if (!selectedAnswer) return;

    const wasCorrect = normalize(selectedAnswer) === normalize(current.answer);
    void recordStudentMaterialStudyResultAction({
      materialId,
      sourceType: 'diagnostic',
      itemKey: `diagnostic:${current.id}`,
      wasCorrect,
      topic: current.topic ?? current.reference.sectionTitle,
      prompt: current.prompt,
      explanation: current.explanation,
      correctAnswer: current.answer,
      selectedAnswer,
      reference: current.reference,
    });

    if (currentIndex >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setCurrentIndex((value) => value + 1);
  };

  return (
    <div className="mx-auto max-w-3xl px-1 py-3 sm:px-2 sm:py-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Salir
        </button>
        <span className="text-xs font-medium text-slate-400">
          {currentIndex + 1} de {questions.length}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2563EB] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5">
        {current.topic ? <p className="text-xs font-semibold text-[#2563EB]">{current.topic}</p> : null}
        <h2 className="mt-2 text-lg font-bold leading-7 tracking-[-0.03em] text-slate-950 sm:text-xl">
          {current.prompt}
        </h2>

        <div className="mt-4 space-y-2">
          {current.options.map((option) => {
            const selected = selectedAnswer === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setSelectedAnswers((answers) => ({ ...answers, [current.id]: option }))
                }
                className={cn(
                  'w-full rounded-[14px] border px-3.5 py-3 text-left text-sm leading-5 transition sm:px-4',
                  selected
                    ? 'border-[#2563EB] bg-[#F7FAFF] text-slate-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
          <Button
            type="button"
            disabled={!selectedAnswer}
            onClick={goNext}
            className="h-11 rounded-[14px] px-5"
          >
            {currentIndex === questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  );
}
