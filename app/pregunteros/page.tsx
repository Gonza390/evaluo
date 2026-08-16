import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { BookOpen, ChevronRight, GraduationCap, ListChecks, Target } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { createPublicClient } from '@/lib/supabase-public';
import { fetchExplorarCatalogData } from '@/lib/data/catalog';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { buildBreadcrumbJsonLd } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Pregunteros universitarios por materia y universidad | Evaluo',
  description:
    'Practicá con pregunteros de parcial, primer y segundo parcial, y examen integrador de las materias de tu universidad: UBA, UTN, UNC, UNLP, Siglo 21 y más. Con simulador y feedback en Evaluo.',
  alternates: {
    canonical: '/pregunteros',
  },
  openGraph: {
    title: 'Pregunteros universitarios por materia | Evaluo',
    description:
      'Pregunteros de parcial, primer y segundo parcial e integrador por universidad y carrera. Practicá con simulador y feedback.',
    url: '/pregunteros',
  },
};

interface PregunteroHubMateria {
  materiaId: string;
  materiaNombre: string;
}

interface PregunteroHubCarrera {
  carreraId: string;
  carreraNombre: string;
  universidadNombre: string;
  materias: PregunteroHubMateria[];
}

const loadPregunteroHubData = unstable_cache(
  async (): Promise<PregunteroHubCarrera[]> => {
    const client = createPublicClient();
    const { carreras } = await fetchExplorarCatalogData(client);

    const materiasByCarrera = new Map<string, PregunteroHubMateria[]>();

    const allCarreras = carreras.filter((carrera) => carrera.materiasCount > 0);

    for (const carrera of allCarreras) {
      const { data } = await client
        .from('materias')
        .select('id, nombre, carrera_id')
        .eq('carrera_id', carrera.id)
        .order('nombre');

      const materias = ((data ?? []) as Array<{ id: string; nombre: string }>)
        .filter((materia) => materia.id && materia.nombre)
        .map((materia) => ({ materiaId: materia.id, materiaNombre: materia.nombre }));

      if (materias.length > 0) {
        materiasByCarrera.set(carrera.id, materias);
      }
    }

    return allCarreras
      .filter((carrera) => materiasByCarrera.has(carrera.id))
      .map((carrera) => ({
        carreraId: carrera.id,
        carreraNombre: carrera.nombre,
        universidadNombre: carrera.universidadNombre,
        materias: materiasByCarrera.get(carrera.id) ?? [],
      }))
      .sort((a, b) => a.universidadNombre.localeCompare(b.universidadNombre));
  },
  ['preguntero-hub'],
  { revalidate: 600, tags: ['universidad-data'] }
);

export default async function PregunteroHubPage() {
  const carreras = await loadPregunteroHubData();

  const groupedByUniversity = new Map<string, PregunteroHubCarrera[]>();
  for (const carrera of carreras) {
    const current = groupedByUniversity.get(carrera.universidadNombre) ?? [];
    current.push(carrera);
    groupedByUniversity.set(carrera.universidadNombre, current);
  }

  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Pregunteros', path: '/pregunteros' },
        ])}
      />

      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <ListChecks className="h-4 w-4" />
            Pregunteros
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.06em] text-foreground sm:text-5xl">
            Pregunteros universitarios por materia
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
            Elegí tu universidad y carrera y entrá al preguntero de cada materia: primer parcial, segundo parcial o examen integrador, con simulador y feedback de la IA.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {carreras.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Todavía estamos cargando los pregunteros por materia. Probá de nuevo en unos días.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(groupedByUniversity.entries()).map(([universidadNombre, carrerasDeUni]) => (
              <div key={universidadNombre}>
                <div className="mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-brand" />
                  <h2 className="text-xl font-bold tracking-[-0.04em] text-foreground">
                    {universidadNombre}
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {carrerasDeUni.map((carrera) => (
                    <div key={carrera.carreraId} className="rounded-[22px] border border-border bg-card p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-foreground">{carrera.carreraNombre}</h3>
                      <ul className="mt-3 space-y-1.5">
                        {carrera.materias.map((materia) => (
                          <li key={materia.materiaId}>
                            <Link
                              href={`/pregunteros/${buildSeoEntitySlug(materia.materiaNombre, materia.materiaId)}`}
                              className="group flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-brand/5 hover:text-brand"
                            >
                              <span className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand" />
                                <span className="truncate">{materia.materiaNombre}</span>
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-[28px] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Target className="mt-1 h-5 w-5 shrink-0 text-brand" />
            <div>
              <h2 className="text-base font-bold text-foreground">¿Qué es un preguntero?</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Un preguntero es un banco de preguntas de parcial y de examen de una materia, organizadas por parcial (1, 2 e integrador). En Evaluo practicás esas preguntas con simulador cronometrado y recibís la corrección al instante, con explicación paso a paso de la IA en cada error.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
