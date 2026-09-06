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
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.07)] sm:p-6"
            >
              <h3 className="text-sm font-bold tracking-tight text-slate-950 group-hover:text-indigo-700 sm:text-[15px]">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-6">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-indigo-700">
                Ver página <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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

export function IaParaEstudiantesExperience() {
  const intents = [
    {
      icon: ScanText,
      eyebrow: 'Entender',
      title: 'Necesito ordenar un tema',
      description: 'Empezá por un resumen y un glosario para ubicar ideas y conceptos del material.',
      href: '/funciones/resumir-pdf-con-ia',
    },
    {
      icon: Brain,
      eyebrow: 'Conectar',
      title: 'Quiero ver cómo se relacionan los conceptos',
      description: 'Creá un mapa mental para organizar visualmente temas, subtemas y relaciones del material.',
      href: '/funciones/crear-mapa-mental-desde-pdf',
    },
    {
      icon: Layers3,
      eyebrow: 'Memorizar',
      title: 'Quiero repasar conceptos',
      description: 'Transformá partes del contenido en flashcards para volver sobre lo importante.',
      href: '/funciones/crear-flashcards-desde-pdf',
    },
    {
      icon: Target,
      eyebrow: 'Practicar',
      title: 'Quiero comprobar qué entendí',
      description: 'Usá ejercicios sobre el mismo material para pasar de la lectura a la práctica.',
      href: uploadHref,
    },
    {
      icon: FileText,
      eyebrow: 'Empezar',
      title: 'Tengo un PDF y no sé por dónde arrancar',
      description: 'Usá el documento como fuente y elegí después cómo querés trabajarlo.',
      href: '/estudiar-pdf-con-ia',
    },
  ];

  return (
    <Shell currentPath="/ia-para-estudiantes" breadcrumbLabel="IA para estudiantes" trackingPrefix="seo_ia_estudiantes">
      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.13),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-14 text-center sm:px-8 sm:pb-24 sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> IA aplicada al momento de estudio
            </span>
            <h1 className="mx-auto mt-5 max-w-4xl text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[68px]">
              ¿Qué necesitás hacer <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">para estudiar mejor?</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
              Evaluo usa tu propio material como contexto. Elegí el problema que tenés ahora y entrá a la herramienta que mejor encaja con esa etapa del estudio.
            </p>
            <div className="mt-8 flex justify-center">
              <PrimaryCta label="Subir mi material" trackingPrefix="seo_ia_estudiantes" location="hero" />
            </div>

            <div className="mt-12 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
              {intents.map((intent) => {
                const Icon = intent.icon;
                return (
                  <Link
                    key={intent.title}
                    href={intent.href}
                    className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_55px_rgba(15,23,42,0.09)] sm:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" aria-hidden="true" />
                    </div>
                    <p className="mt-5 text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">{intent.eyebrow}</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">{intent.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{intent.description}</p>
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
              title="La IA cambia de tarea; tu material sigue siendo el contexto."
              description="En vez de copiar y pegar el mismo texto en herramientas separadas, el recorrido parte del contenido que vos elegís y te deja moverte entre comprensión, organización visual, repaso y práctica."
            />
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5 sm:p-7">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500">FUENTE</p>
                    <p className="text-sm font-bold text-slate-950">Tus apuntes o PDF</p>
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

        <RelatedSection
          title="Entrá por la necesidad que tengas ahora."
          links={[
            { href: '/estudiar-pdf-con-ia', title: 'Estudiar un PDF con IA', description: 'Mirá el recorrido completo desde el documento hasta el repaso y la práctica.' },
            { href: '/funciones/crear-mapa-mental-desde-pdf', title: 'Crear un mapa mental desde un PDF', description: 'Organizá visualmente los temas y relaciones que aparecen en tu material.' },
            { href: '/funciones/crear-flashcards-desde-pdf', title: 'Crear flashcards desde un PDF', description: 'Convertí conceptos del material en tarjetas para repasar.' },
          ]}
        />
        <FaqSection
          title="Sobre estudiar con IA"
          items={[
            { question: '¿La IA reemplaza el material original?', answer: 'No. El material que subís sigue siendo la fuente. Evaluo lo transforma en distintas vistas para ayudarte a entender, organizar visualmente, repasar y practicar.' },
            { question: '¿Tengo que usar todas las herramientas?', answer: 'No. Podés empezar por la necesidad que tengas en ese momento y volver al resto cuando te sirva.' },
            { question: '¿Puedo trabajar con mis propios PDFs?', answer: 'Sí. El flujo parte de los PDFs que elegís como material de estudio.' },
          ]}
        />
      </main>
    </Shell>
  );
}

export function EstudiarPdfExperience() {
  return (
    <Shell currentPath="/estudiar-pdf-con-ia" breadcrumbLabel="Estudiar PDF con IA" trackingPrefix="seo_estudiar_pdf_ia">
      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.14),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-18 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Tu PDF como punto de partida
              </span>
              <h1 className="mt-5 text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[66px]">
                Convertí tu PDF en una <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">sesión de estudio</span>
              </h1>
              <p className="mt-5 max-w-xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Subí el documento que estás preparando y usá el mismo contenido para entender, organizar conceptos, repasar y practicar sin tener que volver a cargarlo en cada paso.
              </p>
              <div className="mt-8">
                <PrimaryCta label="Estudiar mi PDF" trackingPrefix="seo_estudiar_pdf_ia" location="hero" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-indigo-100/50 blur-3xl" />
              <div className="relative rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_70px_rgba(15,23,42,0.11)] sm:p-7">
                <p className="text-[10px] font-black tracking-[0.14em] text-slate-500 uppercase">Ejemplo de flujo</p>
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
                    ['Flashcards', 'Tarjetas para repasar', Layers3],
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
              eyebrow="Un documento, cinco usos"
              title="No es solamente resumir el PDF. Es seguir estudiándolo."
              description="Cada salida responde a una etapa distinta. Podés empezar entendiendo el material, ordenar visualmente sus relaciones y después pasar al recuerdo activo y a la práctica sin perder la fuente original."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-5">
              {[
                ['01', 'Entender', 'Resumen para ordenar la primera lectura.'],
                ['02', 'Ubicar conceptos', 'Glosario para volver sobre términos importantes.'],
                ['03', 'Conectar', 'Mapa mental para visualizar temas y relaciones.'],
                ['04', 'Recordar', 'Flashcards para recuperar conceptos activamente.'],
                ['05', 'Practicar', 'Ejercicios para comprobar qué quedó claro.'],
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
          <div className="mx-auto grid w-full max-w-[1100px] gap-8 px-4 sm:px-8 lg:grid-cols-3">
            {[
              ['1', 'Subí el material real', 'Usá tus apuntes, una guía o el capítulo que estés preparando.'],
              ['2', 'Elegí la vista', 'Resumen, glosario, mapa mental o flashcards según lo que necesites hacer en ese momento.'],
              ['3', 'Terminá practicando', 'Volvé al mismo contenido mediante ejercicios cuando quieras comprobar comprensión.'],
            ].map(([n, title, text]) => (
              <div key={n} className="rounded-[24px] border border-slate-200 bg-white p-6">
                <span className="text-xs font-black text-indigo-700">0{n}</span>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <RelatedSection
          title="¿Querés ir directo a una tarea específica?"
          links={[
            { href: '/funciones/resumir-pdf-con-ia', title: 'Resumir PDF con IA', description: 'Mirá cómo se transforma un texto largo en una estructura de estudio más clara.' },
            { href: '/funciones/crear-mapa-mental-desde-pdf', title: 'Crear mapa mental desde PDF', description: 'Visualizá temas, subtemas y relaciones del documento.' },
            { href: '/funciones/crear-flashcards-desde-pdf', title: 'Crear flashcards desde PDF', description: 'Convertí conceptos del documento en tarjetas para repasarlos.' },
          ]}
        />
        <FaqSection
          title="Antes de subir tu PDF"
          items={[
            { question: '¿Tengo que convertir el PDF antes?', answer: 'No. El flujo parte directamente del PDF que elegís como material.' },
            { question: '¿Evaluo solamente resume el documento?', answer: 'No. El recorrido actual incluye resumen, glosario, mapa mental, flashcards y ejercicios sobre el mismo contenido.' },
            { question: '¿Puedo volver al material original?', answer: 'Sí. El PDF sigue siendo la fuente de la sesión de estudio y podés usar las distintas vistas como apoyo.' },
          ]}
        />
      </main>
    </Shell>
  );
}

export function ResumirPdfExperience() {
  return (
    <Shell currentPath="/funciones/resumir-pdf-con-ia" breadcrumbLabel="Resumir PDF con IA" trackingPrefix="seo_resumir_pdf_ia">
      <main>
        <section className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
                <ScanText className="h-3.5 w-3.5" aria-hidden="true" /> Del documento a una estructura más clara
              </span>
              <h1 className="mt-5 text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[66px]">
                Resumí tu PDF con IA <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">para seguir estudiando</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                El objetivo no es acortar por acortar: es separar ideas centrales, conceptos y relaciones para que el resumen te ayude a decidir qué revisar después.
              </p>
              <div className="mt-8 flex justify-center">
                <PrimaryCta label="Resumir mi PDF" trackingPrefix="seo_resumir_pdf_ia" location="hero" />
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
                    <p className="mt-1 text-sm leading-6 text-slate-700">Volver al glosario, llevar estos conceptos a un mapa mental o convertirlos en flashcards.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
            <SectionIntro
              eyebrow="Qué aporta valor"
              title="Un resumen útil te deja algo para hacer después."
              description="La página está pensada para mostrar el uso real de la función: identificar ejes, ubicar términos y continuar el estudio. No es una landing que repite la keyword sin enseñar qué cambia en el material."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ['1', 'Ejes principales', 'Separá las ideas que estructuran el tema antes de profundizar en detalles.'],
                ['2', 'Conceptos vinculados', 'Detectá términos que conviene volver a revisar en el glosario o el PDF original.'],
                ['3', 'Puente al repaso', 'Usá los conceptos del resumen para pasar a un mapa mental, flashcards o ejercicios sin cambiar de material.'],
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

        <RelatedSection
          title="El resumen puede ser el primer paso, no el último."
          links={[
            { href: '/estudiar-pdf-con-ia', title: 'Estudiar un PDF con IA', description: 'Mirá todo lo que podés hacer después de subir el documento.' },
            { href: '/funciones/crear-mapa-mental-desde-pdf', title: 'Crear mapa mental desde PDF', description: 'Organizá visualmente los conceptos y relaciones que detectaste en el resumen.' },
            { href: '/funciones/crear-flashcards-desde-pdf', title: 'Crear flashcards desde PDF', description: 'Llevá los conceptos del material a tarjetas de repaso.' },
          ]}
        />
        <FaqSection
          title="Sobre los resúmenes"
          items={[
            { question: '¿El resumen se basa en el PDF que subo?', answer: 'Sí. El documento que elegís funciona como fuente para la herramienta.' },
            { question: '¿El PDF original deja de ser necesario?', answer: 'No. El resumen organiza el contenido, pero el documento original sigue siendo la referencia y podés volver a él cuando lo necesites.' },
            { question: '¿Puedo seguir estudiando después del resumen?', answer: 'Sí. El mismo material puede continuar en mapas mentales, flashcards, glosario y ejercicios.' },
          ]}
        />
      </main>
    </Shell>
  );
}

export function FlashcardsPdfExperience() {
  return (
    <Shell currentPath="/funciones/crear-flashcards-desde-pdf" breadcrumbLabel="Crear flashcards desde PDF" trackingPrefix="seo_flashcards_pdf">
      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_78%_30%,rgba(99,102,241,0.15),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-18 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700">
                <Layers3 className="h-3.5 w-3.5" aria-hidden="true" /> Repaso desde tu propio material
              </span>
              <h1 className="mt-5 text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[66px]">
                Convertí tu PDF en <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">flashcards para estudiar</span>
              </h1>
              <p className="mt-5 max-w-xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Usá conceptos del documento para crear tarjetas de repaso y mantené cada pregunta conectada con el tema que estás preparando.
              </p>
              <div className="mt-8">
                <PrimaryCta label="Crear flashcards" trackingPrefix="seo_flashcards_pdf" location="hero" />
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
                  <span className="rounded-full border border-slate-200 px-3 py-1.5">Repaso activo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
            <SectionIntro
              eyebrow="De dónde sale cada tarjeta"
              title="La flashcard mantiene contexto porque nace del material que estás estudiando."
              description="La utilidad no está en generar preguntas aisladas. La tarjeta tiene que conservar una relación clara con el tema, el concepto y el documento del que parte."
            />
            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              {[
                [FileText, 'PDF', 'El material que elegiste como fuente.'],
                [BookOpen, 'Tema', 'La parte del contenido que estás repasando.'],
                [Brain, 'Concepto', 'La idea que conviene recuperar de memoria.'],
                [Layers3, 'Flashcard', 'Pregunta y respuesta para practicar recuerdo activo.'],
              ].map(([Icon, title, text], index) => {
                const IconComponent = Icon as typeof FileText;
                return (
                  <div key={String(title)} className="relative rounded-[22px] border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <IconComponent className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                      <span className="text-[10px] font-black text-slate-400">0{index + 1}</span>
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
          <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <SectionIntro
                eyebrow="Repaso con contexto"
                title="Si una tarjeta no alcanza, volvés al material."
                description="El valor de mantener todo conectado es que una duda no termina en la flashcard. Podés volver al resumen, al glosario o al mapa mental del mismo contenido y después seguir practicando."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['No recuerdo el concepto', 'Volver al glosario, al resumen o al mapa mental.'],
                  ['Ya lo entiendo', 'Seguir con otra tarjeta o pasar a ejercicios.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[22px] border border-slate-200 bg-white p-5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    <h3 className="mt-4 text-sm font-bold text-slate-950">{title}</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <RelatedSection
          title="Conectá las tarjetas con el resto del estudio."
          links={[
            { href: '/estudiar-pdf-con-ia', title: 'Estudiar un PDF con IA', description: 'Mirá el recorrido completo del mismo material.' },
            { href: '/funciones/crear-mapa-mental-desde-pdf', title: 'Crear mapa mental desde PDF', description: 'Volvé a una vista visual de los conceptos y relaciones antes de seguir repasando.' },
            { href: '/funciones/resumir-pdf-con-ia', title: 'Resumir PDF con IA', description: 'Ordená el tema antes de convertir conceptos en tarjetas.' },
          ]}
        />
        <FaqSection
          title="Sobre las flashcards"
          items={[
            { question: '¿Las tarjetas parten del PDF que subo?', answer: 'Sí. El material que elegís funciona como fuente para el recorrido de estudio.' },
            { question: '¿Tengo que usar flashcards como único método?', answer: 'No. Podés combinarlas con resumen, glosario, mapa mental y ejercicios del mismo material.' },
            { question: '¿Puedo volver al contexto de una tarjeta?', answer: 'Sí. La idea del flujo es mantener el repaso conectado con el contenido que subiste.' },
          ]}
        />
      </main>
    </Shell>
  );
}
