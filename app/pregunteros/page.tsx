import type { Metadata } from 'next';
import Link from 'next/link';
import { ListChecks, Target } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { isSiglo21University } from '@/lib/seo-search-copy';
import { PregunteroHubClient } from './preguntero-hub-client';
import { loadPregunteroHubData, summarizePregunteroHubData } from './data';

export const revalidate = 600;
/** Materias con visibilidad orgánica en Search Console (28/09–25/10/2026).
 * Ordenar solo materias del catálogo público con preguntas; no crear URLs ficticias.
 */
const FEATURED_SIGLO21_MATERIA_IDS = [
  'eb923481-2207-4895-9ae4-2a0b984d9b99', // Aprender en el Siglo 21
  '50da9d59-a6ad-4784-b964-6553fa6814f8', // Administración y Gestión Inmobiliaria
  'dd732df7-c046-4256-bccc-fd9dd27e41ec', // Informática Jurídica
  '95a4dbc2-e426-4bb5-92a6-b0c59cd260eb', // Concursos y Quiebras
  'b8417139-a4dd-44ca-ba51-7d346d66c888', // Teoría de la Argumentación Jurídica
  'ad0bbb49-20b8-4886-911e-7290226c85a2', // Derecho Penal Parte General
  '555d3d0a-206e-42e2-adf8-08f1063448e6', // Derecho Sucesorio
  'ef1c75fb-74b0-4531-8640-18a120a8e19c', // Derecho Penal Económico
] as const;

function featuredMateriaPriority(materiaId: string) {
  const position = FEATURED_SIGLO21_MATERIA_IDS.findIndex((id) => id === materiaId);
  return position < 0 ? Number.MAX_SAFE_INTEGER : position;
}


export const metadata: Metadata = {
  title: 'Pregunteros Siglo 21: parciales y práctica',
  description:
    'Encontrá pregunteros de Universidad Siglo 21 por materia y parcial. Practicá preguntas, simulá el examen y revisá tus errores en Evaluo.',
  keywords: [
    'pregunteros Siglo 21',
    'preguntero Siglo 21',
    'pregunteros Universidad Siglo 21',
    'preguntas parcial Siglo 21',
    'primer parcial Siglo 21',
    'segundo parcial Siglo 21',
  ],
  alternates: { canonical: '/pregunteros' },
  openGraph: {
    title: 'Pregunteros Siglo 21: materias y parciales | Evaluo',
    description:
      'Pregunteros Siglo 21 organizados por materia y parcial, con preguntas disponibles para practicar en Evaluo.',
    url: '/pregunteros',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pregunteros Siglo 21 | Evaluo',
    description:
      'Encontrá el preguntero de tu materia de Universidad Siglo 21 y practicá el parcial en Evaluo.',
    images: ['/opengraph-image.png'],
  },
};

export default async function PregunteroHubPage() {
  const carreras = await loadPregunteroHubData();
  const carreraSummaries = summarizePregunteroHubData(carreras);
  const siglo21Materias = Array.from(
    new Map(
      carreras
        .filter((carrera) => isSiglo21University(carrera.universidadNombre))
        .flatMap((carrera) => carrera.materias)
        .map((materia) => [materia.materiaId, materia] as const)
    ).values()
  )
    .sort((a, b) =>
      featuredMateriaPriority(a.materiaId) - featuredMateriaPriority(b.materiaId) ||
      a.materiaNombre.localeCompare(b.materiaNombre, 'es')
    )
    .slice(0, 12);

  return (
    <>
      <main className="min-h-screen bg-white text-slate-950">
        <JsonLd
          data={buildBreadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Pregunteros', path: '/pregunteros' },
          ])}
        />

        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader trackingLocation="pregunteros_header" />
        </div>

        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-blue-700 uppercase">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Universidad Siglo 21
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.055em] text-slate-950 sm:text-5xl">
              Pregunteros Siglo 21 por materia y parcial.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Encontrá tu materia y practicá primer parcial, segundo parcial o integrador. También podés buscar pregunteros disponibles de otras universidades.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
          {siglo21Materias.length > 0 ? (
            <div className="border-b border-slate-200 pb-8">
              <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">
                Pregunteros Siglo 21 disponibles
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Accesos directos a materias que ya tienen preguntas para practicar.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {siglo21Materias.map((materia) => (
                  <Link
                    key={materia.materiaId}
                    href={`/pregunteros/${buildSeoEntitySlug(materia.materiaNombre, materia.materiaId)}`}
                    className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    {materia.materiaNombre}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {carreraSummaries.length === 0 ? (
            <div className="border-y border-dashed border-slate-300 py-12 text-center">
              <p className="text-sm text-slate-600">
                Todavía estamos cargando los pregunteros por materia. Probá de nuevo en unos días.
              </p>
            </div>
          ) : (
            <PregunteroHubClient carreras={carreraSummaries} />
          )}

          <div className="mt-10 border-t border-slate-200 pt-6">
            <div className="flex items-start gap-3">
              <Target className="mt-1 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <h2 className="text-base font-bold text-slate-950">¿Qué es un preguntero?</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Es un banco de preguntas de práctica asociado a una materia y a una instancia de parcial. En Evaluo podés responderlas en un Preguntero y revisar tus errores al terminar.
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Los ejercicios son para practicar: no son exámenes oficiales ni garantizan las preguntas que van a tomar.
                </p>
                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                  <h3 className="text-base font-bold text-slate-950">
                    ¿Tu parcial incluye temas que no aparecen en el preguntero?
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Elegí el PDF de tus propios apuntes y usá Evaluo para resumir, practicar preguntas por tema y reforzar lo que te cuesta.
                  </p>
                  <TrackedLink
                    href="/estudiar-pdf-con-ia?source=pregunteros-siglo21"
                    eventName="cta_click"
                    payload={{
                      location: 'pregunteros_hub_after_catalog',
                      cta_name: 'estudiar_pdf_propio',
                      source: 'pregunteros-siglo21',
                      destination: '/estudiar-pdf-con-ia',
                    }}
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                  >
                    Estudiar con mi propio PDF
                  </TrackedLink>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterHome />
    </>
  );
}
