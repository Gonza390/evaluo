'use client';

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { examUiText } from '@/lib/i18n/exam-ui-copy';
import '@/components/dashboard/practice-motion.css';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, CircleAlert, RotateCcw, Sparkles, Layers3, BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pdfStudyQuestionActionsClassName } from '@/components/study/pdf-study-styles';
import type { PedagogicalArtifacts, StudyQuestion } from '@/lib/student-materials/pedagogy';
import { cn } from '@/lib/utils';
import type { TopicPracticeOutcome } from '@/lib/student-materials/topic-practice-feedback';
import { recordStudentMaterialStudyResultAction } from '@/lib/actions/study-errors';
import { AnswerFeedback } from '@/components/study/answer-feedback';
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
  shuffleStudyQuestionOptions,
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
import type { StudySummarySection, StudyGlossaryItem } from '@/lib/student-materials/types';
import { buildGroundedErrorContrast } from '@/lib/student-materials/error-contrast';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import { isReliableTopicQuestion, MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS } from '@/lib/student-materials/question-bank';
import {
  buildPracticeTopicResults,
  visiblePracticeTopicResults,
  getPracticeTopicPerformance,
} from '@/lib/student-materials/practice-result-topics';
import { practiceScope, type PracticeEntrySource } from '@/lib/student-materials/practice-entry';
import { premiumUpgradeForLimit } from '@/lib/premium-flow';
import { FreePracticeLimitScreen } from '@/components/dashboard/free-practice-limit-screen';
import {
  topicPracticeResultActions,
  type TopicPracticeResultAction,
} from '@/lib/student-materials/topic-practice-result-actions';
import {
  practiceBankSignature,
  practiceDraftKey,
  readPracticeDraft,
  type PracticeDraft,
} from '@/lib/student-materials/practice-session';

type StudentMaterialExamProps = {
  /** Fuente de la navegación; no equivale al inicio real de las preguntas. */
  entrySource?: PracticeEntrySource;
  entryId?: string | null;
  artifacts: PedagogicalArtifacts;
  materialId: string;
  materialTitle?: string;
  freeStudyV2?: boolean;
  onComplete?: () => void;
  /** Entrega el resultado de la tanda al contenedor para reutilizar la vista de Progreso. */
  onTopicFinished?: (outcome: TopicPracticeOutcome) => void;
  onContinueToTopic?: (index: number) => void;
  onStudyNextTopic?: (index: number) => void;
  onViewAllTopics?: () => void;
  onReturnToTopic?: (reinforce: boolean, outcome?: TopicPracticeOutcome) => void;
  sections?: StudySummarySection[];
  glossary?: StudyGlossaryItem[];
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
  materialTitle,
  freeStudyV2 = false,
  entrySource = 'direct_tab',
  entryId = null,
  onComplete,
  onTopicFinished,
  onContinueToTopic,
  onStudyNextTopic,
  onViewAllTopics,
  onReturnToTopic,
  sections = [],
  glossary = [],
  simulation,
  topicSectionIndex,
}: StudentMaterialExamProps) {
  const locale = useOptionalAppLocale();
  const english = locale === 'en';
  const tr = (es:string,en:string)=>english?en:es;
  const t = (value: string) => examUiText(locale, value);
  const router = useRouter();
  const [tomorrowStatus, setTomorrowStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const topicTitle =
    topicSectionIndex === undefined ? undefined : sections[topicSectionIndex]?.title;
  const draftStorageKey =
    practiceDraftKey(materialId) +
    (topicSectionIndex === undefined ? '' : `:topic:${topicSectionIndex}`);
  const supplementalCacheKey = 'evaluo:topic-practice-source:v1:' + materialId +
    ':' + (topicSectionIndex ?? 'global');
  const [supplementalBankLoadedFor, setSupplementalBankLoadedFor] = useState<string | null>(null);
  const [supplementalQuestions, setSupplementalQuestions] = useState<StudyQuestion[]>([]);
  const [topicGenerationUnavailable, setTopicGenerationUnavailable] = useState(false);
  const [freeQuotaReached, setFreeQuotaReached] = useState(false);
  const eligibleQuestions = useMemo(
    () =>
      getDistinctEligibleExamQuestions([...artifacts.questions,...supplementalQuestions]).filter(
        (question) =>
          topicSectionIndex === undefined ||
          (question.type === 'multiple_choice' &&
            findSummarySectionForQuestion(question, sections) === topicSectionIndex)
      ),
    [artifacts.questions, supplementalQuestions, sections, topicSectionIndex]
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
  const verifiedTopicCount = useMemo(() =>
    topicSectionIndex === undefined ? 0 :
      getDistinctEligibleExamQuestions(eligibleQuestions.filter(isReliableTopicQuestion)).length,
    [eligibleQuestions,topicSectionIndex]
  );
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
  // Congelar la fuente al comenzar: cambiar de pestaña no altera
  // el origen de una práctica que ya está en marcha.
  const attemptEntryRef = useRef<{ source: PracticeEntrySource; id: string | null }>({
    source: entrySource,
    id: entryId,
  });
  const savedAnswerIdsRef = useRef<string[]>([]);
  const [nextObjective, setNextObjective] = useState<NextStudyObjective | null>(null);
  const [objectiveStatus, setObjectiveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  // Descartar respuestas tardías cuando se reinicia una tanda o se reintenta el guardado.
  const objectiveRequestRef = useRef(0);
  const correctionRef = useRef<HTMLElement | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [openDrafts, setOpenDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const preclaimedFreeQuestionIds = useRef<Set<string>>(new Set());
  const [freeClaimPending, setFreeClaimPending] = useState(false);
  const [freeQuotaMessage, setFreeQuotaMessage] = useState('');
  const [openAssessments, setOpenAssessments] = useState<Record<string, OpenAssessment>>({});
  const [finished, setFinished] = useState(false);
  const finalResultRef = useRef<HTMLDivElement | null>(null);
  const [savedDraft, setSavedDraft] = useState<PracticeDraft | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const isSimulation = Boolean(simulation);

  // El panel de ejercicios tiene scroll propio. Al finalizar, mostrar el resultado
  // desde arriba aunque la última pregunta haya dejado el scroll al pie del panel.
  useEffect(() => {
    if (!finished || topicSectionIndex !== undefined || isSimulation) return;
    finalResultRef.current?.closest<HTMLElement>(
      '[role="region"][aria-label="Contenido de estudio"]'
    )?.scrollTo({ top: 0, behavior: 'instant' });
  }, [finished, topicSectionIndex, isSimulation]);

  // Keep server-verified supplemental questions across page refreshes in this
  // tab, so an interrupted attempt can still resolve its saved question IDs.
  // Never place PDF excerpts in persistent localStorage.
  useEffect(() => {
    // A new topic must never reuse another topic's generated answer bank or
    // draft readiness. Changing the same section object does not reset it.
    setDraftLoaded(false);
    topicAutoStartRequested.current = false;
    if (topicSectionIndex === undefined || isSimulation) {
      setSupplementalQuestions([]);
      setSupplementalBankLoadedFor(supplementalCacheKey);
      return;
    }
    let recovered:StudyQuestion[]=[];
    try {
      const raw = window.sessionStorage.getItem(supplementalCacheKey);
      if (raw) {
        const parsed:unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && topicTitle) {
          recovered = getDistinctEligibleExamQuestions(parsed as StudyQuestion[])
            .filter(q => q.chapterTitle === topicTitle && isReliableTopicQuestion(q))
            .slice(0,24);
        }
      }
    } catch {
      // Session storage may be disabled. The practice remains usable.
    }
    setSupplementalQuestions(recovered);
    setSupplementalBankLoadedFor(supplementalCacheKey);
  }, [topicSectionIndex, isSimulation, supplementalCacheKey, topicTitle]);

  const bankSignature = useMemo(
    () => practiceBankSignature(eligibleQuestions),
    [eligibleQuestions]
  );

  useEffect(() => {
    if (supplementalBankLoadedFor !== supplementalCacheKey) return;
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
  }, [materialId, bankSignature, eligibleQuestions, isSimulation, draftStorageKey, supplementalBankLoadedFor, supplementalCacheKey]);

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
      entrySource: attemptEntryRef.current.source,
      entryId: attemptEntryRef.current.id,
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
    attemptEntryRef.current = {
      source: savedDraft.entrySource ?? 'resumed_draft',
      id: savedDraft.entryId ?? null,
    };
    savedAnswerIdsRef.current = [...(savedDraft.savedAnswerIds ?? [])];
    setQuestions(frozen.map(question => shuffleStudyQuestionOptions(question, sessionIdRef.current!)));
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

  const clearAttempt = (newSessionId = crypto.randomUUID()) => {
    answerIds.current = {};
    preclaimedFreeQuestionIds.current.clear();
    sessionIdRef.current = newSessionId;
    savedAnswerIdsRef.current = [];
    objectiveRequestRef.current += 1;
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

  const startExam = async (sizeOverride?: number) => {
    if (preparing) return;
    const practiceSize = sizeOverride ?? selectedSize ?? defaultSize;
    setPreparing(true);
    setTopicGenerationUnavailable(false);
    setFreeQuotaMessage('');
    setFreeQuotaReached(false);
    let pool=eligibleQuestions;
    if (topicSectionIndex !== undefined && !simulation &&
        verifiedTopicCount < MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS) {
      const additions:StudyQuestion[]=[];
      // The student explicitly opened Practicar for this topic. Do not
      // consume AI during PDF ingestion or for already complete topics.
      for(let round=0;round<2 &&
        getDistinctEligibleExamQuestions([...pool,...additions].filter(isReliableTopicQuestion)).length <
          MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS;round++){
        try {
          const response=await fetch('/api/practice/topic-supplement',{
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({
              materialId,topicIndex:topicSectionIndex,round,
              previous:[...pool,...additions].map(q=>q.prompt).slice(0,30),
            }),
            signal:AbortSignal.timeout(65000),
          });
          if(!response.ok) {setTopicGenerationUnavailable(true);break;}
          const data:unknown=await response.json();
          if(!data||typeof data!=='object'||!('questions'in data)||
            !Array.isArray(data.questions)) {setTopicGenerationUnavailable(true);break;}
          const incoming=getDistinctEligibleExamQuestions(data.questions as StudyQuestion[])
            .filter(q=>q.chapterTitle===sections[topicSectionIndex]?.title);
          if(incoming.length===0) {setTopicGenerationUnavailable(true);break;}
          additions.push(...incoming);
        }catch{
          setTopicGenerationUnavailable(true);
          break;
        }
      }
      if(additions.length){
        const merged=getDistinctEligibleExamQuestions([...supplementalQuestions,...additions]);
        setSupplementalQuestions(merged);
        try {
          window.sessionStorage.setItem(supplementalCacheKey,JSON.stringify(merged.slice(0,24)));
        } catch {
          // Private browsing or quota exhaustion must not block practice.
        }
        pool=getDistinctEligibleExamQuestions([...pool,...additions]);
      }
    }
    const context =
      simulation?.context ??
      (await getStudentMaterialPracticeContextAction(materialId).catch(() => ({
        ...emptyTopicPracticeContext,
        loadError: true,
      })));
    const nextQuestions = selectTopicPracticeQuestions({
      questions: freeStudyV2 && !simulation
        ? pool.filter(question => question.type === 'multiple_choice') : pool,
      preferredQuestionIds,
      targetCount: topicSectionIndex === undefined ? practiceSize || defaultSize :
        topicPracticeQuestionCount(pool.length),
      complete:
        topicSectionIndex === undefined &&
        sizeOptions.find((option) => option.count === (practiceSize || defaultSize))?.mode ===
          'complete',
      sections,
      context,
      unansweredOnly: topicSectionIndex !== undefined,
    });
    // Free: the complete batch is server-verified and reserved before the first
    // answer is shown. The final remaining credit may yield a shorter session.
    // Previously unlocked questions can still be repeated without new credits.
    let accessibleQuestions = nextQuestions;
    let approvedFreeIds: string[] = [];
    if (freeStudyV2 && !simulation && nextQuestions.length) {
      const choices = getDistinctEligibleExamQuestions(pool)
        .filter(question => question.type === 'multiple_choice');
      const byId = new Map(choices.map(question => [question.id, question]));
      const candidateIds = [...new Set([...nextQuestions, ...choices].map(question => question.id))]
        .slice(0, 300);
      try {
        const response = await fetch('/api/free-study-v2/practice-session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialId, questionIds: candidateIds,
            maxQuestions: Math.min(MAX_TOPIC_PRACTICE_QUESTIONS, nextQuestions.length),
          }),
        });
        const data: unknown = await response.json();
        if (!response.ok || !data || typeof data !== 'object' ||
          !('questionIds' in data) || !Array.isArray(data.questionIds) ||
          !data.questionIds.every((id: unknown) => typeof id === 'string') ||
          !('exhausted' in data) || typeof data.exhausted !== 'boolean')
          throw new Error('reservation_unavailable');
        approvedFreeIds = data.questionIds as string[];
        accessibleQuestions = approvedFreeIds.flatMap(id => {
          const question = byId.get(id);
          return question ? [question] : [];
        });
        if (!accessibleQuestions.length && data.exhausted) {
          setFreeQuotaReached(true);
          setPreparing(false);
          return;
        }
      } catch {
        setFreeQuotaMessage(tr('No pudimos verificar las preguntas disponibles. Reintentá para continuar.','We could not verify available questions. Please retry to continue.'));
        setPreparing(false);
        return;
      }
    }
    if (!accessibleQuestions.length) {
      setTopicGenerationUnavailable(true);
      setPreparing(false);
      return;
    }
    const nextSessionId = crypto.randomUUID();
    clearAttempt(nextSessionId);
    preclaimedFreeQuestionIds.current = new Set(approvedFreeIds);
    setQuestions(accessibleQuestions.map(question => shuffleStudyQuestionOptions(question, nextSessionId)));
    setContextUnavailable(Boolean(context.loadError));
    setSavedDraft(null);
    attemptEntryRef.current = { source: entrySource, id: entryId };
    setStarted(true);
    setPreparing(false);
    if (!simulation)
      void trackClientAnalyticsEvent({
        eventName: 'student_material_exam_started',
        metadata: {
          material_id: materialId,
          question_count: nextQuestions.length,
          practice_scope: practiceScope(topicSectionIndex),
          entry_source: attemptEntryRef.current.source,
          entry_id: attemptEntryRef.current.id,
          attempt_id: sessionIdRef.current,
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
      supplementalBankLoadedFor !== supplementalCacheKey ||
      savedDraft ||
      started ||
      preparing ||
      topicAutoStartRequested.current
    ) return;
    topicAutoStartRequested.current = true;
    startTopicPractice();
  }, [topicSectionIndex, draftLoaded, supplementalBankLoadedFor, supplementalCacheKey, savedDraft, started, preparing, eligibleQuestions.length]);

  // Reuse the user's centered HTML only after the API has actually denied a
  // verified Free question. In particular, a 503, network error, or a short
  // pedagogical question bank must NOT be represented as a quota exhaustion.
  if (freeStudyV2 && freeQuotaReached && !simulation) {
    const practicePath = '/materiales/' + materialId + '?tab=ejercicios' +
      (topicSectionIndex !== undefined ? '&studyTopic=' + topicSectionIndex : '');
    const backPath = topicSectionIndex !== undefined
      ? '/materiales/' + materialId + '?tab=resumen&studyTopic=' + topicSectionIndex
      : '/materiales/' + materialId + '?tab=ejercicios';
    return <FreePracticeLimitScreen
      kind="multiple_choice"
      materialTitle={materialTitle}
      topicLabel={topicTitle}
      premiumHref={premiumUpgradeForLimit('multiple_choice', {
        materialId, returnTo:practicePath,
      }).href}
      backHref={backPath}
      backLabel={t(topicSectionIndex !== undefined ? 'Volver al tema' : 'Volver a la práctica')}
      onBack={() => {
        setFreeQuotaReached(false);
        if (topicSectionIndex !== undefined) {
          if (onReturnToTopic) onReturnToTopic(false);
          else router.push(backPath);
        } else resetExam();
      }}
    />;
  }

  if ((eligibleQuestions.length === 0 || sizeOptions.length === 0) && !preparing) {
    return (
      <div className="border-border border-y py-10 text-center">
        <p className="text-foreground text-sm font-medium">
          {t(topicSectionIndex !== undefined ? 'Preparación de práctica' : 'Todavía no hay preguntas suficientes')}
        </p>
        <p className="text-muted-foreground mt-1 text-[13px] leading-5">
          {topicSectionIndex === undefined
            ? t('El PDF necesita más contenido estructurado para armar una práctica útil.')
            : t('Estamos intentando crear ejercicios desde las fuentes del tema. Si no se pudieron verificar, podés estudiar el resumen y volver a intentar.')}
        </p>
        {topicSectionIndex !== undefined && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button type="button" onClick={() => void startExam()}>
              {t("Generar práctica con IA")}
            </Button>
            {onReturnToTopic && (
              <button type="button" onClick={() => onReturnToTopic(false)}
                className="text-primary text-sm underline">{t("Volver al tema")}</button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (preparing && topicSectionIndex !== undefined && !started) {
    return (
      <div className="mx-auto max-w-[940px] space-y-2 px-2 py-8" role="status">
        <p className="text-foreground text-sm font-medium">{t("Preparando la práctica de este tema…")}</p>
        <p className="text-muted-foreground text-xs">
          Estamos seleccionando y verificando preguntas a partir del material.
        </p>
      </div>
    );
  }

  if (!started && topicSectionIndex !== undefined) {
    return (
      <div className="mx-auto w-full max-w-[940px] space-y-3 px-1 py-2 sm:px-2">
        {onReturnToTopic && (
          <button
            type="button"
            onClick={() => onReturnToTopic(false)}
            className="text-primary min-h-11 text-sm font-medium"
          >
            {t("Volver al tema")}
          </button>
        )}
        <div className="border-border border-b pb-4">
          <p className="text-primary text-[11px] font-medium tracking-[0.14em] uppercase">
            {t("Práctica de este tema")}
          </p>
          <h2 className="text-foreground mt-2 text-xl font-semibold">
            {topicTitle}
          </h2>
        </div>
        {topicGenerationUnavailable && topicSectionIndex !== undefined && (
          <p role="status" className="text-muted-foreground text-xs leading-5">
            {t("No pudimos verificar más ejercicios de este tema ahora. Seguís practicando con las preguntas disponibles.")}
          </p>
        )}
        {verifiedTopicCount < MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS && (
          <p role="status" className="text-muted-foreground text-xs leading-5">
            {tr('Este tema tiene','This topic has')} {verifiedTopicCount} {tr('de','of')} {MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS} {tr('preguntas verificadas. Podés practicar con las disponibles; no agregamos respuestas sin respaldo.','verified questions. You can practice with the available ones; we do not add unsupported answers.')}
          </p>
        )}
        {savedDraft && !isSimulation ? (
          <div className="border-primary/30 bg-primary/5 rounded-xl border p-4">
            <p className="text-sm font-medium">{t("Tenés una práctica sin terminar")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {tr('Retomá desde la pregunta','Resume from question')} {savedDraft.currentIndex + 1} {tr('de','of')} {savedDraft.questionIds.length}.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button type="button" onClick={resumeExam}>{t("Continuar donde quedé")} <ArrowRight className="h-4 w-4" /></Button>
              <button type="button" onClick={discardSavedDraft} className="text-muted-foreground min-h-11 text-xs font-medium underline">
                {t("Empezar una práctica nueva")}
              </button>
            </div>
          </div>
        ) : freeQuotaMessage ? (
          <div role="alert" className="border-border rounded-xl border p-4">
            <p className="text-sm text-slate-700">{freeQuotaMessage}</p>
            <Button type="button" className="mt-3" onClick={() => void startExam()}>
              {t("Reintentar práctica")}
            </Button>
          </div>
        ) : (
          <p role="status" className="text-muted-foreground text-sm">
            {t(preparing ? 'Preparando tus preguntas…' : 'Abriendo la práctica…')}
          </p>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className={cn("w-full max-w-[940px] px-1 py-2 sm:px-2 sm:py-3", topicSectionIndex !== undefined && "mx-auto")}>
        {topicSectionIndex !== undefined && onReturnToTopic && (
          <button
            type="button"
            onClick={() => onReturnToTopic(false)}
            className="text-primary mb-3 min-h-11 text-sm font-medium"
          >
            {tr('Volver al contenido del tema','Back to topic content')}
          </button>
        )}
        <header className="border-border border-b pb-4">
          {topicSectionIndex !== undefined && (
            <p className="text-primary text-[11px] font-medium tracking-[0.15em] uppercase">
              {t("Práctica de este tema")}
            </p>
          )}
          <h2 className={cn('text-foreground text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px]', topicSectionIndex !== undefined && 'mt-2')}>
            {topicTitle ?? t('Elegí cuánto querés practicar')}
          </h2>
        </header>

        {topicSectionIndex === undefined &&
          sections.length > 0 &&
          assessedSections < sections.length && (
            <p className="text-muted-foreground mt-4 text-xs leading-5" role="status">
              {tr('El banco tiene preguntas autocorregibles asociadas a','The question bank has auto-gradable questions for')} {assessedSections} {tr('de','of')}{' '}
              {sections.length} {tr('capítulos del resumen. Los demás no se consideran evaluados, incluso en el modo Completo.','summary chapters. Other chapters are not considered assessed, even in Complete mode.')}
            </p>
          )}

        {savedDraft && !isSimulation && (
          <div className="border-primary/30 bg-primary/5 mt-5 rounded-xl border px-4 py-4">
            <p className="text-foreground text-sm font-medium">{t("Tenés una práctica sin terminar")}</p>
            <p className="text-muted-foreground mt-1 text-[13px]">
              {tr('Retomá desde la pregunta','Resume from question')} {savedDraft.currentIndex + 1} {tr('de','of')}{' '}
              {savedDraft.questionIds.length}. {tr('Tus respuestas anteriores siguen guardadas en este navegador.','Your previous answers remain saved in this browser.')}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={resumeExam} className="h-10 rounded-lg">
                {t("Continuar donde quedé")} <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={discardSavedDraft}
                className="text-muted-foreground hover:text-foreground text-xs font-medium underline"
              >
                {t("Descartar práctica guardada")}
              </button>
            </div>
          </div>
        )}

        <div data-onboarding-practice-options className="grid w-full max-w-[720px] grid-cols-3 gap-2 py-3 sm:gap-3 sm:py-4">
          {sizeOptions.map((option, index) => {
            const Icon = index === 0 ? Sparkles : index === 1 ? Layers3 : BookOpenCheck;
            const tones = [
              'bg-[#F3F0FF] text-[#6452A8] border-[#E8E0FA]',
              'bg-[#E8F5F8] text-[#27798C] border-[#D7EBF0]',
              'bg-[#EBF5EB] text-[#39794D] border-[#D7E8D8]',
            ];
            return (
              <button
                key={option.count}
                type="button"
                disabled={preparing}
                onClick={() => { setSelectedSize(option.count); void startExam(option.count); }}
                className={cn(
                  'group relative flex min-h-[116px] min-w-0 flex-col items-start rounded-[14px] border p-2.5 text-left transition-[border-color,box-shadow,transform] duration-150 sm:min-h-[138px] sm:p-3 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-reduce:transition-none motion-reduce:active:scale-100',
                  tones[index % tones.length],
                  preparing && 'cursor-wait opacity-70'
                )}
              >
                <div className="flex w-full items-start justify-between gap-1">
                  <Icon className="size-[17px] shrink-0 opacity-85" aria-hidden="true" />

                </div>
                <div className="mt-auto min-w-0 pt-3 sm:pt-4">
                  <p className="break-words text-[12px] font-semibold leading-[1.4] sm:text-[14px] sm:leading-5">
                    {option.label}
                  </p>
                  <p className="mt-1 text-[11px] font-medium opacity-90 sm:text-[12px]">
                    {option.count} {option.count === 1 ? tr('pregunta','question') : tr('preguntas','questions')}
                  </p>
                  <p className="mt-1 hidden text-[11px] leading-[1.4] opacity-80 sm:block">
                    {topicSectionIndex === undefined
                      ? option.description
                      : option.mode === 'complete'
                        ? tr('Respondé todas las preguntas disponibles de este tema.','Answer all available questions for this topic.')
                        : tr('Respondé una selección de preguntas de este tema.','Answer a selection of questions for this topic.')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {freeQuotaMessage && freeStudyV2 ? (
        <p role="alert" className="mb-3 text-sm text-amber-700">{freeQuotaMessage}</p>
      ) : null}
      {freeQuotaReached && freeStudyV2 ? (
        <p role="status" className="mb-3 text-sm text-slate-600">
          {t("Llegaste al límite de preguntas nuevas del plan gratuito. Podés repasar las que ya desbloqueaste.")}
        </p>
      ) : null}

      </div>
    );
  }

  const persistNextObjective = () => {
    if (isSimulation) return;
    if (!sessionIdRef.current || savedAnswerIdsRef.current.length !== questions.length) {
      setObjectiveStatus('error');
      return;
    }
    const requestId = ++objectiveRequestRef.current;
    setObjectiveStatus('saving');
    // El próximo objetivo es opcional: un servidor lento no debe dejar el
    // resultado esperando indefinidamente. El intento es idempotente y reintentable.
    let timer: number | undefined;
    const timeout = new Promise<{ success: false }>((resolve) => {
      timer = window.setTimeout(() => resolve({ success: false }), 15_000);
    });
    void Promise.race([
      saveNextStudyObjectiveAction({
        materialId,
        sessionId: sessionIdRef.current,
        answerIds: [...savedAnswerIdsRef.current],
      }),
      timeout,
    ]).then((response) => {
      if (objectiveRequestRef.current !== requestId) return;
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
    }).catch(() => {
      if (objectiveRequestRef.current === requestId) setObjectiveStatus('error');
    }).finally(() => {
      if (timer !== undefined) window.clearTimeout(timer);
    });
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

    // La práctica POR TEMA (real o demo) conserva su pantalla final diseñada:
    // sin próximos objetivos visibles y con acciones según errores y tema siguiente.
    // No modifica ni el resultado GENERAL del PDF ni el simulador público.
    if (topicSectionIndex !== undefined) {
      const hasErrors = result.wrong.length > 0;
      const nextTopicIndex = topicSectionIndex + 1 < sections.length ? topicSectionIndex + 1 : null;
      const [primaryAction, secondaryAction] = topicPracticeResultActions(
        hasErrors, nextTopicIndex !== null
      );
      const actionLabel: Record<TopicPracticeResultAction, string> = {
        reinforce: 'Reforzar mis errores',
        next_topic: 'Seguir al siguiente tema',
        all_topics: 'Ver todos mis temas',
        retry: 'Practicar de nuevo',
      };
      const handleResultAction = (action: TopicPracticeResultAction) => {
        void trackClientAnalyticsEvent({
          eventName: 'cta_click',
          metadata: {
            location: 'topic_practice_result',
            cta_name: action,
            material_id: materialId,
            topic_section_index: topicSectionIndex,
          },
        });
        if (action === 'retry') {
          resetExam();
        } else if (action === 'reinforce') {
          if (onReturnToTopic) {
            onReturnToTopic(true, {
              sectionIndex: topicSectionIndex,
              total: result.total,
              correct: result.correct,
              incorrect: result.wrong.length,
              incorrectPrompts: result.wrong.map((question) => question.prompt),
            });
          } else {
            router.push(`/dashboard/explicaciones?material=${encodeURIComponent(materialId)}`);
          }
        } else if (action === 'next_topic' && nextTopicIndex !== null) {
          if (onStudyNextTopic) onStudyNextTopic(nextTopicIndex);
          else router.push(`/materiales/${encodeURIComponent(materialId)}?tab=progreso`);
        } else if (action === 'all_topics') {
          if (onViewAllTopics) onViewAllTopics();
          else router.push(`/materiales/${encodeURIComponent(materialId)}?tab=progreso`);
        }
      };

      return (
        <div ref={finalResultRef} className="practice-screen-enter mx-auto w-full max-w-[640px] px-2 py-3 sm:px-3 sm:py-4">
          <div className="border-border bg-card rounded-xl border px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col items-center text-center">
              <p className="text-primary text-[11px] font-medium tracking-[0.13em] uppercase">
                {tr('Práctica finalizada','Practice finished')}{topicTitle ? ` · ${topicTitle}` : ''}
              </p>
              <h2
                className="text-foreground mt-3 text-[24px] font-semibold tracking-[-0.04em] sm:text-[28px]"
                aria-label={english ? `Result: ${result.correct} of ${result.total}` : `Resultado: ${result.correct} de ${result.total}`}
              >
                {result.correct} {tr('de','of')} {result.total}
              </h2>
            </div>

            <div className="border-border mt-4 border-t pt-4 text-center">
              <h3 className="text-foreground text-[19px] leading-[1.3] font-semibold tracking-tight sm:text-[20px]">
                {t(hasErrors ? 'Detectamos qué necesitás reforzar' : '¡Excelente! Respondiste todo correctamente')}
              </h3>
              <p className="text-muted-foreground mx-auto mt-2 max-w-md text-[13px] leading-5">
                {hasErrors
                  ? result.wrong.length === 1
                    ? tr('Encontramos una dificultad en tus respuestas. Vamos a trabajarla para comprobar si la superaste.','We found one difficulty in your answers. Review it and check your understanding.')
                    : tr('Identificamos dificultades en tus respuestas. Vamos a reforzarlas y comprobar si las superaste.','We found difficulties in your answers. Review them and check your understanding.')
                  : tr('No detectamos dificultades en esta práctica. Podés seguir avanzando.','No difficulties detected in this practice session. You can continue studying.')}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                className="min-h-11 w-full rounded-lg text-[13px] font-medium"
                onClick={() => handleResultAction(primaryAction)}
              >
                {actionLabel[primaryAction]} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-lg text-[13px] font-medium"
                onClick={() => handleResultAction(secondaryAction)}
              >
                {secondaryAction === 'retry' ? <RotateCcw className="mr-1 h-4 w-4" /> : null}
                {actionLabel[secondaryAction]}
                {secondaryAction !== 'retry' ? <ArrowRight className="ml-1 h-4 w-4" /> : null}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Mostrar el desglose por temas únicamente al terminar la práctica GENERAL del PDF.
    // El simulador conserva su resultado anterior.
    if (!isSimulation && topicSectionIndex === undefined) {
      const nextStepTitle =
        nextObjective?.kind === 'reinforce'
          ? `${tr('Reforzar','Review')} ${nextObjective.topicTitle || tr('mis errores','my mistakes')}`
          : nextObjective?.kind === 'practice'
            ? `${tr('Practicar','Practice')} ${nextObjective.topicTitle || tr('el próximo tema','the next topic')}`
            : tr(tr('Consolidar lo aprendido','Consolidate what you learned'),'Consolidate what you learned');

      // Acertar toda una tanda no significa haber recorrido todas las preguntas del tema.
      // Los totales del banco se calculan SOLO sobre preguntas elegibles y verificables.
      const topicName = (question: StudyQuestion) => {
        const sectionIndex = findSummarySectionForQuestion(question, sections);
        return (
          (sectionIndex >= 0 ? sections[sectionIndex]?.title : undefined) ||
          question.chapterTitle ||
          question.topic ||
          question.reference.sectionTitle ||
          tr('Tema sin capítulo identificado','Topic without a chapter')
        ).trim();
      };
      const bankCounts = new Map<string, number>();
      for (const question of eligibleQuestions) {
        const topic = topicName(question);
        bankCounts.set(topic, (bankCounts.get(topic) ?? 0) + 1);
      }
      // Mismo criterio que el resultado global: incluye preguntas abiertas
      // autoevaluadas y evita discrepancias entre 1/5 y las filas por tema.
      const wrongIds = new Set(result.wrong.map((question) => question.id));
      const topicResults = buildPracticeTopicResults(
        questions,
        topicName,
        (question) => !wrongIds.has(question.id),
        bankCounts
      );
      const visibleTopics = visiblePracticeTopicResults(topicResults);
      const wrongAnswers = questions.filter((question) =>
        question.type === 'multiple_choice'
          ? normalizeAnswer(selectedAnswers[question.id] ?? '') !== normalizeAnswer(question.answer)
          : openAssessments[question.id] === 'review'
      );
      const hasOpenQuestions = questions.some((question) => question.type === 'open');
      const isQuestionCorrect = (question: StudyQuestion) =>
        question.type === 'multiple_choice'
          ? normalizeAnswer(selectedAnswers[question.id] ?? '') === normalizeAnswer(question.answer)
          : openAssessments[question.id] === 'got_it';

      return (
        <div ref={finalResultRef} className="@container/practice-result mx-auto w-full max-w-[1240px] px-1 py-2 sm:px-2 sm:py-3">
          <div className="grid min-w-0 grid-cols-1 gap-3 @min-[660px]/practice-result:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] @min-[1040px]/practice-result:grid-cols-[minmax(165px,0.7fr)_minmax(0,1.2fr)_minmax(290px,1fr)] @min-[1040px]/practice-result:gap-4">
          <header className="border-border bg-card flex min-w-0 flex-col items-center justify-center rounded-xl border px-3 py-4 text-center @min-[660px]/practice-result:col-start-1 @min-[1040px]/practice-result:col-auto @min-[1040px]/practice-result:min-h-[210px]">
            <p className="text-primary text-xs font-semibold tracking-[0.12em] uppercase">
              {t("Práctica terminada")}
            </p>
            <h2 className="text-foreground mt-3 text-[24px] font-semibold tracking-[-0.04em] sm:text-[28px]">
              {result.correct} <span className="text-muted-foreground/45">/ {result.total}</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              respuestas correctas
            </p>
          </header>

          <section className="border-border bg-card min-w-0 rounded-xl border p-3.5 sm:p-4 @min-[660px]/practice-result:col-start-1 @min-[1040px]/practice-result:col-auto">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-foreground text-sm font-medium">{t("Así te fue por tema")}</h3>
              <span className="text-muted-foreground text-xs">
                {topicResults.length} {topicResults.length === 1 ? 'tema evaluado' : 'temas evaluados'}
              </span>
            </div>
            {topicResults.length ? (
              <div className="space-y-3.5">
                {visibleTopics.map((topic) => {
                  const performance = getPracticeTopicPerformance(topic.correct, topic.total);
                  return (
                    <div key={topic.title} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="text-foreground min-w-0 flex-1 text-sm font-medium">{topic.title}</span>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold tabular-nums ${performance.badgeClass}`}>
                          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${performance.indicatorClass}`} />
                          {topic.correct}/{topic.total} · {performance.label}
                        </span>
                      </div>
                      <div
                        className={`${performance.trackClass} relative h-2.5 overflow-hidden rounded-full`}
                        role="progressbar"
                        aria-label={english ? `Correct answers in ${topic.title}: ${performance.percentage}%, ${performance.label}` : `Aciertos en ${topic.title}: ${performance.percentage}%, ${performance.label}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={performance.percentage}
                      >
                        <div className={`h-full rounded-full ${performance.fillClass}`} style={{ width: `${performance.percentage}%` }} />
                        {performance.percentage === 0 && (
                          <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 rounded-full ${performance.zeroMarkerClass}`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("Esta tanda no incluyó preguntas de opción múltiple asociadas a temas.")}
              </p>
            )}
            {topicResults.length > visibleTopics.length && (
              <p className="text-muted-foreground mt-3 text-xs">
                {topicResults.length - visibleTopics.length} {tr('temas más en «Ver todos los detalles».','more topics in “View all details”.')}
              </p>
            )}
            <p className="text-muted-foreground mt-4 text-xs">
              {tr('Aciertos en esta tanda, no dominio definitivo de los temas.','This session reflects correct answers, not definitive mastery of topics.')}
              {hasOpenQuestions ? tr(' Las respuestas abiertas fueron autoevaluadas.',' Written answers were self-assessed.') : ''}
            </p>
            <Link
              href={`/materiales/${materialId}?tab=progreso`}
              onClick={() => {
                void trackClientAnalyticsEvent({
                  eventName: 'cta_click',
                  metadata: {
                    location: 'practice_result',
                    cta_name: 'view_pdf_progress',
                    destination: 'pdf_progress',
                  },
                });
              }}
              className="text-primary mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              {tr('Ver mi progreso','View my progress')} <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <div className="border-border bg-card flex min-w-0 flex-col rounded-xl border p-3.5 sm:p-4 @min-[660px]/practice-result:col-start-2 @min-[660px]/practice-result:row-span-2 @min-[660px]/practice-result:row-start-1 @min-[1040px]/practice-result:col-start-3 @min-[1040px]/practice-result:row-span-1">
          <section aria-live="polite">
            <p className="text-primary text-[11px] font-medium tracking-[0.12em] uppercase">
              {t("Tu próximo paso")}
            </p>
            {objectiveStatus === 'saving' || objectiveStatus === 'idle' ? (
              <p className="text-muted-foreground mt-3 text-sm">
                {t("Preparando tu próximo repaso…")}
              </p>
            ) : objectiveStatus === 'saved' && nextObjective ? (
              <>
                <h3 className="text-foreground mt-2 text-[18px] leading-[1.35] font-semibold tracking-tight">
                  {nextStepTitle}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {nextObjective.kind === 'reinforce'
                    ? tr('Retomá este tema con una práctica breve y comprobá qué aprendiste.','Review this topic with a short practice and check what you learned.')
                    : nextObjective.kind === 'practice'
                      ? tr('Ya tenés un tema preparado para seguir estudiando.','Your next topic is ready for study.')
                      : tr('Podés continuar con otra práctica cuando quieras.','You can continue with another practice session whenever you like.')}
                </p>
              </>
            ) : (
              <div className="mt-3">
                <p className="text-muted-foreground text-sm">
                  {tr('No pudimos guardar tu próximo repaso. Tu práctica sí quedó guardada.','We could not save your next review. Your practice was saved.')}
                </p>
                <Button type="button" variant="outline" onClick={persistNextObjective} className="mt-3">
                  {t("Reintentar")}
                </Button>
              </div>
            )}
          </section>

          <div className="mt-auto space-y-3 pt-6">
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
                className="bg-primary text-primary-foreground inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-medium transition hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-60"
              >
                {t("Continuar ahora")} <ArrowRight className="h-4 w-4" />
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
                className="min-h-11 w-full rounded-lg text-[13px] font-medium"
              >
                {t("Continuar ahora")} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={objectiveStatus !== 'saved' || tomorrowStatus === 'saving'}
              onClick={() => void continueTomorrow()}
              className="min-h-11 w-full rounded-lg text-[13px] font-medium"
            >
              {tomorrowStatus === 'saving' ? tr('Guardando para mañana…','Saving for tomorrow…') : tr('Continuar mañana','Continue tomorrow')}
            </Button>
            {tomorrowStatus === 'error' ? (
              <p role="alert" className="text-destructive text-center text-xs">
                {tr('No pudimos guardar el repaso para mañana. Volvé a intentarlo.','Could not save the review for tomorrow. Try again.')}
              </p>
            ) : null}
            <p className="text-muted-foreground text-center text-xs">
              {tr('Si elegís mañana, el repaso queda guardado en Mi espacio.','If you choose tomorrow, your review is saved in My space.')}
            </p>
          </div>

          </div>
          </div>
          <details className="group border-border bg-card mt-3 rounded-xl border px-3 py-1 sm:px-4">
            <summary className="text-muted-foreground hover:text-foreground flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
              {t("Ver todos los detalles")}
              <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="grid gap-6 border-t py-4 @min-[800px]/practice-result:grid-cols-2 @min-[800px]/practice-result:gap-7">
              <section className="space-y-3">
                <h3 className="text-foreground text-sm font-medium">Resultados de todos los temas</h3>
                {topicResults.length ? (
                  topicResults.map((topic) => {
                    const performance = getPracticeTopicPerformance(topic.correct, topic.total);
                    return (
                      <div key={topic.title} className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-foreground min-w-0 flex-1 text-sm font-medium">{topic.title}</span>
                          <span className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-medium tabular-nums ${performance.textClass}`}>
                            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${performance.indicatorClass}`} />
                            {topic.correct}/{topic.total} · {performance.label}
                          </span>
                        </div>
                        <div
                          className={`${performance.trackClass} relative h-2 overflow-hidden rounded-full`}
                          role="progressbar"
                          aria-label={english ? `Correct answers in ${topic.title}: ${performance.percentage}%, ${performance.label}` : `Aciertos en ${topic.title}: ${performance.percentage}%, ${performance.label}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={performance.percentage}
                        >
                          <div className={`h-full rounded-full ${performance.fillClass}`} style={{ width: `${performance.percentage}%` }} />
                          {performance.percentage === 0 && (
                            <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 rounded-full ${performance.zeroMarkerClass}`} />
                          )}
                        </div>
                        {topic.bankSize > 0 ? (
                          <p className="text-muted-foreground text-xs">
                            {tr('En esta tanda aparecieron','This session included')} {topic.total} {tr('de','of')} {topic.bankSize} {tr('preguntas válidas disponibles de este tema.','valid available questions for this topic.')}
                            {topic.total < topic.bankSize && topic.correct === topic.total
                              ? tr(' Todavía quedan preguntas distintas por comprobar.',' There are more distinct questions to practice.') : ''}
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {tr('No hubo preguntas vinculadas a un tema en esta tanda.','No topic-linked questions appeared in this session.')}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  {tr('El banco puede cambiar cuando se actualiza el PDF. Estas cantidades describen esta práctica, no todo tu historial.','The question bank can change when the PDF is updated. These counts describe this session, not your entire history.')}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-foreground text-sm font-medium">
                  {tr('Preguntas para revisar','Questions to review')} · {wrongAnswers.length}
                </h3>
                {wrongAnswers.length ? (
                  <div className="space-y-2">
                    {wrongAnswers.map((question) => (
                      <details key={question.id} className="border-border rounded-xl border px-3 py-2.5">
                        <summary className="text-foreground cursor-pointer text-sm font-medium leading-6">
                          {question.prompt}
                        </summary>
                        {question.type === 'multiple_choice' ? (
                          <AnswerFeedback
                            className="pt-3"
                            correct={false}
                            chosen={selectedAnswers[question.id] || null}
                            correctAnswer={question.answer}
                            explanation={question.explanation}
                            page={sourceLabel(question)}
                            pdfHref={
                              question.reference.pageStart
                                ? '/materiales/' + materialId + '?tab=resumen&page=' + question.reference.pageStart
                                : null
                            }
                          />
                        ) : (
                        <div className="text-muted-foreground space-y-3 pt-4 text-sm leading-6">
                          <p>
                            <span className="text-foreground font-semibold">{t("Tu respuesta:")} </span>
                            {openDrafts[question.id] || 'Sin respuesta escrita'}
                          </p>
                          <p>
                            <span className="text-foreground font-semibold">
                              {'Respuesta esperada: '}
                            </span>
                            {question.answer}
                          </p>
                          {question.explanation && (
                            <p><span className="text-foreground font-semibold">{t("¿Por qué?")} </span>{question.explanation}</p>
                          )}
                          <p className="text-xs">Fuente: {sourceLabel(question)}</p>
                          {question.type === 'open' && (
                            <p className="text-xs">{t("La respuesta abierta fue autoevaluada, no corregida automáticamente.")}</p>
                          )}
                        </div>
                        )}
                      </details>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No quedaron respuestas para revisar en esta tanda.
                  </p>
                )}
              </section>

              <details className="border-border border-t pt-4 @min-[800px]/practice-result:col-span-2">
                <summary className="text-foreground cursor-pointer text-sm font-medium">
                  Todas mis respuestas · {questions.length}
                </summary>
                <div className="mt-4 space-y-2">
                  {questions.map((question, index) => (
                    <details key={question.id} className="border-border rounded-xl border px-3 py-2.5">
                      <summary className="text-foreground cursor-pointer text-sm font-medium leading-6">
                        <span className={isQuestionCorrect(question) ? 'text-emerald-700' : 'text-amber-700'}>
                          {isQuestionCorrect(question) ? '✓' : '•'}
                        </span>
                        {' '}Pregunta {index + 1}: {question.prompt}
                      </summary>
                      <div className="text-muted-foreground space-y-2 pt-3 text-sm">
                        <p><span className="text-foreground font-semibold">{t("Tu respuesta:")} </span>
                          {question.type === 'multiple_choice'
                            ? selectedAnswers[question.id] || 'Sin respuesta'
                            : openDrafts[question.id] || 'Sin respuesta escrita'}
                        </p>
                        <p><span className="text-foreground font-semibold">Respuesta esperada: </span>
                          {question.answer}
                        </p>
                        {question.explanation && <p>{question.explanation}</p>}
                        <p className="text-xs">Fuente: {sourceLabel(question)}</p>
                        {question.type === 'open' && <p className="text-xs">Pregunta autoevaluada.</p>}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
              <div className="flex flex-wrap gap-3 @min-[800px]/practice-result:col-span-2">
                <Button type="button" variant="outline" onClick={resetExam}>
                  <RotateCcw className="h-4 w-4" /> {t("Nueva práctica")}
                </Button>
              </div>
            </div>
          </details>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-[940px] px-1 py-2 sm:px-2 sm:py-3">
        <header className="border-border border-b pb-6">
          <p className="text-primary text-[11px] font-medium tracking-[0.15em] uppercase">
            {tr('Práctica completada','Practice completed')}{topicTitle ? ` · ${topicTitle}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
            <h2 className="text-foreground text-[24px] font-semibold tracking-[-0.04em] sm:text-[28px]">
              {topicSectionIndex === undefined
                ? `${result.percentage}%`
                : `${result.correct} de ${result.total}`}
            </h2>
            <p className="text-muted-foreground pb-1 text-sm">
              {topicSectionIndex === undefined
                ? `${result.correct} ${tr('de','of')} ${result.total} ${tr('respuestas consolidadas','consolidated answers')}`
                : tr('Respuestas correctas en esta tanda','Correct answers in this session')}
            </p>
          </div>
        </header>

        <div className="border-border grid border-b py-5 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          {(['recordar', 'comprender', 'aplicar'] as const)
            .filter((level) => topicSectionIndex === undefined || result.levels[level].total > 0)
            .map((level) => (
              <div key={level} className="py-2 sm:px-5 first:sm:pl-0 last:sm:pr-0">
                <p className="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
                  {levelLabel(level)}
                </p>
                <p className="text-foreground mt-1 text-lg font-semibold">
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
                  ? `${result.wrong.length} ${result.wrong.length === 1 ? tr('pregunta para revisar','question to review') : tr('preguntas para revisar','questions to review')}`
                  : tr('Respondiste toda la tanda correctamente','All answers in this session were correct')}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {result.wrong.length > 0
                  ? tr('Antes de continuar, te recomendamos revisar estas dificultades con el contenido del tema.','Before continuing, review these difficulties with the topic content.')
                  : tr('Podés volver al tema y continuar estudiando. Más adelante conviene comprobarlo otra vez.','You can return to the topic and keep studying. Check your understanding again later.')}
              </p>
            </div>
          ) : reviewTopics.length > 0 ? (
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="text-foreground font-semibold">{tr('Temas para repasar','Topics to review')}</h3>
                <ul className="text-foreground mt-2 space-y-1.5 text-[13px] leading-5">
                  {reviewTopics.map((topic) => (
                    <li key={topic}>• {topic}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-emerald-700">
              {tr('No quedaron temas marcados para repasar en este intento.','No topics were marked for review in this session.')}
            </p>
          )}
        </section>

        {topicSectionIndex !== undefined && (
          <p className="text-muted-foreground mt-4 text-sm!">
            {tr('Resultado de esta tanda de','Results for this session on')} {topicTitle}. {tr('Incluye','Includes')} {result.total}{' '}
            {result.total === 1 ? tr('pregunta','question') : tr('preguntas','questions')}; {tr('no representa el dominio de todo el tema.','this does not mean you have mastered the whole topic.')}
          </p>
        )}
        {topicSectionIndex === undefined && sections.length > 0 && (
          <p className="text-muted-foreground mt-4 text-[13px]!">
            {tr('Esta práctica incluyó preguntas corregidas de','This practice included graded questions from')}{' '}
            {
              new Set(
                questions
                  .filter((question) => question.type === 'multiple_choice')
                  .map((question) => findSummarySectionForQuestion(question, sections))
                  .filter((index) => index >= 0)
              ).size
            }{' '}
            {tr('de','of')} {sections.length} {tr('temas. Los temas que no aparecieron siguen sin evaluar en este intento; no cuentan como errores.','topics. Topics not covered remain unassessed and do not count as mistakes.')}
          </p>
        )}
        {!isSimulation && (
          <section className="border-primary/20 bg-primary/5 mt-5 rounded-xl border p-4 sm:p-5" aria-live="polite">
            <p className="text-primary text-[11px] font-medium tracking-[0.13em] uppercase">{t("Tu próximo objetivo")}</p>
            {objectiveStatus === 'saving' || objectiveStatus === 'idle' ? (
              <p className="text-muted-foreground mt-2 text-sm">{t("Preparando tu próximo repaso con tus respuestas guardadas…")}</p>
            ) : objectiveStatus === 'saved' && nextObjective ? (
              <>
                <h3 className="text-foreground mt-2 text-lg font-semibold">
                  {nextObjective.kind === 'reinforce' ? `${tr('Reforzar:','Review:')} ${nextObjective.topicTitle || tr('tus errores','your mistakes')}`
                    : nextObjective.kind === 'practice' ? `${tr('Practicar:','Practice:')} ${nextObjective.topicTitle || tr('el próximo tema','the next topic')}`
                    : tr('Consolidar lo aprendido','Consolidate what you learned')}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {nextObjective.kind === 'reinforce' ? tr('Volvé a comprobar los conceptos que te costaron en esta práctica.','Check the concepts that were difficult in this practice again.')
                    : nextObjective.kind === 'practice' ? tr('Seguí con un tema que todavía necesita una comprobación.','Continue with a topic that still needs practice.')
                    : tr('Comprobá lo aprendido con otra tanda de preguntas.','Check what you learned with another session of questions.')}
                </p>
                <p className="text-muted-foreground mt-2 text-xs font-medium">
                  {tr('Repaso sugerido:','Suggested review:')} {new Date(`${nextObjective.reviewOn}T12:00:00`).toLocaleDateString(english ? 'en-US' : 'es-AR', { day: 'numeric', month: 'long' })}
                </p>
                <p className="text-primary mt-3 text-xs font-semibold">{t("✓ Guardado en Mi espacio para tu próxima visita")}</p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mt-2 text-sm">{t("Tu práctica está guardada, pero no pudimos guardar tu próximo objetivo.")}</p>
                <Button type="button" variant="outline" className="mt-3" onClick={persistNextObjective}>{t("Reintentar guardar objetivo")}</Button>
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
              className="border-border focus-visible:outline-ring inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium focus-visible:outline-2"
            >
              Ver mi progreso
            </Link>
          )}
          {!isSimulation && (
            <Link
              href="/dashboard"
              className="border-border inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-medium"
            >
              Terminar por hoy
            </Link>
          )}
          <Button
            variant={topicSectionIndex !== undefined ? 'outline' : 'default'}
            onClick={resetExam}
            className="h-11 w-full rounded-lg sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            {t(topicSectionIndex !== undefined ? 'Practicar de nuevo' : 'Nueva práctica')}
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
  const groundedMistakeContrast = current.type === 'multiple_choice' && !isCorrect && isRevealed
    
    ? buildGroundedErrorContrast(selectedAnswer, current.answer, glossary)
    : null;
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
            practice_scope: practiceScope(topicSectionIndex),
            entry_source: attemptEntryRef.current.source,
            entry_id: attemptEntryRef.current.id,
            attempt_id: sessionIdRef.current,
            flow_version: MATERIAL_PRACTICE_FLOW_VERSION,
          },
        });
      onComplete?.();
      if (topicSectionIndex !== undefined) {
        onTopicFinished?.({
          sectionIndex: topicSectionIndex,
          total: result.total,
          correct: result.correct,
          incorrect: result.wrong.length,
          incorrectPrompts: result.wrong.map((question) => question.prompt),
        });
      }
      setFinished(true);
      // También guardar el próximo objetivo al practicar un tema concreto.
      // El resultado y la salida no dependen de que este guardado termine.
      if (!isSimulation) persistNextObjective();
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
        entrySource: attemptEntryRef.current.source,
        entryId: attemptEntryRef.current.id,
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
            ? tr('Evaluo se actualizó mientras estudiabas. Tu respuesta está guardada en este navegador. Actualizá para retomarla y volver a enviarla.','Evaluo updated while you were studying. Your answer is saved in this browser. Refresh to restore and submit it.')
            : tr('Evaluo se actualizó. No pudimos guardar una copia local: mantené esta pestaña abierta e intentá de nuevo antes de actualizar.','Evaluo updated. We could not save a local copy. Keep this tab open and try again before refreshing.')
          : protectedLocally
            ? tr('No se pudo guardar la respuesta en tu progreso. Sigue disponible en este navegador: reintentá o actualizá la página para retomarla.','Your answer was not saved to your progress, but is still available in this browser. Retry or refresh to recover it.')
            : tr('No se pudo guardar la respuesta ni crear una copia local. Mantené esta pestaña abierta y reintentá.','We could not save your answer or a local copy. Keep this tab open and retry.')
      );
      return;
    }
    if (!savedAnswerIdsRef.current.includes(payload.resultId)) savedAnswerIdsRef.current.push(payload.resultId);
    delete answerIds.current[current.id];

    advanceExam();
  };

  return (
    <>
      <div className="practice-screen-enter mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-2 sm:py-4">
        {topicSectionIndex !== undefined && (
          <div className="border-border border-b pb-3">
            <p className="text-muted-foreground text-[13px] font-medium">{topicTitle}</p>
          </div>
        )}
        {topicSectionIndex !== undefined &&
          verifiedTopicCount < MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS && (
            <p role="status" className="text-muted-foreground text-xs leading-5">
              {tr('Cobertura de este tema:','Topic coverage:')} {verifiedTopicCount} {tr('de','of')} {MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS} {tr('preguntas verificadas. Esta tanda utiliza las disponibles.','verified questions. This session uses the available questions.')}
            </p>
          )}
        {contextUnavailable && (
          <p role="status" className="text-muted-foreground text-xs!">
            {topicSectionIndex === undefined
              ? tr('No pudimos cargar tu historial. Esta tanda reparte preguntas entre los temas disponibles.','Could not load your history. This session uses questions across available topics.')
              : tr('No pudimos cargar tu historial. Esta tanda usa las preguntas disponibles de este tema.','Could not load your history. This session uses available questions from this topic.')}
          </p>
        )}
        {topicSectionIndex === undefined && unavailableTopics > 0 && (
          <p className="text-muted-foreground text-xs!">
            {unavailableTopics}{' '}
            {unavailableTopics === 1 ? tr('tema todavía no tiene','topic does not have') : tr('temas todavía no tienen','topics do not have')}{' '}
            {tr('preguntas corregibles asociadas. No se cuentan como errores.','linked gradable questions yet. They do not count as mistakes.')}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-[12px] font-semibold tracking-[0.14em] uppercase">
              {tr('Pregunta','Question')} {currentIndex + 1} {tr('de','of')} {questions.length}
            </p>
          </div>
          <span className="text-primary text-[11px] font-medium tracking-[0.12em] uppercase md:hidden">
            {levelLabel(current.level)}
          </span>
        </div>

        {!isSimulation && questions.length >= 20 && (
          <p className="text-muted-foreground text-[11px]">
            {tr('Tu avance se guarda automáticamente en este navegador. Podés volver a este PDF y continuar.','Your progress is saved automatically in this browser. You can return to this PDF and continue.')}
          </p>
        )}

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <article key={current.id} className="practice-step-enter border-border border-t pt-4">
          <h2 className="text-foreground text-[16px] leading-6 font-medium tracking-[-0.025em] sm:text-[16px]">
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
                      'flex min-h-11 w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition sm:px-3.5',
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
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
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
                    <span className="text-foreground pt-0.5 text-[13px] leading-5 sm:text-[13.5px] sm:leading-5">
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
              placeholder={t("Escribí tu respuesta con tus palabras...")}
              className="border-border bg-card text-foreground focus:border-primary focus:ring-ring/20 disabled:bg-muted mt-3 min-h-28 w-full resize-y rounded-lg border px-4 py-3 text-sm leading-6 transition outline-none focus:ring-2"
            />
          )}

          {isRevealed ? (
            <div className="border-border mt-4 space-y-3 border-t pt-4">
              {current.type === 'multiple_choice' ? (
                <section ref={correctionRef} aria-label={tr('Corrección','Feedback')}>
                  <AnswerFeedback
                    correct={isCorrect}
                    chosen={selectedAnswer}
                    explanation={groundedMistakeContrast || current.explanation}
                    page={sourceLabel(current)}
                    pdfHref={
                      current.reference.pageStart
                        ? '/materiales/' + materialId + '?tab=resumen&page=' + current.reference.pageStart
                        : null
                    }
                    savedToErrors={!isCorrect}
                    evi={isSimulation || !/^[0-9a-f-]{36}$/i.test(materialId) ? null : {
                      kind: 'practice',
                      materialId,
                      question: current.prompt,
                      chosen: selectedAnswer,
                      correctAnswer: current.answer,
                      explanation: groundedMistakeContrast || current.explanation,
                      page: current.reference.pageStart ?? null,
                      label: [
                        tr('Práctica', 'Practice'),
                        current.answer.slice(0, 48),
                        current.reference.pageStart
                          ? tr('pág. ', 'p. ') + current.reference.pageStart
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' · '),
                    }}
                  />
                </section>
              ) : (
                <section ref={correctionRef} className="border-primary border-l-2 py-0.5 pl-4">
                  <p className="text-foreground text-sm font-medium">
                    {tr('Respuesta esperada','Expected answer')}
                  </p>
                  <p className="text-foreground mt-2 text-[13.5px] leading-6">
                    <span className="font-semibold">{t("Respuesta:")}</span> {current.answer}
                  </p>
                  <p className="text-muted-foreground mt-2 text-[13px] leading-5">
                    {current.explanation}
                  </p>
                  <p className="text-muted-foreground mt-3 text-[11.5px] font-medium">
                    Fuente: {sourceLabel(current)}
                  </p>
                </section>
              )}

              {current.type === 'open' ? (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-foreground text-[13px] font-medium">
                    {t("Compará tu respuesta con la esperada. ¿Cómo te fue?")}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenAssessments((items) => ({ ...items, [current.id]: 'got_it' }))
                      }
                      className={cn(
                        'min-h-11 rounded-lg border px-3 py-2 text-[13px] font-medium transition',
                        openAssessment === 'got_it'
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : 'border-border bg-card text-foreground hover:border-emerald-300'
                      )}
                    >
                      {t("La tenía")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenAssessments((items) => ({ ...items, [current.id]: 'review' }))
                      }
                      className={cn(
                        'min-h-11 rounded-lg border px-3 py-2 text-[13px] font-medium transition',
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
                      className="text-primary min-h-10 text-sm font-medium underline underline-offset-4"
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
          {freeQuotaMessage && <p role="status" className="text-xs text-amber-700">{freeQuotaMessage}</p>}
          {!isRevealed ? (
            <Button
              type="button"
              disabled={freeClaimPending || (current.type === 'multiple_choice' && !selectedAnswer)}
              onClick={() => {
                void (async () => {
                  if (freeStudyV2 && current.type === 'multiple_choice' &&
                      !preclaimedFreeQuestionIds.current.has(current.id)) {
                    setFreeClaimPending(true);
                    setFreeQuotaMessage('');
                    try {
                      const response = await fetch('/api/free-study-v2/claim', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ materialId, kind: 'multiple_choice', itemKey: current.id }),
                      });
                      const reply: unknown = await response.json();
                      if (!response.ok || !reply || typeof reply !== 'object' ||
                          !('allowed' in reply) || reply.allowed !== true) {
                        if (response.ok && reply && typeof reply === 'object' && 'allowed' in reply && reply.allowed === false)
                          setFreeQuotaReached(true);
                        setFreeQuotaMessage(response.status === 503
                          ? tr('No pudimos comprobar tu cupo. Reintentá.','Could not verify your Free quota. Please retry.')
                          : tr('Ya resolviste tus 12 preguntas gratuitas. Podés repetir las anteriores.','You used your 12 Free questions. You can repeat previously unlocked ones.'));
                        return;
                      }
                    } catch {
                      setFreeQuotaMessage(tr('No pudimos comprobar tu cupo. Reintentá.','Could not verify your Free quota. Please retry.'));
                      return;
                    } finally { setFreeClaimPending(false); }
                  }
                  setRevealed(items => ({ ...items, [current.id]: true }));
                  if (current.type === 'multiple_choice' && !isCorrect &&
                      window.matchMedia('(max-width: 767px)').matches) {
                    requestAnimationFrame(() => {
                      correctionRef.current?.scrollIntoView({
                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                        block: 'nearest',
                      });
                    });
                  }
                })();
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
