'use client';

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pdfStudyQuestionActionsClassName } from '@/components/study/pdf-study-styles';
import type { PedagogicalArtifacts, StudyQuestion } from '@/lib/student-materials/pedagogy';
import { cn } from '@/lib/utils';
import { selectDiagnosticQuestions } from '@/lib/student-materials/diagnostic-questions';
import type { StudySummarySection } from '@/lib/student-materials/types';
import {
  recordStudentMaterialStudyResultAction,
  finishStudyErrorOnboardingAction,
} from '@/lib/actions/study-errors';

type Props = {
  artifacts: PedagogicalArtifacts;
  sections?: StudySummarySection[];
  materialId: string;
  onReviewTopics: (topics: string[]) => void;
  onExit: () => void;
  onComplete?: () => void;
  guided?: boolean;
  demo?: boolean;
  onDemoAnswer?: (question: StudyQuestion, selectedAnswer: string) => void;
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
  sections,
  materialId,
  onReviewTopics,
  onExit,
  onComplete,
  guided = false,
  demo = false,
  onDemoAnswer,
  onResult,
  onRestart,
  onReinforce,
  session,
  onSessionChange,
}: Props) {
  const questions = useMemo(
    () => selectDiagnosticQuestions(artifacts, guided ? 5 : 6, sections),
    [artifacts, guided, sections]
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
  const answerIds = useRef<Record<string, string>>({});
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
        <p className="text-foreground text-sm font-semibold">
          Todavía no hay preguntas suficientes para un diagnóstico útil.
        </p>
        <p className="text-muted-foreground mt-1 text-[13px] leading-5">
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
        <p className="text-primary text-[11px] font-bold tracking-[0.15em] uppercase">
          {guided ? 'Práctica completada' : 'Diagnóstico listo'}
        </p>
        <h2
          ref={resultHeading}
          tabIndex={-1}
          className="text-foreground mt-2 text-[22px] font-bold tracking-[-0.05em] outline-none"
        >
          {guided
            ? result.reviewTopics.length > 0
              ? 'Encontraste temas para reforzar'
              : 'Buen comienzo con tu material'
            : 'Ya sabemos por dónde empezar'}
        </h2>

        <div className="border-border mt-5 border-y py-4">
          <p className="text-foreground text-3xl font-bold tracking-[-0.055em]">
            {result.correct}/{questions.length}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">respuestas correctas</p>
        </div>

        <div className="mt-5">
          {result.reviewTopics.length > 0 ? (
            <>
              <p className="text-foreground text-sm font-semibold">
                {guided
                  ? `${result.reviewTopics.length} ${result.reviewTopics.length === 1 ? 'tema para reforzar' : 'temas para reforzar'} de este PDF`
                  : 'Te conviene repasar primero'}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {result.reviewTopics.slice(0, 3).join(', ')}.
              </p>
              {guided && (
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {demo
                    ? 'En tu PDF, estos conceptos quedarían guardados en Progreso.'
                    : 'Estos conceptos quedaron guardados en Progreso para que puedas repasarlos y comprobarlos de nuevo.'}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-foreground text-sm font-semibold">Buen dominio inicial</p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
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
            className="h-11 w-full rounded-lg"
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
            className="text-muted-foreground hover:text-foreground mt-2 inline-flex h-9 w-full items-center justify-center text-xs font-semibold"
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
      resultId: (answerIds.current[current.id] ??= crypto.randomUUID()),
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
      onDemoAnswer?.(current, selectedAnswer);
      delete answerIds.current[current.id];
      advanceDiagnostic();
      return;
    }

    {
      setSaveError('');
      setIsRecordingError(true);
      try {
        const recorded = await recordStudentMaterialStudyResultAction(payload);
        if (!recorded.success) throw new Error('No se pudo guardar');
        if (recorded.onboardingErrorId) {
          setOnboardingErrorId((previous) => previous ?? recorded.onboardingErrorId ?? null);
          // El primer error ya no interrumpe el diagnóstico con otro tutorial.
          void finishStudyErrorOnboardingAction(recorded.onboardingErrorId, 'legacy').catch(() => {});
        }
        delete answerIds.current[current.id];
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
  };

  return (
    <>
      <div className="mx-auto max-w-3xl px-1 py-3 sm:px-2 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Salir
          </button>
          <span aria-live="polite" className="text-muted-foreground text-xs font-medium">
            {currentIndex + 1} de {questions.length}
          </span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5">
          {current.topic ? (
            <p className="text-primary text-xs font-semibold">{current.topic}</p>
          ) : null}
          <h2
            ref={questionHeading}
            tabIndex={-1}
            data-guided-question={guided || undefined}
            className="text-foreground mt-2 text-[16px] leading-6 font-bold tracking-[-0.03em] outline-none sm:text-[18px]"
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
                    'w-full rounded-lg border px-3.5 py-3 text-left text-sm leading-5 transition sm:px-4',
                    selected
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-card text-foreground hover:bg-muted/60 hover:border-slate-300'
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
        </div>
        <div data-pdf-question-actions className={pdfStudyQuestionActionsClassName}>
          <Button
            type="button"
            disabled={!selectedAnswer || isRecordingError}
            onClick={() => void goNext()}
            className="h-11 rounded-lg px-5"
          >
            {currentIndex === questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </>
  );
}
