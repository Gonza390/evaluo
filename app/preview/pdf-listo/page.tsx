'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, FileText, Loader2, X } from 'lucide-react';

const topics = [
  'Dogmática y teoría del delito',
  'Concepciones dogmáticas',
  'Normativismo',
  'Finalismo',
  'Funcionalismo',
  'Estructura del delito',
];

export default function PdfReadyPreviewPage() {
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);

  return (
    <main className="relative min-h-screen bg-white text-slate-950">
      <div className="pointer-events-none select-none blur-[5px]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-6 sm:px-6 sm:py-7">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">Tu espacio</p>
              <h1 className="mt-2 text-[1.65rem] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2rem]">
                Tu espacio de estudio
              </h1>
              <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-5 text-slate-500">
                Tus materiales primero. Seguí donde dejaste o sumá otro PDF cuando lo necesites.
              </p>
            </div>
          </section>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Derecho Penal · Módulo 2</p>
                  <p className="mt-0.5 text-xs text-slate-400">PDF procesado</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="mt-3 h-2.5 w-40 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/25 px-4 py-8">
        <section className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/70 bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)] [scrollbar-width:none] sm:p-6 [&::-webkit-scrollbar]:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.035em] text-slate-950">Tu PDF está listo</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Terminamos de preparar tu material.
              </p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center text-indigo-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">Módulo 2 · Lectura 1 Derecho Penal</p>
                <p className="mt-0.5 text-xs text-slate-500">Procesamiento completado</p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-slate-500">100%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-full rounded-full bg-indigo-600" />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Encontramos 6 temas</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Antes de leer todo, podemos medir cuáles ya dominás y cuáles conviene practicar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mt-3 flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-slate-200"
              >
                <span className="text-xs font-semibold text-slate-700">Ver temas detectados</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {topics.slice(0, 3).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
                  >
                    {topic}
                  </span>
                ))}
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400">
                  +3 más
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium text-emerald-700">Guardado · Universidad · Carrera</p>

            {!diagnosticOpen ? (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Abrir PDF
                </button>
                <button
                  type="button"
                  onClick={() => setDiagnosticOpen(true)}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Empezar diagnóstico
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  <p className="text-sm font-semibold text-slate-900">Preparando 6 preguntas...</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Una por tema para detectar rápido qué ya sabés y qué conviene reforzar.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
