'use client';

import { CheckCircle2, FileText, UploadCloud } from 'lucide-react';

const steps = [
  {
    icon: UploadCloud,
    title: 'Subí tu PDF',
    description: 'Cargá el apunte o material que querés estudiar.',
  },
  {
    icon: CheckCircle2,
    title: 'Entendé y repasá',
    description: 'Recorré el resumen, conectá conceptos y repasá el contenido con flashcards.',
  },
  {
    icon: FileText,
    title: 'Practicá y reforzá',
    description: 'Respondé preguntas, revisá tus errores y volvé a los temas que todavía te cuestan.',
  },
] as const;

export function HomeHowItWorksInteractive() {
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
          </div>

          <div className="grid border-t border-slate-200 sm:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className={`group relative transition hover:bg-white ${
                    index > 0 ? 'border-t border-slate-200 sm:border-t-0 sm:border-l' : ''
                  }`}
                >
                  <div className="h-full px-0 py-5 sm:min-h-[190px] sm:px-5 sm:py-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm transition group-hover:bg-indigo-600 group-hover:text-white">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-[10px] font-black text-slate-400 transition group-hover:text-indigo-700">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-bold tracking-tight text-slate-950 transition group-hover:text-indigo-800">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{step.description}</p>
                  </div>

                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-indigo-600 transition-transform duration-200 group-hover:scale-x-100"
                    aria-hidden="true"
                  />
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
