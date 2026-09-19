'use client';

import { useState } from 'react';
import { CheckCircle2, FileText, UploadCloud } from 'lucide-react';

const steps = [
  {
    icon: UploadCloud,
    title: 'Subí tu PDF',
    description: 'Cargá el apunte o material que querés estudiar.',
    detail: 'Evaluo toma ese archivo como la fuente para todo el recorrido de estudio.',
  },
  {
    icon: CheckCircle2,
    title: 'Entendé y repasá',
    description: 'Recorré el resumen, conectá conceptos y repasá el contenido con flashcards.',
    detail: 'Podés cambiar de formato sin perder el contexto del material que subiste.',
  },
  {
    icon: FileText,
    title: 'Practicá y reforzá',
    description: 'Respondé preguntas, revisá tus errores y volvé a los temas que todavía te cuestan.',
    detail: 'La práctica te ayuda a detectar qué conviene revisar antes de seguir avanzando.',
  },
] as const;

export function HomeHowItWorksInteractive() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = steps[activeIndex];

  return (
    <section id="como-funciona" className="border-b border-slate-100 bg-slate-50/70 py-12 sm:py-14">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.68fr_1.32fr] lg:items-start lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-sm">
              <UploadCloud className="h-3.5 w-3.5" />
              Así de simple
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              ¿Cómo funciona Evaluo?
            </h2>
            <p className="mt-3 max-w-[420px] text-sm leading-7 text-slate-600">
              Subí una vez tu material y usalo para entender, repasar y practicar.
            </p>

            <div className="mt-6 hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm lg:block">
              <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                Paso {activeIndex + 1}
              </p>
              <h3 className="mt-2 text-base font-bold text-slate-950">{active.title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">{active.detail}</p>
            </div>
          </div>

          <div className="grid border-t border-slate-200 sm:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeIndex;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  className={`group relative text-left transition sm:min-h-[190px] ${
                    index > 0 ? 'border-t border-slate-200 sm:border-t-0 sm:border-l' : ''
                  } ${isActive ? 'bg-white' : 'bg-transparent hover:bg-white/70'}`}
                >
                  <div className="h-full px-0 py-5 sm:px-5 sm:py-6">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm transition ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className={`text-[10px] font-black ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className={`mt-4 text-sm font-bold tracking-tight transition ${
                      isActive ? 'text-indigo-800' : 'text-slate-950'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{step.description}</p>

                    <div className="mt-4 lg:hidden">
                      <p className={`overflow-hidden text-xs leading-5 text-slate-500 transition-all ${
                        isActive ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        {step.detail}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-indigo-600 transition-transform duration-200 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
