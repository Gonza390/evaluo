'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { studyUiText } from '@/lib/i18n/study-ui-copy';
import './practice-motion.css';
import { PracticePreparing } from '@/components/dashboard/practice-preparing';
import { FreePracticeLimitScreen } from '@/components/dashboard/free-practice-limit-screen';
import { PracticeResultsScreen, type PracticeResultEntry } from '@/components/dashboard/practice-results-screen';
import { AnswerFeedback, answeredOptionClass } from '@/components/study/answer-feedback';
import { ExamPracticeScreen } from '@/components/dashboard/practice-exam-screen';
import { MatchPracticeScreen, CasesPracticeScreen, CompletePracticeScreen, MixedPracticeScreen } from '@/components/dashboard/practice-visual-screens';
import { selectBalancedTrueFalse, sufficientTrueFalse, verifiedTrueFalsePool } from '@/lib/student-materials/practice-true-false';
import {
  allowedWrittenVariants, balancedQuestions, groundedPracticeContrast,
  groundedPracticeExplanation, normalizedAnswer,
  distinctApplicationCases, isCorrectWrittenAnswer, MIN_CASES_PER_PRACTICE, qualifiedQuestions, selectMixedQuestions,
  selectPracticePairs, shuffleMatchingDefinitions, shufflePracticeChoices, shufflePracticeItems,
  type PracticePair, type PracticeQuestion,
} from '@/lib/student-materials/practice-modes';

type Mode = 'unir' | 'completar' | 'casos' | 'mixto' | 'simulacro' | 'opciones';
type Task = { type: 'question'; question: PracticeQuestion } | { type: 'recall'; pair: PracticePair };
const title: Record<Mode, string> = {
  unir: 'Unir conceptos', completar: 'Completar', casos: 'Casos',
  mixto: 'Práctica mixta', simulacro: 'Simulacro de examen', opciones: 'Opciones',
};
const rotate = <T,>(values: T[], amount: number) =>
  values.length ? [...values.slice(amount % values.length), ...values.slice(0, amount % values.length)] : values;

/** Rondas Free reclamadas como sesión completa (una por cuenta, idempotente por material). */
const FREE_SESSION_CLAIMS: Partial<Record<string, { kind: string; itemKey: string }>> = {
  unir: { kind: 'matching_round', itemKey: 'matching:first' },
  simulacro: { kind: 'simulator', itemKey: 'simulator:first' },
  completar: { kind: 'complete_round', itemKey: 'complete:first' },
  mixto: { kind: 'mixed_round', itemKey: 'mixed:first' },
};

export function PracticeSession({ mode, materialId, materialTitle, glossary, questions, cases, reviewLength = 'completo', aiAvailable = false, isWord = false, planTopicIndex, freeV2 = false, quotaPremiumHref, quotaBackHref, quotaBackLabel, previewResult }: {
  mode: Mode; materialId: string; materialTitle: string; reviewLength?: 'rapido' | 'completo';
  glossary: PracticePair[]; questions: PracticeQuestion[]; cases: PracticeQuestion[];
  aiAvailable?: boolean; isWord?: boolean; planTopicIndex?: number; freeV2?: boolean;
  quotaPremiumHref?: string; quotaBackHref?: string; quotaBackLabel?: string;
  /** Vista local sin lectura/escritura de intentos, IA ni cuotas. */
  previewResult?: { correct: number };
}) {
  const locale = useOptionalAppLocale();
  const english = locale === 'en';
  const t = (value: string) => studyUiText(locale, value);
  const [addedPairs, setAddedPairs] = useState<PracticePair[]>([]);
  const [generatedOptions, setGeneratedOptions] = useState<PracticeQuestion[]>([]);
  const [generatedTrueFalse, setGeneratedTrueFalse] = useState<PracticeQuestion[]>([]);
  const [trueFalseLoading, setTrueFalseLoading] = useState(false);
  const [trueFalseError, setTrueFalseError] = useState('');
  const [trueFalseDiagnostic, setTrueFalseDiagnostic] = useState('');
  const trueFalseBusy = useRef(false);
  const trueFalseAttempts = useRef(0);
  const trueFalsePool = useMemo(() => verifiedTrueFalsePool(generatedTrueFalse), [generatedTrueFalse]);
  const pairs = useMemo(() => selectPracticePairs([...glossary, ...addedPairs]),
    [glossary, addedPairs]);
  // PDF exams keep the existing page-citation requirement. DOCX questions
  // have section citations instead and must not be rejected for page=null.
  const options = useMemo(() => qualifiedQuestions([
    ...questions.filter(question => mode !== 'simulacro' || isWord ||
      question.pageStart !== null),
    ...(mode !== 'casos' ? generatedOptions : []),
  ]), [questions, generatedOptions, mode, isWord]);
  const [generatedCases, setGeneratedCases] = useState<PracticeQuestion[]>([]);
  const verifiedChapterCount = new Set(options.map(q => q.chapterTitle).filter(Boolean)).size;
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generationDiagnostic, setGenerationDiagnostic] = useState('');
  const attempts = useRef(0);
  const generatingRequest = useRef(false);
  const contexts = useMemo(() => {
    const all = distinctApplicationCases([...generatedCases, ...cases, ...questions]);
    return freeV2 ? all.slice(0, 2) : all;
  }, [questions, cases, generatedCases, freeV2]);
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [reviewed, setReviewed] = useState<number[]>([]);
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [finished, setFinished] = useState(previewResult !== undefined);
  const [leavingActivity, setLeavingActivity] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [examStarted, setExamStarted] = useState(false);
  // Unir, Completar y Mixto se reclaman al estar listos; el simulacro al pulsar Comenzar.
  const sessionRound = freeV2 ? FREE_SESSION_CLAIMS[mode] : undefined;
  const [freeSessionGate, setFreeSessionGate] = useState<'new'|'pending'|'allowed'|'denied'|'error'>(
    sessionRound ? 'new' : 'allowed'
  );
  const freeSessionGateBusy = useRef(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const posted = useRef('');
  const sessionIdRef = useRef<string | null>(null);
  const [historySaveFailed, setHistorySaveFailed] = useState(false);
  const exercisePairs = useMemo(() => rotate(pairs, round * 6).slice(0, freeV2 ? 6 : reviewLength === 'rapido' ? 6 : 8), [pairs, round, reviewLength, freeV2]);
  const definitions = useMemo(() => shuffleMatchingDefinitions(
    exercisePairs.map((pair, pairIndex) => ({ pair, pairIndex })),
  ), [exercisePairs]);

  const tasks = useMemo<Task[]>(() => {
    if (previewResult) {
      if (mode === 'unir') return [];
      if (mode === 'completar') return pairs.slice(0, 6).map(pair => ({ type: 'recall' as const, pair }));
      if (mode === 'mixto') return [
        ...questions.slice(0, 4).map(question => ({ type: 'question' as const, question })),
        ...pairs.slice(0, 2).map(pair => ({ type: 'recall' as const, pair })),
      ];
      return questions.slice(0, 6).map(question => ({ type: 'question' as const, question }));
    }
    if (mode === 'unir') return [];
    if (mode === 'completar')
      return shufflePracticeItems(rotate(pairs, round * 5).slice(0, freeV2 || reviewLength === 'rapido' ? 6 : 8))
        .map(pair => ({ type: 'recall' as const, pair }));
    if (mode === 'casos')
      return shufflePracticeItems(rotate(contexts, round * 5).slice(0, freeV2 ? 2 : reviewLength === 'rapido' ? 6 : 8))
        .map(question => ({ type: 'question' as const, question: shufflePracticeChoices(question) }));
    if (mode === 'simulacro')
      return shufflePracticeItems(balancedQuestions(options, freeV2 ? 20 : reviewLength === 'rapido' ? 6 : 10, round))
        .map(question => ({ type: 'question' as const, question: shufflePracticeChoices(question) }));
    if (mode === 'opciones')
      return selectBalancedTrueFalse(trueFalsePool, freeV2 ? 10 : reviewLength === 'rapido' ? 6 : 8, round).map(question => ({ type: 'question' as const, question }));
    const mixed = selectMixedQuestions(options, contexts, round);
    const base = mixed.questions.map(question => ({ type: 'question' as const, question: shufflePracticeChoices(question) }));
    const recalled = rotate(pairs, round * 3).slice(0, 2).map(pair => ({ type: 'recall' as const, pair }));
    const applied = mixed.application ? [{ type: 'question' as const, question:shufflePracticeChoices(mixed.application) }] : [];
    return shufflePracticeItems([...base.slice(0, 3), ...recalled, ...applied, ...base.slice(3)]
      .slice(0, reviewLength === 'rapido' ? 6 : 10));
  }, [mode, pairs, options, contexts, trueFalsePool, round, reviewLength, freeV2, questions, previewResult]);

  const total = mode === 'unir' ? exercisePairs.length : tasks.length;
  const ready = previewResult !== undefined ? true : mode === 'unir' ? exercisePairs.length >= MIN_CASES_PER_PRACTICE :
    mode === 'casos' ? contexts.length >= (freeV2 ? 1 : MIN_CASES_PER_PRACTICE) :
    mode === 'completar' ? tasks.length >= MIN_CASES_PER_PRACTICE :
    // La ronda gratis de Mixto no genera casos nuevos: usa la aplicación sólo si ya existe.
    mode === 'mixto' ? tasks.length >= MIN_CASES_PER_PRACTICE && options.length >= 4 && pairs.length >= 2 && (freeV2 || distinctApplicationCases(contexts).length >= 1) :
    mode === 'opciones' ? sufficientTrueFalse(trueFalsePool, freeV2 ? 1 : MIN_CASES_PER_PRACTICE) :
    mode === 'simulacro' && freeV2 ? tasks.length >= 20 :
    tasks.length >= MIN_CASES_PER_PRACTICE;
  // La ruta puede preparar contenido sin gastar el único uso. La ronda
  // se reclama al estar verificada y lista; el simulacro al pulsar Comenzar.
  const claimSessionQuota = useCallback(async (): Promise<boolean> => {
    if (!sessionRound) return true;
    if (freeSessionGateBusy.current) return false;
    freeSessionGateBusy.current = true;
    setFreeSessionGate('pending');
    try {
      const response = await fetch('/api/free-study-v2/claim', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          materialId, kind: sessionRound.kind, itemKey: sessionRound.itemKey,
        }),
      });
      const result: unknown = await response.json();
      if (response.ok && result && typeof result === 'object' && 'allowed' in result) {
        if (result.allowed === true) { setFreeSessionGate('allowed'); return true; }
        if (result.allowed === false) { setFreeSessionGate('denied'); return false; }
      }
      setFreeSessionGate('error');
      return false;
    } catch {
      // Errores técnicos no son cuota agotada ni justifican un upsell.
      setFreeSessionGate('error');
      return false;
    } finally {
      freeSessionGateBusy.current = false;
    }
  }, [sessionRound, materialId]);
  useEffect(() => {
    if (sessionRound && mode !== 'simulacro' && ready && freeSessionGate === 'new')
      void claimSessionQuota();
  }, [sessionRound, mode, ready, freeSessionGate, claimSessionQuota]);

  const correctAt = (index: number) => {
    if (previewResult) return index < previewResult.correct;
    if (mode === 'unir') return matches[index] === index;
    const item = tasks[index];
    if (!item) return false;
    return item.type === 'recall'
      ? isCorrectWrittenAnswer(responses[index] ?? '', item.pair.term,
        allowedWrittenVariants(item.pair,pairs))
      : responses[index] === item.question.answer;
  };
  const score = Array.from({ length: total }, (_, i) => correctAt(i)).filter(Boolean).length;
  const answeredCount = mode === 'unir' ? Object.keys(matches).length :
    Object.keys(responses).filter(i => responses[Number(i)]?.trim()).length;
  const missedTopics = [...new Set(tasks.flatMap((task, i) => {
    if (correctAt(i)) return [];
    const name = task.type === 'recall' ? task.pair.chapterTitle : task.question.chapterTitle;
    return name && name !== 'Situaciones de aplicación' ? [name] : [];
  }))].slice(0, 4);
  const diagnosticFor = (index: number): string | null => {
    const task = tasks[index];
    if (!task || correctAt(index) || mode === 'opciones' || freeV2) return null;
    const response = responses[index] ?? '';
    return task.type === 'recall'
      ? groundedPracticeContrast(response, task.pair.term, pairs)
      : groundedPracticeContrast(response, task.question.answer, pairs);
  };
  const current = tasks[step];
  const checked = reviewed.includes(step);
  const explanationFor = (question:PracticeQuestion) => groundedPracticeExplanation(question,pairs);
  const pdfPageHref = (page:number) => '/materiales/' + materialId + '?tab=resumen&page=' + page;

  useEffect(() => {
    if (mode !== 'simulacro' || !ready || finished || !examStarted) return;
    if (deadline === null) { setDeadline(Date.now() + 15 * 60 * 1000); return; }
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setFinished(true);
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, ready, finished, deadline, examStarted]);

  const saveCompletedSession = () => {
    if (!ready || !finished) return;
    const attempt = materialId + ':' + mode + ':' + round;
    if (posted.current === attempt) return;
    posted.current = attempt;
    sessionIdRef.current ??= crypto.randomUUID();
    const answers = mode === 'unir'
      ? exercisePairs.map((pair, i) => ({
          prompt: pair.term,
          selectedAnswer: exercisePairs[matches[i]]?.definition ?? '',
          correctAnswer: pair.definition,
          correct: correctAt(i),
        }))
      : tasks.map((task, i) => ({
          prompt: task.type === 'recall' ? task.pair.definition : task.question.prompt,
          selectedAnswer: responses[i] ?? '',
          correctAnswer: task.type === 'recall' ? task.pair.term : task.question.answer,
          correct: correctAt(i),
        }));
    void fetch('/api/practice/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ sessionId: sessionIdRef.current, materialId, mode, correct: score, total, answers, planTopicIndex }),
    }).then((response) => {
      if (!response.ok) throw new Error('save_failed');
      if (posted.current === attempt) setHistorySaveFailed(false);
    }).catch(() => {
      // Un intento anterior puede terminar en red después de iniciar otra ronda.
      // Nunca marcar la ronda nueva como fallida ni permitir doble guardado.
      if (posted.current === attempt) {
        posted.current = '';
        setHistorySaveFailed(true);
      }
    });
  };
  useEffect(() => {
    if (finished && ready && !previewResult) saveCompletedSession();
    // One submission per finished round; scores are frozen at completion.
    // Finishing a round triggers a single submission for that frozen attempt.
  }, [finished]);

  const generateNewCases = useCallback(async () => {
    if (generatingRequest.current || freeSessionGate === 'denied') return;
    generatingRequest.current = true;
    attempts.current += 1;
    setGenerating(true); setGenerationError(''); setGenerationDiagnostic('');
    try {
      const response = await fetch('/api/practice/cases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId, round: attempts.current - 1,
          existingScenarios: contexts.map(q => q.prompt.split(/\n\s*\n/)[0]).slice(0, 24),
        }),
        signal: AbortSignal.timeout(65000),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !body || typeof body !== 'object' || !('cases' in body) ||
          !Array.isArray(body.cases) || body.cases.length < 1) {
        const code = body && typeof body === 'object' && 'error' in body &&
          typeof body.error === 'string' ? body.error : 'unknown_response';
        if (freeV2 && response.status === 403 && code === 'free_quota_exhausted') {
          setFreeSessionGate('denied');
          return;
        }
        // A different batch of cited pages can yield valid exercises when
        // Gemini could not ground or independently verify the first batch.
        // Keep a strict budget: at most 3 automatic attempts per entry.
        if (mode === 'casos' && response.status === 422 &&
            ['ungrounded_generation','ambiguous_generation','insufficient_grounded_terms'].includes(code) &&
            attempts.current < 3) return;
        setGenerationDiagnostic('HTTP ' + response.status + ' · ' + code);
        setGenerationError(response.status === 429
          ? (english ? 'Today\'s generation limit was reached. This material does not yet have six verified cases.' : 'Se alcanzó el límite de generación por hoy. Este material todavía no tiene seis casos verificables.')
          : response.status === 401
            ? (english ? 'Your session expired. Please sign in again.' : 'Tu sesión venció. Iniciá sesión nuevamente.')
          : response.status === 503 || response.status >= 500
            ? (english ? 'The AI service could not finish generating or verifying cases. Please retry.' : 'El servicio de IA no pudo completar la generación o verificación. Podés reintentar.')
          : (english ? 'We could not find enough source-backed cases. We will not invent cases to reach six.' : 'No encontramos más situaciones con respaldo suficiente en este material. No vamos a completar los seis con casos inventados.'));
        return;
      }
      const incoming = body.cases as PracticeQuestion[];
      if (mode === 'casos') {
        setGeneratedCases(previous => distinctApplicationCases([
          ...previous, ...incoming,
        ]));
      } else {
        setGeneratedOptions(previous => qualifiedQuestions([...previous, ...incoming]));
      }
    } catch (error) {
      setGenerationDiagnostic(error instanceof Error ? error.name : 'network_error');
      setGenerationError((english ? 'The connection failed while generating cases. Please try again.' : 'No pudimos conectarnos para generar los casos. Podés reintentar.'));
    } finally {
      generatingRequest.current = false;
      setGenerating(false);
    }
  }, [materialId, contexts, options, mode, freeV2, freeSessionGate]);
  // The student enters an actual six-case session only when enough verified
  // applications exist. Try again with fresh source snippets if QA rejects any.
  useEffect(() => {
    const needsMore = mode === 'casos'
      ? contexts.length < (freeV2 ? 1 : MIN_CASES_PER_PRACTICE)
      : mode === 'mixto' ? options.length < 4 || (!freeV2 && contexts.length < 1)
      : mode === 'simulacro'
        ? options.length < (freeV2 ? 20 : MIN_CASES_PER_PRACTICE) : false;
    const automaticLimit = mode === 'casos' ? 3 : 6;
    if (!aiAvailable || !needsMore || generating || generationError || freeSessionGate === 'denied' ||
        attempts.current >= automaticLimit || generatingRequest.current) return;
    void generateNewCases();
  }, [mode, aiAvailable, contexts.length, options.length, generating, generationError, generateNewCases, freeV2, freeSessionGate]);
  useEffect(() => {
    if (mode === 'casos' && !generating && !generationError &&
        attempts.current >= 3 && contexts.length < (freeV2 ? 1 : MIN_CASES_PER_PRACTICE)) {
      setGenerationError(freeV2
        ? 'No pudimos preparar un caso gratuito con evidencia suficiente. Podés reintentar.'
        : 'No pudimos reunir seis casos distintos con respuestas verificadas. Podés reintentar con otras fuentes.');
    }
  }, [mode, generating, generationError, contexts.length, freeV2]);
  const generateTrueFalse = useCallback(async () => {
    if (trueFalseBusy.current || freeSessionGate === 'denied') return;
    trueFalseBusy.current = true;
    setTrueFalseLoading(true);
    setTrueFalseError('');
    setTrueFalseDiagnostic('');
    let accumulated=verifiedTrueFalsePool(trueFalsePool);
    try {
      // Retry only source-verification failures, using different pages on each
      // attempt. Auth, rate-limit, provider and network failures stop immediately.
      for (let retry=0; retry<3 && trueFalseAttempts.current<6; retry++) {
        const round=trueFalseAttempts.current++;
        const response = await fetch('/api/practice/true-false', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            materialId,round,
            previous:accumulated.map(q => q.prompt),
          }),
          signal:AbortSignal.timeout(65000),
        });
        // Preserve HTTP status even for non-JSON reverse-proxy responses.
        const data:unknown = await response.json().catch(() => null);
        const errorCode = data && typeof data === 'object' && 'error' in data &&
          typeof data.error === 'string' ? data.error : 'unknown_response';
        if (freeV2 && response.status === 403 && errorCode === 'free_quota_exhausted') {
          setFreeSessionGate('denied');
          return;
        }
        if (!response.ok || !data || typeof data !== 'object' ||
            !('questions' in data) || !Array.isArray(data.questions)) {
          setTrueFalseDiagnostic('HTTP ' + response.status + ' · ' + errorCode);
          const retryableSourceFailure=response.status===422 &&
            (errorCode==='ungrounded_generation' || errorCode==='ambiguous_generation');
          if (retryableSourceFailure && retry<2 && trueFalseAttempts.current<6) continue;
          setTrueFalseError(
            response.status === 401
              ? (english ? 'Your Evaluo session expired. Sign in and try again.' : 'Tu sesión de Evaluo venció. Volvé a iniciar sesión y reintentá.')
            : response.status === 403
              ? (english ? 'The server blocked this practice request. Please check your account access.' : 'El servidor bloqueó la solicitud de práctica. Revisá la protección de acceso.')
            : response.status === 404 && errorCode === 'material_not_found'
              ? (english ? 'This material was not found in your account. Open it again from Your materials.' : 'No se encontró este material en tu cuenta. Volvé a abrirlo desde Tus materiales.')
            : response.status === 404
              ? (english ? 'The true-or-false service is unavailable. Refresh the page and try again.' : 'No encontramos el servicio de Verdadero o Falso en este servidor. Actualizá la página y reintentá.')
            : response.status === 429
              ? (english ? 'Today\'s generation limit was reached. We will not show unverified statements.' : 'Se alcanzó el límite de generación de hoy. No vamos a mostrar afirmaciones sin verificar.')
            : response.status === 422
              ? (english ? 'We could not verify enough statements from the selected sections. Try other pages.' : 'No conseguimos suficientes afirmaciones verificadas. Probamos distintos apartados; podés reintentar con otras páginas.')
            : response.status === 503
              ? (english ? 'The AI service could not complete or verify the statements. Please try again later.' : 'El servidor no pudo completar la generación con IA o su validación. Revisá las claves de Gemini y reintentá.')
            : response.status === 500
              ? (english ? 'An internal error occurred while preparing true-or-false practice.' : 'Se produjo un error interno al preparar Verdadero o Falso.')
            : (english ? 'We could not prepare the practice. The server returned an unexpected response.' : 'No pudimos preparar la práctica. El servidor devolvió una respuesta inesperada.')
          );
          break;
        }
        const incoming=verifiedTrueFalsePool(data.questions as PracticeQuestion[]);
        accumulated=verifiedTrueFalsePool([...accumulated,...incoming]);
        if (sufficientTrueFalse(accumulated,freeV2 ? 1 : MIN_CASES_PER_PRACTICE)) break;
      }
      if (accumulated.length> trueFalsePool.length) setGeneratedTrueFalse(accumulated);
      if (!sufficientTrueFalse(accumulated,freeV2 ? 1 : MIN_CASES_PER_PRACTICE) &&
          trueFalseAttempts.current>=6) {
        setTrueFalseError((english ? 'We could not verify six statements across the material. Please try again later.' : 'No conseguimos seis afirmaciones verificadas después de revisar distintos apartados. Podés reintentar más tarde.'));
      }
    } catch (error) {
      setTrueFalseDiagnostic(error instanceof Error ? error.name : 'network_error');
      setTrueFalseError((english ? 'The connection dropped while preparing true-or-false questions. Please retry.' : 'La conexión se interrumpió mientras preparábamos Verdadero o Falso. Revisá tu conexión y reintentá.'));
    } finally {
      trueFalseBusy.current=false;
      setTrueFalseLoading(false);
    }
  },[materialId,trueFalsePool,freeV2,freeSessionGate]);
  useEffect(() => {
    if (mode !== 'opciones' || !aiAvailable ||
        sufficientTrueFalse(trueFalsePool, freeV2 ? 1 : MIN_CASES_PER_PRACTICE) ||
        trueFalseBusy.current || trueFalseLoading || trueFalseError || freeSessionGate === 'denied' ||
        trueFalseAttempts.current >= 6) return;
    void generateTrueFalse();
  },[mode,aiAvailable,trueFalsePool,trueFalseLoading,trueFalseError,generateTrueFalse,freeV2,freeSessionGate]);

  const [pairLoading, setPairLoading] = useState(false);
  const [pairError, setPairError] = useState('');
  const pairBusy = useRef(false);
  const pairAttempts = useRef(0);
  const generatePairs = useCallback(async () => {
    if (pairBusy.current || pairAttempts.current >= 6) return;
    pairBusy.current=true;pairAttempts.current++;
    setPairLoading(true);setPairError('');
    try {
      const response = await fetch('/api/practice/supplement', {
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({materialId,mode,round:pairAttempts.current-1,
          excludedTerms:pairs.map(p=>p.term)}),signal:AbortSignal.timeout(65000),
      });
      const body:unknown = await response.json();
      if (!response.ok || !body || typeof body !== 'object' ||
          !('pairs' in body) || !Array.isArray(body.pairs)) throw new Error('invalid');
      const fresh = selectPracticePairs([...(body.pairs as PracticePair[])]).filter(
        next=>!pairs.some(existing=>existing.term.toLowerCase()===next.term.toLowerCase()));
      if (!fresh.length) setPairError((english ? 'No additional distinct, verifiable concepts were found in this material.' : 'No encontramos otros conceptos independientes y verificables en este material.'));
      else setAddedPairs(previous=>[...previous,...fresh]);
    } catch {setPairError((english ? 'We could not prepare six reliable concepts. Please try again.' : 'No pudimos completar seis conceptos confiables. Podés reintentar.'));}
    finally {pairBusy.current=false;setPairLoading(false);}
  },[materialId,mode,pairs]);
  useEffect(()=>{
    const neededPairs = mode === 'mixto' ? 2 : MIN_CASES_PER_PRACTICE;
    if (!['unir','completar','mixto'].includes(mode) || pairs.length >= neededPairs ||
        pairLoading || pairBusy.current || pairError || pairAttempts.current >= 6) return;
    void generatePairs();
  },[mode,pairs.length,pairLoading,pairError,generatePairs]);

  const aiCaseButton = mode === 'casos' && aiAvailable && !ready && !freeV2 ? (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-800">{english ? "Want to try new real-world scenarios?" : "¿Querés resolver situaciones nuevas?"}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        {english
          ? 'AI can suggest new scenarios based on your material. We show only those that pass checks for concepts and source citations. Always compare the answers with your course notes.'
          : 'La IA puede proponer casos nuevos usando tu material. Solo mostramos los que pasan una comprobación de conceptos y citas; no reemplaza la revisión docente.'}
      </p>
      <button type="button" disabled={generating} onClick={() => { attempts.current=0;void generateNewCases(); }}
        className="mt-3 min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-blue-700 disabled:opacity-50">
        {t(generating ? 'Generando situaciones…' : ready ? 'Generar más casos con IA' : 'Reintentar generar casos')}
      </button>
      {generationError && <p role="status" className="mt-2 text-xs text-amber-800">{generationError}</p>}
      {generationDiagnostic && generationError &&
        <p className="mt-1 text-[11px] text-slate-500" data-practice-case-diagnostic>{generationDiagnostic}</p>}
    </div>
  ) : null;
  function transitionTo(action:()=>void) {
    if (leavingActivity) return;
    setLeavingActivity(true);
    window.setTimeout(()=>{
      action();
      setLeavingActivity(false);
    },200);
  }
  function completeWithTransition() {
    transitionTo(()=>setFinished(true));
  }
  function anotherRound() {
    if (previewResult) return;
    posted.current = '';
    setRound(value => freeV2 ? value : value + 1);
    setStep(0); setSelectedTerm(null); setMatches({}); setResponses({});
    setReviewed([]); setMarkedForReview([]); setFinished(false); setSecondsLeft(15 * 60); setDeadline(null); setExamStarted(false);
    sessionIdRef.current = null;
    setHistorySaveFailed(false);
  }
  function setResponse(value: string) {
    if (checked || finished) return;
    setResponses(old => ({ ...old, [step]: value }));
  }
  function reviewOrNext() {
    if (!checked && mode !== 'simulacro') { setReviewed(old => [...old, step]); return; }
    if (step < tasks.length - 1) { setStep(old => old + 1); return; }
    completeWithTransition();
  }
  const resultEntries: PracticeResultEntry[] = mode === 'unir'
    ? exercisePairs.map((pair, i) => ({
        index: i,
        prompt: t('Unir «') + pair.term + t('» con su definición'),
        selectedAnswer: previewResult && i >= previewResult.correct
          ? exercisePairs[(i + 1) % exercisePairs.length]?.definition ?? 'Otra definición'
          : exercisePairs[matches[i]]?.definition ?? 'Sin responder',
        correctAnswer: pair.definition,
        explanation: '',
        correct: correctAt(i),
        chapterTitle: pair.chapterTitle,
        modeLabel: 'Unir conceptos',
        pageStart: pair.pageStart,
      }))
    : tasks.map((task, i) => {
        const answer = task.type === 'recall' ? task.pair.term : task.question.answer;
        const selected = previewResult && i >= previewResult.correct
          ? task.type === 'recall'
            ? 'Otro concepto'
            : task.question.options.find(option => option !== answer) ?? 'Otra opción'
          : responses[i] || 'Sin responder';
        const modeLabel = mode === 'mixto'
          ? task.type === 'recall' ? 'Completar' : 'Opción múltiple'
          : mode === 'opciones' ? 'Verdadero o falso' : title[mode];
        return {
          index: i,
          prompt: task.type === 'recall' ? task.pair.definition : task.question.prompt,
          selectedAnswer: selected,
          correctAnswer: answer,
          explanation: task.type === 'recall'
            ? diagnosticFor(i) ?? ''
            : explanationFor(task.question),
          correct: correctAt(i),
          chapterTitle: task.type === 'recall' ? task.pair.chapterTitle : task.question.chapterTitle,
          modeLabel,
          pageStart: task.type === 'recall' ? task.pair.pageStart : task.question.pageStart,
        };
      });
  const fullReport = finished ? (
    <PracticeResultsScreen
      materialTitle={materialTitle}
      materialId={materialId}
      documentLabel={isWord ? 'DOC' : 'PDF'}
      modeLabel={t(mode === 'opciones' ? 'Verdadero o falso' : title[mode])}
      entries={resultEntries}
      preview={Boolean(previewResult)}
      closeHref={previewResult ? undefined : '/dashboard/practicar'}
      primaryAction={{
        label: english ? (mode === 'simulacro' ? (freeV2 ? 'Repeat mock exam' : 'New mock exam') : 'Practice again') : (mode === 'simulacro' ? (freeV2 ? 'Repetir simulacro' : 'Nuevo simulacro') : 'Practicar otra vez'),
        onClick: anotherRound,
        disabled: Boolean(previewResult),
      }}
      secondaryAction={previewResult ? undefined : {
        label: t(mode === 'casos' ? 'Volver a Practicar' : 'Volver al resumen'),
        href: mode === 'casos' ? '/dashboard/practicar' : '/materiales/' + materialId + '?tab=resumen',
      }}
      extraAction={historySaveFailed && !previewResult
        ? { label: t('Reintentar guardado'), onClick: saveCompletedSession }
        : undefined}
      note={historySaveFailed && !previewResult
        ? (english ? 'We could not save this practice to your history.' : 'No pudimos guardar esta práctica en el historial.')
        : undefined}
    />
  ) : null;

  const [revealPractice,setRevealPractice]=useState(false);
  useEffect(()=>{
    if(!ready){setRevealPractice(false);return;}
    const timer=window.setTimeout(()=>setRevealPractice(true),360);
    return()=>window.clearTimeout(timer);
  },[ready]);
  const pendingPreparation=!ready && !generationError && !pairError && !trueFalseError &&
    (generating || pairLoading || trueFalseLoading ||
      (aiAvailable && ['casos','mixto','simulacro','opciones','unir','completar'].includes(mode)));
  if (freeV2 && freeSessionGate === 'denied' && quotaPremiumHref && quotaBackHref) {
    return <FreePracticeLimitScreen
      kind={mode === 'unir' ? 'matching_round' : mode === 'casos' ? 'case'
        : mode === 'opciones' ? 'true_false' : mode === 'completar' ? 'complete'
        : mode === 'mixto' ? 'mixed' : 'simulator'}
      premiumHref={quotaPremiumHref} backHref={quotaBackHref}
      backLabel={quotaBackLabel} materialTitle={materialTitle}/>;
  }
  if (sessionRound && freeSessionGate === 'error') {
    return <main className="mx-auto max-w-[780px] px-4 py-8">
      <p role="alert" className="text-sm text-slate-700">{english ? 'We could not confirm your quota. Trying again will not deduct an already recorded session twice.' : 'No pudimos confirmar tu cupo. Reintentá: si el uso anterior se registró, no se descontará otra vez.'}</p>
      <button type="button" className="mt-4 min-h-11 rounded-xl border px-4 text-sm"
        onClick={() => { setFreeSessionGate('new'); if(mode==='simulacro') void claimSessionQuota(); }}>
        {english ? 'Try checking again' : 'Reintentar verificación'}
      </button>
      <Link href={quotaBackHref ?? '/dashboard/practicar'} className="ml-4 text-sm text-blue-600 underline">{english ? 'Back to practice' : 'Volver a Practicar'}</Link>
    </main>;
  }
  if (sessionRound && mode !== 'simulacro' && ready && freeSessionGate !== 'allowed')
    return <PracticePreparing mode={mode} ready={false}/>;
  if (!finished && (pendingPreparation || (ready && !revealPractice)))
    return <PracticePreparing mode={mode} ready={ready} />;

  if (ready && finished && fullReport) return fullReport;

  if (ready && !finished && mode === 'simulacro' && examStarted && current?.type === 'question') return <div className={leavingActivity?'practice-screen-leave':''}><ExamPracticeScreen key={step}
    materialTitle={materialTitle} index={step} secondsLeft={secondsLeft}
    questions={tasks.filter((task):task is Extract<Task,{type:'question'}>=>task.type==='question').map(task=>({prompt:task.question.prompt,options:task.question.options}))}
    answers={responses} marked={markedForReview} onSelect={setResponse}
    onNavigate={setStep}
    onToggleMark={()=>setMarkedForReview(previous=>previous.includes(step)?previous.filter(i=>i!==step):[...previous,step])}
    onSubmit={completeWithTransition} /></div>;

  if (ready && !finished && mode === 'unir') return <div className={leavingActivity?'practice-screen-leave':''}><MatchPracticeScreen
    materialTitle={materialTitle} pairs={exercisePairs} definitions={definitions}
    selectedTerm={selectedTerm} onSelectTerm={setSelectedTerm} matches={matches}
    onMatch={(term,definition) => {
      // Incorrect associations stay editable until the student finds the right pair.
      setMatches(old => {
        const next={...old};
        for(const key of Object.keys(next)) if(next[Number(key)]===definition) delete next[Number(key)];
        next[term]=definition;
        return next;
      });
      setSelectedTerm(null);
    }} onFinish={completeWithTransition} /></div>;
  if (ready && !finished && mode === 'mixto' && current?.type === 'question') return <div className={leavingActivity?'practice-screen-leave':''}><MixedPracticeScreen key={step}
    materialTitle={materialTitle} prompt={current.question.prompt} options={current.question.options}
    index={step} total={total} value={responses[step] ?? ''} checked={checked}
    correct={correctAt(step)} answer={current.question.answer}
    explanation={groundedPracticeExplanation(current.question,pairs)}
    page={isWord ? null : current.question.pageStart}
    pdfHref={current.question.pageStart && !isWord ? pdfPageHref(current.question.pageStart) : null}
    onSelect={setResponse} onConfirm={reviewOrNext}
    onSkip={() => { if(step<tasks.length-1)setStep(step+1);else completeWithTransition(); }} /></div>;
  if (ready && !finished && mode === 'completar' && current?.type === 'recall') return <div className={leavingActivity?'practice-screen-leave':''}><CompletePracticeScreen key={step}
    materialTitle={materialTitle} definition={current.pair.definition}
    index={step} total={total} value={responses[step] ?? ''} checked={checked}
    correct={correctAt(step)} answer={current.pair.term}
    explanation={t(checked && !correctAt(step) ? 'Repasá el concepto y volvé a intentarlo en otra ronda.' : 'Este concepto forma parte del material que estás estudiando.')}
    onChange={setResponse} onConfirm={reviewOrNext}
    onPrevious={() => { if(step>0)setStep(step-1); }}
    onSkip={() => { if(step<tasks.length-1)setStep(step+1);else completeWithTransition(); }} /></div>;
  if (ready && !finished && mode === 'casos' && current?.type === 'question') return <div className={leavingActivity?'practice-screen-leave':''}><CasesPracticeScreen key={step}
    materialTitle={materialTitle} question={current.question}
    index={step} total={total} value={responses[step] ?? ''} checked={checked}
    correct={correctAt(step)} explanation={correctAt(step) ? '' : explanationFor(current.question)}
    pdfHref={current.question.pageStart && !isWord ? pdfPageHref(current.question.pageStart) : null}
    onSelect={setResponse} onNext={reviewOrNext}
    onPrevious={() => { if(step>0)setStep(step-1); }}
    onSkip={() => { if(step<tasks.length-1)setStep(step+1);else completeWithTransition(); }}
    /></div>;

  return <main className="mx-auto w-full max-w-[780px] px-3 py-4 pb-16 sm:px-5 sm:py-6">
    <Link href="/dashboard/practicar" className="text-xs text-slate-500 hover:text-blue-600">← {t('Volver a Practicar')}</Link>
    {mode === 'opciones' ? (
      <div className="mt-3 flex min-w-0 items-center gap-2.5">
        <h1 className="shrink-0 text-[20px] font-semibold tracking-tight text-slate-900">{t(title[mode])}</h1>
        <span aria-hidden="true" className="shrink-0 text-slate-300">·</span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-slate-500 sm:text-sm" title={materialTitle}>{materialTitle}</span>
      </div>
    ) : (
      <>
        <h1 className="mt-3 text-[20px] font-semibold tracking-tight text-slate-900">{t(title[mode])}</h1>
        <p className="mt-1 truncate text-sm text-slate-500" title={materialTitle}>{materialTitle}</p>
      </>
    )}
    {!ready ? <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
      <h2 className="font-medium text-slate-800">{mode === 'opciones' && trueFalseLoading
        ? (english ? 'Preparing true-or-false statements…' : 'Preparando afirmaciones de Verdadero o Falso…')
        : mode === 'opciones' && trueFalseError
          ? (english ? 'Could not start true-or-false practice' : 'No pudimos iniciar Verdadero o Falso')
          : mode === 'casos' && generating
            ? (english ? 'Preparing your practice cases…' : 'Preparando tus casos prácticos…')
            : (english ? 'Not enough reliable exercises' : 'No hay suficientes ejercicios confiables')}</h2>
      {mode === 'mixto' && contexts.length === 0 ? <p className="mt-2">{english ? 'At least one applied case is needed alongside the questions and concepts. We are trying to create one from your document.' : 'Falta al menos un caso real de aplicación, además de las preguntas y conceptos. Estamos intentando generar uno a partir del documento.'}</p> : null}
      {mode === 'opciones' ? <p className="mt-2">
        {trueFalsePool.length} {english ? 'of' : 'de'} {MIN_CASES_PER_PRACTICE} {english ? 'verified statements.' : 'afirmaciones verificadas.'}
        {trueFalseLoading ? (english ? ' We are checking statements and explanations against your document.' : ' Estamos comprobando afirmaciones y sus correcciones contra el documento.') :
          (english ? ' We need at least six statements, including true and false answers.' : ' Para comenzar necesitamos al menos seis afirmaciones, con respuestas verdaderas y falsas.')}
      </p> : mode === 'casos' ? <p className="mt-2">
        {contexts.length} {english ? 'of' : 'de'} {MIN_CASES_PER_PRACTICE} {english ? 'verified practice cases.' : 'casos de aplicación verificados.'}
        {generating ? (english ? ' We are creating new cases from your material.' : ' Estamos creando situaciones nuevas a partir de tu material.') :
          (english ? ' We need six distinct cases with verifiable answers to begin.' : ' Necesitamos seis casos distintos y con respuestas comprobables antes de comenzar.')}
      </p> : <p className="mt-2">{english ? 'This material does not yet contain enough verified content for this activity. We will not invent questions or assess you using ambiguous answers.' : <>Este material todavía no tiene contenido verificable suficiente para {title[mode].toLowerCase()}. No vamos a inventar preguntas ni evaluarte con respuestas ambiguas.</>}</p>}
      {aiCaseButton}
      {trueFalseError && <p role="status" className="mt-3 text-sm text-amber-800">{trueFalseError}</p>}
      {mode === 'opciones' && trueFalseError && process.env.NODE_ENV !== 'production' && trueFalseDiagnostic &&
        <p className="mt-1 text-xs text-slate-500" data-practice-diagnostic>{trueFalseDiagnostic}</p>}
      {pairLoading && <p role="status" className="mt-3 text-sm text-slate-500">{english ? 'Preparing concepts from your material…' : 'Preparando conceptos del material…'}</p>}
      {pairError && <p role="status" className="mt-3 text-sm text-amber-800">{pairError}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
      {mode !== 'casos' && <button type="button" disabled={pairLoading || generating || trueFalseLoading}
        onClick={() => {
          if (mode === 'opciones') {
            trueFalseAttempts.current=0;void generateTrueFalse();
          } else if (mode === 'unir' || mode === 'completar' ||
              (mode === 'mixto' && pairs.length < 2)) {
            pairAttempts.current=0;void generatePairs();
          } else {
            attempts.current=0;void generateNewCases();
          }
        }}
        className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm text-blue-700">
        {pairLoading || generating || trueFalseLoading ? (english ? 'Preparing practice…' : 'Preparando práctica…') : (english ? 'Retry generating six exercises' : 'Reintentar completar seis ejercicios')}
      </button>}
      <Link href={'/materiales/' + materialId + '?tab=ejercicios'} className="inline-flex min-h-11 items-center text-blue-600 underline">
        {english ? 'Back to general practice' : 'Volver a la práctica general'}
      </Link>
      </div>
    </section> : finished ? fullReport : mode === 'simulacro' && !examStarted ? (
      <section className={`${leavingActivity?'practice-screen-leave':'practice-screen-enter'} mx-auto mt-4 w-full max-w-[920px] rounded-[22px] bg-white px-4 py-5 sm:border sm:border-[#E7EBF4] sm:px-10 sm:py-9 sm:shadow-[0_8px_28px_rgba(15,23,42,0.04)] lg:px-14`}>
        <div className="mx-auto max-w-[650px] text-center">
          <img src="/evi-pensando.svg" alt="" className="mx-auto mb-4 size-[92px] object-contain sm:size-[112px]" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F7EF] px-3 py-1 text-[12px] font-bold text-[#16774F]"><span aria-hidden="true">✓</span> {english ? 'Ready' : 'Listo'}</span>
          <h1 className="mt-3 text-[25px] font-extrabold tracking-[-.035em] text-[#0F1B3D] sm:text-[32px]">{english ? 'Your mock exam is ready' : 'Tu simulacro está listo'}</h1>
          <p className="mx-auto mt-2 max-w-[45ch] text-[14px] leading-6 text-slate-600 sm:text-[15px]">{english ? 'The questions are based on your uploaded material. Start whenever you are ready.' : 'Armé las preguntas con lo que cargaste. Cuando quieras, arrancamos.'}</p>
          <div className="mx-auto mt-5 flex min-w-0 max-w-full items-center gap-3 rounded-[14px] border border-[#E7EBF4] px-4 py-3 text-left sm:max-w-[440px]">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#456DBD]"><span aria-hidden="true">▤</span></span>
            <div className="min-w-0"><p className="text-[10px] font-bold tracking-[.08em] text-slate-500">MATERIAL</p><p className="truncate text-[13px] font-semibold text-[#0F1B3D]">{materialTitle}</p></div>
          </div>
          <div className="mx-auto mt-5 divide-y divide-[#EEF1F6] rounded-[18px] border border-[#E7EBF4] px-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:max-w-[560px] sm:px-6">
            {[
              [`${total} ${english ? 'questions' : 'preguntas'}`, verifiedChapterCount >= 2 ? (english ? 'From different topics in your material.' : 'De distintos temas de tu material.') : (english ? 'Created from your material.' : 'Preparadas a partir de tu material.'), '❔'],
              [english ? '15 minutes' : '15 minutos', english ? 'You can submit early if you finish.' : 'Podés entregar antes si terminás.', '◷'],
              [english ? 'Answers shown at the end' : 'Sin soluciones hasta el final', english ? 'You can go back or leave questions unanswered.' : 'Podés volver atrás y dejar respuestas sin completar.', '✓'],
            ].map(([title,description,icon])=><div key={title} className="flex items-center gap-3 py-4 text-left"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#456DBD]">{icon}</span><div className="min-w-0"><p className="text-[14px] font-semibold text-[#0F1B3D]">{title}</p><p className="mt-0.5 text-[12px] leading-5 text-slate-600 sm:text-[13px]">{description}</p></div></div>)}
          </div>
          <div className="mx-auto mt-6 flex max-w-[560px] flex-col gap-2">
            <button type="button" disabled={freeSessionGate === 'pending'} onClick={() => {
              if (!freeV2 || freeSessionGate === 'allowed') {
                transitionTo(()=>setExamStarted(true));
                return;
              }
              void claimSessionQuota().then(allowed => { if (allowed) transitionTo(()=>setExamStarted(true)); });
            }} className="min-h-12 w-full rounded-full bg-[#456DBD] px-6 text-[15px] font-bold text-white transition hover:bg-[#3A5CA8] disabled:opacity-60">
              {t(freeSessionGate === 'pending' ? 'Verificando cupo…' : 'Comenzar simulacro')}
            </button>
            <Link href="/dashboard/practicar" className="inline-flex min-h-11 items-center justify-center text-[13px] font-semibold text-slate-600 hover:text-[#456DBD]">{english ? 'Not now, back to practice' : 'Ahora no, volver a Practicar'}</Link>
          </div>
        </div>
      </section>
    ) : <section className="mt-6">
      {aiCaseButton}
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{mode === 'unir' ? (english ? 'Match concepts with their definitions' : 'Relacioná los conceptos con sus definiciones') :
          (english ? 'Question ' : 'Pregunta ') + (step + 1) + (english ? ' of ' : ' de ') + total}</span>
        {mode === 'simulacro' ? <span role="timer" className="font-medium tabular-nums">
          {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} {english ? 'remaining' : 'restantes'}
        </span> : <span>{answeredCount} {english ? 'of' : 'de'} {total} {english ? 'answered' : 'respondidas'}</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={english ? 'Practice progress' : 'Progreso de la práctica'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((mode === 'unir' ? answeredCount : step + 1) / Math.max(total, 1) * 100)}>
        <div className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: ((mode === 'unir' ? answeredCount : step + 1) / Math.max(total, 1) * 100) + '%' }} />
      </div>
      {mode === 'unir' ? <>
        <p className="mb-2 mt-6 text-xs font-medium text-slate-600">{english ? "First, choose a concept" : "Primero elegí un concepto"}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{exercisePairs.map((pair, i) => (
          <button type="button" key={pair.term} aria-pressed={selectedTerm === i} onClick={() => setSelectedTerm(i)}
            className={'min-h-14 rounded-xl border p-3 text-left text-sm transition ' +
              (selectedTerm === i ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white')}>
            {pair.term}{matches[i] !== undefined ? (english ? ' · Matched' : ' · Vinculado') : ''}
          </button>
        ))}</div>
        <p className="mb-2 mt-6 text-xs font-medium text-slate-600">{english ? "Then, select its definition" : "Después, tocá su definición"}</p>
        <div className="space-y-2">{definitions.map(({ pair, pairIndex }) => {
          const matchedIndex = Object.keys(matches).find(key => matches[Number(key)] === pairIndex);
          return <button key={pairIndex} type="button" disabled={selectedTerm === null} onClick={() => {
            if (selectedTerm === null) return;
            setMatches(old => {
              const next = { ...old };
              for (const key of Object.keys(next))
                if (next[Number(key)] === pairIndex) delete next[Number(key)];
              next[selectedTerm] = pairIndex;
              return next;
            });
            setSelectedTerm(null);
          }} className="flex min-h-14 w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left text-sm disabled:opacity-75">
            <span className="flex-1">{pair.definition}</span>
            {matchedIndex !== undefined &&
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
                {exercisePairs[Number(matchedIndex)]?.term}
              </span>}
          </button>;
        })}</div>
        <button type="button" disabled={answeredCount !== total} onClick={completeWithTransition}
          className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-5 text-sm font-medium text-white disabled:opacity-40">
          {english ? 'Check matches' : 'Corregir asociaciones'}
        </button>
      </> : current && <>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          {current.type === 'recall' ? <>
            <p className="text-xs text-slate-500">{english ? 'Type the specific term from your material. Spelling variants and source-supported equivalents are accepted.' : 'Escribí el término específico que aparece en el material. Aceptamos tildes, variantes gramaticales y equivalencias documentadas.'}</p>
            <p className="mt-3 text-base leading-7 text-slate-900">________: {current.pair.definition}</p>
            <label htmlFor="practice-input" className="mt-5 block text-xs font-medium text-slate-600">{english ? 'Concept' : 'Concepto'}</label>
            <input id="practice-input" type="text" autoComplete="off" maxLength={120}
              disabled={checked || mode === 'simulacro'} value={responses[step] ?? ''}
              onChange={event => setResponse(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-blue-500"
              placeholder={english ? 'Enter the term' : 'Escribí el término'} />
          </> : <>
            {mode === 'opciones' && <p className="mb-2 text-center text-xs font-medium text-slate-500">{english ? 'True or false?' : '¿Verdadero o falso?'}</p>}
            <p className="text-base font-medium leading-7 text-slate-900">{current.question.prompt}</p>
            <div className={mode === 'opciones' ? 'mt-5 grid grid-cols-2 gap-3' : 'mt-5 space-y-2'}>{current.question.options.map(option =>
              <button key={option} type="button" disabled={checked} aria-pressed={responses[step] === option}
                onClick={() => setResponse(option)}
                className={'min-h-12 w-full rounded-xl border p-3 text-sm transition disabled:cursor-default ' +
                  (mode === 'opciones' ? 'text-center ' : 'text-left ') +
                  (checked && mode !== 'simulacro'
                    ? answeredOptionClass(normalizedAnswer(option) === normalizedAnswer(current.question.answer) ? 'correct' : responses[step] === option ? 'wrong' : 'other')
                    : responses[step] === option ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}>
                {checked && mode !== 'simulacro' && normalizedAnswer(option) === normalizedAnswer(current.question.answer)
                  ? <span className="sr-only">{english ? 'Correct answer: ' : 'Respuesta correcta: '}</span>
                  : checked && mode !== 'simulacro' && responses[step] === option
                    ? <span className="sr-only">{english ? 'Your answer, incorrect: ' : 'Tu respuesta, incorrecta: '}</span>
                    : null}
                {option}
              </button>
            )}</div>
          </>}
        </div>
        {checked && mode !== 'simulacro' && current.type === 'question' && <div role="status" className="mt-4">
          <AnswerFeedback correct={correctAt(step)} chosen={responses[step]}
            explanation={correctAt(step) ? '' : [diagnosticFor(step), explanationFor(current.question)].filter(Boolean).join('\n\n')}
            page={!isWord && current.question.pageStart ? (english ? `Page ${current.question.pageStart}` : `Página ${current.question.pageStart}`) : null}
            pdfHref={!isWord && current.question.pageStart ? pdfPageHref(current.question.pageStart) : null} />
        </div>}
        {checked && mode !== 'simulacro' && current.type === 'recall' && <div role="status" className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
          <p className={correctAt(step) ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>
            {correctAt(step) ? (english ? 'Correct' : 'Bien resuelto') : (english ? 'Needs review' : 'Para reforzar')}
          </p>
          {!correctAt(step) && responses[step]?.trim() &&
            <p className="mt-1 text-slate-600">
              {english ? 'Your answer does not match a term or an explicit equivalent in the material: ' : 'La respuesta escrita no coincide con el término o una equivalencia explícita del material: '}{responses[step]}
            </p>}
          <p className="mt-1 text-slate-700">{t('Respuesta: ')}{current.pair.term}</p>
          {diagnosticFor(step) && <p className="mt-1 text-slate-700">{diagnosticFor(step)}</p>}
          {current.type === 'recall' && current.pair.pageStart && <Link
            href={'/materiales/' + materialId + '?tab=resumen&page=' + current.pair.pageStart}
            className="mt-2 inline-block text-blue-600 underline">{english ? "Review this concept in the source · page" : "Revisar el concepto en el material · página"} {current.pair.pageStart}</Link>}

        </div>}
        <div className={mode === 'opciones'
          ? 'mt-5 flex w-full items-center justify-between gap-2'
          : 'mt-5 flex flex-wrap items-center gap-2'}>
          <button type="button" disabled={step === 0} onClick={() => setStep(value => value - 1)}
            className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm disabled:opacity-40">
            Anterior
          </button>
          {mode === 'simulacro' ? <>
            {step < total - 1 && <button type="button" onClick={() => setStep(value => value + 1)}
              className="ml-auto min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white">
              {t(responses[step] ? 'Siguiente' : 'Omitir')}
            </button>}
            <button type="button" onClick={completeWithTransition}
              className={'min-h-11 rounded-xl border px-4 text-sm ' +
                (step === total - 1 ? 'ml-auto bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700')}>
              Entregar examen
            </button>
          </> : <button type="button" disabled={!checked && !responses[step]?.trim()} onClick={reviewOrNext}
            className="ml-auto min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white disabled:opacity-40">
            {t(!checked ? 'Comprobar respuesta' : step === total - 1 ? 'Ver resultados' : 'Siguiente')}
          </button>}
        </div>
      </>}
      {mode === 'casos' && <p className="mt-4 text-xs text-slate-500">
        {contexts.some(question => question.level === 'aplicar')
          ? 'Las situaciones son ficticias y sirven para aplicar conceptos documentados. Algunos ejercicios también pueden comprobar clasificaciones.'
          : 'Esta actividad identifica categorías descritas en tu material; no evalúa todavía la aplicación a situaciones nuevas.'}
      </p>}
    </section>}
  </main>;
}
