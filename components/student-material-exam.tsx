'use client';

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, CircleAlert, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pdfStudyQuestionActionsClassName } from '@/components/study/pdf-study-styles';
import type { PedagogicalArtifacts, StudyQuestion } from '@/lib/student-materials/pedagogy';
import { cn } from '@/lib/utils';
import type { TopicPracticeOutcome } from '@/lib/student-materials/topic-practice-feedback';
import { recordStudentMaterialStudyResultAction } from '@/lib/actions/study-errors';
import { trackClientAnalyticsEvent } from '@/lib/analytics-client';
import {
  saveNextStudyObjectiveAction,
  continueNextStudyTomorrowAction,
  type NextStudyObjective,
} from '@/lib/actions/next-study-objective';
import { MATERIAL_PRACTICE_FLOW_VERSION } from '@/lib/analytics-events';
import {
  getDistinctEligibleExamQuestions,
  resolveExamSizeOptions,
  normalizeAnswer,
  levelLabel,
  sourceLabel,
} from '@/lib/student-materials/practice-questions';
import {
  selectTopicPracticeQuestions,
  getTopicQuestionCounts,
  emptyTopicPracticeContext,
  MAX_TOPIC_PRACTICE_QUESTIONS,
  topicPracticeQuestionCount,
  type TopicPracticeContext,
} from '@/lib/student-materials/topic-practice';
import { getStudentMaterialPracticeContextAction } from '@/lib/actions/student-material-practice';
import type { StudySummarySection } from '@/lib/student-materials/types';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import {
  practiceBankSignature,
  practiceDraftKey,
  readPracticeDraft,
  type PracticeDraft,
} from '@/lib/student-materials/practice-session';

type StudentMaterialExamProps = {
  artifacts: PedagogicalArtifacts;
  materialId: string;
  onComplete?: () => void;
  onContinueToTopic?: (index: number) => void;
  onReturnToTopic?: (reinforce: boolean, outcome?: TopicPracticeOutcome) => void;
  sections?: StudySummarySection[];
  topicSectionIndex?: number;
  simulation?: {
    context: TopicPracticeContext;
    onAnswer: (question: StudyQuestion, wasCorrect: boolean) => void;
    onProgress: () => void;
  };
};

type OpenAssessment = 'got_it' | 'review';

export function StudentMaterialExam({
  artifacts,
  materialId,
  onComplete,
  onContinueToTopic,
  onReturnToTopic,
  sections = [],
  simulation,
  topicSectionIndex,
}: StudentMaterialExamProps) {
  const router = useRouter();
  const [tomorrowStatus, setTomorrowStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const topicTitle =
    topicSectionIndex === undefined ? undefined : sections[topicSectionIndex]?.title;
  const draftStorageKey =
    practiceDraftKey(materialId) +
    (topicSectionIndex === undefined ? '' : `:topic:${topicSectionIndex}`);
  const eligibleQuestions = useMemo(
    () =>
      getDistinctEligibleExamQuestions(artifacts.questions).filter(
        (question) =>
          topicSectionIndex === undefined ||
          (question.type === 'multiple_choice' &&
            findSummarySectionForQuestion(question, sections) === topicSectionIndex)
      ),
    [artifacts.questions, sections, topicSectionIndex]
  );
  const eligibleIds = useMemo(
    () => new Set(eligibleQuestions.map((question) => question.id)),
    [eligibleQuestions]
  );
  const preferredQuestionIds = useMemo(
    () => artifacts.miniExamQuestionIds.filter((id) => eligibleIds.has(id)),
    [artifacts.miniExamQuestionIds, eligibleIds]
  );
  const questionCounts = useMemo(
    () => getTopicQuestionCounts(sections, eligibleQuestions),
    [sections, eligibleQuestions]
  );
  const assessedSections = questionCounts.filter((count) => count > 0).length;
  const sizeOptions = useMemo(
    () => resolveExamSizeOptions(eligibleQuestions.length, assessedSections),
    [eligibleQuestions.length, assessedSections]
  );
  const defaultSize =
    sizeOptions.find((option) => option.mode === 'coverage')?.count ??
    sizeOptions[Math.floor(sizeOptions.length / 2)]?.count ??
    0;
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const topicPracticeCount = topicPracticeQuestionCount(eligibleQuestions.length);
  const topicAutoStartRequested = useRef(false);
  const [started, setStarted] = useState(false);
  // Congelar la tanda: los nuevos resultados no deben cambiar preguntas en pleno intento.
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const unavailableTopics = questionCounts.filter((count) => count === 0).length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecordingError, setIsRecordingError] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [canRestoreAfterRefresh, setCanRestoreAfterRefresh] = useState(false);
  const answerIds = useRef<Record<string, string>>({});
  const sessionIdRef = useRef('');
  const savedAnswerIdsRef = useRef<string[]>([]);
  const [nextObjective, setNextObjective] = useState<NextStudyObjective | null>(null);
  const [objectiveStatus, setObjectiveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const correctionRef = useRef<HTMLElement | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [openDrafts, setOpenDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [openAssessments, setOpenAssessments] = useState<Record<string, OpenAssessment>>({});
  const [finished, setFinished] = useState(false);
  const [savedDraft, setSavedDraft] = useState<PracticeDraft | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const isSimulation = Boolean(simulation);
  const bankSignature = useMemo(
    () => practiceBankSignature(eligibleQuestions),
    [eligibleQuestions]
  );

  useEffect(() => {
    if (isSimulation) {
      setDraftLoaded(true);
      return;
    }
    try {
      const key = draftStorageKey;
      const raw = window.localStorage.getItem(key);
      const restored = readPracticeDraft(raw, materialId, eligibleQuestions);
      if (raw && !restored) window.localStorage.removeItem(key);
      setSavedDraft(restored);
    } catch {
      setSavedDraft(null);
    }
    setDraftLoaded(true);
  }, [materialId, bankSignature, eligibleQuestions, isSimulation, draftStorageKey]);

  // Guardado automático en este dispositivo. No persistir contenidos del PDF
  // ni hacer una llamada al servidor por cada tecla del estudiante.
  useEffect(() => {
    if (isSimulation || !draftLoaded || !started || finished || !questions.length) return;
    const draft: PracticeDraft = {
      version: 1,
      materialId,
      bankSignature,
      questionIds: questions.map((question) => question.id),
      selectedSize: questions.length,
      currentIndex,
      selectedAnswers,
      openDrafts,
      revealed,
      openAssessments,
      answerIds: { ...answerIds.current },
      sessionId: sessionIdRef.current,
      savedAnswerIds: [...savedAnswerIdsRef.current],
      contextUnavailable,
      savedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } catch {
      // Cuota de navegador o almacenamiento bloqueado: la práctica sigue funcionando.
    }
  }, [
    bankSignature,
    contextUnavailable,
    currentIndex,
    draftLoaded,
    finished,
    isRecordingError,
    isSimulation,
    materialId,
    openAssessments,
    openDrafts,
    questions,
    revealed,
    selectedAnswers,
    started,
    draftStorageKey,
  ]);

  useEffect(() => {
    if (isSimulation || !finished) return;
    try {
      window.localStorage.removeItem(draftStorageKey);
    } catch {
      // No bloquear la finalización por permisos de almacenamiento.
    }
    setSavedDraft(null);
  }, [finished, isSimulation, draftStorageKey]);

  const discardSavedDraft = () => {
    try {
      window.localStorage.removeItem(draftStorageKey);
    } catch {
      // Ignorar almacenamiento deshabilitado.
    }
    setSavedDraft(null);
  };

  const resumeExam = () => {
    if (!savedDraft) return;
    const byId = new Map(eligibleQuestions.map((question) => [question.id, question]));
    const frozen = savedDraft.questionIds
      .map((id) => byId.get(id))
      .filter((question): question is StudyQuestion => Boolean(question));
    if (frozen.length !== savedDraft.questionIds.length) {
      discardSavedDraft();
      return;
    }
    answerIds.current = { ...savedDraft.answerIds };
    sessionIdRef.current = savedDraft.sessionId || crypto.randomUUID();
    savedAnswerIdsRef.current = [...(savedDraft.savedAnswerIds ?? [])];
    setQuestions(frozen);
    setSelectedSize(savedDraft.selectedSize);
    setCurrentIndex(savedDraft.currentIndex);
    setSelectedAnswers({ ...savedDraft.selectedAnswers });
    setOpenDrafts({ ...savedDraft.openDrafts });
    setRevealed({ ...savedDraft.revealed });
    setOpenAssessments({ ...savedDraft.openAssessments });
    setContextUnavailable(savedDraft.contextUnavailable);
    setFinished(false);
    setStarted(true);
    setSavedDraft(null);
  };

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
    answerIds.current = {};
    sessionIdRef.current = crypto.randomUUID();
    savedAnswerIdsRef.current = [];
    setNextObjective(null);
    setObjectiveStatus('idle');
    setTomorrowStatus('idle');
    setSaveError('');
    setCanRestoreAfterRefresh(false);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setOpenDrafts({});
    setRevealed({});
    setOpenAssessments({});
    setFinished(false);
  };

  const startExam = async () => {
    if (preparing) return;
    setPreparing(true);
    const context =
      simulation?.context ??
      (await getStudentMaterialPracticeContextAction(materialId).catch(() => ({
        ...emptyTopicPracticeContext,
        loadError: true,
      })));
    const nextQuestions = selectTopicPracticeQuestions({
      questions: eligibleQuestions,
      preferredQuestionIds,
      targetCount: topicSectionIndex === undefined ? selectedSize || defaultSize : topicPracticeCount,
      complete:
        topicSectionIndex === undefined &&
        sizeOptions.find((option) => option.count === (selectedSize || defaultSize))?.mode ===
          'complete',
      sections,
      context,
      unansweredOnly: topicSectionIndex !== undefined,
    });
    setQuestions(nextQuestions);
    setContextUnavailable(Boolean(context.loadError));
    setSavedDraft(null);
    clearAttempt();
    setStarted(true);
    setPreparing(false);
    if (!simulation)
      void trackClientAnalyticsEvent({
        eventName: 'student_material_exam_started',
        metadata: {
          material_id: materialId,
          question_count: nextQuestions.length,
          flow_version: MATERIAL_PRACTICE_FLOW_VERSION,
        },
      });
  };

  const resetExam = () => {
    discardSavedDraft();
    clearAttempt();
    topicAutoStartRequested.current = false;
    setStarted(false);
  };

  const startTopicPractice = useEffectEvent(() => {
    void startExam();
  });
  // Para un tema se empieza directamente: no hay pantalla para elegir cantidad.
  // Un borrador previo se ofrece para retomar antes de crear una tanda nueva.
  useEffect(() => {
    if (
      topicSectionIndex === undefined ||
      !draftLoaded ||
      savedDraft ||
      started ||
      preparing ||
      topicAutoStartRequested.current ||
      eligibleQuestions.length === 0
    ) return;
    topicAutoStartRequested.current = true;
    startTopicPractice();
  }, [topicSectionIndex, draftLoaded, savedDraft, started, preparing, eligibleQuestions.length]);

  if (eligibleQuestions.length === 0 || sizeOptions.length === 0) {
    return (
      <div className="border-border border-y py-10 text-center">
        <p className="text-foreground text-sm font-semibold">
          Todavía no hay preguntas suficientes
        </p>
        <p className="text-muted-foreground mt-1 text-[13px] leading-5">
          {topicSectionIndex === undefined
            ? 'El PDF necesita más contenido estructurado para armar una práctica útil.'
            : 'Podés estudiar este tema con tu resumen. Todavía no hay preguntas fiables asociadas para practicarlo.'}
        </p>
      </div>
    );
  }

  if (!started && topicSectionIndex !== undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-1 py-4 sm:px-2">
        {onReturnToTopic && (
          <button
            type="button"
            onClick={() => onReturnToTopic(false)}
            className="text-primary min-h-11 text-sm font-semibold"
          >
            Volver al tema
          </button>
        )}
        <div className="border-border border-b pb-4">
          <p className="text-primary text-[11px] font-bold tracking-[0.14em] uppercase">
            Práctica de este tema
          </p>
          <h2 className="text-foreground mt-2 text-xl font-semibold">
            {topicTitle}
          </h2>
        </div>
        {savedDraft && !isSimulation ? (
          <div className="border-primary/30 bg-primary/5 rounded-xl border p-4">
            <p className="text-sm font-semibold">Tenés una práctica sin terminar</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Retomá desde la pregunta {savedDraft.currentIndex + 1} de {savedDraft.questionIds.length}.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button type="button" onClick={resumeExam}>Continuar donde quedé <ArrowRight className="h-4 w-4" /></Button>
              <button type="button" onClick={discardSavedDraft} className="text-muted-foreground min-h-11 text-xs font-medium underline">
                Empezar una práctica nueva
              </button>
            </div>
          </div>
        ) : (
          <p role="status" className="text-muted-foreground text-sm">
            {preparing ? 'Preparando tus preguntas…' : 'Abriendo la práctica…'}
          </p>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-4xl px-1 py-2 sm:px-2 sm:py-4">
        {topicSectionIndex !== undefined && onReturnToTopic && (
          <button
            type="button"
            onClick={() => onReturnToTopic(false)}
            className="text-primary mb-3 min-h-11 text-sm font-semibold"
          >
            Volver al contenido del tema
          </button>
        )}
        <header className="border-border border-b pb-5">
          <p className="text-primary text-[11px] font-bold tracking-[0.15em] uppercase">
            {topicSectionIndex === undefined
              ? 'Práctica basada en este PDF'
              : 'Práctica de este tema'}
          </p>
          <h2 className="text-foreground mt-2 text-[20px] font-bold tracking-[-0.05em] sm:text-[22px]">
            {topicTitle ?? 'Elegí cuánto querés practicar'}
          </h2>
        </header>

        {topicSectionIndex === undefined &&
          sections.length > 0 &&
          assessedSections < sections.length && (
            <p className="text-muted-foreground mt-4 text-xs leading-5" role="status">
              El banco tiene preguntas autocorregibles asociadas a {assessedSections} de{' '}
              {sections.length} capítulos del resumen. Los demás no se consideran evaluados, incluso
              en el modo Completo.
            </p>
          )}

        {savedDraft && !isSimulation && (
          <div className="border-primary/30 bg-primary/5 mt-5 rounded-xl border px-4 py-4">
            <p className="text-foreground text-sm font-semibold">Tenés una práctica sin terminar</p>
            <p className="text-muted-foreground mt-1 text-[13px]">
              Retomá desde la pregunta {savedDraft.currentIndex + 1} de{' '}
              {savedDraft.questionIds.length}. Tus respuestas anteriores siguen guardadas en este
              navegador.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={resumeExam} className="h-10 rounded-lg">
                Continuar donde quedé <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={discardSavedDraft}
                className="text-muted-foreground hover:text-foreground text-xs font-medium underline"
              >
                Descartar práctica guardada
              </button>
            </div>
          </div>
        )}

        <div data-onboarding-practice-options className="grid gap-3 py-5 sm:grid-cols-3">
          {sizeOptions.map((option) => {
            const selected = selectedSize === option.count;
            return (
              <button
                key={option.count}
                type="button"
                onClick={() => setSelectedSize(option.count)}
                className={cn(
                  'min-h-24 rounded-2xl border px-3 py-3 text-left transition',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-muted/60 hover:border-slate-300'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'text-xl font-bold',
                      selected ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {option.count}
                  </span>
                  <span
                    className={cn(
                      'text-[9.5px] font-bold tracking-[0.1em] uppercase',
                      selected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                <p className="text-foreground mt-1 text-xs font-semibold">
                  {option.count === 1 ? 'pregunta' : 'preguntas'}
                </p>
                <p className="text-muted-foreground mt-2 text-[12px] leading-5">
                  {topicSectionIndex === undefined
                    ? option.description
                    : option.mode === 'complete'
                      ? 'Respondé todas las preguntas disponibles de este tema.'
                      : 'Respondé una selección de preguntas de este tema.'}
                </p>
              </button>
            );
          })}
        </div>

        <div className="border-border flex justify-end border-t pt-5">
          <Button
            type="button"
            disabled={preparing}
            onClick={() => void startExam()}
            className="h-11 rounded-lg px-5"
          >
            {preparing ? 'Preparando práctica…' : 'Empezar práctica'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const persistNextObjective = () => {
    if (isSimulation) return;
    if (!sessionIdRef.current || savedAnswerIdsRef.current.length !== questions.length) {
      setObjectiveStatus('error');
      return;
    }
    setObjectiveStatus('saving');
    void saveNextStudyObjectiveAction({
      materialId,
      sessionId: sessionIdRef.current,
      answerIds: [...savedAnswerIdsRef.current],
    }).then((response) => {
      if (!response.success || !response.objective) {
        setObjectiveStatus('error');
        return;
      }
      setNextObjective(response.objective);
      setObjectiveStatus('saved');
      void trackClientAnalyticsEvent({
        eventName: 'study_next_objective_created',
        metadata: { material_id: materialId, objective_id: response.objective.id, kind: response.objective.kind },
      });
    }).catch(() => setObjectiveStatus('error'));
  };

  const continueTomorrow = async () => {
    if (objectiveStatus !== 'saved' || !nextObjective || tomorrowStatus === 'saving') return;
    setTomorrowStatus('saving');
    const outcome = await continueNextStudyTomorrowAction({
      materialId,
      objectiveId: nextObjective.id,
    }).catch(() => ({ success: false }));
    if (!outcome.success) {
      setTomorrowStatus('error');
      return;
    }
    void trackClientAnalyticsEvent({
      eventName: 'cta_click',
      metadata: { location: 'practice_result', cta_name: 'continue_tomorrow', destination: '/dashboard' },
    });
    router.push('/dashboard');
    router.refresh();
  };

  if (finished) {
    const reviewTopics = Array.from(
      new Set(
        result.wrong
          .map(
            (question) =>
              sections[findSummarySectionForQuestion(question, sections)]?.title ??
              question.topic ??
              question.reference.sectionTitle
          )
          .filter((value): value is string => Boolean(value))
      )
    ).slice(0, 5);

    // La vista del PDF prioriza el resultado y un solo próximo paso.
    // El desglose y las acciones existentes siguen disponibles al expandir "Ver detalles".
    if (!isSimulation) {
      const nextStepTitle =
        nextObjective?.kind === 'reinforce'
          ? `Reforzar ${nextObjective.topicTitle || 'mis errores'}`
          : nextObjective?.kind === 'practice'
            ? `Practicar ${nextObjective.topicTitle || 'el próximo tema'}`
            : 'Consolidar lo aprendido';

      return (
        <div className="mx-auto max-w-xl px-2 py-8 sm:py-12">
          <header className="text-center">
            <p className="text-primary text-xs font-semibold tracking-[0.12em] uppercase">
              Práctica terminada
            </p>
            <h2 className="text-foreground mt-4 text-5xl font-bold tracking-[-0.07em] sm:text-6xl">
              {result.correct} <span className="text-muted-foreground/45">/ {result.total}</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              respuestas correctas
            </p>
          </header>

          <section className="border-border mt-9 border-t pt-7" aria-live="polite">
            <p className="text-primary text-[11px] font-semibold tracking-[0.12em] uppercase">
              Tu próximo paso
            </p>
            {objectiveStatus === 'saving' || objectiveStatus === 'idle' ? (
              <p className="text-muted-foreground mt-3 text-sm">
                Preparando tu próximo repaso…
              </p>
            ) : objectiveStatus === 'saved' && nextObjective ? (
              <>
                <h3 className="text-foreground mt-2 text-xl font-semibold tracking-tight">
                  {nextStepTitle}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {nextObjective.kind === 'reinforce'
                    ? 'Retomá este tema con una práctica breve y comprobá qué aprendiste.'
                    : nextObjective.kind === 'practice'
                      ? 'Ya tenés un tema preparado para seguir estudiando.'
                      : 'Podés continuar con otra práctica cuando quieras.'}
                </p>
              </>
            ) : (
              <div className="mt-3">
                <p className="text-muted-foreground text-sm">
                  No pudimos guardar tu próximo repaso. Tu práctica sí quedó guardada.
                </p>
                <Button type="button" variant="outline" onClick={persistNextObjective} className="mt-3">
                  Reintentar
                </Button>
              </div>
            )}
          </section>

          <div className="mt-8 space-y-3">
            {nextObjective?.kind === 'reinforce' && nextObjective.topicSectionIndex === null ? (
              <Link
                href={`/dashboard/explicaciones?material=${encodeURIComponent(materialId)}`}
                aria-disabled={objectiveStatus !== 'saved'}
                onClick={(event) => {
                  if (objectiveStatus !== 'saved') event.preventDefault();
                  else void trackClientAnalyticsEvent({
                    eventName: 'cta_click',
                    metadata: { location: 'practice_result', cta_name: 'continue_now', destination: 'study_errors' },
                  });
                }}
                className="bg-primary text-primary-foreground inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-60"
              >
                Continuar ahora <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Button
                type="button"
                disabled={objectiveStatus !== 'saved' || tomorrowStatus === 'saving'}
                onClick={() => {
                  if (!nextObjective) return;
                  void trackClientAnalyticsEvent({
                    eventName: 'cta_click',
                    metadata: { location: 'practice_result', cta_name: 'continue_now', destination: 'topic_practice' },
                  });
                  if (nextObjective.topicSectionIndex !== null && onContinueToTopic) {
                    if (nextObjective.topicSectionIndex === topicSectionIndex) {
                      resetExam();
                    } else {
                      onContinueToTopic(nextObjective.topicSectionIndex);
                    }
                  } else {
                    resetExam();
                  }
                }}
                className="min-h-12 w-full rounded-xl text-sm font-semibold"
              >
                Continuar ahora <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={objectiveStatus !== 'saved' || tomorrowStatus === 'saving'}
              onClick={() => void continueTomorrow()}
              className="min-h-12 w-full rounded-xl text-sm font-semibold"
            >
              {tomorrowStatus === 'saving' ? 'Guardando para mañana…' : 'Continuar mañana'}
            </Button>
            {tomorrowStatus === 'error' ? (
              <p role="alert" className="text-destructive text-center text-xs">
                No pudimos guardar el repaso para mañana. Volvé a intentarlo.
              </p>
            ) : null}
            <p className="text-muted-foreground text-center text-xs">
              Si elegís mañana, el repaso queda guardado en Mi espacio.
            </p>
          </div>

          <details className="group border-border mt-5 border-t pt-4">
            <summary className="text-muted-foreground hover:text-foreground flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 text-sm font-medium">
              Ver detalles y otras opciones
              <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="space-y-5 pt-5">
              <div className="border-border grid grid-cols-3 gap-3 border-b pb-5">
                {(['recordar', 'comprender', 'aplicar'] as const)
                  .filter((level) => topicSectionIndex === undefined || result.levels[level].total > 0)
                  .map((level) => (
                    <div key={level}>
                      <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                        {levelLabel(level)}
                      </p>
                      <p className="text-foreground mt-1 text-base font-semibold">
                        {result.levels[level].correct}/{result.levels[level].total}
                      </p>
                    </div>
                  ))}
              </div>
              {reviewTopics.length > 0 ? (
                <div>
                  <h4 className="text-foreground text-sm font-semibold">Temas para repasar</h4>
                  <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                    {reviewTopics.map((topic) => <li key={topic}>• {topic}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No quedaron temas marcados para repasar en esta tanda.
                </p>
              )}
              {topicSectionIndex !== undefined ? (
                <p className="text-muted-foreground text-xs">
                  Este resultado corresponde solamente a esta tanda; no mide el dominio de todo el tema.
                </p>
              ) : sections.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                  Los temas no evaluados en esta práctica no cuentan como errores.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {topicSectionIndex !== undefined && onReturnToTopic ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onReturnToTopic(result.wrong.length > 0, {
                      sectionIndex: topicSectionIndex,
                      total: result.total,
                      correct: result.correct,
                      incorrect: result.wrong.length,
                      incorrectPrompts: result.wrong.map((question) => question.prompt),
                    })}
                  >
                    {result.wrong.length > 0 ? 'Entender mis errores' : 'Volver al tema'}
                  </Button>
                ) : (
                  <Link
                    href={`/dashboard/progreso?material=${materialId}`}
                    className="border-border inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold"
                  >
                    Ver mi progreso
                  </Link>
                )}
                <Button type="button" variant="outline" onClick={resetExam}>
                  <RotateCcw className="h-4 w-4" />
                  {topicSectionIndex !== undefined ? 'Practicar de nuevo' : 'Nueva práctica'}
                </Button>
              </div>
            </div>
          </details>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl px-1 py-2 sm:px-2 sm:py-4">
        <header className="border-border border-b pb-6">
          <p className="text-primary text-[11px] font-bold tracking-[0.15em] uppercase">
            Práctica completada{topicTitle ? ` · ${topicTitle}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
            <h2 className="text-foreground text-3xl font-bold tracking-[-0.07em]">
              {topicSectionIndex === undefined
                ? `${result.percentage}%`
                : `${result.correct} de ${result.total}`}
            </h2>
            <p className="text-muted-foreground pb-1 text-sm">
              {topicSectionIndex === undefined
                ? `${result.correct} de ${result.total} respuestas consolidadas`
                : 'Respuestas correctas en esta tanda'}
            </p>
          </div>
        </header>

        <div className="border-border grid border-b py-5 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          {(['recordar', 'comprender', 'aplicar'] as const)
            .filter((level) => topicSectionIndex === undefined || result.levels[level].total > 0)
            .map((level) => (
              <div key={level} className="py-2 sm:px-5 first:sm:pl-0 last:sm:pr-0">
                <p className="text-muted-foreground text-[11px] font-bold tracking-[0.14em] uppercase">
                  {levelLabel(level)}
                </p>
                <p className="text-foreground mt-1 text-lg font-bold">
                  {result.levels[level].correct}/{result.levels[level].total}
                </p>
              </div>
            ))}
        </div>

        <section className="border-border border-b py-5">
          {topicSectionIndex !== undefined ? (
            <div>
              <h3 className="text-foreground font-semibold">
                {result.wrong.length > 0
                  ? `${result.wrong.length} ${result.wrong.length === 1 ? 'pregunta para revisar' : 'preguntas para revisar'}`
                  : 'Respondiste toda la tanda correctamente'}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {result.wrong.length > 0
                  ? 'Antes de continuar, te recomendamos revisar estas dificultades con el contenido del tema.'
                  : 'Podés volver al tema y continuar estudiando. Más adelante conviene comprobarlo otra vez.'}
              </p>
            </div>
          ) : reviewTopics.length > 0 ? (
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="text-foreground font-semibold">Temas para repasar</h3>
                <ul className="text-foreground mt-2 space-y-1.5 text-[13px] leading-5">
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

        {topicSectionIndex !== undefined && (
          <p className="text-muted-foreground mt-4 text-sm!">
            Resultado de esta tanda de {topicTitle}. Incluye {result.total}{' '}
            {result.total === 1 ? 'pregunta' : 'preguntas'}; no representa el dominio de todo el
            tema.
          </p>
        )}
        {topicSectionIndex === undefined && sections.length > 0 && (
          <p className="text-muted-foreground mt-4 text-[13px]!">
            Esta práctica incluyó preguntas corregidas de{' '}
            {
              new Set(
                questions
                  .filter((question) => question.type === 'multiple_choice')
                  .map((question) => findSummarySectionForQuestion(question, sections))
                  .filter((index) => index >= 0)
              ).size
            }{' '}
            de {sections.length} temas. Los temas que no aparecieron siguen sin evaluar en este
            intento; no cuentan como errores.
          </p>
        )}
        {!isSimulation && (
          <section className="border-primary/20 bg-primary/5 mt-5 rounded-xl border p-4 sm:p-5" aria-live="polite">
            <p className="text-primary text-[11px] font-bold tracking-[0.13em] uppercase">Tu próximo objetivo</p>
            {objectiveStatus === 'saving' || objectiveStatus === 'idle' ? (
              <p className="text-muted-foreground mt-2 text-sm">Preparando tu próximo repaso con tus respuestas guardadas…</p>
            ) : objectiveStatus === 'saved' && nextObjective ? (
              <>
                <h3 className="text-foreground mt-2 text-lg font-bold">
                  {nextObjective.kind === 'reinforce' ? `Reforzar: ${nextObjective.topicTitle || 'tus errores'}`
                    : nextObjective.kind === 'practice' ? `Practicar: ${nextObjective.topicTitle || 'el próximo tema'}`
                    : 'Consolidar lo aprendido'}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {nextObjective.kind === 'reinforce' ? 'Volvé a comprobar los conceptos que te costaron en esta práctica.'
                    : nextObjective.kind === 'practice' ? 'Seguí con un tema que todavía necesita una comprobación.'
                    : 'Comprobá lo aprendido con otra tanda de preguntas.'}
                </p>
                <p className="text-muted-foreground mt-2 text-xs font-medium">
                  Repaso sugerido: {new Date(`${nextObjective.reviewOn}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                </p>
                <p className="text-primary mt-3 text-xs font-semibold">✓ Guardado en Mi espacio para tu próxima visita</p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mt-2 text-sm">Tu práctica está guardada, pero no pudimos guardar tu próximo objetivo.</p>
                <Button type="button" variant="outline" className="mt-3" onClick={persistNextObjective}>Reintentar guardar objetivo</Button>
              </>
            )}
          </section>
        )}
        <div className="flex flex-wrap gap-3 pt-5">
          {topicSectionIndex !== undefined && onReturnToTopic ? (
            <Button
              onClick={() =>
                onReturnToTopic(result.wrong.length > 0, {
                  sectionIndex: topicSectionIndex,
                  total: result.total,
                  correct: result.correct,
                  incorrect: result.wrong.length,
                  incorrectPrompts: result.wrong.map((question) => question.prompt),
                })
              }
              className="h-auto min-h-11 whitespace-normal"
            >
              {result.wrong.length > 0 ? 'Entender mis errores' : 'Volver al tema'}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          ) : simulation ? (
            <Button variant="outline" onClick={simulation.onProgress}>
              Ver mi progreso
            </Button>
          ) : (
            <Link
              href={`/dashboard/progreso?material=${materialId}`}
              className="border-border focus-visible:outline-ring inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-semibold focus-visible:outline-2"
            >
              Ver mi progreso
            </Link>
          )}
          {!isSimulation && (
            <Link href="/dashboard" onClick={(event) => {
              if (objectiveStatus === 'saving' || objectiveStatus === 'idle') event.preventDefault();
            }} aria-disabled={objectiveStatus === 'saving' || objectiveStatus === 'idle'}
              className="border-border inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold aria-disabled:cursor-wait aria-disabled:opacity-60">
              {objectiveStatus === 'saving' || objectiveStatus === 'idle' ? 'Guardando próximo objetivo…' : 'Terminar por hoy'}
            </Link>
          )}
          <Button
            variant={topicSectionIndex !== undefined ? 'outline' : 'default'}
            onClick={resetExam}
            className="h-11 w-full rounded-lg sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            {topicSectionIndex !== undefined ? 'Practicar de nuevo' : 'Nueva práctica'}
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

  const advanceExam = () => {
    if (currentIndex >= questions.length - 1) {
      if (!simulation)
        void trackClientAnalyticsEvent({
          eventName: 'student_material_exam_completed',
          metadata: {
            material_id: materialId,
            question_count: result.total,
            correct_count: result.correct,
            score_pct: result.percentage,
            flow_version: MATERIAL_PRACTICE_FLOW_VERSION,
          },
        });
      onComplete?.();
      setFinished(true);
      persistNextObjective();
      return;
    }
    setCurrentIndex((index) => index + 1);
  };

  const goNext = async () => {
    if (!canAdvance || isRecordingError) return;

    const wasCorrect =
      current.type === 'multiple_choice' ? isCorrect : openAssessments[current.id] === 'got_it';

    if (simulation) {
      simulation.onAnswer(current, wasCorrect);
      advanceExam();
      return;
    }

    const payload = {
      resultId: (answerIds.current[current.id] ??= crypto.randomUUID()),
      materialId,
      sourceType: 'exercise' as const,
      itemKey: `exercise:${current.id}`,
      wasCorrect,
      topic: current.topic ?? current.reference.sectionTitle,
      prompt: current.prompt,
      explanation: current.explanation,
      correctAnswer: current.answer,
      selectedAnswer:
        current.type === 'multiple_choice' ? selectedAnswer : (openDrafts[current.id] ?? ''),
      reference: current.reference,
    };

    // Persistir SINCRÓNICAMENTE antes de enviar: un redeploy puede invalidar
    // la Server Action incluso antes de que nuestro código del servidor se ejecute.
    // El borrador preserva la tanda y el mismo resultId para reintentos idempotentes.
    let protectedLocally = false;
    try {
      const draft: PracticeDraft = {
        version: 1,
        materialId,
        bankSignature,
        questionIds: questions.map((question) => question.id),
        selectedSize: questions.length,
        currentIndex,
        selectedAnswers,
        openDrafts,
        revealed,
        openAssessments,
        answerIds: { ...answerIds.current },
        sessionId: sessionIdRef.current,
        savedAnswerIds: [...savedAnswerIdsRef.current],
        contextUnavailable,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      protectedLocally = true;
    } catch {
      // En navegación privada o con almacenamiento bloqueado no prometer recuperación.
    }
    setCanRestoreAfterRefresh(protectedLocally);
    setIsRecordingError(true);
    setSaveError('');
    let serverActionMismatch = false;
    const result = await recordStudentMaterialStudyResultAction(payload).catch((error: unknown) => {
      serverActionMismatch = /Failed to find Server Action|older or newer deployment/i.test(
        String(error)
      );
      return { success: false };
    });
    setIsRecordingError(false);
    if (!result.success) {
      setSaveError(
        serverActionMismatch
          ? protectedLocally
            ? 'Evaluo se actualizó mientras estudiabas. Tu respuesta está guardada en este navegador. Actualizá para retomarla y volver a enviarla.'
            : 'Evaluo se actualizó. No pudimos guardar una copia local: mantené esta pestaña abierta e intentá de nuevo antes de actualizar.'
          : protectedLocally
            ? 'No se pudo guardar la respuesta en tu progreso. Sigue disponible en este navegador: reintentá o actualizá la página para retomarla.'
            : 'No se pudo guardar la respuesta ni crear una copia local. Mantené esta pestaña abierta y reintentá.'
      );
      return;
    }
    if (!savedAnswerIdsRef.current.includes(payload.resultId)) savedAnswerIdsRef.current.push(payload.resultId);
    delete answerIds.current[current.id];

    advanceExam();
  };

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-2 sm:py-4">
        {topicSectionIndex !== undefined && (
          <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <p className="text-muted-foreground text-sm!">{topicTitle}</p>
            {onReturnToTopic && (
              <button
                type="button"
                onClick={() => onReturnToTopic(false)}
                className="text-primary min-h-11 text-sm font-semibold"
              >
                Volver al tema
              </button>
            )}
          </div>
        )}
        {contextUnavailable && (
          <p role="status" className="text-muted-foreground text-xs!">
            {topicSectionIndex === undefined
              ? 'No pudimos cargar tu historial. Esta tanda reparte preguntas entre los temas disponibles.'
              : 'No pudimos cargar tu historial. Esta tanda usa las preguntas disponibles de este tema.'}
          </p>
        )}
        {topicSectionIndex === undefined && unavailableTopics > 0 && (
          <p className="text-muted-foreground text-xs!">
            {unavailableTopics}{' '}
            {unavailableTopics === 1 ? 'tema todavía no tiene' : 'temas todavía no tienen'}{' '}
            preguntas corregibles asociadas. No se cuentan como errores.
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-[12px] font-bold tracking-[0.14em] uppercase">
              Pregunta {currentIndex + 1} de {questions.length}
            </p>
          </div>
          <span className="text-primary text-[11px] font-bold tracking-[0.12em] uppercase md:hidden">
            {levelLabel(current.level)}
          </span>
        </div>

        {!isSimulation && questions.length >= 20 && (
          <p className="text-muted-foreground text-[11px]">
            Tu avance se guarda automáticamente en este navegador. Podés volver a este PDF y
            continuar.
          </p>
        )}

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <article className="border-border border-t pt-6">
          <h2 className="text-foreground text-[16px] leading-6 font-bold tracking-[-0.035em] sm:text-[18px]">
            {current.prompt}
          </h2>

          {current.type === 'multiple_choice' ? (
            <div className="mt-3 grid gap-2">
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
                      'flex min-h-11 w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition sm:px-4',
                      !isRevealed && selected && 'border-primary bg-primary/5',
                      !isRevealed &&
                        !selected &&
                        'border-border bg-card hover:bg-muted/60 hover:border-slate-300',
                      showCorrect && 'border-emerald-300 bg-emerald-50',
                      showWrong && 'border-destructive/30 bg-destructive/5',
                      isRevealed && !showCorrect && !showWrong && 'border-border bg-muted/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                        selected && !isRevealed && 'border-primary bg-primary text-white',
                        !selected &&
                          !showCorrect &&
                          !showWrong &&
                          'bg-card text-muted-foreground border-slate-300',
                        showCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                        showWrong && 'border-destructive bg-destructive text-white'
                      )}
                    >
                      {showCorrect ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </span>
                    <span className="text-foreground pt-0.5 text-[13.5px] leading-5 sm:text-sm sm:leading-6">
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
              className="border-border bg-card text-foreground focus:border-primary focus:ring-ring/20 disabled:bg-muted mt-3 min-h-28 w-full resize-y rounded-lg border px-4 py-3 text-sm leading-6 transition outline-none focus:ring-2"
            />
          )}

          {isRevealed ? (
            <div className="border-border mt-5 space-y-4 border-t pt-5">
              <section
                ref={correctionRef}
                className={cn(
                  'border-l-2 py-0.5 pl-4',
                  current.type === 'multiple_choice' && isCorrect
                    ? 'border-emerald-500'
                    : current.type === 'multiple_choice'
                      ? 'border-destructive'
                      : 'border-primary'
                )}
              >
                <p className="text-foreground text-sm font-bold">
                  {current.type === 'multiple_choice'
                    ? isCorrect
                      ? 'Correcto'
                      : 'Revisá este punto'
                    : 'Respuesta esperada'}
                </p>
                <p className="text-foreground mt-2 text-[13.5px] leading-6">
                  <span className="font-semibold">Respuesta:</span> {current.answer}
                </p>
                <p className="text-muted-foreground mt-2 text-[13px] leading-5">
                  {current.explanation}
                </p>
                <p className="text-muted-foreground mt-3 text-[11.5px] font-medium">
                  Fuente: {sourceLabel(current)}
                </p>
              </section>

              {current.type === 'open' ? (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-foreground text-[13px] font-semibold">
                    Compará tu respuesta con la esperada. ¿Cómo te fue?
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenAssessments((items) => ({ ...items, [current.id]: 'got_it' }))
                      }
                      className={cn(
                        'min-h-10 rounded-lg border px-3 py-2 text-sm font-semibold transition',
                        openAssessment === 'got_it'
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : 'border-border bg-card text-foreground hover:border-emerald-300'
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
                        'min-h-10 rounded-lg border px-3 py-2 text-sm font-semibold transition',
                        openAssessment === 'review'
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-border bg-card text-foreground hover:border-amber-300'
                      )}
                    >
                      Necesito repasar
                    </button>
                  </div>
                </div>
              ) : null}

              {saveError && (
                <div role="alert" className="border-destructive/30 bg-destructive/5 space-y-3 rounded-xl border p-4">
                  <p className="text-destructive text-sm">{saveError}</p>
                  {canRestoreAfterRefresh && (
                    <button
                      type="button"
                      className="text-primary min-h-10 text-sm font-semibold underline underline-offset-4"
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('tab', 'ejercicios');
                        if (topicSectionIndex !== undefined) {
                          url.searchParams.set('studyTopic', String(topicSectionIndex));
                        } else {
                          url.searchParams.delete('studyTopic');
                        }
                        window.location.assign(url.toString());
                      }}
                    >
                      Actualizar y retomar mi respuesta
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </article>
        <div data-pdf-question-actions className={pdfStudyQuestionActionsClassName}>
          {!isRevealed ? (
            <Button
              type="button"
              disabled={current.type === 'multiple_choice' && !selectedAnswer}
              onClick={() => {
                setRevealed((items) => ({ ...items, [current.id]: true }));
                if (current.type === 'multiple_choice' && !isCorrect && window.matchMedia('(max-width: 767px)').matches) {
                  requestAnimationFrame(() => {
                    correctionRef.current?.scrollIntoView({
                      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                      block: 'nearest',
                    });
                  });
                }
              }}
              className="h-11 rounded-lg px-5"
            >
              {current.type === 'multiple_choice'
                ? 'Comprobar respuesta'
                : 'Ver respuesta esperada'}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canAdvance || isRecordingError}
              onClick={() => void goNext()}
              className="h-11 rounded-lg px-5"
            >
              {currentIndex === questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
