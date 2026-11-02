'use client';

import { useState } from 'react';
import type { PublicQuestion } from '@/lib/student-seo-content';

export function PublicPractice({questions}:{questions:PublicQuestion[]}) {
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [submitted,setSubmitted]=useState(false);
  const count=Object.keys(answers).length;
  const score=questions.reduce((total,item,index)=>total+(answers[index]===item.correctIndex?1:0),0);
  return (
    <section aria-labelledby="public-practice-title" className="rounded-[24px] border border-slate-200 bg-white p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="public-practice-title" className="text-2xl font-bold">Comprobá lo aprendido</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{count} de {questions.length} respondidas</span>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-600">Respondé sin mirar tus apuntes. Después de corregir, leé la explicación incluso si acertaste.</p>
      <div className="mt-6 space-y-8">
        {questions.map((q,index)=>(
          <fieldset key={q.prompt} disabled={submitted} className="border-b border-slate-100 pb-7 last:border-b-0 last:pb-0">
            <legend className="mb-4 text-base font-bold leading-7">{index+1}. {q.prompt}</legend>
            <div className="space-y-2">
              {q.choices.map((choice,answerIndex)=>(
                <label key={choice} className={'flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6 transition '+(answers[index]===answerIndex?'border-blue-400 bg-blue-50':'border-slate-200 hover:border-blue-200')}>
                  <input type="radio" name={'public-question-'+index} className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
                    value={answerIndex} checked={answers[index]===answerIndex}
                    onChange={()=>{setAnswers(current=>({...current,[index]:answerIndex}));setSubmitted(false)}}/>
                  <span>{choice}</span>
                </label>
              ))}
            </div>
            {submitted ? (
              <div role="status" className={'mt-4 rounded-xl border p-4 text-sm leading-7 '+(answers[index]===q.correctIndex?'border-emerald-200 bg-emerald-50 text-emerald-900':'border-amber-200 bg-amber-50 text-slate-800')}>
                <p className="font-bold">{answers[index]===q.correctIndex?'Correcto':'Para reforzar: '+q.choices[q.correctIndex]}</p>
                <p className="mt-1">{q.explanation}</p>
              </div>
            ) : null}
          </fieldset>
        ))}
      </div>
      {submitted ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-5" aria-live="polite">
          <p className="text-lg font-extrabold">Resultado: {score} de {questions.length}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">No es una nota oficial. Revisá las explicaciones de las preguntas incorrectas y probá otra variación del mismo concepto.</p>
          <button type="button" onClick={()=>{setAnswers({});setSubmitted(false)}} className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold hover:border-blue-300">Volver a intentar</button>
        </div>
      ) : (
        <button type="button" disabled={count!==questions.length} onClick={()=>setSubmitted(true)}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          Corregir mis respuestas
        </button>
      )}
    </section>
  );
}
