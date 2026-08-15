import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { fetchSharedStudentMaterialsByCarrera } from '@/lib/data/student-materials';
import { createPublicClient } from '@/lib/supabase-public';
import { getCarreraById, getMateriasByCarrera, getUniversidadById } from '@/services/api-server';
import type { Materia } from '@/services/api-server';
import MateriaList from '@/components/materia-list';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { StudyStatePanel } from '@/components/study-state-panel';

export const revalidate = 600;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ carreraId?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const carreraId = resolvedParams.carreraId?.trim();

  if (!carreraId) {
    return {
      title: 'Materias',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  try {
    const carreraData = await getCarreraById(carreraId);
    if (!carreraData) {
      return {
        title: 'Materias',
        robots: {
          index: false,
          follow: false,
        },
      };
    }
    const universidadData = carreraData.universidad_id
      ? await getUniversidadById(carreraData.universidad_id)
      : null;

    return {
      title: `${carreraData.nombre} | Materias`,
      description: `Explorá las materias de ${carreraData.nombre}${universidadData ? ` en ${universidadData.nombre}` : ''} y estudiá con materiales y simuladores en Evaluo.`,
      alternates: {
        canonical: `/materias?carreraId=${encodeURIComponent(carreraId)}`,
      },
      openGraph: {
        title: `${carreraData.nombre} | Evaluo`,
        description: `Materias, recursos y simuladores para ${carreraData.nombre}.`,
        url: `/materias?carreraId=${encodeURIComponent(carreraId)}`,
      },
    };
  } catch {
    return {
      title: 'Materias',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function MateriasPage({
  searchParams,
}: {
  searchParams: Promise<{ carreraId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const carreraId = resolvedParams.carreraId?.trim();

  if (!carreraId) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
        <StudyStatePanel
          icon={BookOpen}
          className="w-full"
          title="Todavía no elegiste una carrera"
          description="Entrá desde explorar o desde una universidad para ver el plan de materias correcto."
          secondaryText="Así mantenemos el recorrido ordenado y te mostramos solo el contenido que corresponde a esa carrera."
          primaryActionLabel="Explorar carreras"
          primaryActionHref="/explorar"
          secondaryActionLabel="Ir al inicio"
          secondaryActionHref="/"
        />
      </div>
    );
  }

  let materias: Materia[] = [];
  let sharedStudentMaterials: Awaited<
    ReturnType<typeof fetchSharedStudentMaterialsByCarrera>
  > = [];
  let carreraData: Awaited<ReturnType<typeof getCarreraById>> | null = null;
  let universidadData: Awaited<ReturnType<typeof getUniversidadById>> | null = null;

  try {
    carreraData = await getCarreraById(carreraId);
    const publicClient = createPublicClient();
    [materias, sharedStudentMaterials] = await Promise.all([
      getMateriasByCarrera(carreraId),
      fetchSharedStudentMaterialsByCarrera(publicClient, carreraId, 8),
    ]);

    if (carreraData?.universidad_id) {
      universidadData = await getUniversidadById(carreraData.universidad_id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';

    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
        <StudyStatePanel
          icon={BookOpen}
          tone="warning"
          className="w-full"
          title="No pudimos cargar esta carrera"
          description={message}
          secondaryText="Probá nuevamente en unos segundos o volvé a explorar otras carreras."
          primaryActionLabel="Volver a explorar"
          primaryActionHref="/explorar"
          secondaryActionLabel="Ir al inicio"
          secondaryActionHref="/"
        />
      </div>
    );
  }

  return (
    <>
      {carreraData ? (
        <JsonLd
          data={buildBreadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Explorar', path: '/explorar' },
            ...(universidadData
              ? [{ name: universidadData.nombre, path: `/universidad/${universidadData.id}` }]
              : []),
            { name: carreraData.nombre, path: `/materias?carreraId=${encodeURIComponent(carreraId)}` },
          ])}
        />
      ) : null}
      <MateriaList
        initialMaterias={materias}
        carreraId={carreraId}
        carreraNombre={carreraData?.nombre}
        carreraData={carreraData ?? undefined}
        universidadNombre={universidadData?.nombre}
        universidadId={universidadData?.id}
        sharedStudentMaterials={sharedStudentMaterials}
      />
    </>
  );
}
