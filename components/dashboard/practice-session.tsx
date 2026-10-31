'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Pair = { term: string; definition: string; chapterTitle: string | null };
type Question = { id: string; prompt: string; options: string[]; answer: string; explanation: string; level: string; pageStart: number | null };
type Mode = 'unir' | 'completar' | 'casos' | 'mixto' | 'simulacro';
const titles: Record<Mode, string> = { unir: 'Unir conceptos', completar: 'Completar', casos: 'Casos', mixto: 'Mixto', simulacro: 'Simulacro de examen' };
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function selectPairs(input: Pair[]) {
  const seenTerms = new Set<string>(), seenDefinitions = new Set<string>();
  return input.filter(p => {
    const t = normalize(p.term), d = normalize(p.definition);
    if (t.length < 4 || t.length > 65 || d.length < 30 || d.length > 360 || seenTerms.has(t) || seenDefinitions.has(d)) return false;
    if (input.filter(other => normalize(other.term) === t || normalize(other.definition) === d).length !== 1) return false;
    seenTerms.add(t); seenDefinitions.add(d); return true;
  }).slice(0, 20);
}
function rotate<T>(items: T[], by: number) { return items.length ? [...items.slice(by % items.length), ...items.slice(0, by % items.length)] : items; }
export function PracticeSession({ mode, materialId, materialTitle, glossary, questions }: {
  mode: Mode; materialId: string; materialTitle: string; glossary: Pair[]; questions: Question[];
}) {
  const pairs = useMemo(() => selectPairs(glossary), [glossary]);
  const usable = useMemo(() => questions.filter(q => q.options.includes(q.answer) && new Set(q.options.map(normalize)).size === q.options.length), [questions]);
  const cases = useMemo(() => usable.filter(q => q.level === 'aplicar'), [usable]);
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [associations, setAssociations] = useState<Record<number, number>>({});
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const currentPairs = useMemo(() => rotate(pairs, round * 5).slice(0, 5), [pairs, round]);
  const definitions = useMemo(() => rotate(currentPairs.map((p, i) => ({ ...p, pairIndex: i })), currentPairs.length > 1 ? 2 : 0), [currentPairs]);
  const pool = mode === 'casos' ? cases : usable;
  const activity = mode === 'unir' ? currentPairs : mode === 'completar' ? rotate(pairs, round * 5).slice(0, 5) : rotate(pool, round * 8).slice(0, mode === 'simulacro' ? 10 : 8);
  const complete = mode === 'unir' ? currentPairs.length >= 3 : activity.length >= (mode === 'completar' ? 1 : 3);
  const total = mode === 'unir' ? currentPairs.length : activity.length;
  const correct = mode === 'unir' ? currentPairs.filter((_, i) => associations[i] === i).length :
    mode === 'completar' ? (activity as Pair[]).filter((q, i) => normalize(responses[i] ?? '') === normalize(q.term)).length :
    (activity as Question[]).filter((q, i) => responses[i] === q.answer).length;
  const q = mode === 'unir' ? null : activity[step];
  useEffect(() => {
    if (mode !== 'simulacro' || finished || !complete) return;
    const interval = setInterval(() => setSecondsLeft(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [mode, finished, complete]);
  useEffect(() => { if (mode === 'simulacro' && secondsLeft === 0) setFinished(true); }, [mode, secondsLeft]);
  function restart() { setRound(x => x + 1); setStep(0); setSelected(null); setAssociations({}); setResponses({}); setFinished(false); setSecondsLeft(15 * 60); }
  const answered = mode === 'unir' ? Object.keys(associations).length === currentPairs.length : Object.keys(responses).length === total;
  return (
    <main className="mx-auto w-full max-w-[780px] px-4 py-7 pb-24 sm:px-6 sm:py-9">
      <Link href="/dashboard/practicar" className="text-xs text-slate-500 hover:text-blue-600">← Volver a Practicar</Link>
      <h1 className="mt-4 text-[23px] font-semibold tracking-tight text-slate-900">{titles[mode]}</h1>
      <p className="mt-1 truncate text-sm text-slate-500">{materialTitle}</p>
      {!complete ? <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No hay suficiente contenido verificable en este material para esta modalidad.
        {mode === 'casos' ? ' Para Casos se necesitan preguntas que realmente evalúen aplicación.' : ''}
        <div className="mt-4"><Link href={'/materiales/' + materialId + '?tab=ejercicios'} className="text-blue-600 underline">Practicar con opciones</Link></div>
      </div> : finished ? (
        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-live="polite">
          <p className="text-sm text-slate-500">Resultado de la práctica</p>
          <h2 className="mt-2 text-3xl font-semibold">{correct} de {total} correctas</h2>
          <p className="mt-2 text-sm text-slate-600">Revisá tus errores antes de comenzar otra ronda.</p>
          <div className="mt-5 space-y-3">
            {mode === 'unir' ? currentPairs.map((p,i) => <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm">
              <strong className={associations[i] === i ? 'text-emerald-700' : 'text-rose-700'}>{p.term}</strong>
              <p className="mt-1 text-slate-700">{p.definition}</p>
            </div>) : (activity as (Pair | Question)[]).map((a,i) => {
              const answer = 'term' in a ? a.term : a.answer;
              const isRight = 'term' in a ? normalize(responses[i] ?? '') === normalize(answer) : responses[i] === answer;
              return <div className="rounded-xl bg-slate-50 p-3 text-sm" key={i}>
                <p className={isRight ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>{isRight ? 'Correcta' : 'Para reforzar'}</p>
                <p className="mt-1 text-slate-800">{'term' in a ? a.definition : a.prompt}</p>
                {!isRight && <p className="mt-1 text-slate-600">Respuesta: {answer}</p>}
                {'explanation' in a && <p className="mt-1 text-slate-600">{a.explanation}</p>}
                {'pageStart' in a && a.pageStart && <Link className="mt-1 inline-block text-xs text-blue-600 underline" href={'/materiales/' + materialId + '?tab=resumen&page=' + a.pageStart}>Revisar material · pág. {a.pageStart}</Link>}
              </div>;
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={restart} className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white">Otra ronda</button>
            <Link href={'/materiales/' + materialId + '?tab=resumen'} className="inline-flex min-h-11 items-center rounded-xl border px-5 text-sm font-medium">Volver al resumen</Link>
          </div>
        </section>
      ) : (
        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
            <span>{mode === 'unir' ? 'Relacioná cada término con su definición' : 'Actividad ' + (step + 1) + ' de ' + total}</span>
            {mode === 'simulacro' && <span role="timer" aria-label="Tiempo restante">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} restantes</span>}
          </div>
          {mode === 'unir' ? <>
            <p className="mb-2 text-xs font-medium text-slate-600">1. Seleccioná un concepto</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{currentPairs.map((p,i) =>
              <button key={i} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)}
                className={'min-h-14 rounded-xl border p-3 text-left text-sm ' + (selected === i ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white')}>{p.term}{associations[i] !== undefined ? ' ✓' : ''}</button>)}</div>
            <p className="mb-2 mt-6 text-xs font-medium text-slate-600">2. Elegí su definición</p>
            <div className="space-y-2">{definitions.map(d => <button key={d.pairIndex} type="button" disabled={selected === null}
              onClick={() => { if (selected === null) return; setAssociations(old => {
                const next = { ...old }; for (const key of Object.keys(next)) if (next[Number(key)] === d.pairIndex) delete next[Number(key)];
                next[selected] = d.pairIndex; return next; }); setSelected(null); }}
              className="flex min-h-14 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left text-sm disabled:opacity-60">
              <span>{d.definition}</span>
              {Object.values(associations).includes(d.pairIndex) && <span className="shrink-0 text-xs text-blue-600">{currentPairs[Number(Object.keys(associations).find(k => associations[Number(k)] === d.pairIndex))]?.term}</span>}
            </button>)}</div>
          </> : q && ('term' in q) ? <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Escribí el concepto que corresponde a esta definición:</p>
              <p className="mt-3 text-base leading-7 text-slate-900">{q.definition}</p>
              <label htmlFor="practice-answer" className="mt-5 block text-xs text-slate-500">Concepto</label>
              <input id="practice-answer" value={responses[step] ?? ''} onChange={e=>setResponses(old=>({...old,[step]:e.target.value}))}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-blue-500" placeholder="Tu respuesta" autoComplete="off" />
            </div>
          </> : q && ('prompt' in q) ? <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-base font-medium leading-7 text-slate-900">{q.prompt}</p>
              <div className="mt-5 space-y-2">{q.options.map(option => <button key={option} type="button"
                onClick={()=>{setResponses(old=>({...old,[step]:option}));}}
                aria-pressed={responses[step]===option}
                className={'min-h-12 w-full rounded-xl border p-3 text-left text-sm ' +
                  (responses[step]===option?'border-blue-600 bg-blue-50':'border-slate-200 hover:bg-slate-50')}>{option}</button>)}</div>
            </div>
          </> : null}
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            {mode !== 'unir' && <button disabled={step===0} onClick={()=>setStep(x=>x-1)} className="min-h-11 rounded-xl border px-5 text-sm disabled:opacity-40">Anterior</button>}
            {mode !== 'unir' && step < total-1 ? <button onClick={()=>setStep(x=>x+1)} disabled={!responses[step]?.trim()} className="ml-auto min-h-11 rounded-xl bg-blue-600 px-5 text-sm text-white disabled:opacity-40">Siguiente</button> :
              <button disabled={!answered} onClick={()=>setFinished(true)} className="ml-auto min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white disabled:opacity-40">Finalizar y ver resultados</button>}
          </div>
        </section>
      )}
    </main>
  );
}
