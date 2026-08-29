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
  UploadCloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  improved?: boolean;
};

const PREVIEW_MATERIA_ID = 'a3f01be6-2087-493f-b436-83bdd39eed8a';

export function SimulatorResultRedesignPreview({ improved = false }: Props) {
  const [vote, setVote] = useState<1 | -1 | null>(null);

  const correct = 20;
  const total = 30;
  const wrong = total - correct;
  const percentage = Math.round((correct / total) * 100);
  const grade = ((correct / total) * 10).toFixed(1);
  const uploadHref = `/dashboard/materiales?openUpload=1&materiaId=${PREVIEW_MATERIA_ID}`;

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-[#E8EDF5] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-[#5D65F6]">Resultados del simulador</p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
              Derecho Procesal Público · Parcial 1
            </h1>
          </div>
          <Link
            href={
              improved
                ? '/preview/resultado-simulador'
                : '/preview/resultado-simulador?estado=mejora'
            }
            className="text-xs font-semibold text-slate-500 transition hover:text-slate-800"
          >
            Preview: {improved ? 'ver primer intento' : 'ver caso con mejora'}
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="grid gap-8 border-b border-[#E8EDF5] py-9 sm:py-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Tu nota
            </p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-[4.5rem] leading-none font-bold tracking-[-0.08em] text-[#0F1B3D] sm:text-[5.3rem]">
                {grade}
              </span>
              <span className="pb-2 text-lg font-semibold text-slate-400">/ 10</span>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                <strong className="font-bold text-slate-950">{correct} de {total}</strong> correctas
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Tenés una buena base. Ahora enfocá el repaso en las {wrong} preguntas que fallaste antes de volver a intentar.
            </p>
          </div>

          <div className="flex flex-col justify-center border-t border-[#E8EDF5] pt-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
            <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Tu evolución
            </p>
            {improved ? (
              <div className="mt-3 flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                    Mejoraste 12% vs. tu intento anterior
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Tu nota anterior fue 5,9.</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#5D65F6]" />
                <div>
                  <p className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                    Primer intento en esta materia
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Este resultado queda como punto de partida para medir tu próxima mejora.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-600">¿Te sirvió este simulador?</span>
              <button
                type="button"
                onClick={() => setVote(1)}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition',
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
                  'inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition',
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
        </section>

        <section className="border-b border-[#E8EDF5] py-8 sm:py-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[12px] font-semibold tracking-[0.18em] text-[#5D65F6] uppercase">
                Siguiente paso
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950 sm:text-2xl">
                Repasá tus {wrong} errores
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Volvé sólo sobre las preguntas que fallaste. Corregilas y después medí de nuevo cuánto mejoraste.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5D65F6] to-[#6366F1] px-5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Repasar mis errores
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      <section className="border-b border-[#DCE6FF] bg-[#F7F9FF]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex max-w-3xl items-start gap-4">
            <UploadCloud className="mt-1 h-6 w-6 shrink-0 text-[#5D65F6]" />
            <div>
              <p className="text-[12px] font-semibold tracking-[0.18em] text-[#5D65F6] uppercase">
                Seguí preparando esta materia
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950 sm:text-2xl">
                ¿Tenés apuntes de Derecho Procesal Público?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                Convertí el PDF que estás usando para estudiar en resumen, glosario, tarjetas y ejercicios. Ya sabemos qué materia estás preparando, así que podés empezar directo.
              </p>
            </div>
          </div>
          <Link
            href={uploadHref}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C7D2FE] bg-white px-5 text-sm font-semibold text-[#4F46E5] transition hover:bg-[#EEF0FF]"
          >
            Preparar mis apuntes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#5D65F6]"
            >
              <BookOpen className="h-4 w-4" />
              Volver a la materia
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#5D65F6]"
            >
              <RotateCcw className="h-4 w-4" />
              Hacer otro modelo
            </button>
          </div>
          <span className="text-xs text-slate-400">{percentage}% de aciertos · Preview de diseño</span>
        </section>
      </div>
    </main>
  );
}
