'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Brain,
  Check,
  FileText,
  Layers3,
  ListChecks,
  Sparkles,
} from 'lucide-react';

const previewTabs = [
  { id: 'resumen', label: 'Resumen', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'glosario', label: 'Glosario', icon: BookOpen },
  { id: 'ejercicios', label: 'Ejercicios', icon: ListChecks },
] as const;

type PreviewTabId = (typeof previewTabs)[number]['id'];

function ResumenPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-500 uppercase">Resumen generado</p>
            <h3 className="mt-1 text-sm font-bold text-slate-900">Álgebra · M1 y M2</h3>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-700 shadow-sm">
            24 páginas
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ['01', 'Sistemas de ecuaciones', 'Métodos, interpretación y resolución.'],
          ['02', 'Matrices', 'Tipos, operaciones y producto matricial.'],
          ['03', 'Vectores', 'Combinación y dependencia lineal.'],
        ].map(([number, title, description]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <span className="text-[10px] font-black text-indigo-500">{number}</span>
            <p className="mt-2 text-[11px] font-bold text-slate-800">{title}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">{description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          Idea clave
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-600">
          Para multiplicar dos matrices, el número de columnas de la primera debe coincidir con el número de filas de la segunda.
        </p>
      </div>
    </div>
  );
}

function FlashcardsPreview() {
  return (
    <div className="flex min-h-[278px] flex-col justify-center">
      <div className="mx-auto w-full max-w-[430px] rounded-[24px] border border-indigo-200 bg-[linear-gradient(145deg,#ffffff_0%,#eef2ff_100%)] p-5 shadow-[0_18px_45px_rgba(79,70,229,0.12)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white">Flashcard 4 de 18</span>
          <Brain className="h-5 w-5 text-indigo-500" />
        </div>
        <p className="mt-8 text-center text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">Pregunta</p>
        <p className="mx-auto mt-2 max-w-[330px] text-center text-lg font-bold leading-7 tracking-tight text-slate-900">
          ¿Cuándo se pueden multiplicar dos matrices?
        </p>
        <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Respuesta</p>
          <p className="mt-1 text-[11px] leading-5 font-semibold text-emerald-950">
            Cuando las columnas de A coinciden con las filas de B.
          </p>
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
    <div className="space-y-2.5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-500 uppercase">Glosario del PDF</p>
          <h3 className="mt-1 text-sm font-bold text-slate-900">Conceptos para repasar</h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-400">43 conceptos</span>
      </div>
      {terms.map(([term, definition], index) => (
        <div key={term} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[10px] font-black text-indigo-600">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <p className="text-[11px] font-bold text-slate-900">{term}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">{definition}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EjerciciosPreview() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-500 uppercase">Ejercicio generado</p>
          <p className="mt-1 text-xs font-bold text-slate-800">Producto de matrices</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Intermedio</span>
      </div>

      <p className="mt-6 text-[13px] leading-6 font-semibold text-slate-900">
        Si A es una matriz 3×2 y B es una matriz 2×4, ¿qué dimensión tiene el producto AB?
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {['2×2', '2×4', '3×2', '3×4'].map((option) => {
          const correct = option === '3×4';
          return (
            <div
              key={option}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-[11px] font-bold ${
                correct
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {option}
              {correct ? <Check className="h-3.5 w-3.5" /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-indigo-50 px-3.5 py-3 text-[10px] leading-4 text-indigo-800">
        El resultado conserva las filas de A y las columnas de B: <strong>3×4</strong>.
      </div>
    </div>
  );
}

const previews: Record<PreviewTabId, () => React.JSX.Element> = {
  resumen: ResumenPreview,
  flashcards: FlashcardsPreview,
  glosario: GlosarioPreview,
  ejercicios: EjerciciosPreview,
};

export function HomeStudyPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeTab = previewTabs[activeIndex];
  const ActivePreview = previews[activeTab.id];

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % previewTabs.length);
    }, 3600);

    return () => window.clearInterval(interval);
  }, [paused]);

  return (
    <div
      className="animate-surface-reveal relative mx-auto w-full max-w-[640px]"
      style={{ animationDelay: '100ms' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-indigo-200/45 via-blue-100/20 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur sm:p-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[0.13em] text-indigo-300 uppercase">Procesado desde tu PDF</p>
              <p className="mt-0.5 truncate text-xs font-bold sm:text-sm">Álgebra M1 y M2.pdf</p>
            </div>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 sm:inline-flex">
            <Sparkles className="h-3 w-3" />
            Material listo
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1.5">
          {previewTabs.map(({ id, label, icon: Icon }, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2.5 text-[9px] font-bold transition sm:flex-row sm:gap-1.5 sm:px-2 sm:text-[10px] ${
                  active ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
                {active ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full bg-indigo-100">
                    <span className="block h-full w-full origin-left animate-[homePreviewProgress_3.6s_linear] bg-indigo-600" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div key={activeTab.id} className="min-h-[318px] animate-surface-reveal px-1 py-4 sm:min-h-[330px] sm:px-2 sm:py-5">
          <ActivePreview />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-3 sm:px-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
            <Layers3 className="h-3.5 w-3.5 text-indigo-500" />
            Un PDF, varias formas de estudiar
          </div>
          <div className="flex items-center gap-1.5" aria-label="Vista activa">
            {previewTabs.map(({ id }, index) => (
              <button
                key={id}
                type="button"
                aria-label={`Mostrar ${previewTabs[index].label}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-300'}`}
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
