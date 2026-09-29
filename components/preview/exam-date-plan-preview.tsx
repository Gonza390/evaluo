'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, X } from 'lucide-react';

const SAMPLE_FILE = 'Marketing I - Parcial 1.pdf';

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function addDays(value: string, days: number) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function ExamDatePlanPreview() {
  const defaultDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 12);
    return date.toISOString().slice(0, 10);
  }, []);

  const [date, setDate] = useState(defaultDate);
  const [saved, setSaved] = useState(false);
  const [closed, setClosed] = useState(false);

  const plan = useMemo(() => {
    if (!date) return [];
    return [
      { label: 'Hoy', text: 'Seguí estudiando y detectá qué temas necesitás reforzar.' },
      { label: '7 días antes', text: 'Comprobá qué recordás y volvé sobre los temas más importantes.' },
      { label: '3 días antes', text: 'Reforzá errores y conceptos que todavía te cuestan.' },
      { label: '1 día antes', text: 'Hacé un repaso corto y enfocado antes del examen.' },
    ];
  }, [date]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F7FB] text-[#0F1B3D]">
      <div className="mx-auto min-h-screen max-w-[1180px] px-4 py-8 sm:px-8">
        <div className="rounded-[28px] border border-[#E7EBF4] bg-white shadow-[0_28px_90px_rgba(15,27,61,0.08)]">
          <header className="flex items-center justify-between border-b border-[#E7EBF4] px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2.5">
              <img src="/icon.png" alt="" className="h-9 w-9 object-contain" />
              <span className="text-xl font-black tracking-[-0.04em]">Evaluo</span>
            </div>
            <div className="h-9 w-24 rounded-xl bg-slate-100" />
          </header>

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_320px]">
            <section className="min-h-[560px] rounded-[22px] border border-slate-200 bg-white p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50" />
                <div>
                  <div className="h-3 w-40 rounded bg-slate-200" />
                  <div className="mt-2 h-2.5 w-24 rounded bg-slate-100" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-4/5 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-11/12 rounded bg-slate-100" />
                <div className="h-4 w-3/4 rounded bg-slate-100" />
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {['Resumen', 'Flashcards', 'Práctica', 'Mis errores'].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-bold text-slate-500">{item}</div>
                    <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </section>

            <aside className="hidden rounded-[22px] border border-slate-200 bg-slate-50/70 p-5 lg:block">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Tu material</div>
              <div className="mt-3 text-sm font-bold text-slate-900">{SAMPLE_FILE}</div>
              <div className="mt-5 h-3 w-full rounded bg-slate-200" />
              <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
              <div className="mt-8 h-11 rounded-xl bg-indigo-100" />
            </aside>
          </div>
        </div>
      </div>

      {!closed && (
        <>
          <div className="fixed inset-0 z-40 bg-[#08132A]/55 backdrop-blur-[2px]" />

          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <section className="relative w-full max-w-[520px] overflow-hidden rounded-t-[28px] border border-white/60 bg-white shadow-[0_30px_100px_rgba(2,12,35,0.35)] sm:rounded-[28px]">
              <button
                type="button"
                onClick={() => setClosed(true)}
                aria-label="Cerrar"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>

              {!saved ? (
                <div className="p-6 pb-7 sm:p-8">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <p className="pr-10 text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                    Organizá tu repaso
                  </p>

                  <h1 className="mt-2 pr-8 text-[25px] font-bold leading-[1.14] tracking-[-0.035em] text-[#0F1B3D] sm:text-[29px]">
                    ¿Cuándo rendís “{SAMPLE_FILE}”?
                  </h1>

                  <p className="mt-4 text-[15px] leading-6 text-slate-600">
                    Cargá la fecha y Evaluo organiza tus repasos hasta el examen para ayudarte a llegar con los temas importantes reforzados.
                  </p>

                  <label className="mt-6 block text-xs font-bold text-slate-700" htmlFor="exam-date-preview">
                    Fecha del examen
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="exam-date-preview"
                      type="date"
                      value={date}
                      min={addDays(new Date().toISOString().slice(0, 10), 1)}
                      onChange={(event) => setDate(event.target.value)}
                      className="h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 pr-12 text-[15px] font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  </div>

                  <button
                    type="button"
                    disabled={!date}
                    onClick={() => setSaved(true)}
                    className="mt-4 flex h-13 w-full items-center justify-center rounded-2xl bg-[#2563EB] px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(37,99,235,0.22)] transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Guardar fecha
                  </button>

                  <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
                    Podés cambiarla más adelante desde tu material.
                  </p>
                </div>
              ) : (
                <div className="p-6 pb-7 sm:p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-5 w-5" />
                  </div>

                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                    Plan de repaso
                  </p>

                  <h2 className="mt-2 pr-8 text-[25px] font-bold leading-[1.14] tracking-[-0.035em] text-[#0F1B3D] sm:text-[29px]">
                    Listo. Rendís el {formatDate(date)}.
                  </h2>

                  <p className="mt-3 text-[15px] leading-6 text-slate-600">
                    Evaluo va a usar esta fecha para ayudarte a organizar el repaso de “{SAMPLE_FILE}”.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-[#E7EBF4]">
                    {plan.map((item, index) => (
                      <div
                        key={item.label}
                        className={`grid grid-cols-[88px_1fr] gap-3 px-4 py-3.5 ${index > 0 ? 'border-t border-[#E7EBF4]' : ''}`}
                      >
                        <div className="text-[11px] font-black text-indigo-600">{item.label}</div>
                        <div className="text-[12px] leading-5 text-slate-600">{item.text}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setClosed(true)}
                    className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-[#2563EB] px-5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {closed && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Preview cerrado · recargá la página para verlo otra vez
        </div>
      )}
    </main>
  );
}
