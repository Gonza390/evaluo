import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  ListChecks,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { UbaXxiParcialesPractice } from '@/components/marketing/uba-xxi-parciales-practice';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const PATH = '/uba-xxi/parciales';
const PDF_HREF = '/estudiar-pdf-con-ia?source=seo-uba-xxi-parciales';
const OFFICIAL_CALENDAR = 'https://ubaxxi.uba.ar/calendario-academico/';
const OFFICIAL_FAQ = 'https://ubaxxi.uba.ar/preguntas-frecuentes/';

const EXAMS = [
  {
    subject: 'IPC',
    title: 'IPC · primer parcial 2025',
    details: 'Cátedra Buacar · 1.º cuatrimestre · tema 3',
    description: 'Referencia para observar cómo se evalúan argumentos, premisas y tipos de enunciados.',
    href: 'https://ubaparciales.com/materias/ipc/buacar/primer-parcial/1c-2025/tema-3',
    label: 'Ver parcial IPC 2025',
  },
  {
    subject: 'IPC',
    title: 'IPC · primer parcial 2026',
    details: 'Cátedra Buacar · 1.º cuatrimestre · tema 1',
    description: 'Otra evaluación publicada para comparar el tipo de consignas entre cuatrimestres.',
    href: 'https://ubaparciales.com/materias/ipc/buacar/primer-parcial/1c-2026/tema-1',
    label: 'Ver parcial IPC 2026',
  },
  {
    subject: 'ICSE',
    title: 'ICSE · primer parcial 2025',
    details: 'Cátedra Pedrosa · 1.º cuatrimestre · tema 1',
    description: 'Ejemplo de consignas sobre contenidos de Sociedad y Estado, diferentes de las de IPC.',
    href: 'https://ubaparciales.com/materias/icse/pedrosa/primer-parcial/1c-2025/tema-1',
    label: 'Ver parcial ICSE 2025',
  },
] as const;

const FAQ = [
  {
    question: '¿Estos son exámenes oficiales de UBA XXI?',
    answer:
      'No. Los enlaces llevan a reproducciones de exámenes anteriores publicadas por un tercero. Evaluo es independiente de la UBA. Las preguntas de práctica de esta página son originales y no pertenecen a esos exámenes.',
  },
  {
    question: '¿Puedo usar parciales anteriores para preparar el próximo?',
    answer:
      'Sí, como referencia para observar tipos de consignas y practicar habilidades. Comprobá siempre el programa, los textos y la cátedra que te corresponden: los contenidos y exámenes pueden cambiar.',
  },
  {
    question: '¿Los parciales de UBA XXI se rinden online?',
    answer:
      'Según las preguntas frecuentes oficiales de UBA XXI, la cursada es virtual, pero los parciales y finales son presenciales y requieren inscripción previa.',
  },
  {
    question: '¿Tengo que registrarme para resolver las preguntas de esta página?',
    answer:
      'No. La práctica demostrativa se puede resolver sin cuenta. Si querés estudiar con un PDF propio, podés elegir el archivo antes de registrarte en Evaluo.',
  },
] as const;

export const metadata: Metadata = {
  title: 'Parciales UBA XXI: exámenes anteriores y práctica',
  description:
    'Consultá parciales anteriores de IPC e ICSE (2025 y 2026), practicá preguntas gratis con corrección y prepará UBA XXI con tus propios apuntes PDF.',
  alternates: { canonical: toAbsoluteUrl(PATH) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Parciales UBA XXI: exámenes anteriores y práctica | Evaluo',
    description:
      'Ejemplos de parciales anteriores de IPC e ICSE y una práctica interactiva gratis para prepararte con tu propio material.',
    url: toAbsoluteUrl(PATH),
    images: [
      {
        url: toAbsoluteUrl('/opengraph-image.png'),
        width: 1200,
        height: 630,
        alt: 'Parciales UBA XXI — práctica con Evaluo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parciales UBA XXI: exámenes anteriores y práctica | Evaluo',
    description: 'Mirá exámenes anteriores de UBA XXI y practicá para el próximo parcial.',
    images: ['/opengraph-image.png'],
  },
};

function PrimaryCta({ location, label }: { location: string; label: string }) {
  return (
    <TrackedLink
      href={PDF_HREF}
      eventName="cta_click"
      payload={{ location, cta_name: 'estudiar_con_mi_pdf', destination: PDF_HREF }}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(29,78,216,0.18)] transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </TrackedLink>
  );
}

export default function ParcialesUbaXxiPage() {
  return (
    <div className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <MarketingAnalyticsSlot />
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Evaluo', path: '/' },
            { name: 'Parciales UBA XXI', path: PATH },
          ]),
          buildCollectionPageJsonLd({
            name: 'Parciales UBA XXI: exámenes anteriores y práctica',
            description: 'Selección de referencias externas de exámenes anteriores y práctica original para estudiantes de UBA XXI.',
            url: PATH,
          }),
        ]}
      />
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
        <PublicSiteHeader
          variant="landing"
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login?mode=login"
                className="inline-flex min-h-11 items-center text-xs font-semibold text-slate-600 hover:text-slate-950"
              >
                Iniciar sesión
              </Link>
              <TrackedLink
                href={PDF_HREF}
                eventName="cta_click"
                payload={{
                  location: 'seo_uba_xxi_parciales_header',
                  cta_name: 'elegir_pdf',
                  destination: PDF_HREF,
                }}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800 sm:px-4"
              >
                Elegir PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
            </div>
          }
        />
      </div>

      <main>
        <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.13),transparent_37%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1160px] gap-8 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-12 lg:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">
                <GraduationCap className="h-4 w-4" aria-hidden="true" /> UBA XXI · Preparación de parciales
              </p>
              <h1 className="mt-5 max-w-2xl text-[2.45rem] font-black leading-[1.07] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[3.45rem]">
                Parciales UBA XXI: <span className="text-blue-700">exámenes anteriores</span> y práctica para rendir
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                Mirá ejemplos de parciales reales de IPC e ICSE de 2025 y 2026, entendé qué tipo de
                ejercicios incluyen y probá preguntas originales antes de estudiar el próximo con tus apuntes.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#practica"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ListChecks className="h-4 w-4" aria-hidden="true" /> Probar 3 preguntas gratis
                </a>
                <PrimaryCta location="seo_uba_xxi_parciales_hero" label="Estudiar con mi PDF" />
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                Sin registro para la práctica. Evaluo no pertenece a la UBA.
              </p>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_25px_80px_rgba(15,23,42,0.1)] sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                  Examen anterior de referencia
                </span>
                <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                IPC · Primer parcial 2025
              </h2>
              <p className="mt-2 text-sm text-slate-600">Cátedra Buacar · 1.º cuatrimestre · tema 3</p>
              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
                  Qué podés observar en ese examen
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                  {[
                    'Distinguir un argumento de otros enunciados.',
                    'Identificar premisas y conclusión.',
                    'Interpretar enunciados y razonamientos inductivos.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <TrackedLink
                href={EXAMS[0].href}
                target="_blank"
                rel="noopener noreferrer"
                eventName="cta_click"
                payload={{
                  location: 'seo_uba_xxi_parciales_hero_reference',
                  cta_name: 'ver_examen_anterior_externo',
                  destination: EXAMS[0].href,
                }}
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-500"
              >
                Consultar el parcial de 2025 <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Publicado por un tercero. No reproducimos sus consignas ni afirmamos que el próximo examen será igual.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="anteriores" className="mx-auto w-full max-w-[1160px] px-4 py-14 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Ejemplos comprobables</p>
            <h2 id="anteriores" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Modelos de parciales UBA XXI 2025 y 2026: IPC e ICSE
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Estos enlaces llevan a publicaciones externas de evaluaciones anteriores. Revisá siempre
              materia, cátedra, año y programa antes de usarlas como referencia para estudiar.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {EXAMS.map((exam) => (
              <article key={exam.href} className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-6">
                <span className="w-fit rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {exam.subject}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{exam.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{exam.details}</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{exam.description}</p>
                <TrackedLink
                  href={exam.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  eventName="cta_click"
                  payload={{
                    location: 'seo_uba_xxi_parciales_reference_list',
                    cta_name: 'ver_examen_externo',
                    materia: exam.subject,
                    destination: exam.href,
                  }}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 border-t border-slate-100 pt-3 text-sm font-bold text-blue-700 hover:text-blue-900"
                >
                  {exam.label} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">
            Evaluo es una plataforma independiente. Los ejemplos anteriores no son materiales oficiales
            proporcionados por Evaluo y podrían no coincidir con tu cátedra actual.
          </p>
        </section>

        <section aria-labelledby="analisis-examen-ipc" className="border-t border-slate-100 bg-white py-14 sm:py-20">
          <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Cómo aprovechar modelos anteriores
              </p>
              <h2 id="analisis-examen-ipc" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                ¿Qué estudiar para un parcial de IPC UBA XXI?
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                Los parciales anteriores sirven para identificar habilidades y tipos de consignas,
                no para adivinar preguntas futuras. Antes de practicar, comprobá la cátedra y
                el programa vigente de tu materia.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">IPC · Buacar · 2025</p>
                <h3 className="mt-3 text-lg font-bold text-slate-950">Reconocer argumentos</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  En el primer parcial de referencia se pide distinguir cuándo un fragmento
                  presenta un argumento. Para prepararte, identificá premisas y conclusión
                  en fragmentos nuevos y justificá por qué lo son.
                </p>
                <a href="#practica" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-blue-700 underline underline-offset-4">
                  Practicar esta habilidad <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">IPC · Buacar · 2026</p>
                <h3 className="mt-3 text-lg font-bold text-slate-950">Aplicar conceptos a casos</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Una evaluación de 2026 incluye consignas sobre la teoría de Darwin.
                  Estudiá los conceptos con tu bibliografía y comprobá si podés aplicarlos
                  a ejemplos diferentes del examen anterior.
                </p>
                <TrackedLink
                  href={EXAMS[1].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  eventName="cta_click"
                  payload={{
                    location: 'seo_uba_xxi_parciales_analysis',
                    cta_name: 'ver_examen_ipc_2026_externo',
                    destination: EXAMS[1].href,
                  }}
                  className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-blue-700 underline underline-offset-4"
                >
                  Consultar modelo 2026 <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">ICSE · Pedrosa · 2025</p>
                <h3 className="mt-3 text-lg font-bold text-slate-950">Relacionar autores y procesos</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  El examen de referencia plantea preguntas a partir de interpretaciones de autores
                  y acontecimientos históricos. Prepará fichas de conceptos por autor y practicá
                  justificar cada elección con el material de tu cátedra.
                </p>
                <TrackedLink
                  href={EXAMS[2].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  eventName="cta_click"
                  payload={{
                    location: 'seo_uba_xxi_parciales_analysis',
                    cta_name: 'ver_examen_icse_2025_externo',
                    destination: EXAMS[2].href,
                  }}
                  className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-blue-700 underline underline-offset-4"
                >
                  Consultar modelo ICSE <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
              </article>
            </div>
          </div>
        </section>

        <section id="practica" aria-labelledby="titulo-practica" className="scroll-mt-8 border-y border-slate-200 bg-slate-50 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-[860px] px-4 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Del examen anterior a la práctica</p>
            <h2 id="titulo-practica" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Probá cómo se estudia IPC con preguntas nuevas
            </h2>
            <p className="mt-4 mb-7 text-sm leading-7 text-slate-600 sm:text-base">
              En el parcial de referencia de 2025 aparecen habilidades como reconocer argumentos,
              ubicar premisas y evaluar inferencias. Estas tres preguntas son originales de Evaluo:
              no están copiadas de un examen ni anticipan consignas oficiales.
            </p>
            <UbaXxiParcialesPractice />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1160px] px-4 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Método de estudio</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Cómo estudiar a partir de un parcial anterior
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Resolver un modelo viejo puede mostrarte cómo preguntan. No reemplaza la bibliografía
                ni el programa de la materia que cursás hoy.
              </p>
            </div>
            <ol className="space-y-5">
              {[
                {
                  title: 'Identificá materia, cátedra y fecha.',
                  body: 'Elegí una referencia pertinente y comprobá si el programa actual incluye esos contenidos.',
                },
                {
                  title: 'Resolvés primero sin mirar la respuesta.',
                  body: 'Intentá justificar cada opción: detectar por qué las otras no corresponden te ayuda a comprender.',
                },
                {
                  title: 'Volvé a tu bibliografía.',
                  body: 'Si fallaste una pregunta, ubicá el concepto en el texto o PDF de tu propia cursada.',
                },
                {
                  title: 'Practicá una consigna distinta sobre el mismo tema.',
                  body: 'No memorices una clave antigua. Necesitás poder aplicar el concepto cuando cambie el planteo.',
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-4 border-b border-slate-200 pb-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-950">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-[#0f1b3d] py-14 text-white sm:py-20">
          <div className="mx-auto grid w-full max-w-[1160px] gap-10 px-4 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">Prepará el próximo parcial</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                El examen viejo muestra el tipo de ejercicio. Tu PDF contiene lo que estudiás ahora.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Elegí tus apuntes en PDF y usá Evaluo para organizar conceptos, practicar preguntas
                y revisar qué temas necesitás reforzar antes de rendir.
              </p>
              <div className="mt-7">
                <PrimaryCta location="seo_uba_xxi_parciales_study" label="Elegir mi PDF y empezar" />
              </div>
              <p className="mt-3 text-xs text-slate-300">Primero seleccionás el PDF; después creás tu cuenta.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <BookOpenCheck className="h-6 w-6 text-blue-300" aria-hidden="true" />
                <p className="text-lg font-bold">Una sesión de estudio, no solo una respuesta</p>
              </div>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-100">
                {[
                  'Trabajá con el material que vos elegiste.',
                  'Identificá conceptos importantes y repasá por temas.',
                  'Practicá con preguntas basadas en tu PDF.',
                  'Revisá errores y volvé a los temas que cuestan.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/demo/material-estudio?source=seo-uba-xxi-parciales" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-white underline underline-offset-4">
                Ver cómo funciona Evaluo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1160px] px-4 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Preguntas frecuentes</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Lo que conviene saber antes de rendir
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Para inscripciones, fechas y reglas de evaluación, la referencia válida es siempre UBA XXI.
              </p>
              <a
                href={OFFICIAL_CALENDAR}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline underline-offset-4"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> Calendario oficial <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {FAQ.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="cursor-pointer pr-5 text-sm font-bold text-slate-950 sm:text-base">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
              <p className="pt-5 text-sm leading-6 text-slate-600">
                <a href={OFFICIAL_FAQ} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline underline-offset-4">
                  Consultar las preguntas frecuentes de UBA XXI
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <FooterHome />
    </div>
  );
}
