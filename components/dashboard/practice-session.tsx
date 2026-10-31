'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  balancedQuestions, isCorrectWrittenAnswer, qualifiedQuestions,
  selectPracticePairs, type PracticePair, type PracticeQuestion,
} from '@/lib/student-materials/practice-modes';

type Mode = 'unir' | 'completar' | 'casos' | 'mixto' | 'simulacro';
type Task = { type: 'question'; question: PracticeQuestion } | { type: 'recall'; pair: PracticePair };
const title: Record<Mode, string> = {
  unir: 'Unir conceptos', completar: 'Completar', casos: 'Casos',
  mixto: 'Práctica mixta', simulacro: 'Simulacro de examen',
};
const rotate = <T,>(values: T[], amount: number) =>
  values.length ? [...values.slice(amount % values.length), ...values.slice(0, amount % values.length)] : values;

export function PracticeSession({ mode, materialId, materialTitle, glossary, questions, cases }: {
  mode: Mode; materialId: string; materialTitle: string;
  glossary: PracticePair[]; questions: PracticeQuestion[]; cases: PracticeQuestion[];
}) {
  const pairs = useMemo(() => selectPracticePairs(glossary), [glossary]);
  const options = useMemo(() => qualifiedQuestions(questions), [questions]);
  const [generatedCases, setGeneratedCases] = useState<PracticeQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const contexts = useMemo(() => qualifiedQuestions([
    ...generatedCases, ...questions.filter(q => q.level === 'aplicar'), ...cases,
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
  const exercisePairs = useMemo(() => rotate(pairs, round * 5).slice(0, 5), [pairs, round]);
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
    const base = balancedQuestions(options, 5, round).map(question => ({ type: 'question' as const, question }));
    const recalled = rotate(pairs, round * 3).slice(0, 3).map(pair => ({ type: 'recall' as const, pair }));
    const applied = rotate(contexts, round).slice(0, 1).map(question => ({ type: 'question' as const, question }));
    return [...base.slice(0, 3), ...recalled.slice(0, 2), ...applied, ...base.slice(3)];
  }, [mode, pairs, options, contexts, round]);

  const total = mode === 'unir' ? exercisePairs.length : tasks.length;
  const ready = mode === 'unir' ? exercisePairs.length >= 3 : mode === 'casos' ? contexts.length >= 2 :
    mode === 'completar' ? tasks.length >= 3 : tasks.length >= 4;
  const correctAt = (index: number) => {
    if (mode === 'unir') return matches[index] === index;
    const item = tasks[index];
    if (!item) return false;
    return item.type === 'recall'
      ? isCorrectWrittenAnswer(responses[index] ?? '', item.pair.term)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  async function generateNewCases() {
    if (generating) return;
    setGenerating(true); setGenerationError('');
    try {
      const response = await fetch('/api/practice/cases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId }),
      });
      const body: unknown = await response.json();
      if (!response.ok || !body || typeof body !== 'object' || !('cases' in body) ||
          !Array.isArray(body.cases) || body.cases.length < 1) {
        setGenerationError(response.status === 429
          ? 'Ya usaste los intentos de generación con IA de hoy. Podés seguir con los casos del material.'
          : 'No pudimos crear casos nuevos con evidencia suficiente. Podés continuar con los existentes.');
        return;
      }
      const newCases = (body.cases as PracticeQuestion[]);
      setGeneratedCases(newCases);
      setRound(value => value + 1); setStep(0); setResponses({}); setReviewed([]); setFinished(false);
    } catch {
      setGenerationError('No pudimos conectarnos para crear casos nuevos. Reintentá más tarde.');
    } finally { setGenerating(false); }
  }
  const aiCaseButton = mode === 'casos' ? (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-800">¿Querés resolver situaciones nuevas?</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        La IA puede proponer casos nuevos usando tu material. Solo mostramos los que pasan una
        comprobación de conceptos y citas; no reemplaza la revisión docente.
      </p>
      <button type="button" disabled={generating} onClick={generateNewCases}
        className="mt-3 min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-blue-700 disabled:opacity-50">
        {generating ? 'Generando situaciones…' : generatedCases.length ? 'Generar otros casos con IA' : 'Generar casos con IA'}
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
            {task.type === 'question' && <>
              <p className="mt-1 text-slate-600">{task.question.explanation}</p>
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

  return <main className="mx-auto w-full max-w-[780px] px-4 py-7 pb-24 sm:px-6 sm:py-9">
    <Link href="/dashboard/practicar" className="text-xs text-slate-500 hover:text-blue-600">← Volver a Practicar</Link>
    <h1 className="mt-4 text-[23px] font-semibold tracking-tight text-slate-900">{title[mode]}</h1>
    <p className="mt-1 truncate text-sm text-slate-500" title={materialTitle}>{materialTitle}</p>
    {!ready ? <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
      <h2 className="font-medium text-slate-800">No hay suficientes ejercicios confiables</h2>
      <p className="mt-2">Este material todavía no tiene contenido verificable suficiente para {title[mode].toLowerCase()}.
        No vamos a inventar preguntas ni evaluarte con respuestas ambiguas.</p>
      {aiCaseButton}
      <Link href={'/materiales/' + materialId + '?tab=ejercicios'} className="mt-4 inline-block text-blue-600 underline">
        Practicar con opciones
      </Link>
    </section> : finished ? fullReport : mode === 'simulacro' && !examStarted ? (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <p className="text-sm font-medium text-slate-900">Antes de comenzar</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Vas a resolver {total} preguntas de distintos temas. Tenés 15 minutos.
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
            {pair.term}{matches[i] !== undefined ? ' ✓' : ''}
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
            <p className="text-xs text-slate-500">Escribí el concepto que falta</p>
            <p className="mt-3 text-base leading-7 text-slate-900">________: {current.pair.definition}</p>
            <label htmlFor="practice-input" className="mt-5 block text-xs font-medium text-slate-600">Concepto</label>
            <input id="practice-input" type="text" autoComplete="off" maxLength={120}
              disabled={checked || mode === 'simulacro'} value={responses[step] ?? ''}
              onChange={event => setResponse(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-blue-500"
              placeholder="Escribí el término" />
          </> : <>
            <p className="text-base font-medium leading-7 text-slate-900">{current.question.prompt}</p>
            <div className="mt-5 space-y-2">{current.question.options.map(option =>
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
          <p className="mt-1 text-slate-700">Respuesta: {current.type === 'recall' ? current.pair.term : current.question.answer}</p>
          {current.type === 'question' && <p className="mt-1 text-slate-600">{current.question.explanation}</p>}
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
        Situaciones construidas a partir de clasificaciones del documento. No son una evaluación de transferencia a escenarios inéditos.
      </p>}
    </section>}
  </main>;
}
