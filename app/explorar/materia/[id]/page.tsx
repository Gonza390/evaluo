import Link from 'next/link';
import { createClientServer } from '@/lib/supabase-server';
import MateriaContent from './materia-content';
import type { Metadata } from 'next';
import {
  buildSeoEntitySlug,
  getSiglo21PregunteroMateria,
} from '@/lib/seo-siglo21';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ carreraId?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClientServer();

  try {
    const { data: materia } = await supabase
      .from('materias')
      .select('id, nombre')
      .eq('id', resolvedParams.id)
      .maybeSingle();

    if (!materia) {
      return {
        title: 'Materia',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const siglo21 = await getSiglo21PregunteroMateria(materia.id).catch(() => null);
    const title = siglo21
      ? `${materia.nombre} - Universidad Siglo 21`
      : `${materia.nombre} | Materia`;
    const description = siglo21 && siglo21.totalPreguntas > 0
      ? `Estudiá ${materia.nombre} de Universidad Siglo 21 con materiales, simuladores y ${siglo21.totalPreguntas.toLocaleString('es-AR')} preguntas disponibles en Evaluo.`
      : `Estudia ${materia.nombre} con resúmenes, preguntas y simuladores en Evaluo.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/explorar/materia/${materia.id}`,
      },
      openGraph: {
        title: `${title} | Evaluo`,
        description,
        url: `https://evaluo.com.ar/explorar/materia/${materia.id}`,
      },
    };
  } catch {
    return {
      title: 'Materia',
    };
  }
}

export default async function MateriaPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as { carreraId?: string }),
  ]);
  const materiaId = resolvedParams.id;
  const requestedCarreraId = resolvedSearchParams.carreraId?.trim() ?? '';
  const supabase = await createClientServer();

  let materiaNombre = '';
  let carreraId = '';
  let carreraNombre = '';
  let universidadId = '';
  let universidadNombre = '';

  try {
    const { data: materia, error: materiaError } = await supabase
      .from('materias')
      .select('id, nombre, carrera_id')
      .eq('id', materiaId)
      .single();

    if (materiaError) {
      console.error('Error fetching materia:', materiaError);
    } else if (materia) {
      materiaNombre = materia.nombre;
      let resolvedCarreraId = requestedCarreraId || materia.carrera_id || '';

      if (!requestedCarreraId && !resolvedCarreraId) {
        const { data: carreraMateria, error: carreraMateriaError } = await supabase
          .from('carrera_materias')
          .select('carrera_id, prioridad')
          .eq('materia_id', materiaId)
          .order('prioridad', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (carreraMateriaError) {
          console.error('Error fetching carrera_materias:', carreraMateriaError);
        } else if (carreraMateria?.carrera_id) {
          resolvedCarreraId = carreraMateria.carrera_id;
        }
      }

      if (resolvedCarreraId) {
        carreraId = resolvedCarreraId;

        const { data: carrera, error: carreraError } = await supabase
          .from('carreras')
          .select('id, nombre, universidad_id')
          .eq('id', resolvedCarreraId)
          .maybeSingle();

        if (carreraError) {
          console.error('Error fetching carrera:', carreraError);
        } else if (carrera) {
          carreraNombre = carrera.nombre;

          if (carrera.universidad_id) {
            universidadId = carrera.universidad_id;

            const { data: universidad, error: uniError } = await supabase
              .from('universidades')
              .select('id, nombre')
              .eq('id', carrera.universidad_id)
              .maybeSingle();

            if (uniError) {
              console.error('Error fetching universidad:', uniError);
            } else if (universidad) {
              universidadNombre = universidad.nombre;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading materia data:', error);
  }

  const siglo21Preguntero = await getSiglo21PregunteroMateria(materiaId).catch(() => null);

  return (
    <>
      {siglo21Preguntero && siglo21Preguntero.totalPreguntas > 0 ? (
        <div className="mx-auto mb-4 w-full max-w-7xl rounded-2xl border border-[#C7D2FE] bg-white px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4F5DFF]">
                Universidad Siglo 21 · Preguntero disponible
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0F1B3D]">
                {siglo21Preguntero.totalPreguntas.toLocaleString('es-AR')} preguntas para practicar {siglo21Preguntero.materiaNombre}
              </p>
            </div>
            <Link
              href={`/pregunteros/${buildSeoEntitySlug(siglo21Preguntero.materiaNombre, siglo21Preguntero.materiaId)}`}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(37,99,235,0.18)]"
            >
              Ver preguntero
            </Link>
          </div>
        </div>
      ) : null}

      <MateriaContent
        materiaId={materiaId}
        materiaNombre={materiaNombre}
        carreraId={carreraId}
        carreraNombre={carreraNombre}
        universidadId={universidadId}
        universidadNombre={universidadNombre}
      />
    </>
  );
}
