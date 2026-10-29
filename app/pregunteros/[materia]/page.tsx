import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookOpen, Sparkles, Target } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { buildPregunteroSearchTitle } from '@/lib/seo-search-copy';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { PregunteroPracticeHero } from '@/components/marketing/preguntero-practice-hero';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { getPregunteroParcialData, getPregunteroMateriaStats } from '@/lib/data/preguntero';
import { buildShareCardPath } from '@/lib/share-card';

export const revalidate = 600;

type PageProps = {
  params: Promise<{
    materia: string;
  }>;
};

function buildPregunteroHref(materiaNombre: string, materiaId: string) {
  return `/pregunteros/${buildSeoEntitySlug(materiaNombre, materiaId)}`;
}

interface PregunteroData {
  materiaNombre: string;
  materiaId: string;
  carreraNombre?: string;
  universidadNombre?: string;
  totalPreguntas: number;
  resumenesCount: number;
  preguntasPorParcial: Array<{ parcial: number; count: number }>;
}

const loadPregunteroData = unstable_cache(
  async (materiaId: string): Promise<PregunteroData | null> => {
    const bootstrap = await getMateriaBootstrap({ materiaId });

    if (bootstrap.materiaFound === false) {
      return null;
    }

    try {
      // Reusar las muestras que ya trae la página del parcial (caché de 10 min).
      const stats = await getPregunteroMateriaStats(materiaId);

      return {
        materiaNombre: bootstrap.materiaNombre,
        materiaId: bootstrap.materiaId,
        carreraNombre: bootstrap.carreraNombre,
        universidadNombre: bootstrap.universidadNombre,
        totalPreguntas: stats.totalPreguntas,
        resumenesCount: bootstrap.initialResumenes.length,
        preguntasPorParcial: stats.preguntasPorParcial,
      };
    } catch {
      return {
        materiaNombre: bootstrap.materiaNombre,
        materiaId: bootstrap.materiaId,
        carreraNombre: bootstrap.carreraNombre,
        universidadNombre: bootstrap.universidadNombre,
        totalPreguntas: 0,
        resumenesCount: bootstrap.initialResumenes.length,
        preguntasPorParcial: [],
      };
    }
  },
  ['preguntero-data-v2'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

function buildPregunteroDescription(data: PregunteroData) {
  const context = [data.carreraNombre, data.universidadNombre].filter(Boolean).join(' en ');
  const base =
    data.totalPreguntas > 0
      ? `Practicá con ${data.totalPreguntas.toLocaleString('es-AR')} preguntas de ${data.materiaNombre}`
      : `Practicá con preguntas disponibles de ${data.materiaNombre}`;

  return context
    ? `${base} para ${context}, con parciales y práctica en Evaluo.`
    : `${base}, con parciales y práctica en Evaluo.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const materiaId = parseSeoEntitySlug(resolvedParams.materia).id;
  const data = await loadPregunteroData(materiaId);

  if (!data) {
    return {
      title: 'Preguntero',
      robots: { index: false, follow: false },
    };
  }

  const canonicalHref = buildPregunteroHref(data.materiaNombre, data.materiaId);
  const description = buildPregunteroDescription(data);
  const seoTitle = buildPregunteroSearchTitle(data.materiaNombre, data.universidadNombre);
  const socialTitle = `${seoTitle} | Evaluo`;
  const socialImage = buildShareCardPath({
    kind: 'preguntero',
    title: `Preguntero de ${data.materiaNombre}`,
    subtitle:
      [data.carreraNombre, data.universidadNombre].filter(Boolean).join(' · ') ||
      'Práctica universitaria',
    detail:
      data.totalPreguntas > 0
        ? `${data.totalPreguntas.toLocaleString('es-AR')} preguntas disponibles para practicar`
        : 'Preguntas y práctica para preparar parciales',
  });

  return {
    title: seoTitle,
    description,
    alternates: { canonical: canonicalHref },
    robots: {
      index: data.totalPreguntas > 0,
      follow: true,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalHref,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: `Preguntero de ${data.materiaNombre} en Evaluo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [socialImage],
    },
  };
}

export default async function PregunteroIntentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const materiaId = parseSeoEntitySlug(resolvedParams.materia).id;
  const data = await loadPregunteroData(materiaId);

  if (!data) {
    notFound();
  }

  const canonicalHref = buildPregunteroHref(data.materiaNombre, data.materiaId);
  if (resolvedParams.materia !== buildSeoEntitySlug(data.materiaNombre, data.materiaId)) {
    redirect(canonicalHref);
  }

  const materiaHref = `/explorar/materia/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}`;
  const firstParcial = data.preguntasPorParcial.find(
    (item) => item.parcial === 1 || item.parcial === 2
  );
  const practiceData = firstParcial
    ? await getPregunteroParcialData(data.materiaId, firstParcial.parcial === 1 ? '1' : '2')
    : null;
  const simuladorHref = practiceData
    ? `/simulador/${data.materiaId}/${practiceData.parcialNumero}?acq=preguntero_landing_v1`
    : materiaHref;

  return (
    <main className="bg-background min-h-screen">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Pregunteros', path: '/pregunteros' },
          { name: `Preguntero de ${data.materiaNombre}`, path: canonicalHref },
        ])}
      />

      <PregunteroPracticeHero
        title={`Preguntero de ${data.materiaNombre}`}
        materiaNombre={data.materiaNombre}
        universidadNombre={data.universidadNombre}
        totalPreguntas={data.totalPreguntas}
        pregunteroHref="/pregunteros"
        backLabel="Todos los pregunteros"
        simuladorHref={simuladorHref}
        label={practiceData ? `Parcial ${practiceData.parcial}` : 'Materia'}
        parcial={practiceData?.parcial}
        description={buildPregunteroDescription(data)}
        countLabel="preguntas de la materia"
        previewQuestion={practiceData?.previewQuestion}
      >
        {practiceData ? (
          <p className="text-muted-foreground mt-3 text-sm">
            Empezá por el Parcial {practiceData.parcial} o elegí otro parcial:
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3">
          {data.preguntasPorParcial.map((item) => (
            <Link
              key={item.parcial}
              href={`/pregunteros/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}/parcial/${item.parcial}`}
              className="border-border bg-card hover:border-brand hover:text-brand inline-flex items-center gap-2 rounded-2xl border px-4 py-3 transition"
            >
              <Target className="text-accent h-5 w-5" />
              <span className="text-foreground text-sm font-semibold">
                Parcial {item.parcial}: {item.count.toLocaleString('es-AR')}
              </span>
            </Link>
          ))}
        </div>
      </PregunteroPracticeHero>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-border bg-card rounded-[28px] border p-6 shadow-sm">
            <h2 className="text-foreground text-2xl font-bold tracking-[-0.04em]">
              Preguntas de muestra
            </h2>
            {(practiceData?.samplePreguntas.length ?? 0) === 0 ? (
              <p className="text-muted-foreground mt-5 text-sm leading-7">
                Todavía estamos cargando el banco de preguntas de esta materia. Entrá al espacio de
                la materia para ver el Preguntero.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {(practiceData?.samplePreguntas ?? []).map((question) => (
                  <li
                    key={question.id}
                    className="border-border bg-card rounded-2xl border px-4 py-4"
                  >
                    <p className="text-foreground text-sm leading-6">{question.enunciado}</p>
                    <p className="text-muted-foreground mt-2 text-xs font-semibold">
                      Parcial {question.parcial} · {question.opcionesCount} opciones
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <div className="border-border bg-card rounded-[28px] border p-6 shadow-sm">
              <h2 className="text-foreground text-xl font-bold tracking-[-0.04em]">
                Practicá el parcial
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-7">
                Elegí el parcial arriba y pasá de las preguntas de muestra al Preguntero completo.
              </p>
              <Link
                href={materiaHref}
                className="from-brand to-brand-2 mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px]"
              >
                <Sparkles className="h-5 w-5" />
                Entrar a la materia
              </Link>
            </div>

            {data.resumenesCount > 0 ? (
              <div className="border-border bg-card rounded-[28px] border p-6 shadow-sm">
                <h2 className="text-foreground text-xl font-bold tracking-[-0.04em]">
                  Estudiá con resúmenes
                </h2>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  Complementá la práctica con resúmenes disponibles para esta materia.
                </p>
                <div className="mt-5 flex items-center gap-2">
                  <BookOpen className="text-brand h-5 w-5" />
                  <Link
                    href={`/resumenes/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}`}
                    className="text-brand text-sm font-semibold hover:underline"
                  >
                    Ver resúmenes de {data.materiaNombre}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-8 rounded-[24px] border border-blue-100 bg-blue-50/50 px-6 py-6 sm:px-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            ¿Querés practicar con los apuntes de tu materia?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            El preguntero te ayuda a comprobar qué recordás. Con tu PDF podés estudiar los temas de tu material, crear flashcards y practicar ejercicios antes de rendir.
          </p>
          <TrackedLink
            href="/estudiar-pdf-con-ia?source=preguntero-materia"
            eventName="cta_click"
            payload={{
              location: 'preguntero_materia_after_questions',
              cta_name: 'estudiar_pdf_propio',
              source: 'preguntero-materia',
              materia_id: data.materiaId,
              destination: '/estudiar-pdf-con-ia',
            }}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Estudiar con mi PDF
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
