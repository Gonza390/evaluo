import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
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

const iconMap = {
  book: BookOpen,
  brain: Brain,
  cards: Layers3,
  check: CheckCircle2,
  file: FileText,
  list: ListChecks,
  scan: ScanText,
  sparkles: Sparkles,
  target: Target,
  upload: UploadCloud,
} satisfies Record<string, LucideIcon>;

type IconName = keyof typeof iconMap;

type FeatureItem = {
  icon: IconName;
  title: string;
  description: string;
};

type StepItem = {
  title: string;
  description: string;
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

type SeoStudyLandingProps = {
  currentPath: string;
  breadcrumbLabel: string;
  eyebrow: string;
  titleBefore: string;
  titleAccent: string;
  titleAfter?: string;
  description: string;
  proofPoints: string[];
  featuresHeading: string;
  featuresIntro: string;
  features: FeatureItem[];
  stepsHeading: string;
  stepsIntro: string;
  steps: StepItem[];
  exampleEyebrow: string;
  exampleHeading: string;
  exampleDescription: string;
  exampleItems: Array<{ label: string; value: string }>;
  relatedHeading: string;
  relatedIntro: string;
  relatedLinks: RelatedLink[];
  faqItems: FaqItem[];
  primaryCtaLabel?: string;
  secondaryCta?: { href: string; label: string };
  trackingPrefix: string;
};

const uploadHref = '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1';

export function SeoStudyLanding({
  currentPath,
  breadcrumbLabel,
  eyebrow,
  titleBefore,
  titleAccent,
  titleAfter,
  description,
  proofPoints,
  featuresHeading,
  featuresIntro,
  features,
  stepsHeading,
  stepsIntro,
  steps,
  exampleEyebrow,
  exampleHeading,
  exampleDescription,
  exampleItems,
  relatedHeading,
  relatedIntro,
  relatedLinks,
  faqItems,
  primaryCtaLabel = 'Subir mi PDF',
  secondaryCta,
  trackingPrefix,
}: SeoStudyLandingProps) {
  return (
    <div className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <MarketingAnalyticsSlot />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Evaluo', path: '/' },
          { name: breadcrumbLabel, path: currentPath },
        ])}
      />

      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_78%_18%,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_12%_35%,rgba(37,99,235,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent" />
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-8 lg:px-10 lg:pb-24">
          <PublicSiteHeader primaryHref={uploadHref} trackingLocation={`${trackingPrefix}_header`} />

          <div className="grid items-center gap-10 pt-10 sm:pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:pt-20">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {eyebrow}
              </span>

              <h1 className="mt-5 max-w-[720px] text-[2.45rem] leading-[1] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[66px]">
                {titleBefore}{' '}
                <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">
                  {titleAccent}
                </span>
                {titleAfter ? ` ${titleAfter}` : ''}
              </h1>

              <p className="mt-5 max-w-[650px] text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                {description}
              </p>

              <div className="mt-7 flex w-full flex-col gap-2.5 sm:mt-9 sm:flex-row sm:gap-3">
                <TrackedLink
                  href={uploadHref}
                  eventName="cta_click"
                  payload={{
                    location: `${trackingPrefix}_hero`,
                    cta_name: 'subir_pdf',
                    destination: uploadHref,
                  }}
                  className="from-brand to-brand-2 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-8"
                >
                  <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
                  {primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>

                {secondaryCta ? (
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:px-7"
                  >
                    {secondaryCta.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200/70 pt-5 text-[11px] font-semibold text-slate-600 sm:text-xs">
                {proofPoints.map((point) => (
                  <span key={point} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="pointer-events-none absolute -inset-8 rounded-[42px] bg-[radial-gradient(circle_at_60%_35%,rgba(99,102,241,0.16),transparent_58%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.11)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500">Tu material</p>
                      <p className="text-xs font-bold text-slate-900 sm:text-sm">Apuntes del parcial.pdf</p>
                    </div>
                  </div>
                  <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline">
                    Listo para estudiar
                  </span>
                </div>

                <div className="grid min-h-[380px] sm:grid-cols-[150px_minmax(0,1fr)]">
                  <aside className="hidden border-r border-slate-200 bg-slate-50/70 p-4 sm:block">
                    <p className="mb-3 px-2 text-[9px] font-bold tracking-[0.14em] text-slate-500 uppercase">Estudio</p>
                    {['Resumen', 'Glosario', 'Flashcards', 'Ejercicios'].map((label, index) => (
                      <div
                        key={label}
                        className={`border-l-2 px-3 py-2.5 text-[10px] font-bold ${
                          index === 0 ? 'border-indigo-600 text-indigo-800' : 'border-transparent text-slate-500'
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                  </aside>

                  <div className="min-w-0 p-5 sm:p-6 lg:p-7">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-700 uppercase">Mismo material, distintas formas de estudiar</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                      Pasá de leer a practicar sin cambiar de apunte.
                    </h2>
                    <div className="mt-6 border-t border-slate-200">
                      {[
                        ['Resumen', 'Ideas centrales organizadas para una primera pasada.'],
                        ['Glosario', 'Conceptos y definiciones del material que subiste.'],
                        ['Flashcards', 'Tarjetas para repasar los conceptos del mismo contenido.'],
                        ['Ejercicios', 'Práctica para comprobar qué entendiste del material.'],
                      ].map(([label, text], index) => (
                        <div key={label} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-b border-slate-100 py-4">
                          <span className="text-[10px] font-black text-indigo-700">0{index + 1}</span>
                          <div>
                            <p className="text-[11px] font-bold text-slate-900">{label}</p>
                            <p className="mt-1 text-[10px] leading-4 text-slate-600">{text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="border-b border-slate-100 bg-white py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
            <div className="grid gap-6 border-b border-slate-200 pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16 lg:pb-12">
              <h2 className="max-w-[620px] text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.04]">
                {featuresHeading}
              </h2>
              <p className="max-w-[620px] text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                {featuresIntro}
              </p>
            </div>

            <div className="grid gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:pt-10">
              {features.map((feature) => {
                const Icon = iconMap[feature.icon];
                return (
                  <article key={feature.title} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-sm font-bold tracking-tight text-slate-950 sm:text-[15px]">{feature.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-6">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-slate-50/50 py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-16 lg:px-10">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Cómo funciona</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">{stepsHeading}</h2>
              <p className="mt-4 max-w-[520px] text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{stepsIntro}</p>
            </div>

            <div className="border-t border-slate-200">
              {steps.map((step, index) => (
                <div key={step.title} className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 border-b border-slate-200 py-5 sm:py-6">
                  <span className="pt-0.5 text-[10px] font-black text-indigo-700">0{index + 1}</span>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-950">{step.title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-6">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-10">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">{exampleEyebrow}</p>
              <h2 className="mt-4 max-w-[560px] text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">{exampleHeading}</h2>
              <p className="mt-4 max-w-[560px] text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{exampleDescription}</p>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.09)]">
              <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
                <p className="text-xs font-bold text-slate-900">Ejemplo de salida</p>
              </div>
              <dl className="divide-y divide-slate-100 px-5 sm:px-6">
                {exampleItems.map((item) => (
                  <div key={item.label} className="grid gap-1 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-5 sm:py-5">
                    <dt className="text-[10px] font-bold tracking-[0.08em] text-indigo-700 uppercase">{item.label}</dt>
                    <dd className="text-xs leading-5 text-slate-700 sm:text-[13px] sm:leading-6">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-slate-50/40 py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">{relatedHeading}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{relatedIntro}</p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {relatedLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.07)] sm:p-6"
                >
                  <h3 className="text-sm font-bold tracking-tight text-slate-950 group-hover:text-indigo-700 sm:text-[15px]">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-6">{item.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-indigo-700">
                    Ver herramienta
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1040px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Preguntas frecuentes</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">Antes de subir tu material</h2>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {faqItems.map((item) => (
                <details key={item.question} className="group py-5 sm:py-6">
                  <summary className="cursor-pointer list-none pr-8 text-sm font-bold text-slate-950 marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-3 max-w-[680px] text-xs leading-6 text-slate-600 sm:text-[13px]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_40%),linear-gradient(180deg,#050B2C_0%,var(--heading)_100%)] p-8 text-center shadow-xl md:p-14">
              <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
                <Sparkles className="h-5 w-5 text-indigo-200" aria-hidden="true" />
                <h2 className="mt-5 text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Probalo con el material que ya estás estudiando.
                </h2>
                <p className="mt-4 max-w-xl text-xs leading-6 text-white/80 sm:text-sm">
                  Subí tu PDF y usá el mismo contenido para estudiar, repasar y practicar dentro de Evaluo.
                </p>
                <TrackedLink
                  href={uploadHref}
                  eventName="cta_click"
                  payload={{
                    location: `${trackingPrefix}_final`,
                    cta_name: 'subir_pdf_final',
                    destination: uploadHref,
                  }}
                  className="mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-white px-7 text-sm font-bold text-slate-950 shadow-md transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <UploadCloud className="h-4.5 w-4.5 text-indigo-700" aria-hidden="true" />
                  {primaryCtaLabel}
                  <ArrowRight className="h-4 w-4 text-indigo-700" aria-hidden="true" />
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterHome />
    </div>
  );
}
