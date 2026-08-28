import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { ListChecks, Target } from 'lucide-react';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { JsonLd } from '@/components/seo/JsonLd';
import { createPublicClient } from '@/lib/supabase-public';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import {
  PregunteroHubClient,
  type PregunteroHubCarrera,
} from './preguntero-hub-client';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Pregunteros Universidad Siglo 21 por materia',
  description:
    'Encontrá pregunteros de Universidad Siglo 21 organizados por carrera, materia y parcial. Solo mostramos materias que ya tienen preguntas disponibles para practicar en Evaluo.',
  keywords: [
    'pregunteros Siglo 21',
    'preguntero Universidad Siglo 21',
    'preguntas parcial Siglo 21',
    'primer parcial Siglo 21',
    'segundo parcial Siglo 21',
  ],
  alternates: {
    canonical: '/pregunteros',
  },
  openGraph: {
    title: 'Pregunteros Universidad Siglo 21 por materia | Evaluo',
    description:
      'Pregunteros por carrera, materia y parcial con preguntas disponibles para practicar en Evaluo.',
    url: '/pregunteros',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pregunteros Universidad Siglo 21 por materia | Evaluo',
    description:
      'Encontrá el preguntero de tu materia de Universidad Siglo 21 y practicá el parcial en Evaluo.',
    images: ['/opengraph-image.png'],
  },
};

const loadPregunteroHubData = unstable_cache(
  async (): Promise<PregunteroHubCarrera[]> => {
    const client = createPublicClient();
    const [universidadesResult, carrerasResult, relacionesResult, materiasResult, preguntasResult] =
      await Promise.all([
        client.from('universidades').select('id, nombre').order('nombre'),
        client.from('carreras').select('id, nombre, universidad_id').order('nombre'),
        client.from('carrera_materias').select('carrera_id, materia_id').limit(10000),
        client.from('materias').select('id, nombre').order('nombre').limit(10000),
        client.from('preguntas_banco_public').select('materia_id').limit(10000),
      ]);

    for (const result of [
      universidadesResult,
      carrerasResult,
      relacionesResult,
      materiasResult,
      preguntasResult,
    ]) {
      if (result.error) throw result.error;
    }

    const universidadById = new Map(
      (universidadesResult.data ?? []).map((universidad) => [
        universidad.id,
        universidad.nombre.trim(),
      ])
    );
    const materiaById = new Map(
      (materiasResult.data ?? []).map((materia) => [materia.id, materia.nombre.trim()])
    );
    const questionMateriaIds = new Set(
      (preguntasResult.data ?? [])
        .map((row) => row.materia_id)
        .filter((materiaId): materiaId is string => Boolean(materiaId))
    );
    const materiaIdsByCarrera = new Map<string, Set<string>>();

    for (const relation of relacionesResult.data ?? []) {
      if (!relation.carrera_id || !relation.materia_id || !questionMateriaIds.has(relation.materia_id)) {
        continue;
      }
      const current = materiaIdsByCarrera.get(relation.carrera_id) ?? new Set<string>();
      current.add(relation.materia_id);
      materiaIdsByCarrera.set(relation.carrera_id, current);
    }

    return (carrerasResult.data ?? [])
      .flatMap((carrera) => {
        const universidadNombre = carrera.universidad_id
          ? universidadById.get(carrera.universidad_id)
          : null;
        const materiaIds = materiaIdsByCarrera.get(carrera.id);
        if (!universidadNombre || !materiaIds || materiaIds.size === 0) return [];

        const materias = Array.from(materiaIds)
          .flatMap((materiaId) => {
            const materiaNombre = materiaById.get(materiaId);
            return materiaNombre ? [{ materiaId, materiaNombre }] : [];
          })
          .sort((a, b) => a.materiaNombre.localeCompare(b.materiaNombre, 'es'));

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
        const byUniversity = a.universidadNombre.localeCompare(b.universidadNombre, 'es');
        return byUniversity || a.carreraNombre.localeCompare(b.carreraNombre, 'es');
      });
  },
  ['preguntero-hub-v4'],
  { revalidate: 600, tags: ['universidad-data'] }
);

export default async function PregunteroHubPage() {
  const carreras = await loadPregunteroHubData();

  return (
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
            Pregunteros · Universidad Siglo 21
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.055em] text-slate-950 sm:text-5xl">
            Practicá el preguntero de tu materia.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Buscá tu carrera o materia de Universidad Siglo 21. Solo mostramos materias que ya tienen preguntas disponibles para practicar.
          </p>
        </div>
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
  );
}
