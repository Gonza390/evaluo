import Link from 'next/link';
import { ArrowRight, BookOpenCheck, CheckCircle2, FileText, Layers3, Target } from 'lucide-react';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import {
  STUDY_MARKETS,
  STUDY_MARKET_ORDER,
  type StudyMarket,
} from '@/lib/international-study-landings';

const studySteps = [
  {
    number: '01',
    title: 'Selecciona tus apuntes',
    description: 'Elige el PDF que realmente necesitas estudiar. No se envía al servidor hasta después del registro.',
    icon: FileText,
  },
  {
    number: '02',
    title: 'Comprende el contenido',
    description: 'Utiliza el resumen, el glosario y el mapa mental para organizar los conceptos.',
    icon: BookOpenCheck,
  },
  {
    number: '03',
    title: 'Recuerda y practica',
    description: 'Repasa con tarjetas y responde preguntas relacionadas con el material.',
    icon: Layers3,
  },
  {
    number: '04',
    title: 'Revisa tus errores',
    description: 'Detecta los temas que necesitan más atención y comprueba las respuestas en el PDF.',
    icon: Target,
  },
];

export function InternationalStudyLanding({ market }: { market: StudyMarket }) {
  const copy = STUDY_MARKETS[market];
  const source = 'international-study-' + market;
  const demoUrl = '/demo/material-estudio?source=' + source;

  return (
    <div lang={copy.htmlLang} className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-blue-100">
      <MarketingAnalyticsSlot />
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader
          variant="landing"
          trackingLocation={'international_' + market + '_header'}
          actions={
            <a
              href="#seleccionar-pdf"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Elegir mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          }
        />
      </div>

      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_75%_10%,rgba(59,130,246,0.12),transparent_36%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 pb-18 pt-12 sm:px-8 sm:pb-24 sm:pt-18 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:px-10">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700">
                <FileText className="h-4 w-4" aria-hidden="true" /> {copy.eyebrow}
              </p>
              <h1 className="mt-5 max-w-[620px] text-[2.4rem] leading-[1.08] font-bold tracking-[-0.055em] text-slate-950 sm:text-[3.6rem] lg:text-[3.9rem]">
                {copy.headline}
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                {copy.intro}
              </p>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">{copy.searchContext}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Primero eliges el PDF
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Puedes empezar gratis
                </span>
              </div>
              <Link
                href={demoUrl}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Ver una sesión de ejemplo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div id="seleccionar-pdf" className="scroll-mt-24">
              <PdfFirstLandingUploader
                locale="neutral"
                market={market}
                sourceKey={source}
                trackingLocation={'international_' + market + '_uploader'}
              />
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-22" aria-labelledby="pasos-de-estudio">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
            <p className="text-xs font-bold tracking-[0.16em] text-blue-700 uppercase">De tu PDF a la práctica</p>
            <h2 id="pasos-de-estudio" className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {copy.benefitTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{copy.benefitDescription}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {studySteps.map(({ number, title, description, icon: Icon }) => (
                <div key={number} className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex items-center justify-between text-xs font-bold text-blue-700">
                    {number} <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/60 py-16 sm:py-20" aria-labelledby="ejemplo-de-pregunta">
          <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-bold tracking-wider text-blue-700 uppercase">{copy.exampleLabel}</p>
              <h2 id="ejemplo-de-pregunta" className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Practica el contenido, no respuestas al azar.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Este ejemplo ilustra cómo trabajar un concepto. Tus preguntas se basan en el PDF que selecciones y pueden incluir otros tipos de ejercicio.
              </p>
              <Link href={demoUrl} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
                Ver cómo funciona Evaluo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.06)] sm:p-8">
              <p className="text-[11px] font-bold tracking-wide text-blue-700 uppercase">Tema: {copy.exampleTopic}</p>
              <h3 className="mt-4 text-lg font-bold leading-7 text-slate-950">{copy.exampleQuestion}</h3>
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-xs font-bold text-blue-800">Ejemplo de explicación</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{copy.exampleAnswer}</p>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Ejemplo preparado para esta página; no representa una pregunta oficial ni un resultado de un estudiante.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20" aria-labelledby="preguntas-frecuentes">
          <div className="mx-auto grid w-full max-w-[1080px] gap-8 px-4 sm:px-8 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold tracking-wider text-blue-700 uppercase">Preguntas frecuentes</p>
              <h2 id="preguntas-frecuentes" className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Antes de empezar a estudiar
              </h2>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {copy.faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="cursor-pointer pr-4 text-sm font-bold text-slate-950">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-9">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col justify-between gap-5 px-4 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div>
            <p className="text-sm font-bold text-slate-900">Evaluo · Estudia con tu propio material</p>
            <p className="mt-1 text-xs text-slate-500">Versión de lectura: {copy.country}. La disponibilidad de pagos puede variar según el país.</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
              <Link href="/privacidad" className="hover:text-blue-700 hover:underline">Privacidad</Link>
              <Link href="/terminos" className="hover:text-blue-700 hover:underline">Términos</Link>
            </div>
          </div>
          <nav aria-label="Cambiar región" className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-blue-700">
            {STUDY_MARKET_ORDER.map((key) => (
              <Link
                key={key}
                href={STUDY_MARKETS[key].path}
                aria-current={key === market ? 'page' : undefined}
                className="hover:underline aria-[current=page]:text-slate-900"
              >
                {STUDY_MARKETS[key].country}
              </Link>
            ))}
            <Link href="/estudiar-pdf-con-ia" className="hover:underline">Argentina</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
