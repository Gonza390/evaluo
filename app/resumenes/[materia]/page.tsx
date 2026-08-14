import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, FileText, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import {
  buildSeoEntitySlug,
  buildSummaryLandingDescription,
  parseSeoEntitySlug,
} from '@/lib/seo-intents';

export const revalidate = 600;

type PageProps = {
  params: Promise<{
    materia: string;
  }>;
};

function buildResumenesHref(materiaNombre: string, materiaId: string) {
  return `/resumenes/${buildSeoEntitySlug(materiaNombre, materiaId)}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const materiaId = parseSeoEntitySlug(resolvedParams.materia).id;
  const bootstrap = await getMateriaBootstrap({ materiaId });

  return {
    title: `Resúmenes de ${bootstrap.materiaNombre}`,
    description: buildSummaryLandingDescription({
      materiaNombre: bootstrap.materiaNombre,
      carreraNombre: bootstrap.carreraNombre,
      universidadNombre: bootstrap.universidadNombre,
    }),
    alternates: {
      canonical: buildResumenesHref(bootstrap.materiaNombre, bootstrap.materiaId),
    },
    openGraph: {
      title: `Resúmenes de ${bootstrap.materiaNombre} | Evaluo`,
      description: buildSummaryLandingDescription({
        materiaNombre: bootstrap.materiaNombre,
        carreraNombre: bootstrap.carreraNombre,
        universidadNombre: bootstrap.universidadNombre,
      }),
      url: buildResumenesHref(bootstrap.materiaNombre, bootstrap.materiaId),
    },
  };
}

export default async function SummaryIntentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const materiaId = parseSeoEntitySlug(resolvedParams.materia).id;
  const bootstrap = await getMateriaBootstrap({ materiaId });

  const canonicalHref = buildResumenesHref(bootstrap.materiaNombre, bootstrap.materiaId);
  if (resolvedParams.materia !== buildSeoEntitySlug(bootstrap.materiaNombre, bootstrap.materiaId)) {
    redirect(canonicalHref);
  }

  const materiaHref = bootstrap.carreraId
    ? `/explorar/materia/${bootstrap.materiaId}?carreraId=${encodeURIComponent(bootstrap.carreraId)}`
    : `/explorar/materia/${bootstrap.materiaId}`;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: `Resúmenes de ${bootstrap.materiaNombre}`, path: canonicalHref },
        ])}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
            <FileText className="h-4 w-4" />
            Resúmenes
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Resúmenes de {bootstrap.materiaNombre}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            {buildSummaryLandingDescription({
              materiaNombre: bootstrap.materiaNombre,
              carreraNombre: bootstrap.carreraNombre,
              universidadNombre: bootstrap.universidadNombre,
            })}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
              Material disponible para estudiar
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <BookOpen className="h-5 w-5 text-[#2563EB]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  {bootstrap.initialResumenes.length} resúmenes iniciales
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Primer material cargado para ayudarte a empezar más rápido.
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <Sparkles className="h-5 w-5 text-[#2563EB]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Vista por materia</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Entra al espacio completo de la materia para combinar resúmenes, recursos y práctica.
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <FileText className="h-5 w-5 text-[#2563EB]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Contexto académico</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {bootstrap.carreraNombre && bootstrap.universidadNombre
                    ? `${bootstrap.carreraNombre} · ${bootstrap.universidadNombre}`
                    : 'Catálogo ordenado para estudiar mejor.'}
                </p>
              </article>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={materiaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
              >
                Ver materia completa
              </Link>
              {bootstrap.carreraId ? (
                <Link
                  href={`/materias?carreraId=${encodeURIComponent(bootstrap.carreraId)}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  Ver más materias relacionadas
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">Resúmenes destacados</h2>
            <div className="mt-5 space-y-3">
              {bootstrap.initialResumenes.slice(0, 6).map((resumen) => (
                <article key={resumen.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{resumen.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {resumen.author_name || 'Resumen disponible para esta materia'}
                  </p>
                </article>
              ))}
              {bootstrap.initialResumenes.length === 0 ? (
                <p className="text-sm leading-7 text-slate-600">
                  Todavía no hay resúmenes iniciales visibles en esta landing, pero puedes entrar a la
                  materia para revisar recursos y actualizaciones.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
