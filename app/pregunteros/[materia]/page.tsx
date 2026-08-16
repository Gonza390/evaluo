import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, HelpCircle, ListChecks, Sparkles, Target } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { JsonLd } from '@/components/seo/JsonLd';
import { createPublicClient } from '@/lib/supabase-public';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import {
  buildSeoEntitySlug,
  parseSeoEntitySlug,
} from '@/lib/seo-intents';
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
        client
          .from('preguntas_banco_public')
          .select('parcial')
          .eq('materia_id', materiaId),
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
        preguntasPorParcial: Array.from(parcialCounts.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([parcial, count]) => ({ parcial, count })),
        samplePreguntas: ((sampleRows.data ?? []) as Array<{
          id: string;
          enunciado: string;
          opciones: unknown;
          parcial: number | null;
        }>).map((row) => ({
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
      : `Practicá con preguntas reales de ${data.materiaNombre}`;

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

  return {
    title: `Preguntero de ${data.materiaNombre}`,
    description,
    alternates: { canonical: canonicalHref },
    openGraph: {
      title: `Preguntero de ${data.materiaNombre} | Evaluo`,
      description,
      url: canonicalHref,
    },
  };
}

export default async function PregunteroIntentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const materiaId = parseSeoEntitySlug(resolvedParams.materia).id;
  const data = await loadPregunteroData(materiaId);

  if (!data) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <p className="text-center text-sm text-muted-foreground">Este preguntero no existe.</p>
      </main>
    );
  }

  const canonicalHref = buildPregunteroHref(data.materiaNombre, data.materiaId);
  if (resolvedParams.materia !== buildSeoEntitySlug(data.materiaNombre, data.materiaId)) {
    redirect(canonicalHref);
  }

  const materiaHref = data.materiaId
    ? `/explorar/materia/${data.materiaId}`
    : '/explorar';

  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: `Preguntero de ${data.materiaNombre}`, path: canonicalHref },
        ])}
      />

      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <ListChecks className="h-4 w-4" />
            Preguntero
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.06em] text-foreground sm:text-5xl">
            Preguntero de {data.materiaNombre}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
            {buildPregunteroDescription(data)}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {data.totalPreguntas > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                <HelpCircle className="h-5 w-5 text-brand" />
                <span className="text-sm font-semibold text-foreground">
                  {data.totalPreguntas.toLocaleString('es-AR')} preguntas
                </span>
              </div>
            ) : null}
            {data.preguntasPorParcial.map((item) => (
              <Link
                key={item.parcial}
                href={`/pregunteros/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}/parcial/${item.parcial}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 transition hover:border-brand hover:text-brand"
              >
                <Target className="h-5 w-5 text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  Parcial {item.parcial}: {item.count.toLocaleString('es-AR')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-foreground">
              Preguntas de muestra
            </h2>
            {data.samplePreguntas.length === 0 ? (
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                Todavía estamos cargando el banco de preguntas de esta materia. Entrá al espacio de la materia para ver el simulador.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {data.samplePreguntas.map((question) => (
                  <li key={question.id} className="rounded-2xl border border-border bg-card px-4 py-4">
                    <p className="text-sm leading-6 text-foreground">{question.enunciado}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      Parcial {question.parcial} · {question.opcionesCount} opciones
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-[-0.04em] text-foreground">
                Simulá el parcial
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Respondé las preguntas con tiempo límite, corregí al instante y recibí explicaciones paso a paso de la IA en cada error.
              </p>
              <Link
                href={materiaHref}
                className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px]"
              >
                <Sparkles className="h-5 w-5" />
                Entrar a la materia
              </Link>
            </div>

            <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-[-0.04em] text-foreground">
                Estudiá con resúmenes
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Complementá la práctica con resúmenes ordenados por módulo, directamente del programa de la materia.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-brand" />
                <Link
                  href={`/resumenes/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}`}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Ver resúmenes de {data.materiaNombre}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
