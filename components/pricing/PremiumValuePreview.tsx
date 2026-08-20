'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, BrainCircuit, FileText, Target } from 'lucide-react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const previewSteps = [
  {
    key: 'resumen',
    label: 'Resumen',
    icon: FileText,
    title: 'Los conceptos que más probablemente entren en el parcial',
    content:
      'La muestra organiza el material por prioridad, conecta definiciones y separa lo esencial de los ejemplos complementarios.',
  },
  {
    key: 'diagnostico',
    label: 'Diagnóstico',
    icon: BrainCircuit,
    title: 'Tu principal brecha está en aplicar los conceptos',
    content:
      'Dominás las definiciones, pero necesitás reforzar ejercicios de aplicación. Evaluo convierte esa brecha en un plan de práctica.',
  },
  {
    key: 'simulacro',
    label: 'Simulacro',
    icon: Target,
    title: 'Práctica basada en el material real de la materia',
    content:
      'Recibís preguntas, corrección y explicación paso a paso para entender por qué fallaste antes del examen.',
  },
] as const;

export function PremiumValuePreview({ source }: { source: string }) {
  const [activeStep, setActiveStep] = useState<(typeof previewSteps)[number]['key']>('resumen');
  const active = previewSteps.find((step) => step.key === activeStep) ?? previewSteps[0];

  useEffect(() => {
    trackMarketingEvent('premium_preview_viewed', { source });
  }, [source]);

  return (
    <section className="border-border bg-card mx-auto max-w-5xl rounded-3xl border p-5 shadow-sm sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
            Probá el resultado
          </p>
          <h2 className="text-foreground mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            De tus apuntes a un plan para aprobar
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6 sm:text-base">
            Esta muestra reproduce el recorrido Premium. Con tu PDF, cada resultado se adapta al
            contenido que realmente estudiás.
          </p>
          <a
            href="#elegir-plan"
            className="text-primary mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            Desbloquearlo con mi material <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="bg-white rounded-2xl border p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Muestra Premium">
            {previewSteps.map((step) => {
              const Icon = step.icon;
              const selected = step.key === activeStep;
              return (
                <button
                  key={step.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveStep(step.key);
                    trackMarketingEvent('premium_preview_interacted', {
                      source,
                      preview_step: step.key,
                    });
                  }}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold transition sm:flex-row sm:text-sm ${
                    selected
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-background/70'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {step.label}
                </button>
              );
            })}
          </div>
          <div className="bg-background mt-3 min-h-44 rounded-2xl border p-5" role="tabpanel">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-bold">
              Ejemplo de resultado
            </span>
            <h3 className="text-foreground mt-4 text-lg font-bold">{active.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{active.content}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
