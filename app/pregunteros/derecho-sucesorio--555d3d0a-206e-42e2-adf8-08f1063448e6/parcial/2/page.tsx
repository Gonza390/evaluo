import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, ListChecks, Target } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { PregunteroSucesorioStudyPlan } from '@/components/marketing/preguntero-sucesorio-study-plan';
import { PregunteroPracticeHero } from '@/components/marketing/preguntero-practice-hero';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { buildPregunteroParcialSearchTitle } from '@/lib/seo-search-copy';
import { appendPregunteroAttribution } from '@/lib/preguntero-attribution';
import {
  buildParcialHref,
  getPregunteroParcialData,
  parcialToPreguntaFilter,
} from '@/lib/data/preguntero';

export const revalidate = 600;

const MATERIA_ID = '555d3d0a-206e-42e2-adf8-08f1063448e6';
const MATERIA_SLUG = `derecho-sucesorio--${MATERIA_ID}`;
const PARCIAL = '2' as const;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildDescription(input: {
  materiaNombre: string;
  carreraNombre?: string;
  universidadNombre?: string;
  totalPreguntas: number;
}) {
  const context = [input.carreraNombre, input.universidadNombre].filter(Boolean).join(' en ');
  const base =
    input.totalPreguntas > 0
      ? `${input.totalPreguntas.toLocaleString('es-AR')} preguntas para practicar el parcial 2 de ${input.materiaNombre}`
      : `Practicá el parcial 2 de ${input.materiaNombre}`;

  return context
    ? `${base} para ${context}. Practicá el examen y revisá tus errores en Evaluo.`
    : `${base}. Practicá el examen y revisá tus errores en Evaluo.`;
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPregunteroParcialData(MATERIA_ID, PARCIAL);
  if (!data) return { title: 'Preguntero', robots: { index: false, follow: false } };

  const canonicalHref = buildParcialHref(data.materiaNombre, data.materiaId, data.parcial);
  const description = buildDescription({
    materiaNombre: data.materiaNombre,
    carreraNombre: data.carreraNombre,
    universidadNombre: data.universidadNombre,
    totalPreguntas: data.totalPreguntas,
  });
  const seoTitle = buildPregunteroParcialSearchTitle({
    materiaNombre: data.materiaNombre,
    parcial: data.parcial,
    universityName: data.universidadNombre,
  });

  return {
    title: seoTitle,
    description,
    alternates: { canonical: canonicalHref },
    robots: { index: data.totalPreguntas > 0, follow: true },
    openGraph: {
      title: `${seoTitle} | Evaluo`,
      description,
      url: canonicalHref,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seoTitle} | Evaluo`,
      description,
      images: ['/opengraph-image.png'],
    },
  };
}

export default async function DerechoSucesorioParcial2Page({ searchParams }: PageProps) {
  const [data, resolvedSearchParams] = await Promise.all([
    getPregunteroParcialData(MATERIA_ID, PARCIAL),
    searchParams,
  ]);

  if (!data) notFound();

  const { label } = parcialToPreguntaFilter(data.parcial);
  const canonicalHref = buildParcialHref(data.materiaNombre, data.materiaId, data.parcial);
  const pregunteroHref = `/pregunteros/${MATERIA_SLUG}`;
  const materiaHref = `/explorar/materia/${MATERIA_SLUG}`;
  const simuladorHref = appendPregunteroAttribution(
    `/simulador/${data.materiaId}/${data.parcialNumero}`,
    { ...resolvedSearchParams, acq: 'preguntero_landing_v1' }
  );
  const title = `Preguntero parcial 2 de ${data.materiaNombre}`;
  const breadcrumbData = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Pregunteros', path: '/pregunteros' },
    { name: `Preguntero de ${data.materiaNombre}`, path: pregunteroHref },
    { name: title, path: canonicalHref },
  ]);

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white text-slate-950">
      <JsonLd data={breadcrumbData} />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader trackingLocation="derecho_sucesorio_p2_header" />
        </div>
      </div>

      <main>
        <PregunteroPracticeHero
          title={title}
          materiaNombre={data.materiaNombre}
          universidadNombre={data.universidadNombre}
          totalPreguntas={data.totalPreguntas}
          pregunteroHref={pregunteroHref}
          simuladorHref={simuladorHref}
          label={label}
          parcial={data.parcial}
          previewQuestion={data.previewQuestion}
          description="Encontraste preguntas del Parcial 2. Usalas para medir cómo venís y, si querés preparar el examen completo, armá un recorrido con tus propios apuntes."
        >
          {data.carreraNombre ? (
            <p className="text-muted-foreground mt-3 text-sm">{data.carreraNombre}</p>
          ) : null}
          <a
            href="#plan-estudio"
            className="text-primary mt-3 inline-flex min-h-11 items-center text-sm font-semibold hover:underline"
          >
            Armar mi plan de estudio
          </a>
          <p className="text-muted-foreground text-sm">
            Plan según fecha y tiempo disponible · Tus apuntes como fuente del estudio
          </p>
        </PregunteroPracticeHero>

        <section className="mx-auto w-full max-w-[1160px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-black tracking-[0.14em] text-indigo-700 uppercase">
              Preguntas de muestra
            </p>
            <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="min-w-0 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                Mirá cómo viene el Parcial 2.
              </h2>
              <span className="text-sm font-semibold text-slate-500">
                {data.totalPreguntas.toLocaleString('es-AR')} disponibles
              </span>
            </div>

            {data.samplePreguntas.length > 0 ? (
              <div className="mt-6 grid min-w-0 gap-3">
                {data.samplePreguntas.slice(0, 3).map((question, index) => (
                  <article
                    key={question.id}
                    className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5"
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[11px] font-black text-indigo-700">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 font-semibold [overflow-wrap:anywhere] text-slate-900 sm:text-[15px]">
                          {question.enunciado}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-slate-400">
                          {question.opcionesCount} opciones
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                Todavía estamos cargando preguntas de muestra para este parcial.
              </p>
            )}
          </div>
        </section>

        <section
          id="plan-estudio"
          className="scroll-mt-24 border-y border-slate-100 bg-slate-50/60 py-10 sm:py-14"
        >
          <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
            <PregunteroSucesorioStudyPlan materiaId={data.materiaId} />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1160px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <Link
              href={pregunteroHref}
              className="min-w-0 rounded-[20px] border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <ListChecks className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-slate-950">Preguntero completo</p>
              <p className="mt-1 text-xs leading-5 [overflow-wrap:anywhere] text-slate-500">
                Volvé a todas las preguntas de {data.materiaNombre}.
              </p>
            </Link>
            <Link
              href={materiaHref}
              className="min-w-0 rounded-[20px] border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <BookOpen className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-slate-950">Ver la materia</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Entrá al contexto completo de Derecho Sucesorio.
              </p>
            </Link>
            <Link
              href={simuladorHref}
              className="min-w-0 rounded-[20px] border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <Target className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-slate-950">Practicar el parcial</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Medí cómo venís y usá los errores para ajustar tu repaso.
              </p>
            </Link>
          </div>
        </section>
      </main>

      <FooterHome />
    </div>
  );
}
