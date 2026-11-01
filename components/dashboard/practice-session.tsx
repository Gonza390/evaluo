'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MatchPracticeScreen, CasesPracticeScreen, CompletePracticeScreen, MixedPracticeScreen } from '@/components/dashboard/practice-visual-screens';
import { selectBalancedTrueFalse, sufficientTrueFalse, verifiedTrueFalsePool } from '@/lib/student-materials/practice-true-false';
import {
  allowedWrittenVariants, balancedQuestions, groundedPracticeContrast,
  groundedPracticeExplanation,
  distinctApplicationCases, isCorrectWrittenAnswer, MIN_CASES_PER_PRACTICE, qualifiedQuestions, selectMixedQuestions,
  selectPracticePairs, type PracticePair, type PracticeQuestion,
} from '@/lib/student-materials/practice-modes';

type Mode = 'unir' | 'completar' | 'casos' | 'mixto' | 'simulacro' | 'opciones';
type Task = { type: 'question'; question: PracticeQuestion } | { type: 'recall'; pair: PracticePair };
const title: Record<Mode, string> = {
  unir: 'Unir conceptos', completar: 'Completar', casos: 'Casos',
  mixto: 'Práctica mixta', simulacro: 'Simulacro de examen', opciones: 'Opciones',
};
const rotate = <T,>(values: T[], amount: number) =>
  values.length ? [...values.slice(amount % values.length), ...values.slice(0, amount % values.length)] : values;

export function PracticeSession({ mode, materialId, materialTitle, glossary, questions, cases, aiAvailable = false, isWord = false }: {
  mode: Mode; materialId: string; materialTitle: string;
  glossary: PracticePair[]; questions: PracticeQuestion[]; cases: PracticeQuestion[];
  aiAvailable?: boolean; isWord?: boolean;
}) {
  const [addedPairs, setAddedPairs] = useState<PracticePair[]>([]);
  const [generatedOptions, setGeneratedOptions] = useState<PracticeQuestion[]>([]);
  const [generatedTrueFalse, setGeneratedTrueFalse] = useState<PracticeQuestion[]>([]);
  const [trueFalseLoading, setTrueFalseLoading] = useState(false);
  const [trueFalseError, setTrueFalseError] = useState('');
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
  const attempts = useRef(0);
  const generatingRequest = useRef(false);
  const contexts = useMemo(() => distinctApplicationCases([
    ...generatedCases, ...cases, ...questions,
  ]), [questions, cases, generatedCases]);
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [reviewed, setReviewed] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [examStarted, setExamStarted] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const posted = useRef('');
  const exercisePairs = useMemo(() => rotate(pairs, round * 6).slice(0, 6), [pairs, round]);
  const definitions = useMemo(() => rotate(
    exercisePairs.map((pair, pairIndex) => ({ pair, pairIndex })), exercisePairs.length > 1 ? 2 : 0,
  ), [exercisePairs]);

  const tasks = useMemo<Task[]>(() => {
    if (mode === 'unir') return [];
    if (mode === 'completar')
      return rotate(pairs, round * 5).slice(0, 6).map(pair => ({ type: 'recall' as const, pair }));
    if (mode === 'casos')
      return rotate(contexts, round * 5).slice(0, 8).map(question => ({ type: 'question' as const, question }));
    if (mode === 'simulacro')
      return balancedQuestions(options, 10, round).map(question => ({ type: 'question' as const, question }));
    if (mode === 'opciones')
      return selectBalancedTrueFalse(trueFalsePool, 8, round).map(question => ({ type: 'question' as const, question }));
    const mixed = selectMixedQuestions(options, contexts, round);
    const base = mixed.questions.map(question => ({ type: 'question' as const, question }));
    const recalled = rotate(pairs, round * 3).slice(0, 2).map(pair => ({ type: 'recall' as const, pair }));
    const applied = mixed.application ? [{ type: 'question' as const, question:mixed.application }] : [];
    return [...base.slice(0, 3), ...recalled, ...applied, ...base.slice(3)];
  }, [mode, pairs, options, contexts, trueFalsePool, round]);

  const total = mode === 'unir' ? exercisePairs.length : tasks.length;
  const ready = mode === 'unir' ? exercisePairs.length >= MIN_CASES_PER_PRACTICE :
    mode === 'casos' ? contexts.length >= MIN_CASES_PER_PRACTICE :
    mode === 'completar' ? tasks.length >= MIN_CASES_PER_PRACTICE :
    mode === 'mixto' ? tasks.length >= MIN_CASES_PER_PRACTICE && options.length >= 4 && pairs.length >= 2 && distinctApplicationCases(contexts).length >= 1 :
    mode === 'opciones' ? sufficientTrueFalse(trueFalsePool, MIN_CASES_PER_PRACTICE) :
    tasks.length >= MIN_CASES_PER_PRACTICE;
  const correctAt = (index: number) => {
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
    if (!task || correctAt(index) || mode === 'opciones') return null;
    const response = responses[index] ?? '';
    return task.type === 'recall'
      ? groundedPracticeContrast(response, task.pair.term, pairs)
      : groundedPracticeContrast(response, task.question.answer, pairs);
  };
  const current = tasks[step];
  const checked = reviewed.includes(step);

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

  useEffect(() => {
    if (!finished || !ready) return;
    const attempt = materialId + ':' + mode + ':' + round;
    if (posted.current === attempt) return;
    posted.current = attempt;
    // Analytics-only score. The server intentionally does not treat this as verified mastery.
    void fetch('/api/practice/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId, mode, correct: score, total }),
    }).catch(() => undefined);
  // Only send on transition to completed; responses cannot change after completion.
  }, [finished]);

  const generateNewCases = useCallback(async () => {
    if (generatingRequest.current) return;
    generatingRequest.current = true;
    attempts.current += 1;
    setGenerating(true); setGenerationError('');
    try {
      const response = await fetch('/api/practice/cases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId, round: attempts.current - 1,
          existingScenarios: contexts.map(q => q.prompt.split(/\n\s*\n/)[0]).slice(0, 24),
        }),
        signal: AbortSignal.timeout(65000),
      });
      const body: unknown = await response.json();
      if (!response.ok || !body || typeof body !== 'object' || !('cases' in body) ||
          !Array.isArray(body.cases) || body.cases.length < 1) {
        setGenerationError(response.status === 429
          ? 'Se alcanzó el límite de generación por hoy. Este material todavía no tiene seis casos verificables.'
          : 'No pudimos generar más situaciones con respaldo suficiente en este material. No vamos a completar los seis con casos inventados.');
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
    } catch {
      setGenerationError('No pudimos conectarnos para generar los casos. Podés reintentar.');
    } finally {
      generatingRequest.current = false;
      setGenerating(false);
    }
  }, [materialId, contexts, options, mode]);
  // The student enters an actual six-case session only when enough verified
  // applications exist. Try again with fresh source snippets if QA rejects any.
  useEffect(() => {
    const needsMore = mode === 'casos'
      ? contexts.length < MIN_CASES_PER_PRACTICE
      : mode === 'mixto' ? options.length < 4 || contexts.length < 1
      : mode === 'simulacro'
        ? options.length < MIN_CASES_PER_PRACTICE : false;
    if (!aiAvailable || !needsMore || generating || generationError ||
        attempts.current >= 6 || generatingRequest.current) return;
    void generateNewCases();
  }, [mode, aiAvailable, contexts.length, options.length, generating, generationError, generateNewCases]);
  const generateTrueFalse = useCallback(async () => {
    if (trueFalseBusy.current) return;
    trueFalseBusy.current = true;
    trueFalseAttempts.current += 1;
    setTrueFalseLoading(true);
    setTrueFalseError('');
    try {
      const response = await fetch('/api/practice/true-false', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          materialId,
          round:trueFalseAttempts.current - 1,
          previous:trueFalsePool.map(q => q.prompt),
        }),
        signal:AbortSignal.timeout(65000),
      });
      const data:unknown = await response.json();
      if (!response.ok || !data || typeof data !== 'object' ||
          !('questions' in data) || !Array.isArray(data.questions)) {
        setTrueFalseError(response.status === 429
          ? 'Se alcanzó el límite de generación de hoy. No vamos a mostrar afirmaciones sin verificar.'
          : 'No encontramos nuevas afirmaciones con respuestas comprobables en este material. Podés reintentar.');
        return;
      }
      const incoming = verifiedTrueFalsePool(data.questions as PracticeQuestion[]);
      const unique = verifiedTrueFalsePool([...trueFalsePool,...incoming]);
      if (unique.length === trueFalsePool.length) {
        setTrueFalseError('La IA no encontró afirmaciones nuevas y diferentes. Podés reintentar con otros apartados.');
        return;
      }
      setGeneratedTrueFalse(unique);
    } catch {
      setTrueFalseError('No pudimos generar afirmaciones verificadas. Reintentá más tarde.');
    } finally {
      trueFalseBusy.current=false;
      setTrueFalseLoading(false);
    }
  },[materialId,trueFalsePool]);
  useEffect(() => {
    if (mode !== 'opciones' || !aiAvailable ||
        sufficientTrueFalse(trueFalsePool, MIN_CASES_PER_PRACTICE) ||
        trueFalseBusy.current || trueFalseLoading || trueFalseError ||
        trueFalseAttempts.current >= 6) return;
    void generateTrueFalse();
  },[mode,aiAvailable,trueFalsePool,trueFalseLoading,trueFalseError,generateTrueFalse]);

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
      if (!fresh.length) setPairError('No encontramos otros conceptos independientes y verificables en este material.');
      else setAddedPairs(previous=>[...previous,...fresh]);
    } catch {setPairError('No pudimos completar seis conceptos confiables. Podés reintentar.');}
    finally {pairBusy.current=false;setPairLoading(false);}
  },[materialId,mode,pairs]);
  useEffect(()=>{
    const neededPairs = mode === 'mixto' ? 2 : MIN_CASES_PER_PRACTICE;
    if (!['unir','completar','mixto'].includes(mode) || pairs.length >= neededPairs ||
        pairLoading || pairBusy.current || pairError || pairAttempts.current >= 6) return;
    void generatePairs();
  },[mode,pairs.length,pairLoading,pairError,generatePairs]);

  const aiCaseButton = mode === 'casos' && aiAvailable && (!ready || finished) ? (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-800">¿Querés resolver situaciones nuevas?</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        La IA puede proponer casos nuevos usando tu material. Solo mostramos los que pasan una
        comprobación de conceptos y citas; no reemplaza la revisión docente.
      </p>
      <button type="button" disabled={generating} onClick={generateNewCases}
        className="mt-3 min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-blue-700 disabled:opacity-50">
        {generating ? 'Generando situaciones…' : ready ? 'Generar más casos con IA' : 'Reintentar generar casos'}
      </button>
      {generationError && <p role="status" className="mt-2 text-xs text-amber-800">{generationError}</p>}
    </div>
  ) : null;
  function anotherRound() {
    setRound(value => value + 1);
    setStep(0); setSelectedTerm(null); setMatches({}); setResponses({});
    setReviewed([]); setFinished(false); setSecondsLeft(15 * 60); setDeadline(null); setExamStarted(false);
  }
  function setResponse(value: string) {
    if (checked || finished) return;
    setResponses(old => ({ ...old, [step]: value }));
  }
  function reviewOrNext() {
    if (!checked && mode !== 'simulacro') { setReviewed(old => [...old, step]); return; }
    if (step < tasks.length - 1) { setStep(old => old + 1); return; }
    setFinished(true);
  }
  const fullReport = finished ? (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-live="polite">
      <p className="text-xs text-slate-500">Resultado de {title[mode].toLowerCase()}</p>
      <h2 className="mt-2 text-3xl font-semibold text-slate-900">{score} de {total}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {score === total ? 'Completaste la actividad sin errores.' :
          'Revisá las respuestas que te costaron y volvé al material para reforzarlas.'}
      </p>
      {missedTopics.length > 0 && <div className="mt-4 rounded-xl bg-blue-50/60 p-4">
        <p className="text-sm font-medium text-slate-800">Temas sugeridos para repasar</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
          {missedTopics.map(topic => <li key={topic}>{topic}</li>)}
        </ul>
      </div>}
      <div className="mt-6 space-y-3">
        {mode === 'unir' ? exercisePairs.map((pair, i) => (
          <article key={i} className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className={correctAt(i) ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>
              {correctAt(i) ? 'Correcta' : 'Para reforzar'} · {pair.term}
            </p>
            {!correctAt(i) && <p className="mt-1 text-slate-500">Tu elección: {exercisePairs[matches[i]]?.definition ?? 'Sin responder'}</p>}
            <p className="mt-1 text-slate-700">{pair.definition}</p>
          </article>
        )) : tasks.map((task, i) => {
          const answer = task.type === 'recall' ? task.pair.term : task.question.answer;
          const prompt = task.type === 'recall' ? task.pair.definition : task.question.prompt;
          return <article className="rounded-xl bg-slate-50 p-3 text-sm" key={i}>
            <p className={correctAt(i) ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>
              {correctAt(i) ? 'Correcta' : 'Para reforzar'} · {i + 1}
            </p>
            <p className="mt-1 text-slate-800">{prompt}</p>
            {!correctAt(i) && <p className="mt-1 text-slate-600">Tu respuesta: {responses[i] || 'Sin responder'}</p>}
            <p className="mt-1 text-slate-700">Respuesta esperada: {answer}</p>
            {diagnosticFor(i) && <p className="mt-1 text-slate-700">{diagnosticFor(i)}</p>}
            {task.type === 'question' && <>
              <p className="mt-1 text-slate-600">{groundedPracticeExplanation(task.question,pairs)}</p>
              {task.question.pageStart && <Link className="mt-2 inline-block text-blue-600 underline"
                href={'/materiales/' + materialId + '?tab=resumen&page=' + task.question.pageStart}>
                Revisar el material · página {task.question.pageStart}
              </Link>}
            </>}
          </article>;
        })}
      </div>
      {aiCaseButton}
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={anotherRound}
          className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white">{mode === 'simulacro' ? 'Nuevo simulacro' : 'Practicar otra vez'}</button>
        <Link href={'/materiales/' + materialId + '?tab=resumen'}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 text-sm">
          Volver al resumen
        </Link>
      </div>
      <p className="mt-3 text-xs text-slate-500">Este resultado es orientativo y todavía no modifica tu progreso de aprendizaje.</p>
    </section>
  ) : null;

  if (ready && !finished && mode === 'unir') return <MatchPracticeScreen
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
    }} onFinish={() => setFinished(true)} />;
  if (ready && !finished && mode === 'mixto' && current?.type === 'question') return <MixedPracticeScreen
    materialTitle={materialTitle} prompt={current.question.prompt} options={current.question.options}
    index={step} total={total} value={responses[step] ?? ''} checked={checked}
    correct={correctAt(step)} answer={current.question.answer}
    explanation={groundedPracticeExplanation(current.question,pairs)}
    onSelect={setResponse} onConfirm={reviewOrNext}
    onSkip={() => { if(step<tasks.length-1)setStep(step+1);else setFinished(true); }} />;
  if (ready && !finished && mode === 'completar' && current?.type === 'recall') return <CompletePracticeScreen
    materialTitle={materialTitle} definition={current.pair.definition}
    index={step} total={total} value={responses[step] ?? ''} checked={checked}
    correct={correctAt(step)} answer={current.pair.term}
    explanation={checked && !correctAt(step) ? 'Repasá el concepto y volvé a intentarlo en otra ronda.' : 'Este concepto forma parte del material que estás estudiando.'}
    onChange={setResponse} onConfirm={reviewOrNext}
    onPrevious={() => { if(step>0)setStep(step-1); }}
    onSkip={() => { if(step<tasks.length-1)setStep(step+1);else setFinished(true); }} />;
  if (ready && !finished && mode === 'casos' && current?.type === 'question') return <CasesPracticeScreen
    materialTitle={materialTitle} question={current.question}
    index={step} total={total} value={responses[step] ?? ''} checked={checked}
    correct={correctAt(step)} explanation={groundedPracticeExplanation(current.question,pairs)}
    onSelect={setResponse} onNext={reviewOrNext}
    onPrevious={() => { if(step>0)setStep(step-1); }}
    onSkip={() => { if(step<tasks.length-1)setStep(step+1);else setFinished(true); }}
    onGenerate={() => { void generateNewCases(); }} generating={generating} />;

  return <main className="mx-auto w-full max-w-[780px] px-4 py-7 pb-24 sm:px-6 sm:py-9">
    <Link href="/dashboard/practicar" className="text-xs text-slate-500 hover:text-blue-600">← Volver a Practicar</Link>
    <h1 className="mt-4 text-[23px] font-semibold tracking-tight text-slate-900">{title[mode]}</h1>
    <p className="mt-1 truncate text-sm text-slate-500" title={materialTitle}>{materialTitle}</p>
    {!ready ? <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
      <h2 className="font-medium text-slate-800">{mode === 'opciones' && trueFalseLoading
        ? 'Preparando afirmaciones de Verdadero o Falso…' : mode === 'casos' && generating
        ? 'Preparando tus casos prácticos…' : 'No hay suficientes ejercicios confiables'}</h2>
      {mode === 'mixto' && contexts.length === 0 ? <p className="mt-2">Falta al menos un caso real de aplicación, además de las preguntas y conceptos. Estamos intentando generar uno a partir del documento.</p> : null}
      {mode === 'opciones' ? <p className="mt-2">
        {trueFalsePool.length} de {MIN_CASES_PER_PRACTICE} afirmaciones verificadas.
        {trueFalseLoading ? ' Estamos comprobando afirmaciones y sus correcciones contra el documento.' :
          ' Para comenzar necesitamos al menos seis afirmaciones, con respuestas verdaderas y falsas.'}
      </p> : mode === 'casos' ? <p className="mt-2">
        {contexts.length} de {MIN_CASES_PER_PRACTICE} casos de aplicación verificados.
        {generating ? ' Estamos creando situaciones nuevas a partir de tu material.' :
          ' Necesitamos seis casos distintos y con respuestas comprobables antes de comenzar.'}
      </p> : <p className="mt-2">Este material todavía no tiene contenido verificable suficiente para {title[mode].toLowerCase()}.
        No vamos a inventar preguntas ni evaluarte con respuestas ambiguas.</p>}
      {aiCaseButton}
      {trueFalseError && <p role="status" className="mt-3 text-sm text-amber-800">{trueFalseError}</p>}
      {pairLoading && <p role="status" className="mt-3 text-sm text-slate-500">Preparando conceptos del material…</p>}
      {pairError && <p role="status" className="mt-3 text-sm text-amber-800">{pairError}</p>}
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
        className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm text-blue-700">
        {pairLoading || generating || trueFalseLoading ? 'Preparando práctica…' : 'Reintentar completar seis ejercicios'}
      </button>}
      <Link href={'/materiales/' + materialId + '?tab=ejercicios'} className="mt-4 inline-block text-blue-600 underline">
        Volver a la práctica general
      </Link>
    </section> : finished ? fullReport : mode === 'simulacro' && !examStarted ? (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <p className="text-sm font-medium text-slate-900">Antes de comenzar</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Vas a resolver {total} preguntas {verifiedChapterCount >= 2 ? 'de diferentes temas identificados' : 'distribuidas por el material'}. Tenés 15 minutos.
          Podés volver a preguntas anteriores, dejar respuestas sin completar y entregar antes.
          No vas a ver las soluciones hasta finalizar.
        </p>
        <button type="button" onClick={() => setExamStarted(true)}
          className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white">
          Comenzar simulacro
        </button>
      </section>
    ) : <section className="mt-6">
      {aiCaseButton}
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{mode === 'unir' ? 'Relacioná los conceptos con sus definiciones' :
          'Pregunta ' + (step + 1) + ' de ' + total}</span>
        {mode === 'simulacro' ? <span role="timer" className="font-medium tabular-nums">
          {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} restantes
        </span> : <span>{answeredCount} de {total} respondidas</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: ((mode === 'unir' ? answeredCount : step + 1) / total * 100) + '%' }} />
      </div>
      {mode === 'unir' ? <>
        <p className="mb-2 mt-6 text-xs font-medium text-slate-600">Primero elegí un concepto</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{exercisePairs.map((pair, i) => (
          <button type="button" key={pair.term} aria-pressed={selectedTerm === i} onClick={() => setSelectedTerm(i)}
            className={'min-h-14 rounded-xl border p-3 text-left text-sm transition ' +
              (selectedTerm === i ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white')}>
            {pair.term}{matches[i] !== undefined ? ' · Vinculado' : ''}
          </button>
        ))}</div>
        <p className="mb-2 mt-6 text-xs font-medium text-slate-600">Después, tocá su definición</p>
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
        <button type="button" disabled={answeredCount !== total} onClick={() => setFinished(true)}
          className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-5 text-sm font-medium text-white disabled:opacity-40">
          Corregir asociaciones
        </button>
      </> : current && <>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          {current.type === 'recall' ? <>
            <p className="text-xs text-slate-500">Escribí el término específico que aparece en el material. Aceptamos tildes, variantes gramaticales y equivalencias documentadas.</p>
            <p className="mt-3 text-base leading-7 text-slate-900">________: {current.pair.definition}</p>
            <label htmlFor="practice-input" className="mt-5 block text-xs font-medium text-slate-600">Concepto</label>
            <input id="practice-input" type="text" autoComplete="off" maxLength={120}
              disabled={checked || mode === 'simulacro'} value={responses[step] ?? ''}
              onChange={event => setResponse(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-blue-500"
              placeholder="Escribí el término" />
          </> : <>
            {mode === 'opciones' && <p className="mb-2 text-xs font-medium text-slate-500">¿Verdadero o falso?</p>}
            <p className="text-base font-medium leading-7 text-slate-900">{current.question.prompt}</p>
            <div className={mode === 'opciones' ? 'mt-5 grid grid-cols-2 gap-3' : 'mt-5 space-y-2'}>{current.question.options.map(option =>
              <button key={option} type="button" disabled={checked} aria-pressed={responses[step] === option}
                onClick={() => setResponse(option)}
                className={'min-h-12 w-full rounded-xl border p-3 text-left text-sm transition disabled:cursor-default ' +
                  (responses[step] === option ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}>
                {option}
              </button>
            )}</div>
          </>}
        </div>
        {checked && mode !== 'simulacro' && <div role="status" className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
          <p className={correctAt(step) ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>
            {correctAt(step) ? 'Bien resuelto' : 'Para reforzar'}
          </p>
          {!correctAt(step) && responses[step]?.trim() &&
            <p className="mt-1 text-slate-600">
              {current.type === 'recall'
                ? 'La respuesta escrita no coincide con el término o una equivalencia explícita del material: '
                : 'Elegiste: '}{responses[step]}
            </p>}
          <p className="mt-1 text-slate-700">{mode === 'opciones' ? 'La afirmación es: ' : 'Respuesta: '}{current.type === 'recall' ? current.pair.term : current.question.answer}</p>
          {diagnosticFor(step) && <p className="mt-1 text-slate-700">{diagnosticFor(step)}</p>}
          {current.type === 'question' && <p className="mt-1 text-slate-600">{groundedPracticeExplanation(current.question,pairs)}</p>}
          {current.type === 'recall' && current.pair.pageStart && <Link
            href={'/materiales/' + materialId + '?tab=resumen&page=' + current.pair.pageStart}
            className="mt-2 inline-block text-blue-600 underline">Revisar el concepto en el material · página {current.pair.pageStart}</Link>}

        </div>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" disabled={step === 0} onClick={() => setStep(value => value - 1)}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm disabled:opacity-40">
            Anterior
          </button>
          {mode === 'simulacro' ? <>
            {step < total - 1 && <button type="button" onClick={() => setStep(value => value + 1)}
              className="ml-auto min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white">
              {responses[step] ? 'Siguiente' : 'Omitir'}
            </button>}
            <button type="button" onClick={() => setFinished(true)}
              className={'min-h-11 rounded-xl border px-4 text-sm ' +
                (step === total - 1 ? 'ml-auto bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700')}>
              Entregar examen
            </button>
          </> : <button type="button" disabled={!checked && !responses[step]?.trim()} onClick={reviewOrNext}
            className="ml-auto min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white disabled:opacity-40">
            {!checked ? 'Comprobar respuesta' : step === total - 1 ? 'Ver resultados' : 'Siguiente'}
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
