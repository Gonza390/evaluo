import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, FileText, RefreshCw } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { FooterHome } from '@/components/footer-home';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';
import { STUDY_GUIDES, getStudyGuide } from '@/lib/es-study-guides';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return STUDY_GUIDES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getStudyGuide(slug);
  if (!guide) return { title: 'Guía de estudio', robots: { index: false, follow: false } };
  const path = `/es/guias/${slug}`;
  return {
    title: guide.seoTitle,
    description: guide.description,
    alternates: { canonical: toAbsoluteUrl(path) },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      title: guide.seoTitle + ' | Evaluo',
      description: guide.description,
      url: toAbsoluteUrl(path),
      locale: 'es',
    },
  };
}

export default async function GuiaDeEstudio({ params }: Props) {
  const { slug } = await params;
  const guide = getStudyGuide(slug);
  if (!guide) notFound();

  const path = `/es/guias/${guide.slug}`;
  const source = `guia-${guide.slug}`;
  const href = `/es/estudiar-pdf-con-ia?source=${encodeURIComponent(source)}`;
  const related = STUDY_GUIDES.filter((item) =>
    item.slug !== guide.slug && item.category === guide.category
  ).slice(0, 3);
  const otherGuides = related.length > 0 ? related : STUDY_GUIDES.filter((item) => item.slug !== guide.slug).slice(0, 3);

  return (
    <div lang="es" className="min-h-screen bg-white text-slate-950">
      <JsonLd data={[
        buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Guías de estudio', path: '/es/guias' },
          { name: guide.title, path },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guide.description,
          inLanguage: 'es',
          datePublished: '2026-10-29',
          dateModified: '2026-10-29',
          author: { '@type': 'Organization', name: 'Evaluo' },
          publisher: { '@type': 'Organization', name: 'Evaluo' },
          mainEntityOfPage: toAbsoluteUrl(path),
        },
      ]} />
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader variant="landing" trackingLocation="es_study_guide_header" />
      </div>
      <main>
        <header className="border-b border-slate-100 bg-[linear-gradient(160deg,#F8FAFF_0%,#FFFFFF_100%)]">
          <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8 sm:py-16">
            <Link href="/es/guias" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todas las guías de estudio
            </Link>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{guide.category}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{guide.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{guide.opening}</p>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-700">
              Para quién: {guide.audience}
            </p>
            <TrackedLink
              href={href}
              eventName="cta_click"
              payload={{
                location: 'es_study_guide_hero',
                cta_name: 'estudiar_pdf',
                guide_slug: guide.slug,
                source,
                destination: '/es/estudiar-pdf-con-ia',
              }}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Aplicarlo a mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12 lg:py-16">
          <article className="min-w-0">
            <section aria-labelledby="objetivo-estudio">
              <h2 id="objetivo-estudio" className="text-2xl font-bold tracking-tight sm:text-3xl">{guide.question}</h2>
              <p className="mt-4 text-base leading-8 text-slate-700">{guide.focus}</p>
            </section>
            <section id="metodo" className="mt-12 scroll-mt-20" aria-labelledby="metodo-titulo">
              <h2 id="metodo-titulo" className="text-2xl font-bold tracking-tight sm:text-3xl">Método paso a paso</h2>
              <ol className="mt-6 space-y-5">
                {guide.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4 border-b border-slate-100 pb-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
                    <div>
                      <h3 className="text-lg font-bold leading-7">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section id="ejemplo" className="mt-12 scroll-mt-20 rounded-[26px] border border-blue-100 bg-blue-50/60 p-6 sm:p-8" aria-labelledby="ejemplo-titulo">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Ejemplo resuelto · Para practicar</p>
              <h2 id="ejemplo-titulo" className="mt-3 text-2xl font-bold tracking-tight">{guide.exampleTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{guide.exampleContext}</p>
              <ol className="mt-5 space-y-3">
                {guide.exampleTasks.map((task, i) => (
                  <li key={task} className="flex gap-3 rounded-xl border border-blue-100 bg-white p-4">
                    <span className="font-bold text-blue-700">{i + 1}.</span>
                    <span className="text-sm leading-7 text-slate-700">{task}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 flex items-start gap-2 text-sm font-semibold leading-7 text-slate-800">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" /> {guide.exampleOutcome}
              </p>
            </section>

            <section id="errores" className="mt-12 scroll-mt-20" aria-labelledby="errores-titulo">
              <h2 id="errores-titulo" className="text-2xl font-bold tracking-tight sm:text-3xl">Errores frecuentes y cómo evitarlos</h2>
              <div className="mt-6 space-y-6">
                {guide.pitfalls.map((pitfall) => (
                  <div key={pitfall.title} className="border-l-2 border-blue-200 pl-5">
                    <h3 className="text-base font-bold">{pitfall.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{pitfall.detail}</p>
                  </div>
                ))}
              </div>
            </section>
            <section id="repaso" className="mt-12 scroll-mt-20 rounded-2xl border border-slate-200 p-6 sm:p-8" aria-labelledby="repaso-titulo">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-blue-700" aria-hidden="true" />
                <h2 id="repaso-titulo" className="text-xl font-bold">Cómo volver a practicar</h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{guide.review}</p>
            </section>

            <section id="preguntas" className="mt-12 scroll-mt-20" aria-labelledby="preguntas-titulo">
              <h2 id="preguntas-titulo" className="text-2xl font-bold tracking-tight sm:text-3xl">Preguntas frecuentes</h2>
              <div className="mt-6 space-y-5">
                {guide.faq.map((item) => (
                  <div key={item.q} className="border-b border-slate-100 pb-5">
                    <h3 className="text-base font-bold leading-7">{item.q}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12 rounded-[26px] border border-blue-100 bg-[linear-gradient(120deg,#EFF6FF_0%,#FFFFFF_100%)] p-6 sm:p-8">
              <div className="flex items-center gap-2 text-blue-700"><FileText className="h-5 w-5" aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-wide">Prueba con tu propio material</p></div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Convierte tus apuntes en una sesión de estudio</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Selecciona tu PDF y utiliza Evaluo para organizar temas, estudiar con tarjetas y responder preguntas
                que puedas contrastar con tu documento. Las actividades son material de práctica, no exámenes oficiales.
              </p>
              <TrackedLink
                href={href}
                eventName="cta_click"
                payload={{
                  location: 'es_study_guide_after_article',
                  cta_name: 'estudiar_pdf',
                  guide_slug: guide.slug,
                  source,
                  destination: '/es/estudiar-pdf-con-ia',
                }}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Elegir mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
              <p className="mt-3 text-xs text-slate-500">Primero eliges el PDF; para procesarlo necesitas crear una cuenta.</p>
            </section>
            <p className="mt-8 text-xs leading-6 text-slate-500">
              Recurso educativo de Evaluo · Actualizado el 29 de octubre de 2026.
              La práctica de recuperación y el repaso distribuido tienen apoyo en investigación educativa.
              Puedes consultar <a href="https://www.aft.org/ae/fall2013/dunlosky" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">esta revisión divulgativa de la evidencia</a>.
              Contrasta siempre los contenidos técnicos con tu programa y material original.
            </p>
          </article>
          <aside className="min-w-0">
            <nav aria-label="Secciones de la guía" className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">En esta guía</p>
              <div className="mt-3 flex flex-col gap-1 text-sm font-semibold text-blue-700">
                {[
                  ['#metodo', 'Método'],
                  ['#ejemplo', 'Ejemplo práctico'],
                  ['#errores', 'Errores frecuentes'],
                  ['#repaso', 'Cómo repasar'],
                  ['#preguntas', 'Preguntas frecuentes'],
                ].map(([link, label]) => (
                  <a href={link} key={link} className="flex min-h-10 items-center hover:underline">{label}</a>
                ))}
              </div>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="flex items-center gap-2 text-sm font-bold"><BookOpenCheck className="h-4 w-4 text-blue-700" /> Otras guías</p>
                <div className="mt-2 flex flex-col gap-2">
                  {otherGuides.map((item) => (
                    <Link href={`/es/guias/${item.slug}`} key={item.slug} className="py-2 text-sm leading-6 text-slate-600 hover:text-blue-700">
                      {item.title}
                    </Link>
                  ))}
                </div>
                <Link href="/es/guias" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
                  Todas las guías <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          </aside>
        </div>
      </main>
      <FooterHome />
    </div>
  );
}
