'use client';

import { useState } from 'react';
import {
  Check,
  CircleHelp,
  FileText,
  Layers3,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

type DemoView = 'resumen' | 'flashcard' | 'ejercicio' | 'preguntero';

const demoViews: Array<{ id: DemoView; label: string }> = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'flashcard', label: 'Flashcard' },
  { id: 'ejercicio', label: 'Ejercicio' },
  { id: 'preguntero', label: 'Preguntero' },
];

const quizOptions = [
  'Medible, sustancial, accesible, diferenciable y procesable.',
  'Amplia, flexible, global, genérica y masiva.',
  'Rentable, viral, rápida, emocional y estacional.',
];

export function HomeLiveStudyDemo() {
  const [activeView, setActiveView] = useState<DemoView>('resumen');
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [showExerciseAnswer, setShowExerciseAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const changeView = (view: DemoView) => {
    setActiveView(view);
    if (view !== 'flashcard') setShowFlashcardAnswer(false);
    if (view !== 'ejercicio') setShowExerciseAnswer(false);
    if (view !== 'preguntero') setSelectedAnswer(null);
  };

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.10)]">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-indigo-600">
            <FileText className="h-5 w-5" />
          </span>
          <p className="truncate text-xs font-bold text-slate-950 sm:text-sm">Marketing I</p>
        </div>
        <p className="hidden shrink-0 text-[10px] font-semibold text-slate-400 sm:block">
          Material compartido · 29 páginas
        </p>
      </div>

      <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/50 px-2 sm:px-4">
        {demoViews.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => changeView(view.id)}
            aria-pressed={activeView === view.id}
            className={`relative min-w-0 px-1 py-3 text-[9px] font-bold transition sm:px-3 sm:text-[11px] ${
              activeView === view.id ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="truncate">{view.label}</span>
            {activeView === view.id && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 bg-indigo-600 sm:inset-x-4" />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[330px] min-w-0 px-4 py-5 sm:min-h-[350px] sm:px-7 sm:py-6">
        {activeView === 'resumen' && (
          <div className="animate-surface-reveal">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.15em] text-indigo-600 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Resumen del material
            </div>
            <h3 className="mt-3 max-w-[540px] text-xl font-bold tracking-[-0.03em] text-slate-950 sm:text-2xl">
              Segmentación de mercados
            </h3>
            <p className="mt-2 max-w-[570px] text-xs leading-6 text-slate-500 sm:text-[13px]">
              Del mismo apunte, Evaluo organiza conceptos que después podés convertir en tarjetas y práctica.
            </p>

            <div className="mt-6 border-t border-slate-200">
              {[
                ['Mercado meta', 'Grupo de personas al que se dirige la estrategia de marketing.'],
                ['Segmentación', 'Dividir o clasificar el mercado en grupos similares y significativos.'],
                ['Requisitos', 'Medible, sustancial, accesible, diferenciable y procesable.'],
              ].map(([title, description], index) => (
                <div
                  key={title}
                  className="grid grid-cols-[30px_minmax(0,1fr)] gap-3 border-b border-slate-100 py-3.5 sm:py-4"
                >
                  <span className="pt-0.5 text-[9px] font-black text-indigo-500">0{index + 1}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 sm:text-xs">{title}</p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-[11px] sm:leading-5">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'flashcard' && (
          <div className="animate-surface-reveal">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.15em] text-indigo-600 uppercase">
              <Layers3 className="h-3.5 w-3.5" />
              Flashcard
            </div>

            <div className="relative mt-4 pb-2">
              <div
                aria-hidden="true"
                className="absolute inset-x-4 top-3 bottom-0 translate-y-1.5 rounded-[22px] border border-slate-200 bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowFlashcardAnswer((value) => !value)}
                aria-label={showFlashcardAnswer ? 'Volver a la pregunta' : 'Girar flashcard para ver la respuesta'}
                aria-pressed={showFlashcardAnswer}
                className="group relative block min-h-[245px] w-full rounded-[22px] text-left outline-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:min-h-[265px]"
              >
                <div
                  className={`relative min-h-[245px] w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none sm:min-h-[265px] ${
                    showFlashcardAnswer ? '[transform:rotateY(180deg)]' : ''
                  }`}
                >
                  <div
                    aria-hidden={showFlashcardAnswer}
                    className="absolute inset-0 flex flex-col rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_38px_rgba(15,23,42,0.08)] [backface-visibility:hidden] sm:px-7 sm:py-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-bold tracking-[0.15em] text-indigo-600 uppercase">
                        Pregunta
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-slate-400 sm:text-[10px]">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Tocá para girar
                      </span>
                    </div>

                    <div className="flex flex-1 items-center justify-center py-4 text-center">
                      <h3 className="max-w-[520px] text-xl font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-2xl">
                        ¿Cuál es la diferencia entre intercambio y transacción?
                      </h3>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[9px] font-medium text-slate-400 sm:text-[10px]">
                      <span>Marketing I</span>
                      <span>Recuperación activa</span>
                    </div>
                  </div>

                  <div
                    aria-hidden={!showFlashcardAnswer}
                    className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col rounded-[22px] border border-emerald-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#F4FBF7_100%)] px-5 py-5 shadow-[0_16px_38px_rgba(16,185,129,0.10)] [backface-visibility:hidden] sm:px-7 sm:py-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-bold tracking-[0.15em] text-emerald-700 uppercase">
                        Respuesta
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[9px] font-bold text-emerald-700 sm:text-[10px]">
                        <Check className="h-3 w-3" />
                        Correcta
                      </span>
                    </div>

                    <div className="flex flex-1 items-center justify-center py-4 text-center">
                      <p className="max-w-[540px] text-xs leading-6 text-slate-700 sm:text-[13px] sm:leading-6">
                        Toda transacción es un intercambio, pero no todo intercambio es una transacción. La transacción implica objetos y condiciones acordadas entre las partes.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-emerald-100 pt-3 text-[9px] font-medium text-slate-400 sm:text-[10px]">
                      <span>Respuesta del material</span>
                      <span className="inline-flex items-center gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Tocá para volver
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeView === 'ejercicio' && (
          <div className="animate-surface-reveal">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.15em] text-indigo-600 uppercase">
              <CircleHelp className="h-3.5 w-3.5" />
              Ejercicio rápido
            </div>
            <p className="mt-5 text-[10px] font-semibold text-slate-400">Completá el recorrido</p>
            <h3 className="mt-2 max-w-[560px] text-xl font-bold leading-tight tracking-[-0.03em] text-slate-950 sm:text-2xl">
              Después de segmentar el mercado, ¿qué pasos siguen?
            </h3>

            <div className="mt-7 border-y border-slate-200 py-5">
              {showExerciseAnswer ? (
                <div className="animate-surface-reveal space-y-3">
                  {['Segmentación de mercado', 'Elección del mercado meta', 'Posicionamiento en el mercado'].map(
                    (label, index) => (
                      <div key={label} className="grid grid-cols-[26px_minmax(0,1fr)] items-center gap-3">
                        <span className="text-[10px] font-black text-indigo-500">0{index + 1}</span>
                        <p className="text-xs font-bold text-slate-700">{label}</p>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowExerciseAnswer(true)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 transition hover:text-indigo-900"
                >
                  Mostrar solución
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>

            {showExerciseAnswer && (
              <p className="mt-4 text-[10px] leading-5 text-slate-500">
                El apunte presenta estos tres pasos como el recorrido para trabajar la segmentación y el posicionamiento.
              </p>
            )}
          </div>
        )}

        {activeView === 'preguntero' && (
          <div className="animate-surface-reveal">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.15em] text-indigo-600 uppercase">
              <CircleHelp className="h-3.5 w-3.5" />
              Preguntero
            </div>
            <h3 className="mt-4 max-w-[590px] text-lg font-bold leading-snug tracking-[-0.025em] text-slate-950 sm:text-xl">
              ¿Qué requisitos debe cumplir una segmentación para ser efectiva?
            </h3>

            <div className="mt-5 space-y-2">
              {quizOptions.map((option, index) => {
                const answered = selectedAnswer !== null;
                const isCorrect = index === 0;
                const isSelected = selectedAnswer === index;
                const stateClass = answered
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                    : isSelected
                      ? 'border-red-200 bg-red-50/70 text-red-800'
                      : 'border-slate-200 text-slate-400'
                  : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-slate-900';

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={answered}
                    onClick={() => setSelectedAnswer(index)}
                    className={`flex w-full min-w-0 items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-[10px] leading-4 font-semibold transition sm:text-[11px] sm:leading-5 ${stateClass}`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current/20 text-[9px] font-black">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="min-w-0">{option}</span>
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <div className="mt-4 flex items-start gap-2 border-t border-slate-200 pt-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-[10px] leading-5 text-slate-500">
                  El material enumera esos cinco requisitos para que una segmentación sea efectiva.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
