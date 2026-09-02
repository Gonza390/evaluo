'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, CircleAlert, RotateCcw } from 'lucide-react';
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

function normalizeForSearch(value: string) {
  return normalizeAnswer(value).replace(/[^a-z0-9áéíóúñü\s]/gi, ' ');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function hasExplicitClassificationEvidence(question: StudyQuestion) {
  if (question.kind !== 'classification') return true;
  const answer = question.answer.trim();
  const excerpt = question.reference.excerpt;
  if (!answer || !excerpt) return false;

  return new RegExp(`${escapeRegExp(answer)}\\s*:`, 'i').test(excerpt);
}

function hasGroundedComparisonAnswer(question: StudyQuestion) {
  if (question.type !== 'open' || question.kind !== 'relationship') return true;
  const topic = normalizeForSearch(question.topic ?? '');
  const answer = normalizeForSearch(question.answer);
  const stopWords = new Set([
    'segun',
    'material',
    'entre',
    'frente',
    'estructura',
    'estructural',
    'funcional',
  ]);
  const keywords = Array.from(
    new Set(
      topic
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !stopWords.has(word))
    )
  );

  if (keywords.length === 0) return Boolean(answer);
  const matches = keywords.filter((word) => answer.includes(word)).length;
  return matches >= Math.min(2, keywords.length);
}

function isUsefulFormulaQuestion(question: StudyQuestion) {
  if (question.kind !== 'formula') return true;
  const expression = question.topic?.trim() ?? '';
  if (!expression) return false;
  if (/^km$/i.test(expression)) return true;
  return /[=+\-*/()[\]0-9]/.test(expression);
}

function isEligibleExamQuestion(question: StudyQuestion) {
  if (question.kind === 'confusion') return false;
  if (!hasExplicitClassificationEvidence(question)) return false;
  if (!hasGroundedComparisonAnswer(question)) return false;
  if (!isUsefulFormulaQuestion(question)) return false;

  if (question.type === 'multiple_choice') {
    if (question.options.length < 3) return false;
    const answer = normalizeAnswer(question.answer);
    if (!question.options.some((option) => normalizeAnswer(option) === answer)) return false;
  }

  return Boolean(question.prompt.trim() && question.answer.trim());
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

function resolveExamQuestions(
  questions: StudyQuestion[],
  preferredQuestionIds: string[],
  targetCount: number
) {
  const selected: StudyQuestion[] = [];
  const selectedIds = new Set<string>();
  const selectedTopics = new Set<string>();
  const selectedPages = new Set<number>();
  const selectedKinds = new Set<StudyQuestion['kind']>();
  const preferredIds = new Set(preferredQuestionIds);
  const levelSequence: StudyQuestion['level'][] = [
    'recordar',
    'comprender',
    'aplicar',
    'comprender',
    'aplicar',
  ];
  const maxOpenQuestions = Math.max(1, Math.round(targetCount * 0.15));

  const score = (question: StudyQuestion) => {
    let value = preferredIds.has(question.id) ? 4 : 0;
    if (question.type === 'multiple_choice') value += 4;
    if (question.topic && !selectedTopics.has(normalizeAnswer(question.topic))) value += 6;
    if (question.reference.pageStart && !selectedPages.has(question.reference.pageStart)) value += 5;
    if (question.kind && !selectedKinds.has(question.kind)) value += 3;
    if (question.kind === 'formula' && question.level === 'aplicar') value += 6;
    return value;
  };

  const pickBest = (level?: StudyQuestion['level']) =>
    questions
      .filter((question) => !selectedIds.has(question.id))
      .filter((question) => !level || question.level === level)
      .filter(
        (question) =>
          question.type !== 'open' ||
          selected.filter((selectedQuestion) => selectedQuestion.type === 'open').length < maxOpenQuestions
      )
      .map((question, index) => ({ question, index, score: score(question) }))
      .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.question;

  const push = (question: StudyQuestion | undefined) => {
    if (!question || selectedIds.has(question.id) || selected.length >= targetCount) return;
    selected.push(question);
    selectedIds.add(question.id);
    if (question.topic) selectedTopics.add(normalizeAnswer(question.topic));
    if (question.reference.pageStart) selectedPages.add(question.reference.pageStart);
    if (question.kind) selectedKinds.add(question.kind);
  };

  for (let index = 0; index < targetCount; index += 1) {
    const desiredLevel = levelSequence[index % levelSequence.length];
    push(pickBest(desiredLevel) ?? pickBest());
  }

  while (selected.length < targetCount) {
    const match = pickBest();
    if (!match) break;
    push(match);
  }

  if (targetCount >= 10 && selected.every((question) => question.type !== 'open')) {
    const openCandidate = questions
      .filter((question) => question.type === 'open' && question.level === 'comprender')
      .map((question, index) => ({ question, index, score: score(question) }))
      .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.question;
    const replaceIndex = selected.findLastIndex(
      (question) => question.type === 'multiple_choice' && question.level === 'comprender'
    );
    if (openCandidate && replaceIndex >= 0) {
      selected[replaceIndex] = openCandidate;
    }
  }

  return selected.slice(0, targetCount);
}

export function StudentMaterialExam({ artifacts }: StudentMaterialExamProps) {
  const eligibleQuestions = useMemo(() => {
    const baseEligible = artifacts.questions.filter(isEligibleExamQuestion);
    const canonicalEligible = baseEligible.filter(
      (question) => !question.id.startsWith('fallback-concept-')
    );
    return canonicalEligible.length >= 20 ? canonicalEligible : baseEligible;
  }, [artifacts.questions]);
  const eligibleIds = useMemo(
    () => new Set(eligibleQuestions.map((question) => question.id)),
    [eligibleQuestions]
  );
  const preferredQuestionIds = useMemo(
    () => artifacts.miniExamQuestionIds.filter((id) => eligibleIds.has(id)),
    [artifacts.miniExamQuestionIds, eligibleIds]
  );
  const sizeOptions = useMemo(
    () => resolveExamSizeOptions(eligibleQuestions.length),
    [eligibleQuestions.length]
  );
  const defaultSize = sizeOptions[Math.floor(sizeOptions.length / 2)]?.count ?? 0;
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [started, setStarted] = useState(false);
  const questions = useMemo(
    () =>
      resolveExamQuestions(
        eligibleQuestions,
        preferredQuestionIds,
        selectedSize || defaultSize
      ),
    [defaultSize, eligibleQuestions, preferredQuestionIds, selectedSize]
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

  if (eligibleQuestions.length === 0 || sizeOptions.length === 0) {
    return (
      <div className="border-y border-slate-200 py-10 text-center">
        <p className="text-sm font-semibold text-slate-800">Todavía no hay preguntas suficientes</p>
        <p className="mt-1 text-[13px] leading-5 text-slate-500">
          El PDF necesita más contenido estructurado para armar un examen útil.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-4xl px-1 py-2 sm:px-2 sm:py-4">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">
            Examen basado en este PDF
          </p>
          <h2 className="mt-2 text-[1.65rem] font-bold tracking-[-0.05em] text-slate-950 sm:text-[1.85rem]">
            Elegí cuánto querés practicar
          </h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-slate-600">
            Las opciones se adaptan a la cantidad y variedad de preguntas que este documento permite construir con buena cobertura.
          </p>
        </header>

        <div className="grid gap-3 py-5 sm:grid-cols-3">
          {sizeOptions.map((option) => {
            const selected = selectedSize === option.count;
            return (
              <button
                key={option.count}
                type="button"
                onClick={() => setSelectedSize(option.count)}
                className={cn(
                  'min-h-32 border px-4 py-4 text-left transition first:rounded-l-[16px] last:rounded-r-[16px] sm:rounded-[16px]',
                  selected
                    ? 'border-[#2563EB] bg-[#F7FAFF]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-xl font-bold', selected ? 'text-[#2563EB]' : 'text-slate-950')}>
                    {option.count}
                  </span>
                  <span
                    className={cn(
                      'text-[9.5px] font-bold uppercase tracking-[0.1em]',
                      selected ? 'text-[#2563EB]' : 'text-slate-400'
                    )}
                  >
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

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <Button type="button" onClick={startExam} className="h-11 rounded-[14px] px-5">
            Comenzar examen
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
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
      <div className="mx-auto max-w-4xl px-1 py-2 sm:px-2 sm:py-4">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">
            Examen completado
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
            <h2 className="text-4xl font-bold tracking-[-0.07em] text-slate-950">
              {result.percentage}%
            </h2>
            <p className="pb-1 text-sm text-slate-600">
              {result.correct} de {result.total} respuestas consolidadas
            </p>
          </div>
        </header>

        <div className="grid border-b border-slate-200 py-5 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          {(['recordar', 'comprender', 'aplicar'] as const).map((level) => (
            <div key={level} className="py-2 sm:px-5 first:sm:pl-0 last:sm:pr-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {levelLabel(level)}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {result.levels[level].correct}/{result.levels[level].total}
              </p>
            </div>
          ))}
        </div>

        <section className="border-b border-slate-200 py-5">
          {reviewTopics.length > 0 ? (
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="font-semibold text-slate-950">Temas para repasar</h3>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-5 text-slate-700">
                  {reviewTopics.map((topic) => (
                    <li key={topic}>• {topic}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-emerald-700">
              No quedaron temas marcados para repasar en este intento.
            </p>
          )}
        </section>

        <div className="pt-5">
          <Button onClick={resetExam} className="h-11 w-full rounded-[14px] sm:w-auto">
            <RotateCcw className="h-4 w-4" />
            Elegir otro examen
          </Button>
        </div>
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
    <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-2 sm:py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Pregunta {currentIndex + 1} de {questions.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Basado únicamente en este PDF</p>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
          {levelLabel(current.level)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2563EB] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold leading-7 tracking-[-0.035em] text-slate-950 sm:text-xl">
          {current.prompt}
        </h2>

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
                    'flex min-h-14 w-full items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left transition sm:px-4',
                    !isRevealed && selected && 'border-[#2563EB] bg-[#F7FAFF]',
                    !isRevealed && !selected && 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60',
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
            className="mt-5 min-h-36 w-full resize-y rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] disabled:bg-slate-50"
          />
        )}

        {!isRevealed ? (
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
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
          <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
            <section
              className={cn(
                'border-l-2 py-0.5 pl-4',
                current.type === 'multiple_choice' && isCorrect
                  ? 'border-emerald-500'
                  : current.type === 'multiple_choice'
                    ? 'border-amber-500'
                    : 'border-[#2563EB]'
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
              <div className="border-t border-slate-100 pt-4">
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

            <div className="flex justify-end border-t border-slate-100 pt-4">
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
