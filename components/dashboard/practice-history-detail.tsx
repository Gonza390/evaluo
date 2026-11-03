'use client';

import { ArrowLeft, BookOpen, CheckCircle2, CircleAlert, History, Layers3, ListChecks, Network, Timer, Zap } from 'lucide-react';
import type { PracticeHistoryEntry } from '@/lib/student-materials/practice-history';

const labels: Record<string,string> = {
  unir:'Unir conceptos', completar:'Completar', casos:'Casos', mixto:'Mixto',
  simulacro:'Simulacro de examen', opciones:'Opciones', flashcards:'Flashcards',
};
const icons = { unir:Network, completar:ListChecks, casos:BookOpen, mixto:Zap,
  simulacro:Timer, opciones:CheckCircle2, flashcards:Layers3 };
const palettes:Record<string,string> = {
  unir:'bg-[#E0F2F0] text-[#27817A]', completar:'bg-[#FAE9DE] text-[#AE663F]',
  casos:'bg-[#EBE4FA] text-[#6C52A8]', mixto:'bg-[#FCF2DF] text-[#9A712C]',
  simulacro:'bg-[#E9EAED] text-[#626B7A]', opciones:'bg-[#E3F2E5] text-[#398052]',
  flashcards:'bg-[#E2F2F7] text-[#41839B]',
};
const TIME_ZONE='America/Argentina/Buenos_Aires';

export function PracticeHistoryDetail({ session, onBack }: {
  session:PracticeHistoryEntry; onBack:()=>void;
}) {
  const Icon=icons[session.mode as keyof typeof icons]??History;
  const score=session.total>0?Math.round(session.correct/session.total*100):0;
  const incorrect=Math.max(0,session.total-session.correct);
  const when=new Date(session.completedAt);
  const date=Number.isFinite(when.getTime())
    ? new Intl.DateTimeFormat('es-AR',{timeZone:TIME_ZONE,day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(when)
    : 'Fecha no disponible';
  return (
    <main data-practice-detail className="practice-screen-enter mx-auto flex h-full min-h-0 w-full max-w-[1190px] flex-col px-3 pb-20 pt-4 text-[#0F1B3D] sm:px-5 sm:pt-6 lg:overflow-hidden lg:px-7 lg:pb-5" aria-labelledby="practice-detail-title">
      <div className="shrink-0">
        <button type="button" onClick={onBack}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-[12px] font-medium text-[#42506A] transition-colors hover:bg-[#EEF2FF] hover:text-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
          <ArrowLeft className="size-4" aria-hidden="true"/> Volver a Practicar
        </button>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className={`flex size-11 items-center justify-center rounded-xl ${palettes[session.mode]??'bg-slate-100 text-slate-600'}`}>
            <Icon className="size-5" aria-hidden="true"/>
          </span>
          <div>
            <h1 id="practice-detail-title" className="text-[21px] font-semibold tracking-[-0.035em] sm:text-[24px]">{labels[session.mode]??session.mode}</h1>
            <p className="mt-0.5 text-[12px] text-[#7F8AA3]">Práctica realizada · {date}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-visible lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
        <section className="rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5" aria-label="Resultado de la práctica">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium text-[#7F8AA3]">Tu resultado</p>
              <p className="mt-1 text-[26px] font-semibold tabular-nums text-[#0F1B3D]">{score}%</p>
              <p className="text-[12px] text-[#42506A]">{session.correct} de {session.total} {session.mode==='flashcards'?'tarjetas':'preguntas'} correctas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl bg-[#E7F5EC] px-3 py-2 text-[12px] font-medium text-[#358458]">{session.correct} correctas</span>
              <span className="rounded-xl bg-[#FFF0E6] px-3 py-2 text-[12px] font-medium text-[#A65A30]">{incorrect} para repasar</span>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EDF1F6]" aria-label={`Progreso: ${score}%`}>
            <div className={`h-full rounded-full ${score>=80?'bg-[#38A169]':'bg-[#E0AB45]'}`} style={{width:`${score}%`}}/>
          </div>
        </section>
        <section className="mt-4" aria-labelledby="practice-answers-title">
          <h2 id="practice-answers-title" className="text-[16px] font-semibold tracking-tight">Detalle de respuestas</h2>
          {session.answers?.length ? (
            <ol className="mt-3 grid gap-3">
              {session.answers.map((answer,index)=>(
                <li key={index} className="rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${answer.correct?'bg-[#E7F5EC] text-[#358458]':'bg-[#FFF0E6] text-[#A65A30]'}`}>
                      {answer.correct?<CheckCircle2 className="size-4" aria-hidden="true"/>:<CircleAlert className="size-4" aria-hidden="true"/>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#7F8AA3]">Pregunta {index+1} · {answer.correct?'Correcta':'Para repasar'}</p>
                      <p className="mt-1 text-[13px] font-semibold leading-[1.6] text-[#0F1B3D]">{answer.prompt}</p>
                      {session.mode!=='flashcards'&&(
                        <p className="mt-3 text-[12px] leading-[1.5] text-[#42506A]">
                          <span className="font-semibold">Tu respuesta:</span> {answer.selectedAnswer||'Sin responder'}
                        </p>
                      )}
                      <p className="mt-1 text-[12px] leading-[1.5] text-[#42506A]">
                        <span className="font-semibold">Respuesta esperada:</span> {answer.correctAnswer}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ):(
            <div className="mt-3 rounded-2xl border border-[#E7EBF4] bg-[#F8FAFD] px-4 py-5 text-[12px] leading-[1.6] text-[#42506A]">
              Esta práctica se guardó con su puntuación, pero sin el detalle individual de las respuestas.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
