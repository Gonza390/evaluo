'use client';

import Link from 'next/link';
import { PregunteroPracticeHero } from '@/components/marketing/preguntero-practice-hero';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Brain, ListChecks, Target } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type Variant = 'a' | 'b';

type SampleQuestion = {
  id: string;
  enunciado: string;
  opcionesCount: number;
};

type Props = {
  previewQuestion?: { id: string; enunciado: string; opciones: string[] };
  title: string;
  materiaNombre: string;
  universidadNombre?: string;
  carreraNombre?: string;
  label: string;
  totalPreguntas: number;
  samplePreguntas: SampleQuestion[];
  simuladorHref: string;
  pregunteroHref: string;
  materiaHref: string;
  resumenHref: string;
  parcial1Href: string;
  parcial2Href: string;
  integradorHref: string;
};

const EXPERIMENT = 'preguntero_personas_juridicas_p1_visual_v1';
const STORAGE_KEY = `evaluo:experiment:${EXPERIMENT}`;

function readOrAssignVariant(): Variant {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'a' || stored === 'b') return stored;

    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    const assigned: Variant = value[0] % 2 === 0 ? 'a' : 'b';
    window.localStorage.setItem(STORAGE_KEY, assigned);
    return assigned;
  } catch {
    return 'a';
  }
}

function withExperiment(href: string, variant: Variant) {
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}exp=${encodeURIComponent(EXPERIMENT)}&variant=${variant}`;
}

export function PregunteroPersonasJuridicasExperiment({
  title,
  previewQuestion,
  materiaNombre,
  universidadNombre,
  carreraNombre,
  label,
  totalPreguntas,
  samplePreguntas,
  simuladorHref,
  pregunteroHref,
  materiaHref,
  resumenHref,
  parcial1Href,
  parcial2Href,
  integradorHref,
}: Props) {
  const [variant, setVariant] = useState<Variant>('a');
  const exposureTracked = useRef(false);

  useEffect(() => {
    const assigned = readOrAssignVariant();
    setVariant(assigned);

    if (!exposureTracked.current) {
      exposureTracked.current = true;
      trackMarketingEvent('preguntero_landing_experiment_viewed', {
        experiment: EXPERIMENT,
        variant: assigned,
        materia: materiaNombre,
        parcial: '1',
      });
    }
  }, [materiaNombre]);

  const experimentSimulatorHref = useMemo(
    () => withExperiment(simuladorHref, variant),
    [simuladorHref, variant]
  );

  const primaryPayload = (location: string) => ({
    experiment: EXPERIMENT,
    variant,
    location,
    cta_name: 'practicar_parcial_1',
    destination: experimentSimulatorHref,
    materia: materiaNombre,
    parcial: '1',
  });

  return (
    <>
      <PregunteroPracticeHero
        title={title}
        materiaNombre={materiaNombre}
        universidadNombre={universidadNombre}
        totalPreguntas={totalPreguntas}
        pregunteroHref={pregunteroHref}
        simuladorHref={experimentSimulatorHref}
        label={label}
        parcial="1"
        previewQuestion={previewQuestion}
      >
        {carreraNombre ? (
          <p className="text-muted-foreground mt-3 text-sm">{carreraNombre}</p>
        ) : null}
        <p className="text-muted-foreground mt-2 text-sm">
          Gratis para empezar · Corrección y repaso conectados
        </p>
        <Link
          href={materiaHref}
          className="text-primary mt-3 inline-flex min-h-11 items-center text-sm font-semibold hover:underline"
        >
          Ver la materia
        </Link>
      </PregunteroPracticeHero>

      <section className="border-b border-slate-100 bg-white py-14 sm:py-18">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <div
            className={
              variant === 'a'
                ? 'grid gap-6 lg:grid-cols-3'
                : 'grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center'
            }
          >
            {variant === 'a' ? (
              [
                [
                  Target,
                  'Practicá como vas a rendir',
                  'Respondé preguntas del parcial y comprobá qué tan preparado estás.',
                ],
                [
                  Brain,
                  'Entendé tus errores',
                  'No te quedes con el resultado: revisá qué falló y por qué.',
                ],
                [
                  BookOpen,
                  'Reforzá la materia',
                  'Volvé al material de Personas Jurídicas y estudiá lo que todavía te cuesta.',
                ],
              ].map(([Icon, stepTitle, description]) => {
                const StepIcon = Icon as typeof Target;
                return (
                  <article
                    key={String(stepTitle)}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <StepIcon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-5 text-lg font-bold tracking-tight text-slate-950">
                      {String(stepTitle)}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{String(description)}</p>
                  </article>
                );
              })
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                    <span className="h-px w-8 bg-indigo-500" />
                    Más que un preguntero
                  </div>
                  <h2 className="mt-5 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                    El preguntero es la entrada. Evaluo te ayuda a preparar toda la materia.
                  </h2>
                  <p className="mt-4 max-w-[560px] text-sm leading-7 text-slate-600 sm:text-base">
                    Practicá, detectá qué te cuesta y volvé al contenido correcto sin cambiar de
                    herramienta.
                  </p>
                </div>
                <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50/70">
                  {[
                    ['01', 'Preguntero', 'Medí cómo venís con preguntas del parcial.'],
                    ['02', 'Corrección', 'Entendé el error y ubicá el tema que necesitás repasar.'],
                    [
                      '03',
                      'Material de estudio',
                      'Usá resumen, flashcards y ejercicios para reforzarlo.',
                    ],
                  ].map(([number, stepTitle, description]) => (
                    <div
                      key={number}
                      className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 border-b border-slate-200 px-5 py-5 last:border-b-0 sm:px-6"
                    >
                      <span className="pt-0.5 text-[10px] font-black text-indigo-700">
                        {number}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-950">{stepTitle}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-50/60 py-14 sm:py-18">
        <div className="mx-auto grid w-full max-w-[1240px] gap-7 px-4 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  Preguntas reales
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
                  Preguntas de muestra del {label.toLowerCase()}
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {totalPreguntas.toLocaleString('es-AR')} disponibles
              </span>
            </div>

            {samplePreguntas.length === 0 ? (
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Todavía estamos cargando el banco de preguntas de este parcial. Entrá al Preguntero
                para ver las preguntas disponibles.
              </p>
            ) : (
              <ul className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
                {samplePreguntas.map((question, index) => (
                  <li key={question.id} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 py-5">
                    <span className="pt-0.5 text-[10px] font-black text-indigo-700">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-sm leading-6 font-semibold text-slate-900">
                        {question.enunciado}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {question.opcionesCount} opciones
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <TrackedLink
              href={experimentSimulatorHref}
              eventName="preguntero_landing_cta_clicked"
              payload={primaryPayload('sample_questions')}
              className="from-brand to-brand-2 mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]"
            >
              Practicar Parcial 1 gratis
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                [parcial1Href, 'Parcial 1', true],
                [parcial2Href, 'Parcial 2', false],
                [integradorHref, 'Integrador', false],
              ].map(([href, text, active]) => (
                <Link
                  key={String(text)}
                  href={String(href)}
                  className={
                    active
                      ? 'rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700'
                      : 'rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700'
                  }
                >
                  {String(text)}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">
                Seguir con {materiaNombre}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Practicá el parcial y después seguí con el contenido de la misma materia.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={pregunteroHref}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline"
                >
                  <ListChecks className="h-5 w-5" />
                  Ver preguntero completo
                </Link>
                <Link
                  href={materiaHref}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline"
                >
                  <BookOpen className="h-5 w-5" />
                  Entrar a la materia
                </Link>
                <Link
                  href={resumenHref}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline"
                >
                  <BookOpen className="h-5 w-5" />
                  Ver resúmenes
                </Link>
              </div>
            </div>

            <div
              className={
                variant === 'a'
                  ? 'rounded-[26px] border border-indigo-100 bg-indigo-50/70 p-6'
                  : 'rounded-[26px] bg-slate-950 p-6 text-white shadow-xl'
              }
            >
              <p
                className={
                  variant === 'a'
                    ? 'text-xs font-bold text-indigo-700'
                    : 'text-xs font-bold text-indigo-200'
                }
              >
                Llegá al parcial sabiendo qué reforzar.
              </p>
              <h2
                className={
                  variant === 'a'
                    ? 'mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950'
                    : 'mt-2 text-2xl font-bold tracking-[-0.04em] text-white'
                }
              >
                {materiaNombre} · Parcial 1
              </h2>
              <TrackedLink
                href={experimentSimulatorHref}
                eventName="preguntero_landing_cta_clicked"
                payload={primaryPayload('final_cta')}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5"
              >
                Practicar Parcial 1 gratis
                <ArrowRight className="h-4 w-4" />
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <div className="h-20 sm:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
        <TrackedLink
          href={experimentSimulatorHref}
          eventName="preguntero_landing_cta_clicked"
          payload={primaryPayload('mobile_sticky')}
          className="from-brand to-brand-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 text-sm font-bold text-white"
        >
          Practicar Parcial 1 gratis
          <ArrowRight className="h-4 w-4" />
        </TrackedLink>
      </div>
    </>
  );
}
