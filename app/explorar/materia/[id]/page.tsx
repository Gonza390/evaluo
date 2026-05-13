import { createClientServer } from '@/lib/supabase-server';
import MateriaContent from './materia-content';
import type { Metadata } from 'next';

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

    return {
      title: `${materia.nombre} | Materia`,
      description: `Estudia ${materia.nombre} con resúmenes, preguntas y simuladores en Evaluo.`,
      alternates: {
        canonical: `/explorar/materia/${materia.id}`,
      },
      openGraph: {
        title: `${materia.nombre} | Evaluo`,
        description: `Accede a materiales, preguntas y simuladores para ${materia.nombre}.`,
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

  return (
    <MateriaContent
        materiaId={materiaId}
        materiaNombre={materiaNombre}
        carreraId={carreraId}
        carreraNombre={carreraNombre}
        universidadId={universidadId}
        universidadNombre={universidadNombre}
      />
  );
}
