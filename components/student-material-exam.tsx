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

type ExamSizeOption = {
  count: number;
  label: string;
  description: string;
};

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

function resolveExamSizeOptions(totalQuestions: number): ExamSizeOption[] {
  if (totalQuestions <= 0) return [];

  let counts: number[];

  if (totalQuestions <= 6) {
    counts = [Math.min(3, totalQuestions), Math.min(5, totalQuestions), totalQuestions];
  } else if (totalQuestions <= 11) {
    counts = [5, Math.min(8, totalQuestions), totalQuestions];
  } else if (totalQuestions <= 19) {
    counts = [5, Math.min(10, totalQuestions), Math.min(15, totalQuestions)];
  } else if (totalQuestions <= 29) {
    counts = [8, 12, Math.min(20, totalQuestions)];
  } else {
    counts = [10, 15, 20];
  }

  const uniqueCounts = Array.from(new Set(counts.filter((count) => count > 0))).sort(
    (left, right) => left - right
  );

  return uniqueCounts.map((count, index) => ({
    count,
    label: index === 0 ? 'Rápido' : index === uniqueCounts.length - 1 ? 'Intensivo' : 'Recomendado',
    description:
      index === 0
        ? 'Repaso breve de los puntos centrales.'
        : index === uniqueCounts.length - 1
          ? 'Mayor cobertura del contenido del PDF.'
          : 'Buen equilibrio entre tiempo y cobertura.',
  }));
}

function resolveExamQuestions(artifacts: PedagogicalArtifacts, targetCount: number) {
  const byId = new Map(artifacts.questions.map((question) => [question.id, question]));
  const selected: StudyQuestion[] = [];
  const selectedIds = new Set<string>();

  const push = (question: StudyQuestion | undefined) => {
    if (!question || selectedIds.has(question.id) || selected.length >= targetCount) return;
    selected.push(question);
    selectedIds.add(question.id);
  };

  artifacts.miniExamQuestionIds.forEach((id) => push(byId.get(id)));

  const kindOrder: Array<StudyQuestion['kind']> = [
    'relationship',
    'classification',
    'process',
    'formula',
    'concept',
    'confusion',
    'section',
  ];

  let addedInRound = true;
  while (selected.length < targetCount && addedInRound) {
    addedInRound = false;

    for (const kind of kindOrder) {
      const match = artifacts.questions.find(
        (question) => question.kind === kind && !selectedIds.has(question.id)
      );
      if (match) {
        push(match);
        addedInRound = true;
      }
      if (selected.length >= targetCount) break;
    }
  }

  for (const question of artifacts.questions) {
    if (selected.length >= targetCount) break;
    push(question);
  }

  return selected.slice(0, targetCount);
}

export function StudentMaterialExam({ artifacts }: StudentMaterialExamProps) {
  const sizeOptions = useMemo(
    () => resolveExamSizeOptions(artifacts.questions.length),
    [artifacts.questions.length]
  );
  const defaultSize = sizeOptions[Math.floor(sizeOptions.length / 2)]?.count ?? 0;
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [started, setStarted] = useState(false);
  const questions = useMemo(
    () => resolveExamQuestions(artifacts, selectedSize || defaultSize),
    [artifacts, defaultSize, selectedSize]
  );
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

  const clearAttempt = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setOpenDrafts({});
    setRevealed({});
    setOpenAssessments({});
    setFinished(false);
  };

  const startExam = () => {
    clearAttempt();
    setStarted(true);
  };

  const resetExam = () => {
    clearAttempt();
    setStarted(false);
  };

  if (artifacts.questions.length === 0 || sizeOptions.length === 0) {
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

  if (!started) {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(135deg,#EEF4FF_0%,#FFFFFF_60%,#F8FAFC_100%)] px-5 py-6 sm:px-7 sm:py-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)]">
              <Target className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">
              Examen basado en este PDF
            </p>
            <h3 className="mt-1.5 text-2xl font-bold tracking-[-0.05em] text-slate-950">
              Elegí cuánto querés practicar
            </h3>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-slate-600">
              Las opciones se adaptan a la cantidad y variedad de preguntas que este documento permite construir con buena cobertura.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {sizeOptions.map((option) => {
                const selected = selectedSize === option.count;
                return (
                  <button
                    key={option.count}
                    type="button"
                    onClick={() => setSelectedSize(option.count)}
                    className={cn(
                      'rounded-[18px] border px-4 py-4 text-left transition',
                      selected
                        ? 'border-[#2563EB] bg-[#EEF4FF] shadow-[0_10px_24px_rgba(37,99,235,0.10)]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('text-xl font-bold', selected ? 'text-[#2563EB]' : 'text-slate-950')}>
                        {option.count}
                      </span>
                      <span className={cn(
                        'rounded-full px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em]',
                        selected ? 'bg-white text-[#2563EB]' : 'bg-slate-100 text-slate-500'
                      )}>
                        {option.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {option.count === 1 ? 'pregunta' : 'preguntas'}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-slate-500">{option.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
              <Button type="button" onClick={startExam} className="h-11 rounded-[14px] px-5">
                Comenzar examen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
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
          Elegir otro examen
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