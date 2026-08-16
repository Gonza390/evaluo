import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, BookOpen, HelpCircle, ListChecks, Sparkles, Target } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
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
  const parcialLabel = input.parcial === 'integrador' ? 'examen integrador' : `parcial ${input.parcial}`;
  const base =
    input.totalPreguntas > 0
      ? `Practicá con ${input.totalPreguntas} preguntas del ${parcialLabel} de ${input.materiaNombre}`
      : `Practicá el ${parcialLabel} de ${input.materiaNombre}`;

  return context
    ? `${base} para ${context}, con simulador de parcial y feedback en Evaluo.`
    : `${base}, con simulador de parcial y feedback en Evaluo.`;
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
    openGraph: {
      title: `${buildParcialTitle(data.materiaNombre, data.parcial)} | Evaluo`,
      description,
      url: canonicalHref,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
  };
}

export default async function PregunteroParcialPage({ params }: PageProps) {
  const resolvedParams = await params;
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
    redirect(canonicalHref);
  }

  const { label } = parcialToPreguntaFilter(data.parcial);
  const simuladorHref = `/simulador/${data.materiaId}/${data.parcialNumero}`;
  const materiaHref = `/explorar/materia/${data.materiaId}`;

  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Pregunteros', path: '/pregunteros' },
          { name: `Preguntero de ${data.materiaNombre}`, path: `/pregunteros/${expectedMateriaSlug}` },
          { name: buildParcialTitle(data.materiaNombre, data.parcial), path: canonicalHref },
        ])}
      />

      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <ListChecks className="h-4 w-4" />
            Preguntero · {label}
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.06em] text-foreground sm:text-5xl">
            {buildParcialTitle(data.materiaNombre, data.parcial)}
            {data.universidadNombre ? (
              <span className="block text-2xl font-semibold text-muted-foreground sm:text-3xl">
                ({data.universidadNombre})
              </span>
            ) : null}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
            {buildParcialDescription({
              materiaNombre: data.materiaNombre,
              parcial: data.parcial,
              carreraNombre: data.carreraNombre,
              universidadNombre: data.universidadNombre,
              totalPreguntas: data.totalPreguntas,
            })}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {data.totalPreguntas > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                <HelpCircle className="h-5 w-5 text-brand" />
                <span className="text-sm font-semibold text-foreground">
                  {data.totalPreguntas.toLocaleString('es-AR')} preguntas del {label.toLowerCase()}
                </span>
              </div>
            ) : null}

            <Link
              href={simuladorHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px]"
            >
              <Sparkles className="h-5 w-5" />
              Iniciar pregunteo {label.toLowerCase()}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-foreground">
              Preguntas de muestra del {label.toLowerCase()}
            </h2>
            {data.samplePreguntas.length === 0 ? (
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                Todavía estamos cargando el banco de preguntas de este parcial. Entrá al simulador para ver las preguntas disponibles.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {data.samplePreguntas.map((question) => (
                  <li key={question.id} className="rounded-2xl border border-border bg-card px-4 py-4">
                    <p className="text-sm leading-6 text-foreground">{question.enunciado}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
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
            <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-[-0.04em] text-foreground">
                Simulá el {label.toLowerCase()}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Respondé las preguntas con tiempo límite, corregí al instante y recibí explicaciones paso a paso de la IA en cada error.
              </p>
              <Link
                href={simuladorHref}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px]"
              >
                <Target className="h-5 w-5" />
                Iniciar pregunteo {label.toLowerCase()}
              </Link>
            </div>

            <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-[-0.04em] text-foreground">
                Ver la materia completa
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Accedé a los resúmenes por módulo, otros parciales y el material completo de la materia.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={materiaHref}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
                >
                  <BookOpen className="h-5 w-5" />
                  Entrar a {data.materiaNombre}
                </Link>
                <Link
                  href={`/resumenes/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
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

