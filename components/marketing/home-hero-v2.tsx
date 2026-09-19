import {
  ArrowRight,
  Brain,
  BookOpen,
  CheckCircle2,
  FileText,
  ListChecks,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { HomeStudyPreview } from '@/components/marketing/home-study-preview';
import { HomeProductVideo } from '@/components/marketing/home-product-video';

const studyCapabilities = [
  {
    icon: FileText,
    title: 'Estudiá tu material',
    description: 'Evaluo organiza lo importante de lo que realmente tenés que preparar.',
  },
  {
    icon: Brain,
    title: 'Descubrí qué te falta',
    description: 'Probate sobre tu PDF y detectá qué temas necesitás reforzar.',
  },
  {
    icon: BookOpen,
    title: 'Reforzá lo que te cuesta',
    description: 'Volvé directamente a los conceptos donde tuviste más dificultad.',
  },
  {
    icon: ListChecks,
    title: 'Practicá para el parcial',
    description: 'Respondé preguntas y volvé a probarte hasta llegar preparado.',
  },
];

export function HomeHeroV2({ primaryHref }: { primaryHref: string }) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_78%_18%,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_12%_35%,rgba(37,99,235,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent" />

        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-8 lg:px-10 lg:pb-24">
          <div className="animate-surface-reveal">
            <PublicSiteHeader primaryHref={primaryHref} trackingLocation="home_header" />
          </div>

          <div className="grid items-center gap-10 pt-10 sm:pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:pt-18">
            <div className="animate-surface-reveal flex min-w-0 flex-col items-start text-left">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0">Estudiá con tu propio PDF</span>
              </span>

              <h1 className="text-foreground mt-5 max-w-[680px] text-[2.35rem] leading-[1.02] font-bold tracking-[-0.055em] sm:text-5xl lg:text-[60px] lg:leading-[1.02]">
                Subí tu PDF y en minutos estudiás.
              </h1>

              <p className="mt-5 max-w-[560px] text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Convertí tus apuntes en resúmenes, mapas mentales, flashcards y práctica. Ponete a prueba y descubrí qué temas necesitás reforzar antes del examen.
              </p>

              <div className="mt-7 flex w-full flex-col gap-2.5 sm:mt-9 sm:flex-row sm:items-center sm:gap-3">
                <TrackedLink
                  href={primaryHref}
                  eventName="cta_click"
                  payload={{
                    location: 'home_hero',
                    cta_name: 'probar_con_mi_pdf',
                    destination: primaryHref,
                  }}
                  className="from-brand to-brand-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto sm:px-8"
                >
                  <UploadCloud className="h-4.5 w-4.5 shrink-0" />
                  Probar con mi PDF
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </TrackedLink>
                <TrackedLink
                  href="/#video"
                  eventName="cta_click"
                  payload={{
                    location: 'home_hero',
                    cta_name: 'ver_como_funciona',
                    destination: '/#video',
                  }}
                  className="inline-flex h-13 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Ver cómo funciona
                </TrackedLink>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500 sm:text-xs">Empezá gratis · Sin tarjeta</p>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200/70 pt-5 text-[11px] font-semibold text-slate-600 sm:text-xs">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  Entendé los temas
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  Practicá con preguntas
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  Repasá tus errores
                </span>
              </div>
            </div>

            <HomeStudyPreview />
          </div>
        </div>
      </section>

      <HomeProductVideo primaryHref={primaryHref} />

      <section id="producto" className="border-b border-slate-100 bg-white py-14 sm:py-16 lg:py-18">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end lg:gap-16">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                <span className="h-px w-8 shrink-0 bg-indigo-500" />
                Una sola fuente para estudiar
              </div>
              <h2 className="mt-4 max-w-[620px] text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[42px] lg:leading-[1.05]">
                Un solo PDF. Distintas formas de aprenderlo.
              </h2>
            </div>
            <p className="max-w-[620px] text-sm leading-7 text-slate-600 sm:text-base">
              Subís una vez tu material y cambiás de forma de estudio sin cambiar de fuente.
            </p>
          </div>

          <div className="mt-9 grid border-y border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {studyCapabilities.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className={`min-w-0 py-5 sm:px-5 sm:py-6 ${
                  index > 0 ? 'border-t border-slate-200 sm:border-t-0 sm:border-l' : ''
                } ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-sm font-bold tracking-tight text-slate-950">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-5 rounded-2xl bg-slate-50 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
              {['Resumen', 'Glosario', 'Mapa mental', 'Flashcards', 'Práctica', 'Diagnóstico'].map((label) => (
                <span key={label} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                  {label}
                </span>
              ))}
            </div>

            <TrackedLink
              href={primaryHref}
              eventName="cta_click"
              payload={{
                location: 'home_product_overview',
                cta_name: 'probar_con_mi_pdf_producto',
                destination: primaryHref,
              }}
              className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-indigo-700 transition hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Probar con mi PDF
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </TrackedLink>
          </div>
        </div>
      </section>

    </>
  );
}
