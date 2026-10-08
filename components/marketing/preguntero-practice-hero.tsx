import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, ListChecks, Play, Target } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { buildSimulatorLandingHref } from '@/lib/simulator-landing-entry';

type Props = {
  title: string;
  materiaNombre: string;
  universidadNombre?: string;
  totalPreguntas: number;
  pregunteroHref: string;
  simuladorHref: string;
  label: string;
  parcial?: string;
  backLabel?: string;
  description?: string;
  countLabel?: string;
  children?: ReactNode;
  previewQuestion?: { id: string; enunciado: string; opciones: string[] };
};

export function PregunteroPracticeHero({
  title,
  materiaNombre,
  universidadNombre,
  totalPreguntas,
  pregunteroHref,
  simuladorHref,
  label,
  parcial,
  backLabel,
  description,
  countLabel,
  children,
  previewQuestion,
}: Props) {
  const payload = (location: string) => ({
    location,
    cta_name: 'iniciar_simulador',
    materia: materiaNombre,
    parcial,
    destination: simuladorHref,
  });
  return (
    <section className="border-border from-background to-primary/5 border-b bg-gradient-to-br">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href={pregunteroHref}
          className="text-muted-foreground hover:text-primary inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel ?? `Preguntero de ${materiaNombre}`}
        </Link>
        <div className="mt-3 grid gap-6 sm:mt-5 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          <div>
            <p className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-widest uppercase">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Preguntero · {label}
            </p>
            <h1 className="text-foreground mt-3 text-[1.875rem] leading-[1.12] font-bold tracking-tight sm:mt-5 sm:text-5xl">
              {title}
              {universidadNombre ? (
                <span className="text-muted-foreground mt-2 block text-base font-semibold sm:mt-3 sm:text-2xl">
                  {universidadNombre}
                </span>
              ) : null}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6 sm:mt-5 sm:text-lg sm:leading-8">
              {description ??
                'Practicá tu parcial, descubrí qué necesitás reforzar y entendé por qué te equivocaste.'}
            </p>
            {totalPreguntas > 0 ? (
              <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:items-start sm:gap-3">
                <TrackedLink
                  href={simuladorHref}
                  eventName="preguntero_landing_cta_clicked"
                  payload={payload('preguntero_practice_hero')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-7 text-base font-bold shadow-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Play className="h-5 w-5" aria-hidden="true" />
                  Practicar ahora
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </TrackedLink>
                <p className="text-muted-foreground text-sm">Podés empezar sin crear cuenta.</p>
              </div>
            ) : null}
            <div className="text-muted-foreground border-border mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-sm sm:mt-6 sm:pt-5">
              <span className="text-foreground inline-flex items-center gap-2 font-semibold">
                <ListChecks className="text-primary h-4 w-4" aria-hidden="true" />
                {totalPreguntas.toLocaleString('es-AR')}{' '}
                {countLabel ?? `preguntas del ${label.toLowerCase()}`}
              </span>
              <span className="inline-flex items-center gap-2">
                <Target className="text-primary h-4 w-4" aria-hidden="true" />
                Resultado al terminar
              </span>
            </div>
            {children}
          </div>
          <div className="border-border bg-card overflow-hidden rounded-3xl border shadow-xl">
            <div className="border-border bg-muted/40 flex items-center justify-between gap-3 border-b px-5 py-4">
              <span className="text-foreground text-sm font-bold">Una pregunta del banco</span>
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                {label}
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                {materiaNombre}
              </p>
              <p className="text-foreground mt-4 text-lg leading-8 font-semibold">
                {previewQuestion?.enunciado ??
                  (totalPreguntas > 0
                    ? 'Practicá con las preguntas disponibles de este parcial.'
                    : 'Todavía estamos cargando las preguntas de esta materia.')}
              </p>
              {previewQuestion ? (
                <>
                  <ul
                    className="mt-4 space-y-2"
                    aria-label="Opciones de la pregunta de vista previa"
                  >
                    {previewQuestion.opciones.map((option, index) => (
                      <li key={`${index}-${option}`}>
                        <TrackedLink
                          href={buildSimulatorLandingHref(
                            simuladorHref,
                            previewQuestion.id,
                            option
                          )}
                          eventName="preguntero_landing_cta_clicked"
                          payload={{
                            ...payload('preguntero_option'),
                            cta_name: 'seleccionar_opcion',
                            question_id: previewQuestion.id,
                          }}
                          className="border-border text-foreground hover:border-primary hover:bg-primary/5 focus-visible:ring-ring flex min-h-12 items-start gap-3 rounded-xl border px-3 py-3 text-sm leading-6 transition focus-visible:ring-2 focus-visible:outline-none"
                        >
                          <span
                            className="bg-muted text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                            aria-hidden="true"
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span>{option}</span>
                        </TrackedLink>
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground mt-3 text-xs">
                    Elegí una opción para continuar. Podés cambiarla y confirmarla en el simulador.
                  </p>
                </>
              ) : null}
              {totalPreguntas > 0 ? (
                <>
                  <div className="border-border bg-primary/5 mt-5 rounded-2xl border p-4">
                    <p className="text-foreground text-sm font-semibold">
                      Pasá de leer preguntas a practicar el examen.
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                      Respondé en el simulador y revisá tu resultado al terminar.
                    </p>
                  </div>
                  <TrackedLink
                    href={simuladorHref}
                    eventName="preguntero_landing_cta_clicked"
                    payload={payload('preguntero_question_preview')}
                    className="text-primary hover:bg-primary/5 focus-visible:ring-ring border-primary/30 mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition focus-visible:ring-2 focus-visible:outline-none"
                  >
                    Responder en el simulador
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </TrackedLink>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <ol
          className="border-border mt-8 grid gap-4 border-t pt-6 sm:grid-cols-3"
          aria-label="Cómo funciona el preguntero"
        >
          {[
            ['1', 'Simulá el parcial', `Respondé preguntas de ${materiaNombre}.`],
            ['2', 'Revisá cómo te fue', 'Conocé tu resultado y revisá tus errores al terminar.'],
            [
              '3',
              'Guardá tus intentos',
              'Creá tu cuenta para conservar tu progreso y seguir practicando.',
            ],
          ].map(([number, heading, text]) => (
            <li key={number} className="flex gap-3">
              <span className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {number === '3' ? <Check className="h-4 w-4" aria-hidden="true" /> : number}
                <span className="sr-only">{number === '3' ? 'Paso 3' : ''}</span>
              </span>
              <div>
                <p className="text-foreground text-sm font-bold">{heading}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
