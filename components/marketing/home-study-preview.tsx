'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Brain,
  Check,
  FileText,
  ListChecks,
  Sparkles,
} from 'lucide-react';

const previewSteps = [
  { id: 'resumen', label: 'Resumen', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'glosario', label: 'Glosario', icon: BookOpen },
  { id: 'ejercicios', label: 'Ejercicios', icon: ListChecks },
] as const;

type PreviewStepId = (typeof previewSteps)[number]['id'];

function ResumenPreview() {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-[10px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Resumen generado</p>
        <h3 className="mt-2 text-xl font-bold tracking-[-0.025em] text-slate-950">Los temas clave, ordenados para repasar</h3>
        <p className="mt-2 max-w-[500px] text-[11px] leading-5 text-slate-500">
          Evaluo organiza el contenido del material y separa los conceptos importantes antes de practicar.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80">
        {[
          ['01', 'Sistemas de ecuaciones', 'Métodos, interpretación y resolución.'],
          ['02', 'Matrices', 'Tipos, operaciones y producto matricial.'],
          ['03', 'Vectores', 'Combinación y dependencia lineal.'],
        ].map(([number, title, description], index) => (
          <div
            key={title}
            className={`flex items-start gap-4 px-4 py-3.5 ${index > 0 ? 'border-t border-slate-100' : ''}`}
          >
            <span className="pt-0.5 text-[10px] font-black text-indigo-500">{number}</span>
            <div>
              <p className="text-[11px] font-bold text-slate-900">{title}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-start gap-2.5 rounded-2xl bg-indigo-50/80 px-4 py-3.5 text-indigo-950">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <p className="text-[10px] leading-5">
            <strong>Idea clave:</strong> para multiplicar dos matrices, las columnas de la primera deben coincidir con las filas de la segunda.
          </p>
        </div>
      </div>
    </div>
  );
}

function FlashcardsPreview() {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-[10px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Flashcards</p>
        <h3 className="mt-2 text-xl font-bold tracking-[-0.025em] text-slate-950">Repasá activamente lo que acabás de estudiar</h3>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">Las tarjetas se generan a partir de los conceptos del mismo material.</p>
      </div>

      <div className="flex flex-1 items-center justify-center py-6">
        <div className="w-full max-w-[440px] text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-600">
            <Brain className="h-3.5 w-3.5" />
            Tarjeta 4 de 18
          </div>
          <p className="mt-7 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">Pregunta</p>
          <p className="mx-auto mt-3 max-w-[360px] text-[18px] font-bold leading-7 tracking-tight text-slate-950">
            ¿Cuándo se pueden multiplicar dos matrices?
          </p>
          <div className="mx-auto mt-7 max-w-[390px] border-t border-slate-200 pt-5">
            <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-600 uppercase">Respuesta</p>
            <p className="mt-2 text-[11px] leading-5 font-semibold text-slate-700">
              Cuando el número de columnas de A coincide con el número de filas de B.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlosarioPreview() {
  const terms = [
    ['Matriz identidad', 'Matriz cuadrada con 1 en la diagonal principal y 0 en el resto.'],
    ['Vector columna', 'Matriz de una sola columna utilizada para representar componentes ordenadas.'],
    ['Combinación lineal', 'Suma de vectores multiplicados por escalares.'],
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Glosario</p>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.025em] text-slate-950">Conceptos importantes, listos para consultar</h3>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Definiciones construidas desde el contenido del material.</p>
        </div>
        <span className="hidden shrink-0 text-[10px] font-semibold text-slate-400 sm:block">43 conceptos</span>
      </div>

      <div className="mt-6 divide-y divide-slate-100 border-y border-slate-200/80">
        {terms.map(([term, definition], index) => (
          <div key={term} className="grid grid-cols-[34px_1fr] gap-3 py-4">
            <span className="text-[10px] font-black text-indigo-500">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <p className="text-[11px] font-bold text-slate-900">{term}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">{definition}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EjerciciosPreview() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Ejercicios</p>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.025em] text-slate-950">Comprobá si realmente entendiste el tema</h3>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Preguntas generadas desde los conceptos del mismo material.</p>
        </div>
        <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 sm:block">Intermedio</span>
      </div>

      <p className="mt-7 max-w-[510px] text-[14px] leading-6 font-semibold text-slate-900">
        Si A es una matriz 3×2 y B es una matriz 2×4, ¿qué dimensión tiene el producto AB?
      </p>

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-2">
        {['2×2', '2×4', '3×2', '3×4'].map((option) => {
          const correct = option === '3×4';
          return (
            <div
              key={option}
              className={`flex items-center justify-between border-b px-1 py-3 text-[11px] font-bold ${
                correct ? 'border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-500'
              }`}
            >
              {option}
              {correct ? <Check className="h-3.5 w-3.5" /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-5">
        <p className="text-[10px] leading-5 text-slate-500">
          <strong className="text-indigo-700">Por qué:</strong> el resultado conserva las filas de A y las columnas de B, por eso queda 3×4.
        </p>
      </div>
    </div>
  );
}

const previews: Record<PreviewStepId, () => React.JSX.Element> = {
  resumen: ResumenPreview,
  flashcards: FlashcardsPreview,
  glosario: GlosarioPreview,
  ejercicios: EjerciciosPreview,
};

export function HomeStudyPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeStep = previewSteps[activeIndex];
  const ActivePreview = previews[activeStep.id];
  const ActiveIcon = activeStep.icon;

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % previewSteps.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [paused]);

  return (
    <div
      className="animate-surface-reveal relative mx-auto w-full max-w-[640px]"
      style={{ animationDelay: '100ms' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute -inset-8 rounded-[44px] bg-gradient-to-br from-indigo-200/50 via-blue-100/20 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
        <div className="h-0.5 overflow-hidden bg-indigo-100">
          <div
            key={`progress-${activeStep.id}`}
            className="h-full w-full origin-left animate-[homePreviewProgress_4.2s_linear] bg-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ActiveIcon className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Vista de estudio</p>
              <p className="mt-0.5 text-xs font-bold text-slate-900 sm:text-sm">{activeStep.label}</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">{activeIndex + 1} / {previewSteps.length}</span>
        </div>

        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-5 py-5 sm:px-7 sm:py-6">
          <div key={activeStep.id} className="min-h-[330px] animate-surface-reveal sm:min-h-[350px]">
            <ActivePreview />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
          <p className="text-[10px] font-semibold text-slate-500">Un mismo material, distintas formas de estudiarlo</p>
          <div className="flex items-center gap-2" aria-label="Cambiar vista">
            {previewSteps.map(({ id, label }, index) => (
              <button
                key={id}
                type="button"
                aria-label={`Mostrar ${label}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes homePreviewProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
