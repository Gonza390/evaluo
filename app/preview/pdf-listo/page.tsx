'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';

const topics = [
  'Dogmática y teoría del delito',
  'Concepciones dogmáticas',
  'Normativismo',
  'Finalismo',
  'Funcionalismo',
  'Estructura del delito',
];

const options = [
  'El análisis exclusivo de la pena aplicable',
  'Una herramienta sistemática para analizar los elementos del delito',
  'La descripción histórica de las leyes penales',
  'Un método para clasificar únicamente delitos dolosos',
];

export default function PdfReadyPreviewPage() {
  const [screen, setScreen] = useState<'ready' | 'diagnostic'>('ready');
  const [selected, setSelected] = useState<number | null>(null);

  if (screen === 'diagnostic') {
    return (
      <main className="min-h-screen bg-white px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => {
              setScreen('ready');
              setSelected(null);
            }}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>

          <section className="mt-5 max-w-2xl rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                  Diagnóstico · 1 de 6
                </p>
                <h1 className="mt-1.5 text-[1.45rem] font-bold tracking-[-0.045em] text-slate-950 sm:text-[1.65rem]">
                  Una pregunta rápida
                </h1>
              </div>
              <span className="text-[12px] font-medium text-slate-400">~4 min total</span>
            </div>

            <div className="pt-5">
              <p className="text-[12px] font-semibold text-blue-600">Dogmática y teoría del delito</p>
              <h2 className="mt-2 text-[1.05rem] font-bold leading-6 tracking-[-0.025em] text-slate-950 sm:text-[1.12rem]">
                ¿Cuál describe mejor la función de la teoría del delito?
              </h2>

              <div className="mt-4 space-y-2">
                {options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelected(index)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-[13.5px] leading-5 transition ${
                      selected === index
                        ? 'border-blue-300 bg-blue-50/70 text-slate-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        selected === index
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={selected === null}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Responder
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-3xl rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Check className="h-5 w-5" strokeWidth={2.4} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">PDF listo</p>
              <h1 className="mt-1 text-[1.45rem] font-bold tracking-[-0.045em] text-slate-950 sm:text-[1.65rem]">
                Ya podés estudiar este material
              </h1>
              <p className="mt-1.5 max-w-xl text-[13.5px] leading-5 text-slate-500">
                Detectamos 6 temas. Podés empezar con un diagnóstico corto para saber qué conviene repasar primero.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-slate-200">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-slate-800">Módulo 2 · Lectura 1 Derecho Penal</p>
              <p className="mt-0.5 text-[12px] text-slate-400">3 páginas · procesado</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Temas detectados</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setScreen('diagnostic')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              Empezar diagnóstico
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Ir al material
            </button>
            <span className="text-[12px] text-slate-400">6 preguntas · ~4 min</span>
          </div>
        </section>
      </div>
    </main>
  );
}
