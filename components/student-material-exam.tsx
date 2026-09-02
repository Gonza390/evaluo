'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  RotateCcw,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PedagogicalArtifacts, StudyQuestion } from '@/lib/student-materials/pedagogy';
import { cn } from '@/lib/utils';

type StudentMaterialExamProps = {
  artifacts: PedagogicalArtifacts;
};

type OpenAssessment = 'got_it' | 'review';

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levelLabel(level: StudyQuestion['level']) {
  if (level === 'recordar') return 'Recordar';
  if (level === 'aplicar') return 'Aplicar';
  return 'Comprender';
}

function sourceLabel(question: StudyQuestion) {
  const { pageStart, pageEnd, sectionTitle } = question.reference;
  if (pageStart && pageEnd && pageEnd !== pageStart) return `Páginas ${pageStart}–${pageEnd}`;
  if (pageStart) return `Página ${pageStart}`;
  return sectionTitle || 'Referencia del documento';
}

function resolveExamQuestions(artifacts: PedagogicalArtifacts) {
  const byId = new Map(artifacts.questions.map((question) => [question.id, question]));
  const preferred = artifacts.miniExamQuestionIds
    .map((id) => byId.get(id))
    .filter((question): question is StudyQuestion => Boolean(question));

  if (preferred.length >= 4) return preferred.slice(0, 8);

  const selected = [...preferred];
  for (const question of artifacts.questions) {
    if (selected.length >= 8) break;
    if (!selected.some((item) => item.id === question.id)) selected.push(question);
  }
  return selected;
}

export function StudentMaterialExam({ artifacts }: StudentMaterialExamProps) {
  const questions = useMemo(() => resolveExamQuestions(artifacts), [artifacts]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [openDrafts, setOpenDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [openAssessments, setOpenAssessments] = useState<Record<string, OpenAssessment>>({});
  const [finished, setFinished] = useState(false);

  const current = questions[currentIndex];

  const result = useMemo(() => {
    let correct = 0;
    const wrong: StudyQuestion[] = [];
    const levels: Record<StudyQuestion['level'], { total: number; correct: number }> = {
      recordar: { total: 0, correct: 0 },
      comprender: { total: 0, correct: 0 },
      aplicar: { total: 0, correct: 0 },
    };

    questions.forEach((question) => {
      levels[question.level].total += 1;
      const isCorrect =
        question.type === 'multiple_choice'
          ? normalizeAnswer(selectedAnswers[question.id] ?? '') === normalizeAnswer(question.answer)
          : openAssessments[question.id] === 'got_it';

      if (isCorrect) {
        correct += 1;
        levels[question.level].correct += 1;
      } else {
        wrong.push(question);
      }
    });

    return {
      correct,
      total: questions.length,
      percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
      wrong,
      levels,
    };
  }, [openAssessments, questions, selectedAnswers]);

  const resetExam = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setOpenDrafts({});
    setRevealed({});
    setOpenAssessments({});
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
        <Target className="mx-auto h-6 w-6 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-800">Todavía no hay preguntas suficientes</p>
        <p className="mt-1 text-[13px] leading-5 text-slate-500">
          El PDF necesita más contenido estructurado para armar un examen útil.
        </p>
      </div>
    );
  }

  if (finished) {
    const reviewTopics = Array.from(
      new Set(
        result.wrong
          .map((question) => question.topic || question.reference.sectionTitle)
          .filter((value): value is string => Boolean(value))
      )
    ).slice(0, 5);

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(135deg,#EEF4FF_0%,#FFFFFF_55%,#F8FAFC_100%)] px-5 py-6 text-center sm:px-8 sm:py-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-[0_12px_28px_rgba(37,99,235,0.20)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">
              Examen completado
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-[-0.06em] text-slate-950">
              {result.percentage}%
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {result.correct} de {result.total} respuestas consolidadas
            </p>
          </div>

          <div className="grid gap-3 border-t border-slate-100 px-5 py-5 sm:grid-cols-3 sm:px-8">
            {(['recordar', 'comprender', 'aplicar'] as const).map((level) => (
              <div key={level} className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {levelLabel(level)}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {result.levels[level].correct}/{result.levels[level].total}
                </p>
              </div>
            ))}
          </div>
        </section>

        {reviewTopics.length > 0 ? (
          <section className="rounded-[22px] border border-amber-200 bg-amber-50/60 px-5 py-5">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h4 className="font-semibold text-slate-950">Temas para repasar</h4>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-5 text-slate-700">
                  {reviewTopics.map((topic) => (
                    <li key={topic}>• {topic}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[22px] border border-emerald-200 bg-emerald-50/60 px-5 py-5 text-sm text-emerald-800">
            No quedaron temas marcados para repasar en este intento.
          </section>
        )}

        <Button onClick={resetExam} className="h-11 w-full rounded-[14px] sm:w-auto">
          <RotateCcw className="h-4 w-4" />
          Reintentar examen
        </Button>
      </div>
    );
  }

  if (!current) return null;

  const selectedAnswer = selectedAnswers[current.id] ?? '';
  const isRevealed = Boolean(revealed[current.id]);
  const isCorrect =
    current.type === 'multiple_choice' &&
    normalizeAnswer(selectedAnswer) === normalizeAnswer(current.answer);
  const openAssessment = openAssessments[current.id];
  const canAdvance =
    current.type === 'multiple_choice' ? isRevealed : isRevealed && Boolean(openAssessment);
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  const goNext = () => {
    if (!canAdvance) return;
    if (currentIndex >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Pregunta {currentIndex + 1} de {questions.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Basado únicamente en este PDF</p>
        </div>
        <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
          {levelLabel(current.level)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2563EB] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.07)] sm:px-6 sm:py-6">
        <h3 className="text-lg font-bold leading-7 tracking-[-0.035em] text-slate-950 sm:text-xl">
          {current.prompt}
        </h3>

        {current.type === 'multiple_choice' ? (
          <div className="mt-5 grid gap-2.5">
            {current.options.map((option, index) => {
              const selected = selectedAnswer === option;
              const optionIsCorrect = normalizeAnswer(option) === normalizeAnswer(current.answer);
              const showCorrect = isRevealed && optionIsCorrect;
              const showWrong = isRevealed && selected && !optionIsCorrect;

              return (
                <button
                  key={`${current.id}:${option}`}
                  type="button"
                  disabled={isRevealed}
                  onClick={() =>
                    setSelectedAnswers((answers) => ({ ...answers, [current.id]: option }))
                  }
                  className={cn(
                    'flex min-h-14 w-full items-start gap-3 rounded-[16px] border px-3.5 py-3 text-left transition sm:px-4',
                    !isRevealed && selected && 'border-[#2563EB] bg-[#EEF4FF]',
                    !isRevealed && !selected && 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                    showCorrect && 'border-emerald-300 bg-emerald-50',
                    showWrong && 'border-red-300 bg-red-50',
                    isRevealed && !showCorrect && !showWrong && 'border-slate-200 bg-slate-50/50'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                      selected && !isRevealed && 'border-[#2563EB] bg-[#2563EB] text-white',
                      !selected && !showCorrect && !showWrong && 'border-slate-300 bg-white text-slate-500',
                      showCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                      showWrong && 'border-red-500 bg-red-500 text-white'
                    )}
                  >
                    {showCorrect ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + index)}
                  </span>
                  <span className="pt-0.5 text-[13.5px] leading-5 text-slate-700 sm:text-sm sm:leading-6">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            value={openDrafts[current.id] ?? ''}
            disabled={isRevealed}
            onChange={(event) =>
              setOpenDrafts((drafts) => ({ ...drafts, [current.id]: event.target.value }))
            }
            placeholder="Escribí tu respuesta con tus palabras..."
            className="mt-5 min-h-36 w-full resize-y rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] disabled:bg-slate-50"
          />
        )}

        {!isRevealed ? (
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              disabled={current.type === 'multiple_choice' && !selectedAnswer}
              onClick={() => setRevealed((items) => ({ ...items, [current.id]: true }))}
              className="h-11 rounded-[14px] px-5"
            >
              {current.type === 'multiple_choice' ? 'Comprobar respuesta' : 'Ver respuesta esperada'}
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <section
              className={cn(
                'rounded-[18px] border px-4 py-4',
                current.type === 'multiple_choice' && isCorrect
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : current.type === 'multiple_choice'
                    ? 'border-amber-200 bg-amber-50/70'
                    : 'border-[#BFDBFE] bg-[#F8FBFF]'
              )}
            >
              <p className="text-sm font-bold text-slate-950">
                {current.type === 'multiple_choice'
                  ? isCorrect
                    ? 'Correcto'
                    : 'Revisá este punto'
                  : 'Respuesta esperada'}
              </p>
              <p className="mt-2 text-[13.5px] leading-6 text-slate-700">
                <span className="font-semibold">Respuesta:</span> {current.answer}
              </p>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">{current.explanation}</p>
              <p className="mt-3 text-[11.5px] font-medium text-slate-500">
                Fuente: {sourceLabel(current)}
              </p>
            </section>

            {current.type === 'open' ? (
              <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                <p className="text-[13px] font-semibold text-slate-800">
                  Compará tu respuesta con la esperada. ¿Cómo te fue?
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAssessments((items) => ({ ...items, [current.id]: 'got_it' }))
                    }
                    className={cn(
                      'min-h-10 rounded-[13px] border px-3 py-2 text-sm font-semibold transition',
                      openAssessment === 'got_it'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                    )}
                  >
                    La tenía
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAssessments((items) => ({ ...items, [current.id]: 'review' }))
                    }
                    className={cn(
                      'min-h-10 rounded-[13px] border px-3 py-2 text-sm font-semibold transition',
                      openAssessment === 'review'
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300'
                    )}
                  >
                    Necesito repasar
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="button" disabled={!canAdvance} onClick={goNext} className="h-11 rounded-[14px] px-5">
                {currentIndex === questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
