'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const topics = [
  'Dogmática y teoría del delito',
  'Concepciones dogmáticas',
  'Normativismo o teleologismo',
  'Finalismo',
  'Funcionalismo moderado',
  'Estructura del delito',
];

const options = [
  'El análisis exclusivo de la pena aplicable',
  'Una herramienta sistemática para analizar los elementos del delito',
  'La descripción histórica de las leyes penales',
  'Un método para clasificar únicamente delitos dolosos',
];

export default function PdfReadyPreviewPage() {
  const [screen, setScreen] = useState<'ready' | 'diagnostic' | 'summary'>('ready');
  const [selected, setSelected] = useState<number | null>(null);

  if (screen === 'diagnostic') {
    return (
      <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => {
              setScreen('ready');
              setSelected(null);
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al material
          </button>

          <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-blue-600 uppercase">
                    Diagnóstico · 1 de 6
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
                    Veamos qué tanto dominás
                  </h1>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  ~4 min
                </span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/6 rounded-full bg-blue-600" />
              </div>
            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <p className="text-xs font-bold tracking-[0.13em] text-slate-400 uppercase">
                Dogmática y teoría del delito
              </p>
              <h2 className="mt-3 text-xl font-bold leading-8 tracking-[-0.03em] sm:text-2xl">
                ¿Cuál describe mejor la función de la teoría del delito?
              </h2>

              <div className="mt-6 space-y-3">
                {options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelected(index)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left text-sm leading-6 transition sm:text-[15px] ${
                      selected === index
                        ? 'border-blue-500 bg-blue-50 text-slate-950 ring-2 ring-blue-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
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

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  disabled={selected === null}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Responder
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (screen === 'summary') {
    return (
      <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => setScreen('ready')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <p className="text-xs font-bold tracking-[0.14em] text-blue-600 uppercase">Resumen</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em]">Derecho Penal · Módulo 2</h1>
            <p className="mt-5 text-[15px] leading-7 text-slate-600">
              El material recorre las principales concepciones dogmáticas de la teoría del delito y cómo cambia la ubicación y función de sus elementos según cada corriente.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {topics.map((topic) => (
                <div key={topic} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  {topic}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-6 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Preview de producto
          </div>
          <button
            type="button"
            onClick={() => setScreen('ready')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar
          </button>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_26px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#fbfdff_0%,#ffffff_100%)] px-5 py-8 text-center sm:px-8 sm:py-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <h1 className="mt-6 text-[2rem] font-bold leading-tight tracking-[-0.055em] sm:text-[2.6rem]">
              Tu PDF está listo
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-6 text-slate-600 sm:text-base sm:leading-7">
              Encontramos 6 temas principales. Antes de ponerte a leer todo, veamos cuáles ya dominás y cuáles necesitás practicar.
            </p>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold tracking-[-0.02em] text-slate-950">
                    Módulo 2 · Lectura 1 Derecho Penal
                  </p>
                  <p className="mt-1 text-[13px] text-slate-500">3 páginas · Procesado</p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Listo para estudiar
              </span>
            </div>

            <div className="mt-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">Tu material</p>
                  <h2 className="mt-1.5 text-xl font-bold tracking-[-0.04em]">6 temas detectados</h2>
                </div>
                <BookOpen className="h-5 w-5 text-slate-300" />
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {topics.map((topic, index) => (
                  <div
                    key={topic}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="text-[13.5px] font-semibold leading-5 text-slate-700">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                <Lightbulb className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-slate-900">También encontramos 2 confusiones frecuentes</p>
                <p className="mt-1 text-[12.5px] leading-5 text-slate-600">
                  Las vamos a tener en cuenta para elegir qué preguntarte y qué reforzar.
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setScreen('diagnostic')}
                className="inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 sm:text-[15px]"
              >
                Empezar diagnóstico
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setScreen('summary')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                Ver resumen del material
              </button>
              <p className="mt-1 text-center text-[12px] text-slate-400">
                6 preguntas · aproximadamente 4 minutos
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
