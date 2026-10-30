import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, ClipboardCheck, FileText, GraduationCap } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { FooterHome } from '@/components/footer-home';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { toAbsoluteUrl } from '@/lib/site';
import { STUDY_GUIDES } from '@/lib/es-study-guides';

const path = '/es/guias';
const categories = [
  { title: 'Estudiar por materia', icon: GraduationCap, description: 'Métodos y ejemplos diferentes para comprender cada disciplina.' },
  { title: 'Preparar exámenes', icon: ClipboardCheck, description: 'Organiza el temario y comprueba qué sabes antes de rendir.' },
  { title: 'Practicar y reforzar', icon: BookOpenCheck, description: 'Transforma tus apuntes en ejercicios y utiliza los errores para avanzar.' },
] as const;

export const metadata: Metadata = {
  title: 'Guías para estudiar mejor: materias, exámenes y práctica',
  description: 'Guías prácticas para estudiar anatomía, psicología, derecho y economía, preparar exámenes y aprender con preguntas de tus apuntes PDF.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    locale: 'es',
    title: 'Guías de estudio universitario | Evaluo',
    description: 'Métodos concretos para comprender tus apuntes, preparar exámenes y practicar por temas.',
    url: toAbsoluteUrl(path),
  },
};

export default function GuiasDeEstudioPage() {
  return (
    <div lang="es" className="min-h-screen bg-white text-slate-950">
      <JsonLd data={buildBreadcrumbJsonLd([{ name: 'Inicio', path: '/' }, { name: 'Guías de estudio', path }])} />
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader variant="landing" trackingLocation="es_study_guides_header" />
      </div>
      <main>
        <section className="border-b border-slate-100 bg-[linear-gradient(160deg,#F8FAFF_0%,#FFFFFF_80%)]">
          <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-8 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Guías de estudio · Evaluo</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Estudia con un método. Practica lo que necesitas aprender.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              Aprende cómo estudiar distintas materias, preparar un examen y revisar tus errores.
              Cada guía incluye un procedimiento, un ejemplo y preguntas que puedes aplicar a tus propios apuntes.
              No necesitas seguir una técnica idéntica para todas las asignaturas.
            </p>
            <Link href="/es/paises" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
              Ver guías de estudio por país <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="mt-7 flex flex-wrap gap-3">
              <TrackedLink
                href="/es/estudiar-pdf-con-ia?source=guia-hub"
                eventName="cta_click"
                payload={{ location: 'es_study_guides_hero', cta_name: 'seleccionar_pdf', source: 'guia-hub', destination: '/es/estudiar-pdf-con-ia' }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Estudiar mis apuntes en PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
              <a href="#guias" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 hover:border-blue-300">
                Ver las ocho guías
              </a>
            </div>
          </div>
        </section>

        <div id="guias" className="mx-auto max-w-[1120px] scroll-mt-20 px-4 py-12 sm:px-8 sm:py-16">
          {categories.map(({ title, icon: Icon, description }) => {
            const items = STUDY_GUIDES.filter((guide) => guide.category === title);
            return (
              <section key={title} className="mb-14" aria-label={title}>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {items.map((guide) => (
                    <article key={guide.slug} className="flex flex-col rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{guide.category}</p>
                      <h3 className="mt-3 text-lg font-bold leading-snug text-slate-950">
                        <Link href={`/es/guias/${guide.slug}`} className="hover:text-blue-700">
                          {guide.title}
                        </Link>
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{guide.description}</p>
                      <Link href={`/es/guias/${guide.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-blue-700 hover:underline">
                        Leer la guía <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
          <section className="rounded-[26px] border border-blue-100 bg-blue-50/60 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-blue-700"><FileText className="h-5 w-5" aria-hidden="true" /><span className="text-xs font-bold uppercase tracking-wide">Del consejo a la práctica</span></div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">El siguiente paso está en tus apuntes</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Después de elegir una técnica, utiliza el material de la asignatura: selecciona un PDF,
              organiza un tema, responde preguntas y revisa los errores. Las preguntas creadas con IA
              son herramientas de práctica, no exámenes oficiales ni sustitutos de la bibliografía.
            </p>
            <TrackedLink
              href="/es/estudiar-pdf-con-ia?source=guia-hub"
              eventName="cta_click"
              payload={{ location: 'es_study_guides_bottom', cta_name: 'seleccionar_pdf', source: 'guia-hub', destination: '/es/estudiar-pdf-con-ia' }}
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
            >Elegir el PDF que voy a estudiar <ArrowRight className="h-4 w-4" aria-hidden="true" /></TrackedLink>
          </section>
          <div className="mt-10 rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-600">
            <p className="font-semibold text-slate-900">¿Por qué incluimos práctica y repaso?</p>
            <p className="mt-1">
              La investigación en aprendizaje destaca la utilidad de la recuperación activa y la práctica distribuida.
              Consulta <a href="https://www.aft.org/ae/fall2013/dunlosky" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">el resumen de investigación de Dunlosky</a> y adapta las técnicas al tipo de materia y evaluación.
            </p>
          </div>
        </div>
      </main>
      <FooterHome />
    </div>
  );
}
