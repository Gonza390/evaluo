import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { ListChecks, Target } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { JsonLd } from '@/components/seo/JsonLd';
import { createPublicClient } from '@/lib/supabase-public';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { isSiglo21University } from '@/lib/seo-search-copy';
import { PregunteroHubClient, type PregunteroHubCarrera } from './preguntero-hub-client';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Pregunteros Siglo 21: materias y parciales',
  description:
    'Encontrá pregunteros Siglo 21 por materia y parcial. Practicá primer parcial, segundo parcial e integrador con preguntas disponibles en Evaluo.',
  keywords: [
    'pregunteros Siglo 21',
    'preguntero Siglo 21',
    'pregunteros Universidad Siglo 21',
    'preguntas parcial Siglo 21',
    'primer parcial Siglo 21',
    'segundo parcial Siglo 21',
  ],
  alternates: {
    canonical: '/pregunteros',
  },
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

const loadPregunteroHubData = unstable_cache(
  async (): Promise<PregunteroHubCarrera[]> => {
    const client = createPublicClient();
    const [universidadesResult, carrerasResult] = await Promise.all([
      client.from('universidades').select('id, nombre').order('nombre'),
      // Consultar existencia por materia evita inferir el catálogo desde las primeras
      // 1.000 preguntas/relaciones que permite devolver la API de Supabase.
      client
        .from('carreras')
        .select(
          'id, nombre, universidad_id, carrera_materias!inner(materias!inner(id, nombre, preguntas_banco_public!inner(id)))'
        )
        .limit(1, { referencedTable: 'carrera_materias.materias.preguntas_banco_public' })
        .order('nombre'),
    ]);

    for (const result of [universidadesResult, carrerasResult]) {
      if (result.error) throw result.error;
    }

    const universidadById = new Map(
      (universidadesResult.data ?? []).map((universidad) => [
        universidad.id,
        universidad.nombre.trim(),
      ])
    );
    return (carrerasResult.data ?? [])
      .flatMap((carrera) => {
        const universidadNombre = carrera.universidad_id
          ? universidadById.get(carrera.universidad_id)
          : null;
        if (!universidadNombre) return [];

        const materias = Array.from(
          new Map(
            carrera.carrera_materias.flatMap(({ materias: materia }) =>
              materia
                ? [
                    [
                      materia.id,
                      { materiaId: materia.id, materiaNombre: materia.nombre.trim() },
                    ] as const,
                  ]
                : []
            )
          ).values()
        ).sort((a, b) => a.materiaNombre.localeCompare(b.materiaNombre, 'es'));

        if (materias.length === 0) return [];
        return [
          {
            carreraId: carrera.id,
            carreraNombre: carrera.nombre.trim(),
            universidadNombre,
            materias,
          },
        ];
      })
      .sort((a, b) => {
        const aSiglo21 = isSiglo21University(a.universidadNombre) ? 0 : 1;
        const bSiglo21 = isSiglo21University(b.universidadNombre) ? 0 : 1;
        if (aSiglo21 !== bSiglo21) return aSiglo21 - bSiglo21;
        const byUniversity = a.universidadNombre.localeCompare(b.universidadNombre, 'es');
        return byUniversity || a.carreraNombre.localeCompare(b.carreraNombre, 'es');
      });
  },
  ['preguntero-hub-v6'],
  { revalidate: 600, tags: ['universidad-data'] }
);

export default async function PregunteroHubPage() {
  const carreras = await loadPregunteroHubData();
  const siglo21Materias = Array.from(
    new Map(
      carreras
        .filter((carrera) => isSiglo21University(carrera.universidadNombre))
        .flatMap((carrera) => carrera.materias)
        .map((materia) => [materia.materiaId, materia] as const)
    ).values()
  ).slice(0, 12);

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
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-indigo-700 uppercase">
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
                  className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  {materia.materiaNombre}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {carreras.length === 0 ? (
          <div className="border-y border-dashed border-slate-300 py-12 text-center">
            <p className="text-sm text-slate-600">
              Todavía estamos cargando los pregunteros por materia. Probá de nuevo en unos días.
            </p>
          </div>
        ) : (
          <PregunteroHubClient carreras={carreras} />
        )}

        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex items-start gap-3">
            <Target className="mt-1 h-5 w-5 shrink-0 text-indigo-700" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-slate-950">¿Qué es un preguntero?</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Es un banco de preguntas de práctica asociado a una materia y a una instancia de parcial. En Evaluo podés responderlas en un simulador y revisar tus errores al terminar.
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>
      <FooterHome />
    </>
  );
}
