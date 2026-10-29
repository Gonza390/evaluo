import Link from 'next/link';
import { ArrowRight, BookOpenCheck, CheckCircle2, FileText, Layers3, Target } from 'lucide-react';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';
import { InternationalPracticePreview } from '@/components/marketing/international-practice-preview';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { REGIONAL_STUDY_GUIDES } from '@/lib/regional-study-guides';
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
  const guide = REGIONAL_STUDY_GUIDES[market];
  const source = 'international-study-' + market;
  const demoUrl = '/demo/material-estudio?tour=0&start=ejercicios&source=' + source;

  return (
    <div lang={copy.htmlLang} className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-blue-100">
      <InternationalDocumentLanguage lang={copy.htmlLang} />
      <MarketingAnalyticsSlot />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Evaluo', path: '/' },
          { name: 'Estudiar PDF con IA', path: '/estudiar-pdf-con-ia' },
          { name: copy.country, path: copy.path },
        ])}
      />
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
              <TrackedLink
                href={demoUrl}
                eventName="cta_click"
                payload={{ location: `international_${market}_hero_demo`, cta_name: 'ver_practica_pdf_real', market, source }}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Probar una sesión con PDF de muestra <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
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

        <InternationalPracticePreview market={market} />

        <section className="py-16 sm:py-20" aria-labelledby="guia-regional">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <p className="text-xs font-bold tracking-[0.14em] text-blue-700 uppercase">
              Guía práctica de estudio · {copy.country}
            </p>
            <h2 id="guia-regional" className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {guide.question}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{guide.approach}</p>
            <h3 className="mt-10 text-2xl font-bold tracking-tight text-slate-900">{guide.guideTitle}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{guide.guideIntro}</p>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {guide.steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                  <span className="text-xs font-bold text-blue-700">Paso {index + 1}</span>
                  <h4 className="mt-2 text-lg font-bold text-slate-950">{step.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-[26px] border border-blue-100 bg-blue-50/50 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Ejemplo de uso · {copy.country}
              </p>
              <h3 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-slate-950">
                {guide.appliedExample.title}
              </h3>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                {guide.appliedExample.context}
              </p>
              <ol className="mt-6 grid gap-4 md:grid-cols-3">
                {guide.appliedExample.tasks.map((task, index) => (
                  <li key={task} className="rounded-2xl border border-blue-100 bg-white px-5 py-5">
                    <span className="text-xs font-bold text-blue-700">Actividad {index + 1}</span>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{task}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-slate-800">
                {guide.appliedExample.result}
              </p>
              <TrackedLink
                href="#seleccionar-pdf"
                eventName="cta_click"
                payload={{
                  location: `international_${market}_regional_example`,
                  cta_name: 'seleccionar_pdf_desde_ejemplo',
                  source,
                  market,
                  destination: '#seleccionar-pdf',
                }}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Probarlo con mis propios apuntes <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">{guide.mistakesTitle}</h3>
                <div className="mt-5 space-y-5">
                  {guide.mistakes.map((item) => (
                    <div key={item.title} className="border-l-2 border-blue-200 pl-4">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-6 sm:p-7">
                <h3 className="text-xl font-bold text-slate-950">{guide.selfCheckTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{guide.selfCheckIntro}</p>
                <ul className="mt-5 space-y-4">
                  {guide.selfCheckQuestions.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#seleccionar-pdf"
                  className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
                >
                  Empezar con mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/70 py-16 sm:py-20" aria-labelledby="otras-formas-de-estudiar">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <h2 id="otras-formas-de-estudiar" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Otras formas de trabajar con el mismo PDF
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              No hace falta usar todas las herramientas a la vez. Elige la que responda a tu duda actual:
              comprender un texto, recordar conceptos o relacionar ideas antes de practicar.
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                { title: 'Resumir un PDF con IA', href: '/funciones/resumir-pdf-con-ia', text: 'Extrae las ideas principales para orientar la primera lectura.' },
                { title: 'Crear flashcards desde PDF', href: '/funciones/crear-flashcards-desde-pdf', text: 'Practica la recuperación de conceptos sin consultar la respuesta.' },
                { title: 'Hacer un mapa mental desde PDF', href: '/funciones/crear-mapa-mental-desde-pdf', text: 'Visualiza cómo se relacionan temas, conceptos y apartados.' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm">
                  <h3 className="text-sm font-bold text-blue-700">{item.title} <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden="true" /></h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{item.text}</p>
                </Link>
              ))}
            </div>
            <p className="mt-6 max-w-4xl text-xs leading-6 text-slate-500">
              Por qué recomendamos practicar sin mirar: la investigación sobre aprendizaje reconoce los beneficios
              de la práctica de recuperación y el estudio distribuido.
              {' '}
              <a href="https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline underline-offset-2">
                Revisión científica de técnicas de estudio (Dunlosky y colaboradores).
              </a>
              {' '}
              Las respuestas generadas automáticamente deben contrastarse con el material original.
            </p>
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
