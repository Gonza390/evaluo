'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, RotateCcw, UploadCloud } from 'lucide-react';
import { SimulatorLoginGate } from '@/components/simulador/SimulatorLoginGate';
import { SimulatorIntro } from '@/components/simulador/SimulatorIntro';
import { formatSimulatorExamDate, getDaysUntilExam, getLocalDateKey } from '@/lib/simulator-exam-date';

type PreviewStep = 'intro' | 'login' | 'result';

export function SimulatorExamActivationFlowPreview() {
  const [step, setStep] = useState<PreviewStep>('intro');
  const [examDate, setExamDate] = useState('');

  const timingLabel = useMemo(() => {
    if (!examDate) return null;
    const days = getDaysUntilExam(examDate);
    if (days === null) return null;
    if (days <= 0) return 'Rendís hoy';
    if (days === 1) return 'Rendís mañana';
    return `Rendís en ${days} días`;
  }, [examDate]);

  const reset = () => {
    setExamDate('');
    setStep('intro');
  };

  if (step === 'intro') {
    return (
      <div className="relative">
        <PreviewBar step="1 de 3 · Intro + fecha del examen" onReset={reset} />
        <SimulatorIntro
          materiaNombre="Derecho Sucesorio"
          parcialLabel="Parcial 2"
          preguntasDisponibles={30}
          tiempoLabel="30:00"
          examDate={examDate}
          minExamDate={getLocalDateKey()}
          onExamDateChange={setExamDate}
          onStart={() => setStep('login')}
        />
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="relative">
        <PreviewBar step="2 de 3 · Gate actual después de la muestra" onReset={reset} />
        <SimulatorLoginGate
          answeredCount={10}
          correctCount={7}
          questionLimit={30}
          loginHref="#preview-result"
          signupHref="#preview-result"
          onLoginClick={() => setStep('result')}
          onSignupClick={() => setStep('result')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)]">
      <PreviewBar step="3 de 3 · Resultado → PDF" onReset={reset} />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-5">
          <p className="text-sm font-semibold text-[#5D65F6]">Resultado del Simulador</p>
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
            Derecho Sucesorio · Parcial 2
          </h1>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.09)]">
          <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border-b border-slate-200 p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
              <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Tu nota
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-[4.7rem] leading-none font-bold tracking-[-0.08em] text-[#0F1B3D] sm:text-[5.5rem]">
                  7.0
                </span>
                <span className="pb-2 text-lg font-semibold text-slate-400">/ 10</span>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span><strong className="text-slate-950">21 de 30</strong> correctas</span>
              </div>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                Tenés una buena base. Repasá los errores y usá tus apuntes para preparar lo que realmente entra en este examen.
              </p>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="rounded-[24px] border border-indigo-200 bg-[linear-gradient(135deg,#F5F3FF_0%,#FFFFFF_58%,#EEF2FF_100%)] p-5 sm:p-6">
                <p className="text-[12px] font-bold tracking-[0.18em] text-indigo-700 uppercase">
                  Siguiente paso recomendado
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950">
                  Repaso de errores
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                  Primero entendé qué falló. Después prepará este parcial usando el material que realmente estás estudiando.
                </p>
              </div>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-blue-600 text-white">
                    <UploadCloud className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold tracking-[0.16em] text-[#2563EB] uppercase">
                      Seguí estudiando con tus apuntes
                    </p>
                    <h3 className="mt-2 text-xl font-bold tracking-[-0.035em] text-slate-950">
                      Prepará Derecho Sucesorio con tu propio PDF
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                      Subí tus apuntes y Evaluo te guía para repasar y practicar sobre el material que realmente entra en tu examen.
                    </p>
                  </div>
                </div>

                {examDate ? (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {timingLabel ? `${timingLabel} · ` : ''}{formatSimulatorExamDate(examDate)}
                  </div>
                ) : (
                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    En este recorrido no cargaste una fecha en la intro.
                  </p>
                )}

                <button
                  type="button"
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)]"
                >
                  {examDate ? 'Subir mi PDF para este examen' : 'Subir mi PDF'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('intro')}
                  className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Volver a la intro
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PreviewBar({ step, onReset }: { step: string; onReset: () => void }) {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 text-xs">
        <span className="font-bold text-amber-900">Preview QA · {step}</span>
        <button type="button" onClick={onReset} className="font-semibold text-amber-800 hover:underline">
          Reiniciar recorrido
        </button>
      </div>
    </div>
  );
}
