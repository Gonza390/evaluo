import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  Layers3,
  ListChecks,
  ScanText,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';

const uploadHref = '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1';
const demoHref = '/demo/material-estudio';

type ShellProps = {
  currentPath: string;
  breadcrumbLabel: string;
  trackingPrefix: string;
  children: ReactNode;
};

type RelatedLink = {
  href: string;
  title: string;
  description: string;
  cta: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

function Shell({ currentPath, breadcrumbLabel, trackingPrefix, children }: ShellProps) {
  return (
    <div className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <MarketingAnalyticsSlot />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Evaluo', path: '/' },
          { name: breadcrumbLabel, path: currentPath },
        ])}
      />
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader primaryHref={uploadHref} trackingLocation={`${trackingPrefix}_header`} />
      </div>
      {children}
      <FooterHome />
    </div>
  );
}

function PrimaryCta({ label, trackingPrefix, location }: { label: string; trackingPrefix: string; location: string }) {
  return (
    <TrackedLink
      href={uploadHref}
      eventName="cta_click"
      payload={{
        location: `${trackingPrefix}_${location}`,
        cta_name: 'subir_pdf',
        destination: uploadHref,
      }}
      className="from-brand to-brand-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </TrackedLink>
  );
}

function DemoCta({ trackingPrefix, label = 'Ver una sesión de estudio de ejemplo' }: { trackingPrefix: string; label?: string }) {
  return (
    <TrackedLink
      href={`${demoHref}?source=${trackingPrefix}`}
      eventName="cta_click"
      payload={{
        location: `${trackingPrefix}_demo`,
        cta_name: 'ver_demo_material',
        destination: demoHref,
      }}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </TrackedLink>
  );
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{description}</p>
    </div>
  );
}

function RelatedSection({ title, links }: { title: string; links: RelatedLink[] }) {
  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <h2 className="max-w-2xl text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">{title}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.07)] sm:p-6"
            >
              <h3 className="text-sm font-bold tracking-tight text-slate-950 group-hover:text-indigo-700 sm:text-[15px]">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-6">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-indigo-700">
                {item.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ title, items }: { title: string; items: FaqItem[] }) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-[1040px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Preguntas frecuentes</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">{title}</h2>
        </div>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {items.map((item) => (
            <details key={item.question} className="group py-5 sm:py-6">
              <summary className="cursor-pointer list-none pr-8 text-sm font-bold text-slate-950 marker:hidden">{item.question}</summary>
              <p className="mt-3 max-w-[680px] text-xs leading-6 text-slate-600 sm:text-[13px]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection({
  eyebrow,
  title,
  description,
  trackingPrefix,
}: {
  eyebrow: string;
  title: string;
  description: string;
  trackingPrefix: string;
}) {
  return (
    <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <SectionIntro eyebrow={eyebrow} title={title} description={description} />
        <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7">
          <p className="text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">Demo de Evaluo</p>
          <p className="mt-3 text-lg font-bold text-slate-950">Mirá el material ya transformado antes de subir el tuyo.</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            La demo muestra una sesión de estudio con resumen, glosario, tarjetas, ejercicios y el resto del material conectado en un mismo espacio.
          </p>
          <div className="mt-5">
            <DemoCta trackingPrefix={trackingPrefix} />
          </div>
        </div>
      </div>
    </section>
  );
}

const IA_STUDENTS_FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Qué es una IA para estudiantes universitarios?',
    answer:
      'Es una herramienta de IA aplicada al trabajo académico real: apuntes, PDFs, conceptos, preguntas y preparación de exámenes. En Evaluo el material que vos elegís funciona como fuente del recorrido y puede transformarse en resumen, glosario, mapa mental, flashcards y ejercicios.',
  },
  {
    question: '¿Cómo usar IA para estudiar en la universidad?',
    answer:
      'Usala en etapas: primero para ubicar conceptos y relaciones, después para intentar recuperar lo estudiado sin mirar y finalmente para practicar preguntas o ejercicios. La IA aporta más cuando te ayuda a trabajar sobre tu material y no cuando reemplaza todo por una respuesta aislada.',
  },
  {
    question: '¿Sirve la IA para preparar un parcial o final?',
    answer:
      'Puede servir si la aplicás al contenido que realmente vas a rendir. En Evaluo podés partir de tus apuntes o PDFs, organizar el tema, repasar conceptos y pasar a preguntas de práctica para detectar qué necesitás reforzar antes del examen.',
  },
  {
    question: '¿Qué diferencia hay entre Evaluo y hacer una pregunta aislada a una IA?',
    answer:
      'En Evaluo el punto de partida es el material que vos elegís. El mismo contenido puede convertirse en resumen, glosario, mapa mental, flashcards y ejercicios, para que cada tarea conserve relación con la fuente que estás estudiando.',
  },
  {
    question: '¿Qué conviene buscar en una app o página para estudiar con IA?',
    answer:
      'Que pueda trabajar sobre tus propios apuntes o PDFs, mantenga esa fuente como referencia y conecte comprensión, repaso y práctica. Así evitás estudiar respuestas aisladas sin relación con el material de la materia.',
  },
  {
    question: '¿La IA reemplaza mis apuntes o el PDF?',
    answer:
      'No. El material original sigue siendo la fuente del recorrido. Las herramientas sirven para reorganizarlo, practicarlo y detectar dudas, no para borrar su contexto.',
  },
  {
    question: '¿Tengo que usar todas las herramientas de IA para estudiar?',
    answer:
      'No. Podés entrar por la necesidad que tengas: entender, organizar, recordar o practicar, y usar solo las vistas que te sirvan en ese momento.',
  },
];

export function IaParaEstudiantesExperience() {
  const intents = [
    {
      icon: ScanText,
      eyebrow: 'Entender',
      title: 'Resumir apuntes y PDFs con IA',
      description: 'Separá ideas centrales y conceptos para ubicar rápido qué necesitás estudiar.',
      href: '/funciones/resumir-pdf-con-ia',
    },
    {
      icon: BookOpen,
      eyebrow: 'Ubicar',
      title: 'Extraer conceptos y armar un glosario',
      description: 'Identificá términos importantes y mantenelos conectados con el material original.',
      href: uploadHref,
    },
    {
      icon: Brain,
      eyebrow: 'Conectar',
      title: 'Crear un mapa mental desde tu PDF',
      description: 'Organizá temas, subtemas y relaciones para ver cómo se conecta el contenido.',
      href: '/funciones/crear-mapa-mental-desde-pdf',
    },
    {
      icon: Layers3,
      eyebrow: 'Recordar',
      title: 'Crear flashcards desde tu material',
      description: 'Convertí conceptos del PDF o tus apuntes en preguntas y respuestas para repasar.',
      href: '/funciones/crear-flashcards-desde-pdf',
    },
    {
      icon: Target,
      eyebrow: 'Practicar',
      title: 'Practicar con ejercicios del mismo tema',
      description: 'Comprobá qué entendiste con ejercicios basados en el contenido que estás estudiando.',
      href: uploadHref,
    },
    {
      icon: ListChecks,
      eyebrow: 'Diagnosticar',
      title: 'Hacer un diagnóstico inicial',
      description: 'Detectá qué temas dominás y cuáles conviene priorizar antes de seguir estudiando.',
      href: uploadHref,
    },
  ];

  return (
    <Shell currentPath="/ia-para-estudiantes" breadcrumbLabel="IA para estudiantes" trackingPrefix="seo_ia_estudiantes_v2">
      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.13),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-14 text-center sm:px-8 sm:pb-24 sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> IA para estudiantes universitarios sobre tus propios materiales
            </span>
            <h1 className="mx-auto mt-5 max-w-5xl text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[66px]">
              IA para estudiantes universitarios: <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">estudiá tus PDFs y prepará exámenes</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
              Subí los apuntes o PDFs que realmente tenés que rendir y usá IA para entender conceptos, crear resúmenes y flashcards, practicar preguntas y detectar qué necesitás reforzar antes de un parcial o final. El material original sigue siendo la fuente del recorrido.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCta label="Subir mis apuntes o PDF" trackingPrefix="seo_ia_estudiantes_v2" location="hero" />
              <DemoCta trackingPrefix="seo_ia_estudiantes_v2" label="Ver cómo se estudia en Evaluo" />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500">
              Pensado para parciales, finales, ingresos y materias universitarias donde necesitás pasar de leer a comprobar qué sabés.
            </p>

            <div className="mt-12 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
              {intents.map((intent) => {
                const Icon = intent.icon;
                return (
                  <Link
                    key={intent.title}
                    href={intent.href}
                    className="group flex h-full flex-col rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_55px_rgba(15,23,42,0.09)] sm:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" aria-hidden="true" />
                    </div>
                    <p className="mt-5 text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">{intent.eyebrow}</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:min-h-[3.5rem]">{intent.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{intent.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10">
            <SectionIntro
              eyebrow="Una sola fuente"
              title="La IA cambia de tarea; tus apuntes siguen siendo el contexto."
              description="En vez de empezar de cero cada vez, Evaluo mantiene el material que elegiste como punto de partida. Podés pasar de comprender un tema a recordarlo y practicarlo sin perder la relación con la fuente original."
            />
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5 sm:p-7">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500">FUENTE DE ESTUDIO</p>
                    <p className="text-sm font-bold text-slate-950">Tus apuntes o un PDF</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 pt-4 sm:grid-cols-2">
                {[
                  ['Entender', 'Resumen + glosario'],
                  ['Conectar', 'Mapa mental'],
                  ['Recordar', 'Flashcards'],
                  ['Comprobar', 'Ejercicios'],
                ].map(([title, value]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-black text-indigo-700 uppercase">{title}</p>
                    <p className="mt-2 text-xs font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <SectionIntro
              eyebrow="IA en la universidad"
              title="Cómo usar IA para estudiar según el momento de la cursada."
              description="No necesitás usar IA de la misma manera todo el semestre. El valor cambia según si estás entrando a un tema, repasando después de clase o preparando un examen."
            />
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {[
                ['Después de clase', 'Ordená apuntes y conceptos', 'Usá el material de la cursada para identificar definiciones, relaciones y temas que todavía no entendés bien.'],
                ['Durante la semana', 'Recuperá sin mirar', 'Convertí conceptos en flashcards o preguntas y tratá de responder antes de volver a la fuente.'],
                ['Antes del parcial', 'Practicá y detectá errores', 'Pasá a ejercicios y preguntas del mismo material para encontrar qué temas necesitás reforzar.'],
                ['Antes del final', 'Volvé sobre lo débil', 'Priorizá conceptos que seguís confundiendo y combiná repaso breve con práctica en lugar de releer todo desde cero.'],
              ].map(([when, title, text]) => (
                <div key={when} className="grid gap-2 py-5 sm:grid-cols-[150px_190px_1fr] sm:gap-5">
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-indigo-700">{when}</span>
                  <strong className="text-sm leading-6 text-slate-950">{title}</strong>
                  <span className="text-sm leading-7 text-slate-600">{text}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-600">
              Si querés profundizar el método detrás de este recorrido, podés revisar nuestra guía de{' '}
              <Link
                href="/blog/tecnicas-de-estudio-efectivas"
                className="font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-4 transition hover:decoration-indigo-500"
              >
                técnicas de estudio efectivas
              </Link>
              , con evidencia sobre recuperación activa, práctica espaciada y otras estrategias.
            </p>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <SectionIntro
              eyebrow="Preparar un examen"
              title="Cómo usar IA para preparar un parcial o final sin quedarte solo con el resumen."
              description="El objetivo no es generar más contenido. Es llegar al examen sabiendo qué podés explicar sin mirar, qué errores repetís y qué tema necesitás volver a trabajar."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['01', 'Entender', 'Ubicá ideas centrales, definiciones y procedimientos en el material.'],
                ['02', 'Recuperar', 'Cerrá la fuente e intentá explicar conceptos o responder preguntas sin mirar.'],
                ['03', 'Practicar', 'Resolvé ejercicios o consignas nuevas sobre el mismo contenido.'],
                ['04', 'Corregir', 'Volvé al material solo en los puntos donde aparecieron dudas o errores.'],
              ].map(([number, title, text]) => (
                <article key={number} className="rounded-[22px] border border-slate-200 bg-white p-5 sm:p-6">
                  <p className="text-[10px] font-black tracking-[0.14em] text-indigo-700">{number}</p>
                  <h3 className="mt-3 text-base font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <SectionIntro
              eyebrow="Elegir una IA para estudiar"
              title="Qué debería ofrecer una buena IA para estudiantes universitarios."
              description="Más que generar respuestas, una herramienta de estudio debería conservar la fuente, conectar distintas formas de repaso y llevarte a comprobar qué entendiste."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ['Mantener la fuente', 'El PDF o apunte original debería seguir disponible como referencia durante todo el estudio.'],
                ['Conectar las tareas', 'Resumen, conceptos, flashcards y práctica deberían trabajar sobre el mismo contenido, no como salidas aisladas.'],
                ['Obligarte a responder', 'La herramienta debería llevarte de leer a recuperar y practicar, porque ahí aparecen las dudas reales.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-6">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
            <p className="mt-7 text-sm leading-7 text-slate-600">
              Este mismo método también puede aplicarse a un ingreso universitario. Como ejemplo concreto, podés ver{' '}
              <Link
                href="/como-estudiar-ingreso-unlam"
                className="font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-4 transition hover:decoration-indigo-500"
              >
                cómo preparar el ingreso UNLaM 2027
              </Link>
              {' '}trabajando desde el material oficial.
            </p>
          </div>
        </section>

        <DemoSection
          eyebrow="Producto real"
          title="Probá una sesión real de Evaluo antes de subir tus apuntes."
          description="La demo navegable muestra cómo conviven resumen, glosario, tarjetas y ejercicios alrededor del mismo material. No usamos números inventados ni una captura estática: podés recorrer el producto y evaluar el flujo completo."
          trackingPrefix="seo_ia_estudiantes_v2"
        />

        <RelatedSection
          title="Seguí estudiando con IA según la tarea que necesitás resolver."
          links={[
            {
              href: '/estudiar-pdf-con-ia',
              title: 'Estudiar un PDF con IA',
              description: 'Recorré el proceso completo desde el documento hasta el repaso y la práctica.',
              cta: 'Cómo estudiar un PDF con IA',
            },
            {
              href: '/funciones/resumir-pdf-con-ia',
              title: 'Resumir un PDF con IA para estudiar',
              description: 'Ordená ideas y conceptos sin convertir el resumen en un fin en sí mismo.',
              cta: 'Cómo resumir un PDF con IA',
            },
            {
              href: '/funciones/crear-flashcards-desde-pdf',
              title: 'Crear flashcards con IA desde un PDF',
              description: 'Transformá conceptos del material en preguntas y respuestas para repasar.',
              cta: 'Cómo crear flashcards con IA',
            },
            {
              href: '/funciones/crear-mapa-mental-desde-pdf',
              title: 'Crear un mapa mental desde un PDF',
              description: 'Visualizá temas, subtemas y relaciones sin salir del mismo material.',
              cta: 'Cómo crear un mapa mental con IA',
            },
          ]}
        />

        <FaqSection
          title="Sobre IA para estudiantes universitarios"
          items={IA_STUDENTS_FAQ_ITEMS}
        />
      </main>
    </Shell>
  );
}

export function EstudiarPdfExperience() {
  return (
    <Shell currentPath="/estudiar-pdf-con-ia" breadcrumbLabel="Estudiar PDF con IA" trackingPrefix="seo_estudiar_pdf_ia_v2">
      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.14),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-18 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Tu PDF como fuente de toda la sesión
              </span>
              <h1 className="mt-5 text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[64px]">
                Estudiá un PDF con IA: <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">resumen, conceptos, flashcards y práctica</span>
              </h1>
              <p className="mt-5 max-w-xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Subí el documento que estás preparando y usá el mismo contenido para entender el tema, organizar conceptos, intentar recordarlos y practicar sin volver a cargar el PDF en cada paso.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <PrimaryCta label="Estudiar mi PDF" trackingPrefix="seo_estudiar_pdf_ia_v2" location="hero" />
                <DemoCta trackingPrefix="seo_estudiar_pdf_ia_v2" label="Ver un PDF ya transformado" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-indigo-100/50 blur-3xl" />
              <div className="relative rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_70px_rgba(15,23,42,0.11)] sm:p-7">
                <p className="text-[10px] font-black tracking-[0.14em] text-slate-500 uppercase">Ejemplo de flujo de estudio</p>
                <div className="mt-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center">
                  <UploadCloud className="mx-auto h-7 w-7 text-indigo-600" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold text-slate-950">Apuntes del parcial.pdf</p>
                  <p className="mt-1 text-xs text-slate-500">El documento queda como fuente del recorrido</p>
                </div>
                <div className="mx-auto my-4 h-7 w-px bg-indigo-200" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Resumen', 'Ideas centrales organizadas', ScanText],
                    ['Glosario', 'Conceptos y definiciones', BookOpen],
                    ['Mapa mental', 'Temas y relaciones conectados', Brain],
                    ['Flashcards', 'Preguntas para intentar recordar', Layers3],
                    ['Ejercicios', 'Práctica sobre el material', ListChecks],
                  ].map(([label, text, Icon]) => {
                    const IconComponent = Icon as typeof ScanText;
                    return (
                      <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <IconComponent className="h-4.5 w-4.5 text-indigo-700" aria-hidden="true" />
                        <p className="mt-3 text-xs font-bold text-slate-950">{String(label)}</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-600">{String(text)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
            <SectionIntro
              eyebrow="Un documento, distintas tareas"
              title="Estudiar un PDF con IA no tiene por qué terminar en un resumen."
              description="Un resumen sirve para orientarte, pero estudiar también implica ubicar términos, relacionar ideas, intentar recuperarlas de memoria y comprobar qué entendiste. Evaluo mantiene esas tareas conectadas al mismo documento."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-5">
              {[
                ['01', 'Entender', 'Resumen para ordenar la primera lectura y detectar ejes.'],
                ['02', 'Ubicar conceptos', 'Glosario para volver sobre términos importantes.'],
                ['03', 'Conectar', 'Mapa mental para visualizar temas y relaciones.'],
                ['04', 'Recordar', 'Flashcards para intentar recuperar conceptos antes de ver la respuesta.'],
                ['05', 'Practicar', 'Ejercicios para comprobar qué quedó claro y qué conviene revisar.'],
              ].map(([n, title, text]) => (
                <div key={n} className="border-t-2 border-indigo-200 pt-5">
                  <p className="text-[10px] font-black text-indigo-700">{n}</p>
                  <h3 className="mt-3 text-base font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
            <SectionIntro
              eyebrow="Elegí según el problema"
              title="No necesitás usar todas las vistas al mismo tiempo."
              description="La mejor entrada depende de lo que te está costando. Podés moverte por el mismo material sin convertir la herramienta en una secuencia rígida."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Estoy perdido en el tema', 'Empezá por resumen y glosario para identificar estructura y conceptos.'],
                ['Entiendo partes pero no las relaciones', 'Usá el mapa mental para ver cómo se conectan temas y subtemas.'],
                ['Me cuesta recordar', 'Pasá a flashcards e intentá responder antes de revelar la respuesta.'],
                ['Quiero saber si estoy listo', 'Usá ejercicios sobre el mismo material y volvé a revisar lo que falle.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-[22px] border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <DemoSection
          eyebrow="Ejemplo real de producto"
          title="Recorré una sesión completa antes de subir tu propio PDF."
          description="La demo enseña cómo se ve un material dentro de Evaluo y cómo conviven las distintas formas de estudiarlo. No es una captura estática: podés navegar el espacio de estudio de ejemplo."
          trackingPrefix="seo_estudiar_pdf_ia_v2"
        />

        <RelatedSection
          title="Si ya sabés qué tarea necesitás, podés ir directo."
          links={[
            {
              href: '/funciones/resumir-pdf-con-ia',
              title: 'Resumir PDF con IA para estudiar',
              description: 'Separá ejes, conceptos y relaciones para orientar el resto de la sesión.',
              cta: 'Resumir un PDF con IA',
            },
            {
              href: '/funciones/crear-flashcards-desde-pdf',
              title: 'Crear flashcards con IA desde PDF',
              description: 'Convertí conceptos del documento en preguntas y respuestas de repaso.',
              cta: 'Crear flashcards desde un PDF',
            },
            {
              href: '/funciones/crear-mapa-mental-desde-pdf',
              title: 'Crear un mapa mental desde un PDF',
              description: 'Organizá visualmente temas y relaciones antes de seguir repasando.',
              cta: 'Crear un mapa mental con IA',
            },
            {
              href: '/ia-para-estudiantes',
              title: 'IA para estudiantes',
              description: 'Conocé el enfoque completo para trabajar apuntes y PDFs con IA.',
              cta: 'Ver cómo usar IA para estudiar',
            },
          ]}
        />

        <FaqSection
          title="Antes de estudiar tu PDF con IA"
          items={[
            {
              question: '¿Evaluo solamente resume el PDF?',
              answer: 'No. El recorrido incluye resumen, glosario, mapa mental, flashcards y ejercicios sobre el mismo contenido. Podés usar una sola vista o combinar varias según lo que necesites.',
            },
            {
              question: '¿Tengo que convertir el PDF antes de subirlo?',
              answer: 'No. El flujo parte del PDF que elegís como material de estudio.',
            },
            {
              question: '¿Qué hago después de leer el resumen?',
              answer: 'Podés volver a conceptos en el glosario, ordenar relaciones en el mapa mental, intentar recordarlos con flashcards o pasar a ejercicios para comprobar comprensión.',
            },
            {
              question: '¿El PDF original sigue siendo importante?',
              answer: 'Sí. El documento sigue siendo la fuente del recorrido. Las distintas vistas reorganizan el material para trabajar sobre él, no para borrar su contexto.',
            },
          ]}
        />
      </main>
    </Shell>
  );
}

export function ResumirPdfExperience() {
  return (
    <Shell currentPath="/funciones/resumir-pdf-con-ia" breadcrumbLabel="Resumir PDF con IA" trackingPrefix="seo_resumir_pdf_ia_v2">
      <main>
        <section className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
                <ScanText className="h-3.5 w-3.5" aria-hidden="true" /> Resumen pensado para seguir estudiando
              </span>
              <h1 className="mt-5 text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[64px]">
                Resumí un PDF con IA <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">para estudiar y seguir practicando</span>
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Convertí un PDF largo en una estructura de estudio con ideas centrales y conceptos relacionados. Después podés volver al material, llevar esos conceptos a flashcards o continuar con ejercicios sobre la misma fuente.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <PrimaryCta label="Resumir mi PDF" trackingPrefix="seo_resumir_pdf_ia_v2" location="hero" />
                <DemoCta trackingPrefix="seo_resumir_pdf_ia_v2" label="Ver un resumen dentro de Evaluo" />
              </div>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_64px_1fr] lg:items-stretch">
              <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <FileText className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-black tracking-[0.12em] text-slate-500 uppercase">Texto del PDF · ejemplo ilustrativo</p>
                    <p className="text-sm font-bold text-slate-950">Marketing I — Segmentación</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-600">
                  La segmentación de mercados consiste en dividir un mercado heterogéneo en grupos de consumidores que comparten determinadas características, necesidades o comportamientos. Esta división permite analizar cada grupo y seleccionar aquellos segmentos en los que una organización decide concentrar su propuesta de valor...
                </p>
                <div className="mt-5 space-y-2">
                  {[78, 92, 66].map((width) => (
                    <div key={width} className="h-2 rounded-full bg-slate-100" style={{ width: `${width}%` }} />
                  ))}
                </div>
              </div>

              <div className="hidden items-center justify-center lg:flex">
                <ArrowRight className="h-6 w-6 text-indigo-400" aria-hidden="true" />
              </div>

              <div className="rounded-[26px] border border-indigo-200 bg-white p-6 shadow-[0_18px_45px_rgba(79,70,229,0.08)]">
                <div className="flex items-center gap-3 border-b border-indigo-100 pb-4">
                  <Sparkles className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-black tracking-[0.12em] text-indigo-700 uppercase">Resumen · ejemplo ilustrativo</p>
                    <p className="text-sm font-bold text-slate-950">Segmentación de mercado</p>
                  </div>
                </div>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-[10px] font-black text-indigo-700 uppercase">Idea central</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">Dividir un mercado en grupos con características o necesidades similares para analizarlos y decidir a cuáles dirigirse.</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-700 uppercase">Conceptos relacionados</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['segmento', 'mercado objetivo', 'propuesta de valor'].map((term) => (
                        <span key={term} className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">{term}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-700 uppercase">Siguiente paso</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">Volver al glosario, llevar estos conceptos a flashcards o comprobarlos con ejercicios.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
            <SectionIntro
              eyebrow="Qué hace útil a un resumen para estudiar"
              title="El objetivo no es acortar por acortar: es dejar una estructura que puedas usar después."
              description="Un buen punto de partida separa las ideas que organizan el tema, conserva los conceptos que necesitás volver a mirar y te permite decidir cuál es el siguiente paso de estudio."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-4">
              {[
                ['1', 'Ideas centrales', 'Identificá los ejes que sostienen el tema antes de entrar en detalles.'],
                ['2', 'Conceptos importantes', 'Ubicá términos y definiciones que conviene revisar o relacionar.'],
                ['3', 'Relaciones', 'Entendé qué conceptos dependen de otros y qué partes del tema conviene conectar.'],
                ['4', 'Siguiente acción', 'Pasá del resumen a flashcards, ejercicios o de vuelta al PDF original según lo que necesites.'],
              ].map(([n, title, text]) => (
                <article key={n} className="rounded-[24px] border border-slate-200 p-6">
                  <span className="text-xs font-black text-indigo-700">0{n}</span>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1100px] gap-8 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionIntro
              eyebrow="Resumen con contexto"
              title="El PDF original sigue siendo la referencia."
              description="El resumen ayuda a orientarte, pero no necesita reemplazar el documento. Si una idea queda demasiado condensada, podés volver al material y después continuar con otra forma de repaso sobre esa misma fuente."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Necesito entender mejor', 'Volvé al PDF o al glosario y revisá el concepto en contexto.'],
                ['Ya entiendo el tema', 'Llevá los conceptos a flashcards o ejercicios para intentar recuperarlos y aplicarlos.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-[22px] border border-slate-200 bg-white p-5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <DemoSection
          eyebrow="Ver el resultado"
          title="Mirá cómo convive el resumen con el resto del material de estudio."
          description="En la demo podés abrir un material ya procesado y ver cómo el resumen se conecta con el glosario, las tarjetas y los ejercicios."
          trackingPrefix="seo_resumir_pdf_ia_v2"
        />

        <RelatedSection
          title="Usá el resumen como entrada al resto del estudio."
          links={[
            {
              href: '/estudiar-pdf-con-ia',
              title: 'Estudiar un PDF con IA',
              description: 'Mirá el recorrido completo del documento, desde la comprensión hasta la práctica.',
              cta: 'Cómo estudiar un PDF con IA',
            },
            {
              href: '/funciones/crear-flashcards-desde-pdf',
              title: 'Crear flashcards desde un PDF con IA',
              description: 'Convertí conceptos del material en preguntas y respuestas para repasar.',
              cta: 'Crear flashcards con IA',
            },
            {
              href: '/funciones/crear-mapa-mental-desde-pdf',
              title: 'Crear un mapa mental desde un PDF',
              description: 'Pasá de la lectura lineal a una vista visual de temas y relaciones.',
              cta: 'Crear un mapa mental con IA',
            },
            {
              href: '/ia-para-estudiantes',
              title: 'IA para estudiantes',
              description: 'Conocé cómo encajan resumen, organización, recuerdo y práctica en un mismo flujo.',
              cta: 'Ver el método de estudio con IA',
            },
          ]}
        />

        <FaqSection
          title="Sobre resumir un PDF con IA"
          items={[
            {
              question: '¿El resumen se basa en el PDF que subo?',
              answer: 'Sí. El documento que elegís funciona como fuente para organizar las ideas y conceptos del material.',
            },
            {
              question: '¿Resumir un PDF alcanza para estudiar?',
              answer: 'Depende de lo que necesites. El resumen sirve para ordenar y orientarte, pero después podés volver al documento, usar flashcards para intentar recordar conceptos o pasar a ejercicios para comprobar comprensión.',
            },
            {
              question: '¿El PDF original deja de ser necesario?',
              answer: 'No. El resumen reorganiza el contenido, pero el documento sigue siendo la referencia cuando necesitás recuperar contexto o detalle.',
            },
            {
              question: '¿Puedo seguir estudiando el mismo contenido después del resumen?',
              answer: 'Sí. El mismo material puede continuar en glosario, mapa mental, flashcards y ejercicios sin tener que tratar cada salida como un documento separado.',
            },
          ]}
        />
      </main>
    </Shell>
  );
}

export function FlashcardsPdfExperience() {
  return (
    <Shell currentPath="/funciones/crear-flashcards-desde-pdf" breadcrumbLabel="Crear flashcards desde PDF" trackingPrefix="seo_flashcards_pdf_v2">
      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_78%_30%,rgba(99,102,241,0.15),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-18 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
                <Layers3 className="h-3.5 w-3.5" aria-hidden="true" /> Tarjetas desde tus propios apuntes
              </span>
              <h1 className="mt-5 text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[64px]">
                Creá flashcards con IA <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">desde tu PDF y tus apuntes</span>
              </h1>
              <p className="mt-5 max-w-xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Convertí conceptos del documento en tarjetas de preguntas y respuestas para repasar. Cada flashcard parte del material que estás preparando y puede volver a conectarte con el tema cuando necesitás contexto.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <PrimaryCta label="Crear flashcards desde mi PDF" trackingPrefix="seo_flashcards_pdf_v2" location="hero" />
                <DemoCta trackingPrefix="seo_flashcards_pdf_v2" label="Ver flashcards de ejemplo" />
              </div>
            </div>

            <div className="relative min-h-[430px]">
              <div className="absolute left-[10%] right-[4%] top-10 h-[330px] rotate-3 rounded-[28px] border border-indigo-100 bg-indigo-50/70" />
              <div className="absolute left-[5%] right-[9%] top-5 h-[350px] -rotate-2 rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]" />
              <div className="relative z-10 mt-2 rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_30px_70px_rgba(15,23,42,0.12)] sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">Ejemplo de flashcard</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Marketing I · Segmentación</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">Tarjeta 1</span>
                </div>
                <div className="mt-8 min-h-[130px] rounded-2xl bg-slate-950 p-6 text-white">
                  <p className="text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">Frente</p>
                  <p className="mt-4 text-xl font-bold leading-7">¿Qué significa segmentar un mercado?</p>
                </div>
                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
                  <p className="text-[10px] font-black tracking-[0.12em] text-indigo-700 uppercase">Respuesta · ejemplo</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">Dividir el mercado en grupos con características o necesidades similares para analizarlos y decidir a cuáles dirigirse.</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                  <span className="rounded-full border border-slate-200 px-3 py-1.5">Fuente: PDF</span>
                  <span className="rounded-full border border-slate-200 px-3 py-1.5">Tema: Segmentación</span>
                  <span className="rounded-full border border-slate-200 px-3 py-1.5">Intentar recordar primero</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
            <SectionIntro
              eyebrow="De dónde sale cada tarjeta"
              title="La flashcard conserva contexto porque nace del material que estás estudiando."
              description="La utilidad no está en acumular preguntas aisladas. Cada tarjeta tiene que conservar una relación clara con el tema, el concepto y el documento del que parte para que puedas volver al contexto cuando algo no se entiende."
            />
            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              {[
                [FileText, 'PDF o apuntes', 'El material que elegiste como fuente.'],
                [BookOpen, 'Tema', 'La parte del contenido que estás repasando.'],
                [Brain, 'Concepto', 'La idea que querés intentar recuperar de memoria.'],
                [Layers3, 'Flashcard', 'Una pregunta y su respuesta para practicar ese concepto.'],
              ].map(([Icon, title, text], index) => {
                const IconComponent = Icon as typeof FileText;
                return (
                  <div key={String(title)} className="relative rounded-[22px] border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <IconComponent className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                      <span className="text-[10px] font-black text-slate-600">0{index + 1}</span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-950">{String(title)}</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-600">{String(text)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <SectionIntro
              eyebrow="Recuerdo activo"
              title="Intentá responder antes de mirar la respuesta."
              description="Una flashcard tiene sentido cuando te obliga a recuperar una idea. Si no la recordás o la respuesta te queda corta, el flujo no termina ahí: podés volver al resumen, al glosario o al material original y después intentarlo de nuevo."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['No recuerdo el concepto', 'Volvé al glosario, al resumen o al PDF para recuperar contexto.'],
                ['Lo puedo explicar', 'Seguí con otra tarjeta o pasá a ejercicios para comprobarlo en otra forma.'],
                ['La pregunta es demasiado aislada', 'Revisá el tema del que salió la tarjeta antes de memorizar una frase sin contexto.'],
                ['Quiero repasar antes del parcial', 'Usá las tarjetas como una etapa del repaso y combiná con práctica cuando lo necesites.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-[22px] border border-slate-200 bg-white p-5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <DemoSection
          eyebrow="Ver tarjetas en contexto"
          title="Mirá una sesión de estudio donde las flashcards no están aisladas del resto del material."
          description="La demo te deja recorrer un material y comprobar cómo las tarjetas conviven con el resumen, el glosario y los ejercicios sobre la misma fuente."
          trackingPrefix="seo_flashcards_pdf_v2"
        />

        <RelatedSection
          title="Conectá las flashcards con el resto del estudio."
          links={[
            {
              href: '/estudiar-pdf-con-ia',
              title: 'Estudiar un PDF con IA',
              description: 'Mirá el recorrido completo del mismo material antes y después de las tarjetas.',
              cta: 'Cómo estudiar un PDF con IA',
            },
            {
              href: '/funciones/resumir-pdf-con-ia',
              title: 'Resumir PDF con IA para estudiar',
              description: 'Ordená el tema y ubicá los conceptos antes de convertirlos en tarjetas.',
              cta: 'Resumir el PDF antes de crear tarjetas',
            },
            {
              href: '/funciones/crear-mapa-mental-desde-pdf',
              title: 'Crear un mapa mental desde un PDF',
              description: 'Volvé a la estructura visual del tema cuando una tarjeta quede demasiado aislada.',
              cta: 'Crear un mapa mental con IA',
            },
            {
              href: '/ia-para-estudiantes',
              title: 'IA para estudiantes',
              description: 'Conocé cómo encajan flashcards, resumen, organización y práctica.',
              cta: 'Ver el método de estudio con IA',
            },
          ]}
        />

        <FaqSection
          title="Sobre crear flashcards con IA desde un PDF"
          items={[
            {
              question: '¿Las flashcards parten del PDF o de mis apuntes?',
              answer: 'Sí. El material que elegís funciona como fuente y las tarjetas se organizan alrededor de conceptos de ese contenido.',
            },
            {
              question: '¿Cómo conviene usar una flashcard?',
              answer: 'Intentá responder la pregunta antes de mirar la respuesta. Si no recordás el concepto, podés volver al material o a otra vista de estudio para recuperar contexto.',
            },
            {
              question: '¿Tengo que usar flashcards como único método?',
              answer: 'No. Podés combinarlas con resumen, glosario, mapa mental y ejercicios del mismo material según la etapa del estudio en la que estés.',
            },
            {
              question: '¿Qué pasa si una tarjeta no me alcanza para entender un tema?',
              answer: 'Podés volver al PDF, al resumen o al glosario del mismo contenido y después retomar el repaso. La tarjeta no necesita reemplazar la explicación completa.',
            },
          ]}
        />
      </main>
    </Shell>
  );
}
