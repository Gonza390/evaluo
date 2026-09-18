'use client';

import { CalendarDays, Clock3, HelpCircle, Target } from 'lucide-react';

type SimulatorIntroProps = {
  materiaNombre: string;
  parcialLabel: string;
  preguntasDisponibles: number;
  tiempoLabel: string;
  examDate: string;
  minExamDate: string;
  onExamDateChange: (value: string) => void;
  onStart: () => void | Promise<void>;
  starting?: boolean;
};

export function SimulatorIntro({
  materiaNombre,
  parcialLabel,
  preguntasDisponibles,
  tiempoLabel,
  examDate,
  minExamDate,
  onExamDateChange,
  onStart,
  starting = false,
}: SimulatorIntroProps) {
  return (
    <div className="flex min-h-[640px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-4 sm:p-6">
      <section className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="p-6 sm:p-8 lg:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <Target className="h-4 w-4" aria-hidden="true" />
            {parcialLabel}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            Antes de comenzar el Preguntero de {materiaNombre}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Practicá tu parcial, descubrí qué necesitás reforzar y entendé por qué te equivocaste.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <HelpCircle className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-slate-500">Preguntas</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{preguntasDisponibles}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <Clock3 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-slate-500">Tiempo</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{tiempoLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <Target className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-slate-500">Parcial</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{parcialLabel}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-indigo-100 bg-indigo-50/45 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="simulator-exam-date" className="text-sm font-bold text-slate-900">
                    ¿Cuándo rendís?
                  </label>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-slate-500 uppercase ring-1 ring-slate-200">
                    Opcional
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                  La usamos para ayudarte a preparar este examen con tus apuntes en el momento correcto.
                  Si todavía no sabés la fecha, podés empezar igual.
                </p>
                <input
                  id="simulator-exam-date"
                  type="date"
                  min={minExamDate}
                  value={examDate}
                  onChange={(event) => onExamDateChange(event.target.value)}
                  className="mt-3 h-11 w-full max-w-[280px] rounded-xl border border-indigo-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onStart()}
            disabled={starting}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {starting ? 'Preparando práctica...' : 'Comenzar práctica'}
          </button>
        </div>
      </section>
    </div>
  );
}
