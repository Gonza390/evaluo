import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookOpen, HelpCircle, ListChecks, Sparkles, Target } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { JsonLd } from '@/components/seo/JsonLd';
import { createPublicClient } from '@/lib/supabase-public';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';

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
  samplePreguntas: Array<{
    id: string;
    enunciado: string;
    parcial: number;
    opcionesCount: number;
  }>;
}

const loadPregunteroData = unstable_cache(
  async (materiaId: string): Promise<PregunteroData | null> => {
    const client = createPublicClient();
    const bootstrap = await getMateriaBootstrap({ materiaId });

    if (bootstrap.materiaFound === false) {
      return null;
    }

    try {
      const [{ count: totalPreguntas }, parcialRows, sampleRows] = await Promise.all([
        client
          .from('preguntas_banco_public')
          .select('id', { count: 'exact', head: true })
          .eq('materia_id', materiaId),
        client.from('preguntas_banco_public').select('parcial').eq('materia_id', materiaId),
        client
          .from('preguntas_banco_public')
          .select('id, enunciado, opciones, parcial')
          .eq('materia_id', materiaId)
          .order('creado_at', { ascending: false })
          .limit(6),
      ]);

      const parcialCounts = new Map<number, number>();
      for (const row of (parcialRows.data ?? []) as Array<{ parcial: number | null }>) {
        const parcial = row.parcial ?? 1;
        parcialCounts.set(parcial, (parcialCounts.get(parcial) ?? 0) + 1);
      }

      return {
        materiaNombre: bootstrap.materiaNombre,
        materiaId: bootstrap.materiaId,
        carreraNombre: bootstrap.carreraNombre,
        universidadNombre: bootstrap.universidadNombre,
        totalPreguntas: totalPreguntas ?? 0,
        resumenesCount: bootstrap.initialResumenes.length,
        preguntasPorParcial: Array.from(parcialCounts.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([parcial, count]) => ({ parcial, count })),
        samplePreguntas: (
          (sampleRows.data ?? []) as Array<{
            id: string;
            enunciado: string;
            opciones: unknown;
            parcial: number | null;
          }>
        ).map((row) => ({
          id: row.id,
          enunciado: row.enunciado,
          parcial: row.parcial ?? 1,
          opcionesCount: Array.isArray(row.opciones) ? row.opciones.length : 0,
        })),
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
        samplePreguntas: [],
      };
    }
  },
  ['preguntero-data'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

function buildPregunteroDescription(data: PregunteroData) {
  const context = [data.carreraNombre, data.universidadNombre].filter(Boolean).join(' en ');
  const base =
    data.totalPreguntas > 0
      ? `Practicá con ${data.totalPreguntas} preguntas de ${data.materiaNombre}`
      : `Practicá con preguntas disponibles de ${data.materiaNombre}`;

  return context
    ? `${base} para ${context}, con simulador de parcial y feedback en Evaluo.`
    : `${base}, con simulador de parcial y feedback en Evaluo.`;
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
  const socialTitle = `Preguntero de ${data.materiaNombre} | Evaluo`;

  return {
    title: `Preguntero de ${data.materiaNombre}`,
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
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: ['/opengraph-image.png'],
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

  const materiaHref = data.materiaId ? `/explorar/materia/${data.materiaId}` : '/explorar';

  return (
    <main className="bg-background min-h-screen">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: `Preguntero de ${data.materiaNombre}`, path: canonicalHref },
        ])}
      />

      <section className="border-border bg-card border-b">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="bg-brand/10 text-brand inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
            <ListChecks className="h-4 w-4" />
            Preguntero
          </p>
          <h1 className="text-foreground mt-5 text-4xl font-bold tracking-[-0.06em] sm:text-5xl">
            Preguntero de {data.materiaNombre}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-3xl text-base leading-8">
            {buildPregunteroDescription(data)}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {data.totalPreguntas > 0 ? (
              <div className="border-border bg-card inline-flex items-center gap-2 rounded-2xl border px-4 py-3">
                <HelpCircle className="text-brand h-5 w-5" />
                <span className="text-foreground text-sm font-semibold">
                  {data.totalPreguntas.toLocaleString('es-AR')} preguntas
                </span>
              </div>
            ) : null}
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
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-border bg-card rounded-[28px] border p-6 shadow-sm">
            <h2 className="text-foreground text-2xl font-bold tracking-[-0.04em]">
              Preguntas de muestra
            </h2>
            {data.samplePreguntas.length === 0 ? (
              <p className="text-muted-foreground mt-5 text-sm leading-7">
                Todavía estamos cargando el banco de preguntas de esta materia. Entrá al espacio de
                la materia para ver el simulador.
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
                Simulá el parcial
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-7">
                Respondé las preguntas con tiempo límite, corregí al instante y recibí explicaciones
                paso a paso de la IA en cada error.
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
      </section>
    </main>
  );
}
