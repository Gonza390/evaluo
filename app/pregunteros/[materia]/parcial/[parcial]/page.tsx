import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, BookOpen, HelpCircle, ListChecks, Sparkles, Target } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { appendPregunteroAttribution } from '@/lib/preguntero-attribution';
import {
  buildParcialHref,
  getPregunteroParcialData,
  parsePregunteroParcial,
  parcialToPreguntaFilter,
} from '@/lib/data/preguntero';

export const revalidate = 600;

type PageProps = {
  params: Promise<{
    materia: string;
    parcial: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildParcialTitle(materiaNombre: string, parcial: '1' | '2' | 'integrador') {
  return parcial === 'integrador'
    ? `Preguntero integrador de ${materiaNombre}`
    : `Preguntero parcial ${parcial} de ${materiaNombre}`;
}

function buildParcialDescription(input: {
  materiaNombre: string;
  parcial: '1' | '2' | 'integrador';
  carreraNombre?: string;
  universidadNombre?: string;
  totalPreguntas: number;
}) {
  const context = [input.carreraNombre, input.universidadNombre].filter(Boolean).join(' en ');
  const parcialLabel =
    input.parcial === 'integrador' ? 'examen integrador' : `parcial ${input.parcial}`;
  const base =
    input.totalPreguntas > 0
      ? `Practicá con ${input.totalPreguntas} preguntas del ${parcialLabel} de ${input.materiaNombre}`
      : `Practicá el ${parcialLabel} de ${input.materiaNombre}`;

  return context
    ? `${base} para ${context}. Descubrí qué reforzar y entendé por qué te equivocaste.`
    : `${base}. Descubrí qué reforzar y entendé por qué te equivocaste.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const materiaId = parseSeoEntitySlug(resolvedParams.materia).id;
  const parcial = parsePregunteroParcial(resolvedParams.parcial);

  if (!materiaId || !parcial) {
    return { title: 'Preguntero', robots: { index: false, follow: false } };
  }

  const data = await getPregunteroParcialData(materiaId, parcial);
  if (!data) {
    return { title: 'Preguntero', robots: { index: false, follow: false } };
  }

  const canonicalHref = buildParcialHref(data.materiaNombre, data.materiaId, data.parcial);
  const description = buildParcialDescription({
    materiaNombre: data.materiaNombre,
    parcial: data.parcial,
    carreraNombre: data.carreraNombre,
    universidadNombre: data.universidadNombre,
    totalPreguntas: data.totalPreguntas,
  });

  return {
    title: buildParcialTitle(data.materiaNombre, data.parcial),
    description,
    alternates: { canonical: canonicalHref },
    robots: {
      index: data.totalPreguntas > 0,
      follow: true,
    },
    openGraph: {
      title: `${buildParcialTitle(data.materiaNombre, data.parcial)} | Evaluo`,
      description,
      url: canonicalHref,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
  };
}

export default async function PregunteroParcialPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const materiaId = parseSeoEntitySlug(resolvedParams.materia).id;
  const parcial = parsePregunteroParcial(resolvedParams.parcial);

  if (!materiaId || !parcial) {
    notFound();
  }

  const data = await getPregunteroParcialData(materiaId, parcial);
  if (!data) {
    notFound();
  }

  const canonicalHref = buildParcialHref(data.materiaNombre, data.materiaId, data.parcial);
  const expectedMateriaSlug = buildSeoEntitySlug(data.materiaNombre, data.materiaId);
  if (resolvedParams.materia !== expectedMateriaSlug) {
    redirect(appendPregunteroAttribution(canonicalHref, resolvedSearchParams));
  }

  const { label } = parcialToPreguntaFilter(data.parcial);
  const simuladorHref = appendPregunteroAttribution(
    `/simulador/${data.materiaId}/${data.parcialNumero}`,
    resolvedSearchParams
  );
  const materiaHref = `/explorar/materia/${data.materiaId}`;

  return (
    <main className="bg-background min-h-screen">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Pregunteros', path: '/pregunteros' },
          {
            name: `Preguntero de ${data.materiaNombre}`,
            path: `/pregunteros/${expectedMateriaSlug}`,
          },
          { name: buildParcialTitle(data.materiaNombre, data.parcial), path: canonicalHref },
        ])}
      />

      <section className="border-border bg-card border-b">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="bg-brand/10 text-brand inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
            <ListChecks className="h-4 w-4" />
            Preguntero · {label}
          </p>
          <h1 className="text-foreground mt-5 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
            {buildParcialTitle(data.materiaNombre, data.parcial)}
            {data.universidadNombre ? (
              <span className="text-muted-foreground block text-2xl font-semibold sm:text-3xl">
                ({data.universidadNombre})
              </span>
            ) : null}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-3xl text-lg leading-8">
            Practicá tu parcial, descubrí qué necesitás reforzar y entendé por qué te equivocaste.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {data.totalPreguntas > 0 ? (
              <div className="border-border bg-card inline-flex items-center gap-2 rounded-2xl border px-4 py-3">
                <HelpCircle className="text-brand h-5 w-5" />
                <span className="text-foreground text-sm font-semibold">
                  {data.totalPreguntas.toLocaleString('es-AR')} preguntas del {label.toLowerCase()}
                </span>
              </div>
            ) : null}

            <Link
              href={simuladorHref}
              className="from-brand to-brand-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px]"
            >
              <Sparkles className="h-5 w-5" />
              Practicar ahora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-border bg-card rounded-[28px] border p-6 shadow-sm">
            <h2 className="text-foreground text-2xl font-bold tracking-[-0.04em]">
              Preguntas de muestra del {label.toLowerCase()}
            </h2>
            {data.samplePreguntas.length === 0 ? (
              <p className="text-muted-foreground mt-5 text-sm leading-7">
                Todavía estamos cargando el banco de preguntas de este parcial. Entrá al simulador
                para ver las preguntas disponibles.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {data.samplePreguntas.map((question) => (
                  <li
                    key={question.id}
                    className="border-border bg-card rounded-2xl border px-4 py-4"
                  >
                    <p className="text-foreground text-sm leading-6">{question.enunciado}</p>
                    <p className="text-muted-foreground mt-2 text-xs font-semibold">
                      {question.opcionesCount} opciones
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/pregunteros/${expectedMateriaSlug}/parcial/1`}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  data.parcial === '1'
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border bg-card text-muted-foreground hover:border-brand hover:text-brand'
                }`}
              >
                Parcial 1
              </Link>
              <Link
                href={`/pregunteros/${expectedMateriaSlug}/parcial/2`}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  data.parcial === '2'
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border bg-card text-muted-foreground hover:border-brand hover:text-brand'
                }`}
              >
                Parcial 2
              </Link>
              <Link
                href={`/pregunteros/${expectedMateriaSlug}/parcial/integrador`}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  data.parcial === 'integrador'
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border bg-card text-muted-foreground hover:border-brand hover:text-brand'
                }`}
              >
                Integrador
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-border bg-card rounded-[28px] border p-6 shadow-sm">
              <h2 className="text-foreground text-xl font-bold tracking-[-0.04em]">
                Conocé cómo venís
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-7">
                Practicá en condiciones similares al parcial, recibí una corrección clara y entendé
                cada error antes de volver a intentarlo.
              </p>
              <Link
                href={simuladorHref}
                className="from-brand to-brand-2 mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px]"
              >
                <Target className="h-5 w-5" />
                Practicar ahora
              </Link>
            </div>

            <div className="border-border bg-card rounded-[28px] border p-6 shadow-sm">
              <h2 className="text-foreground text-xl font-bold tracking-[-0.04em]">
                Ver la materia completa
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-7">
                Accedé a los resúmenes por módulo, otros parciales y el material completo de la
                materia.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={materiaHref}
                  className="text-brand inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                >
                  <BookOpen className="h-5 w-5" />
                  Entrar a {data.materiaNombre}
                </Link>
                <Link
                  href={`/resumenes/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}`}
                  className="text-brand inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                >
                  <BookOpen className="h-5 w-5" />
                  Ver resúmenes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
