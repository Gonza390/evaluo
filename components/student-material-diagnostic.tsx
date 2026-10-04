'use client';

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import { cn } from '@/lib/utils';
import { selectDiagnosticQuestions } from '@/lib/student-materials/diagnostic-questions';
import { recordStudentMaterialStudyResultAction } from '@/lib/actions/study-errors';
import { FirstStudyErrorOnboardingPrompt } from '@/components/study-errors/first-error-onboarding-prompt';

type Props = {
  artifacts: PedagogicalArtifacts;
  materialId: string;
  onReviewTopics: (topics: string[]) => void;
  onExit: () => void;
  onComplete?: () => void;
  guided?: boolean;
  demo?: boolean;
  onResult?: (result: DiagnosticResult) => void;
  onRestart?: () => void;
  onReinforce?: (onboardingErrorId: string | null) => void;
  session?: DiagnosticSession;
  onSessionChange?: Dispatch<SetStateAction<DiagnosticSession>>;
};

export type DiagnosticResult = { correct: number; total: number; reviewTopics: string[] };
export type DiagnosticSession = {
  currentIndex: number;
  selectedAnswers: Record<string, string>;
  finished: boolean;
  onboardingErrorId: string | null;
};
export const emptyDiagnosticSession: DiagnosticSession = {
  currentIndex: 0,
  selectedAnswers: {},
  finished: false,
  onboardingErrorId: null,
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function StudentMaterialDiagnostic({
  artifacts,
  materialId,
  onReviewTopics,
  onExit,
  onComplete,
  guided = false,
  demo = false,
  onResult,
  onRestart,
  onReinforce,
  session,
  onSessionChange,
}: Props) {
  const questions = useMemo(
    () => selectDiagnosticQuestions(artifacts, guided ? 5 : 6),
    [artifacts, guided]
  );
  const [localSession, setLocalSession] = useState(emptyDiagnosticSession);
  const { currentIndex, selectedAnswers, finished, onboardingErrorId } = session ?? localSession;
  const updateSession = onSessionChange ?? setLocalSession;
  const setCurrentIndex = (value: SetStateAction<number>) =>
    updateSession((previous) => ({
      ...previous,
      currentIndex: typeof value === 'function' ? value(previous.currentIndex) : value,
    }));
  const setSelectedAnswers = (value: SetStateAction<Record<string, string>>) =>
    updateSession((previous) => ({
      ...previous,
      selectedAnswers: typeof value === 'function' ? value(previous.selectedAnswers) : value,
    }));
  const setFinished = (finished: boolean) =>
    updateSession((previous) => ({ ...previous, finished }));
  const setOnboardingErrorId = (value: SetStateAction<string | null>) =>
    updateSession((previous) => ({
      ...previous,
      onboardingErrorId: typeof value === 'function' ? value(previous.onboardingErrorId) : value,
    }));
  const [isRecordingError, setIsRecordingError] = useState(false);
  const [saveError, setSaveError] = useState('');
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!guided) return;
    const heading = finished ? resultHeading.current : questionHeading.current;
    if (heading && heading.getClientRects().length > 0) heading.focus();
  }, [guided, currentIndex, finished]);

  const result = useMemo(() => {
    const wrong = questions.filter(
      (question) => normalize(selectedAnswers[question.id] ?? '') !== normalize(question.answer)
    );
    const correct = questions.length - wrong.length;
    const reviewTopics = Array.from(
      new Set(
        wrong
          .map(
            (question) =>
              question.topic ||
              question.reference.sectionTitle ||
              `Concepto de la pregunta ${questions.findIndex((item) => item.id === question.id) + 1}`
          )
          .filter((value): value is string => Boolean(value))
      )
    );

    return { correct, wrong, reviewTopics };
  }, [questions, selectedAnswers]);

  const reset = () => {
    updateSession(emptyDiagnosticSession);
    setSaveError('');
    onRestart?.();
  };

  if (questions.length < 3) {
    return (
      <div className="mx-auto max-w-3xl px-1 py-6 sm:px-2">
        <p className="text-sm font-semibold text-slate-900">
          Todavía no hay preguntas suficientes para un diagnóstico útil.
        </p>
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
      <div
        data-recommended-result={guided || undefined}
        className="mx-auto max-w-3xl px-1 py-3 sm:px-2 sm:py-5"
      >
        <p className="text-[11px] font-bold tracking-[0.15em] text-[#2563EB] uppercase">
          {guided ? 'Práctica completada' : 'Diagnóstico listo'}
        </p>
        <h2
          ref={resultHeading}
          tabIndex={-1}
          className="mt-2 text-[1.65rem] font-bold tracking-[-0.05em] text-slate-950 outline-none"
        >
          {guided
            ? result.reviewTopics.length > 0
              ? 'Encontraste temas para reforzar'
              : 'Buen comienzo con tu material'
            : 'Ya sabemos por dónde empezar'}
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
              <p className="text-sm font-semibold text-slate-900">
                {guided
                  ? `${result.reviewTopics.length} ${result.reviewTopics.length === 1 ? 'tema para reforzar' : 'temas para reforzar'} de este PDF`
                  : 'Te conviene repasar primero'}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {result.reviewTopics.slice(0, 3).join(', ')}.
              </p>
              {guided && (
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {demo
                    ? 'En tu PDF, estos conceptos quedarían guardados en Mis errores.'
                    : 'Estos conceptos quedaron guardados en Mis errores para que puedas repasarlos y comprobarlos de nuevo.'}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">Buen dominio inicial</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {guided
                  ? `Respondiste correctamente estas ${questions.length} preguntas. Podés seguir practicando con este material.`
                  : 'No detectamos un tema claramente débil en estas preguntas.'}
              </p>
            </>
          )}
        </div>

        <div className="mt-6">
          <Button
            type="button"
            onClick={() =>
              guided && result.reviewTopics.length > 0 && onReinforce
                ? onReinforce(onboardingErrorId)
                : onReviewTopics(result.reviewTopics)
            }
            className="h-11 w-full rounded-[14px]"
          >
            {guided && result.reviewTopics.length > 0
              ? 'Reforzar mis temas'
              : result.reviewTopics.length > 0
                ? 'Repasar en el resumen'
                : 'Ir al resumen'}
          </Button>
          <button
            type="button"
            onClick={reset}
            className="mt-2 inline-flex h-9 w-full items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {guided ? 'Volver a practicar' : 'Rehacer diagnóstico'}
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const selectedAnswer = selectedAnswers[current.id] ?? '';
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  const advanceDiagnostic = () => {
    if (currentIndex >= questions.length - 1) {
      onComplete?.();
      onResult?.({
        correct: result.correct,
        total: questions.length,
        reviewTopics: result.reviewTopics,
      });
      setFinished(true);
      return;
    }
    setCurrentIndex((value) => value + 1);
  };

  const goNext = async () => {
    if (!selectedAnswer || isRecordingError) return;

    const wasCorrect = normalize(selectedAnswer) === normalize(current.answer);
    const payload = {
      materialId,
      sourceType: 'diagnostic' as const,
      itemKey: `diagnostic:${current.id}`,
      wasCorrect,
      topic: current.topic ?? current.reference.sectionTitle,
      prompt: current.prompt,
      explanation: current.explanation,
      correctAnswer: current.answer,
      selectedAnswer,
      reference: current.reference,
    };

    if (demo) {
      advanceDiagnostic();
      return;
    }

    if (guided) {
      setSaveError('');
      setIsRecordingError(true);
      try {
        const recorded = await recordStudentMaterialStudyResultAction(payload);
        if (!recorded.success) throw new Error('No se pudo guardar');
        if (recorded.onboardingErrorId)
          setOnboardingErrorId((previous) => previous ?? recorded.onboardingErrorId ?? null);
        advanceDiagnostic();
      } catch {
        setSaveError(
          'No pudimos guardar tu respuesta. Volvé a intentarlo para conservar tu progreso.'
        );
      } finally {
        setIsRecordingError(false);
      }
      return;
    }

    if (wasCorrect) {
      void recordStudentMaterialStudyResultAction(payload);
      advanceDiagnostic();
      return;
    }

    setIsRecordingError(true);
    const result = await recordStudentMaterialStudyResultAction(payload);
    setIsRecordingError(false);

    if (result.onboardingErrorId) {
      setOnboardingErrorId(result.onboardingErrorId);
      return;
    }

    advanceDiagnostic();
  };

  return (
    <>
      {!guided && (
        <FirstStudyErrorOnboardingPrompt
          errorId={onboardingErrorId}
          location="student_material_diagnostic"
          onClose={() => {
            setOnboardingErrorId(null);
            advanceDiagnostic();
          }}
        />
      )}
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
          <span aria-live="polite" className="text-xs font-medium text-slate-400">
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
          {current.topic ? (
            <p className="text-xs font-semibold text-[#2563EB]">{current.topic}</p>
          ) : null}
          <h2
            ref={questionHeading}
            tabIndex={-1}
            data-guided-question={guided || undefined}
            className="mt-2 text-lg leading-7 font-bold tracking-[-0.03em] text-slate-950 outline-none sm:text-xl"
          >
            {current.prompt}
          </h2>

          <div className="mt-4 space-y-2">
            {current.options.map((option) => {
              const selected = selectedAnswer === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={isRecordingError}
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

          {saveError && (
            <p role="alert" className="text-destructive mt-4 text-sm">
              {saveError}
            </p>
          )}
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
            <Button
              type="button"
              disabled={!selectedAnswer || isRecordingError}
              onClick={() => void goNext()}
              className="h-11 rounded-[14px] px-5"
            >
              {currentIndex === questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
