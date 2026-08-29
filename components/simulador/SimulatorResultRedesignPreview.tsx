'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  improved?: boolean;
};

export function SimulatorResultRedesignPreview({ improved = false }: Props) {
  const [vote, setVote] = useState<1 | -1 | null>(null);

  const correct = 20;
  const total = 30;
  const wrong = total - correct;
  const percentage = Math.round((correct / total) * 100);
  const grade = ((correct / total) * 10).toFixed(1);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,#F8FAFF_0%,#F3F6FC_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#5D65F6]">Resultados del simulador</p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
              Derecho Procesal Público · Parcial 1
            </h1>
          </div>
          <Link
            href={improved ? '/preview/resultado-simulador' : '/preview/resultado-simulador?estado=mejora'}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
          >
            Preview: {improved ? 'ver primer intento' : 'ver caso con mejora'}
          </Link>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.09)]">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-slate-200 p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
              <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Tu nota
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-[4.7rem] leading-none font-bold tracking-[-0.08em] text-[#0F1B3D] sm:text-[5.5rem]">
                  {grade}
                </span>
                <span className="pb-2 text-lg font-semibold text-slate-400">/ 10</span>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                {correct} de {total} correctas
              </div>

              <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
                Tenés una buena base. Antes de hacer otro modelo, conviene recuperar los {wrong}{' '}
                puntos que todavía podés reforzar.
              </p>

              <div className="mt-7 rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Tu evolución
                </p>
                {improved ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-950">Mejoraste 12% vs. tu intento anterior</p>
                      <p className="mt-1 text-sm text-slate-500">Tu nota anterior fue 5,9.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="font-bold text-slate-950">Primer intento en esta materia</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Este resultado queda como punto de partida para medir tu próxima mejora.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="rounded-[28px] border border-indigo-200 bg-[linear-gradient(135deg,#EEF0FF_0%,#FFFFFF_100%)] p-6 shadow-[0_16px_35px_rgba(99,102,241,0.10)] sm:p-7">
                <p className="text-[12px] font-semibold tracking-[0.18em] text-indigo-700 uppercase">
                  Siguiente paso
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
                  Repasá tus {wrong} errores antes de volver a intentar
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Volvé únicamente sobre las preguntas que fallaste. Cuando las tengas claras, hacé
                  otro simulacro y compará tu resultado.
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-6 text-base font-semibold text-white shadow-[0_14px_30px_rgba(99,102,241,0.26)] transition hover:opacity-95 sm:w-auto"
                >
                  Repasar mis errores
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="flex min-h-[92px] items-center gap-4 rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-950">Volver a la materia</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Repasar antes del próximo intento
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="flex min-h-[92px] items-center gap-4 rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <RotateCcw className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-950">Hacer otro modelo</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Mejor después de repasar errores
                    </span>
                  </span>
                </button>
              </div>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">¿Te sirvió este simulador?</p>
                    <p className="mt-1 text-xs text-slate-500">Tu respuesta nos ayuda a mejorarlo.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVote(1)}
                      className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition',
                        vote === 1
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Me gustó
                    </button>
                    <button
                      type="button"
                      onClick={() => setVote(-1)}
                      className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition',
                        vote === -1
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No me gustó
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between gap-4 px-1 text-xs text-slate-500">
          <span>{percentage}% de aciertos</span>
          <span>Preview de diseño · sin datos reales</span>
        </div>
      </div>
    </main>
  );
}
