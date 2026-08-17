import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCanonicalMateriaId } from '@/lib/materia-aliases';
import { isUuid } from '@/lib/uuid';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildLearningResourceJsonLd } from '@/lib/seo';

const MateriaContent = dynamic(() => import('./materia-content'), {
  loading: () => (
    <div className="space-y-6">
      <div className="surface-panel min-h-[220px] animate-pulse bg-white/80" aria-hidden="true" />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="surface-panel min-h-[360px] animate-pulse bg-white/80" aria-hidden="true" />
        <div className="surface-panel min-h-[360px] animate-pulse bg-white/80" aria-hidden="true" />
      </div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ carreraId?: string }>;
}

export const revalidate = 600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalMateriaId = getCanonicalMateriaId(resolvedParams.id);
  const bootstrap = await getMateriaBootstrap({
    materiaId: canonicalMateriaId,
    requestedCarreraId: '',
  });
  const materiaNombre = bootstrap.materiaNombre?.trim() || 'Materia';
  const carreraNombre = bootstrap.carreraNombre?.trim();

  return {
    title: `Preguntero y simulador de ${materiaNombre}`,
    description:
      carreraNombre
        ? `Estudiá ${materiaNombre} de ${carreraNombre} con resúmenes, pregunteros y simuladores en Evaluo.`
        : `Estudiá ${materiaNombre} con resúmenes, pregunteros y simuladores en Evaluo.`,
    alternates: {
      canonical: `/explorar/materia/${canonicalMateriaId}`,
    },
    openGraph: {
      title: `Preguntero y simulador de ${materiaNombre} | Evaluo`,
      description: carreraNombre
        ? `Preguntero y simulador para estudiar ${materiaNombre} en ${carreraNombre}.`
        : `Preguntero y simulador para estudiar ${materiaNombre} en Evaluo.`,
      url: `/explorar/materia/${canonicalMateriaId}`,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function MateriaPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as { carreraId?: string }),
  ]);
  const canonicalMateriaId = getCanonicalMateriaId(resolvedParams.id);

  if (canonicalMateriaId !== resolvedParams.id) {
    const params = new URLSearchParams();
    const carreraId = resolvedSearchParams.carreraId?.trim();
    if (carreraId) {
      params.set('carreraId', carreraId);
    }
    const target = params.toString()
      ? `/explorar/materia/${canonicalMateriaId}?${params.toString()}`
      : `/explorar/materia/${canonicalMateriaId}`;
    redirect(target);
  }

  const materiaId = canonicalMateriaId;
  if (!isUuid(materiaId)) {
    return notFound();
  }

  const requestedCarreraId = resolvedSearchParams.carreraId?.trim() ?? '';
  const bootstrap = await getMateriaBootstrap({
    materiaId,
    requestedCarreraId,
  });

  if (bootstrap.materiaFound === false) {
    return notFound();
  }

  return (
    <>
      <JsonLd
        data={buildLearningResourceJsonLd({
          name: bootstrap.materiaNombre,
          universityName: bootstrap.universidadNombre,
          careerName: bootstrap.carreraNombre,
          url: `/explorar/materia/${materiaId}`,
        })}
      />
      <MateriaContent
      materiaId={materiaId}
      materiaNombre={bootstrap.materiaNombre}
      carreraId={bootstrap.carreraId || requestedCarreraId || undefined}
      carreraNombre={bootstrap.carreraNombre}
      universidadId={bootstrap.universidadId}
      universidadNombre={bootstrap.universidadNombre}
      initialContextError={bootstrap.contextError}
      initialResumenes={bootstrap.initialResumenes}
      initialResumenesError={bootstrap.initialResumenesError}
      initialSimulatorRatings={bootstrap.initialSimulatorRatings}
      initialSimulatorUsage={bootstrap.initialSimulatorUsage}
    />
    </>
  );
}
