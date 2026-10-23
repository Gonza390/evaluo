import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers3,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/crear-mapa-mental-desde-pdf';
const uploadHref = '/estudiar-pdf-con-ia?source=seo-mapa-mental-pdf';

export const metadata: Metadata = {
  title: 'Crear mapa mental desde PDF con IA | Evaluo',
  description:
    'Creá un mapa mental desde PDF con IA. Elegí tus apuntes, visualizá temas, ramas y conceptos, y seguí repasando con el mismo documento en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Crear mapa mental desde PDF con IA | Evaluo',
    description:
      'Organizá visualmente los conceptos de tu PDF y conectalos con el resto de tu recorrido de estudio.',
    url: toAbsoluteUrl(path),
  },
};

const related = [
  {
    href: '/estudiar-pdf-con-ia',
    title: 'Estudiar un PDF con IA',
    description: 'Usá el mismo documento para resumir, organizar, repasar y practicar.',
  },
  {
    href: '/funciones/resumir-pdf-con-ia',
    title: 'Resumir un PDF con IA',
    description: 'Ordená primero las ideas principales del contenido que estás estudiando.',
  },
  {
    href: '/funciones/crear-flashcards-desde-pdf',
    title: 'Crear flashcards desde un PDF',
    description: 'Convertí los conceptos del material en tarjetas para repasarlos.',
  },
];

export default function CrearMapaMentalDesdePdfPage() {
  return (
    <div className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <MarketingAnalyticsSlot />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Evaluo', path: '/' },
          { name: 'Crear mapa mental desde PDF', path },
        ])}
      />

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader primaryHref={uploadHref} trackingLocation="seo_mapa_mental_pdf_header" />
      </div>

      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_75%_15%,rgba(99,102,241,0.15),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-18 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-[11px] font-bold text-blue-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Organización visual desde tu material
              </span>
              <h1 className="mt-5 text-[2.5rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[66px]">
                Creá un{' '}
                <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">
                  mapa mental desde PDF con IA
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Elegí un PDF de tus apuntes y organizá sus temas, subtemas y conceptos en un mapa mental con IA. Visualizá relaciones entre ideas y después volvé al documento o seguí practicando en Evaluo.
              </p>
              <div className="mt-8">
                <TrackedLink
                  href="#elegir-pdf-mapa-mental"
                  eventName="cta_click"
                  payload={{
                    location: 'seo_mapa_mental_pdf_hero',
                    cta_name: 'elegir_pdf',
                    destination: '#elegir-pdf-mapa-mental',
                  }}
                  className="from-brand to-brand-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
                  Crear mapa mental desde mi PDF
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200/70 pt-5 text-[11px] font-semibold text-slate-600 sm:text-xs">
                {['Partí de tu propio PDF', 'Visualizá conceptos y relaciones', 'Seguí estudiando el mismo material'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 rounded-[44px] bg-blue-100/55 blur-3xl" />
              <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_70px_rgba(15,23,42,0.11)] sm:p-7">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <FileText className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500">Fuente del ejemplo</p>
                      <p className="text-sm font-bold text-slate-950">Marketing I.pdf</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">Ejemplo visual</span>
                </div>

                <div className="relative mt-6 min-h-[360px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 sm:p-7">
                  <div className="absolute left-1/2 top-[72px] h-[90px] w-px -translate-x-1/2 bg-blue-200" />
                  <div className="absolute left-[25%] right-[25%] top-[161px] h-px bg-blue-200" />
                  <div className="absolute left-[25%] top-[161px] h-[54px] w-px bg-blue-200" />
                  <div className="absolute right-[25%] top-[161px] h-[54px] w-px bg-blue-200" />

                  <div className="relative mx-auto flex w-fit items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-5 py-3 text-white shadow-lg shadow-blue-200/70">
                    <Layers3 className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-bold">Marketing</span>
                  </div>

                  <div className="relative mt-[82px] grid grid-cols-2 gap-5 sm:gap-8">
                    <div className="rounded-2xl border border-blue-200 bg-white p-4 text-center shadow-sm">
                      <p className="text-xs font-bold text-slate-950">Segmentación</p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {['Demográfica', 'Geográfica', 'Conductual'].map((label) => (
                          <span key={label} className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600">{label}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-blue-200 bg-white p-4 text-center shadow-sm">
                      <p className="text-xs font-bold text-slate-950">Posicionamiento</p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {['Propuesta de valor', 'Diferenciación'].map((label) => (
                          <span key={label} className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600">{label}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-7 text-center text-[10px] leading-5 text-slate-500">
                    La vista representa cómo un tema central puede organizarse en conceptos relacionados del mismo material.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="elegir-pdf-mapa-mental" className="scroll-mt-24 border-b border-slate-100 bg-white py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1120px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">Convertí PDF a mapa mental</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Cómo hacer un mapa mental a partir de un PDF</h2>
              <ol className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
                <li><strong className="text-slate-900">1. Elegí tu PDF.</strong> Seleccioná un capítulo, apunte o material que estés estudiando.</li>
                <li><strong className="text-slate-900">2. Creá el material.</strong> Registrate cuando decidas procesarlo y accedé a las vistas de estudio.</li>
                <li><strong className="text-slate-900">3. Consultá el mapa mental.</strong> Ubicá el tema principal, las ramas y las relaciones; después comprobá lo aprendido con ejercicios.</li>
              </ol>
              <p className="mt-5 text-xs leading-6 text-slate-500">El mapa visual es parte del estudio sobre tu PDF; no reemplaza la lectura de la fuente original.</p>
            </div>
            <PdfFirstLandingUploader trackingLocation="seo_mapa_mental_pdf" sourceKey="mapa-mental-desde-pdf" />
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
            <p className="text-[11px] font-bold tracking-[0.16em] text-blue-700 uppercase">Para qué sirve</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
              Usá una vista visual cuando necesitás entender cómo se relacionan las ideas.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Un resumen conserva una lectura lineal. El mapa mental agrega otra perspectiva: agrupa conceptos alrededor de temas y hace visibles sus conexiones dentro del material.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ['01', 'Ubicá el tema central', 'Partí del concepto principal que organiza una unidad o capítulo.'],
                ['02', 'Separá ramas y conceptos', 'Visualizá subtemas y términos relacionados sin recorrer todo el documento de nuevo.'],
                ['03', 'Volvé al material', 'Usá el mapa como guía y seguí con resumen, flashcards o práctica cuando lo necesites.'],
              ].map(([number, title, text]) => (
                <article key={number} className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                  <p className="text-[10px] font-black text-blue-700">{number}</p>
                  <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
            <h2 className="max-w-2xl text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
              Conectá el mapa mental con el resto del estudio.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.07)] sm:p-6"
                >
                  <h3 className="text-sm font-bold tracking-tight text-slate-950 group-hover:text-blue-700 sm:text-[15px]">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-6">{item.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-blue-700">
                    Ver página <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1040px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-blue-700 uppercase">Preguntas frecuentes</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">Sobre mapas mentales desde PDF</h2>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {[
                ['¿El mapa mental parte del PDF que subo?', 'Sí. La función usa el material que elegís como fuente para organizar visualmente los temas y conceptos del contenido.'],
                ['¿Cómo crear un mapa mental desde un PDF?', 'Seleccioná el PDF en esta página, continuá con la creación del material y abrí su mapa mental para explorar las relaciones entre temas y subtemas.'],
                ['¿El mapa mental reemplaza al resumen?', 'No. Son formas distintas de recorrer el mismo material: el resumen mantiene una lectura estructurada y el mapa mental ayuda a visualizar relaciones.'],
                ['¿Puedo seguir estudiando después de ver el mapa?', 'Sí. El mapa mental forma parte del recorrido sobre el mismo material y podés continuar con otras herramientas de Evaluo.'],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5 sm:py-6">
                  <summary className="cursor-pointer list-none pr-8 text-sm font-bold text-slate-950 marker:hidden">{question}</summary>
                  <p className="mt-3 max-w-[680px] text-xs leading-6 text-slate-600 sm:text-[13px]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <FooterHome />
    </div>
  );
}
