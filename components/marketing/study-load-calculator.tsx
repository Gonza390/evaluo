'use client';
import { useState } from 'react';

function asCount(value:string,maximum:number) {
  const n=Number(value);
  return Number.isFinite(n)&&n>=1?Math.min(maximum,Math.floor(n)):0;
}
export function StudyLoadCalculator() {
  const [topics,setTopics]=useState('12');
  const [days,setDays]=useState('7');
  const [hours,setHours]=useState('2');
  const topicCount=asCount(topics,1000);
  const dayCount=asCount(days,365);
  const dailyHours=Number(hours);
  const valid=topicCount>0&&dayCount>0&&Number.isFinite(dailyHours)&&dailyHours>=0.25&&dailyHours<=16;
  const topicsPerDay=valid?Math.ceil(topicCount/dayCount):0;
  const minutesPerTopic=valid?Math.round(dayCount*dailyHours*60/topicCount):0;
  const blocks=valid?Math.ceil(dailyHours*60/45):0;
  return (
    <section aria-labelledby="calc-title" className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8">
      <h2 id="calc-title" className="text-2xl font-bold">Calculá tu carga de estudio</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">Ingresá tus datos para obtener una distribución orientativa. Priorizá los temas que más te cuestan: no todos requieren el mismo tiempo.</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-3">
        <label className="block text-sm font-semibold">Temas por estudiar
          <input value={topics} onChange={e=>setTopics(e.target.value)} type="number" min="1" max="1000" step="1" inputMode="numeric" className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium focus:border-blue-600 focus:outline-none"/>
        </label>
        <label className="block text-sm font-semibold">Días disponibles
          <input value={days} onChange={e=>setDays(e.target.value)} type="number" min="1" max="365" step="1" inputMode="numeric" className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium focus:border-blue-600 focus:outline-none"/>
        </label>
        <label className="block text-sm font-semibold">Horas por día
          <input value={hours} onChange={e=>setHours(e.target.value)} type="number" min="0.25" max="16" step="0.25" inputMode="decimal" className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium focus:border-blue-600 focus:outline-none"/>
        </label>
      </div>
      {valid?(
        <div role="status" aria-live="polite" className="mt-7 rounded-2xl bg-blue-50 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Estimación</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <div><p className="text-3xl font-extrabold tabular-nums">{topicsPerDay}</p><p className="mt-1 text-sm text-slate-600">temas por día (aprox.)</p></div>
            <div><p className="text-3xl font-extrabold tabular-nums">{minutesPerTopic}</p><p className="mt-1 text-sm text-slate-600">minutos promedio por tema</p></div>
            <div><p className="text-3xl font-extrabold tabular-nums">{blocks}</p><p className="mt-1 text-sm text-slate-600">bloques diarios de hasta 45 min</p></div>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-700">Reservá parte del tiempo para responder preguntas y corregir errores. Si los minutos por tema son insuficientes, reducí objetivos o ampliá días; no asumas que terminar de leer equivale a dominar un tema.</p>
        </div>
      ):<p role="alert" className="mt-5 text-sm font-semibold text-amber-800">Ingresá entre 1 y 1000 temas, entre 1 y 365 días y entre 0,25 y 16 horas por día.</p>}
    </section>
  );
}
