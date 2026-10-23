'use client';

import { useState } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, RotateCcw, Target } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { STUDY_MARKETS, type StudyMarket } from '@/lib/international-study-landings';

/**
 * Preview intentionally uses editorial example copy, not a student's PDF or
 * scored assessment. Real demo links to the existing PDF workspace/progress.
 */
export function InternationalPracticePreview({ market }: { market: StudyMarket }) {
  const copy = STUDY_MARKETS[market];
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [progressViewed, setProgressViewed] = useState(false);
  const source = `international-study-${market}`;
  const demoUrl = `/demo/material-estudio?tour=0&start=ejercicios&source=${source}`;

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    trackMarketingEvent('international_study_demo_answer_revealed', {
      market,
      source,
      demo_only: true,
      example_topic: copy.exampleTopic,
      has_options: Boolean(copy.exampleOptions),
    });
  };

  const openProgress = () => {
    if (!revealed || progressViewed) return;
    setProgressViewed(true);
    trackMarketingEvent('international_study_demo_progress_viewed', {
      market,
      source,
      demo_only: true,
      example_topic: copy.exampleTopic,
    });
  };

  const reset = () => {
    setSelected(null);
    setRevealed(false);
    setProgressViewed(false);
  };

  return (
    <section className="border-y border-slate-100 bg-slate-50/70 py-16 sm:py-20" aria-labelledby="muestra-practica-pdf">
      <div className="mx-auto grid w-full max-w-[1120px] gap-7 px-4 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-10">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-blue-700 uppercase">Una pregunta · una corrección · un próximo paso</p>
          <h2 id="muestra-practica-pdf" className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            No te quedes solo con un resumen. Descubre qué necesitas repasar.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Prueba una pregunta de ejemplo, revisa la explicación y ve cómo identificar un tema para reforzar. En la plataforma, las preguntas se crean desde tu propio PDF.
          </p>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            Este ejemplo es ilustrativo: no calcula una nota ni guarda progreso académico. Para probar el progreso real de Evaluo, abre el PDF de muestra con sus ejercicios.
          </p>
          <TrackedLink
            href={demoUrl}
            eventName="cta_click"
            payload={{
              location: `international_${market}_real_demo`,
              cta_name: 'abrir_demo_pdf_real',
              destination: '/demo/material-estudio',
              market,
              source,
            }}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Probar ejercicios con un PDF de muestra <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-blue-700">{copy.exampleLabel}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">Ejemplo de práctica</span>
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-600">Tema: {copy.exampleTopic}</p>
          <h3 className="mt-2 text-lg font-bold leading-7 text-slate-950">{copy.exampleQuestion}</h3>

          {copy.exampleOptions ? (
            <div className="mt-5 space-y-2" role="group" aria-label="Selecciona una respuesta de ejemplo">
              {copy.exampleOptions.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  disabled={revealed}
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                  className={`flex w-full min-h-11 items-start gap-2 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition disabled:cursor-default ${selected === index ? 'border-blue-600 bg-blue-50 text-blue-950' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}
                >
                  <span className="font-bold text-blue-700">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm leading-6 text-slate-700">
              Intenta responder con tus propias palabras antes de abrir la explicación.
            </p>
          )}

          {!revealed ? (
            <button
              type="button"
              onClick={reveal}
              disabled={Boolean(copy.exampleOptions) && selected === null}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {copy.exampleOptions ? 'Corregir mi respuesta' : 'Ver explicación'}
              <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <div className="mt-5 space-y-3" aria-live="polite">
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-blue-900"><CheckCircle2 className="h-4 w-4" /> Explicación del concepto</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{copy.exampleAnswer}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">Comprueba el razonamiento con tu temario; una respuesta de práctica no equivale a una evaluación completa.</p>
              </div>
              {!progressViewed ? (
                <button type="button" onClick={openProgress} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50">
                  ¿Qué tema debería repasar? <Target className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold tracking-wide text-blue-700 uppercase">Siguiente paso de estudio</p>
                  <p className="mt-2 text-sm font-bold text-slate-950">{copy.exampleTopic}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">Vuelve al apartado de tus apuntes relacionado con esta pregunta y practica otra vez sin consultar la explicación.</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Para ver resultados por tema calculados a partir de respuestas, utiliza la demostración con PDF.</p>
                </div>
              )}
            </div>
          )}

          {revealed ? (
            <button type="button" onClick={reset} className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Intentar de nuevo
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
