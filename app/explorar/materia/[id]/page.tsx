import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCanonicalMateriaId } from '@/lib/materia-aliases';
import { isUuid } from '@/lib/uuid';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { JsonLd } from '@/components/seo/JsonLd';
import { SeoBreadcrumbs } from '@/components/seo/SeoBreadcrumbs';
import { buildBreadcrumbJsonLd, buildLearningResourceJsonLd } from '@/lib/seo';
import { getMateriaSeoContentSignals } from '@/lib/seo-content-signals';

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
  const [bootstrap, contentSignals] = await Promise.all([
    getMateriaBootstrap({
      materiaId: canonicalMateriaId,
      requestedCarreraId: '',
    }),
    getMateriaSeoContentSignals(canonicalMateriaId),
  ]);
  const materiaNombre = bootstrap.materiaNombre?.trim() || 'Materia';
  const carreraNombre = bootstrap.carreraNombre?.trim();
  const canonicalHref = `/explorar/materia/${canonicalMateriaId}`;
  const description = carreraNombre
    ? `Explorá los temas, recursos y actividades disponibles para estudiar ${materiaNombre} de ${carreraNombre} en Evaluo.`
    : `Explorá los temas, recursos y actividades disponibles para estudiar ${materiaNombre} en Evaluo.`;
  const socialTitle = `Guía y recursos de ${materiaNombre} | Evaluo`;

  return {
    title: `Guía y recursos de ${materiaNombre}`,
    description,
    alternates: {
      canonical: canonicalHref,
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
    robots: {
      index: bootstrap.materiaFound !== false && contentSignals.hasAcademicContent,
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

  const canonicalHref = `/explorar/materia/${materiaId}`;

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Explorar', path: '/explorar' },
            { name: bootstrap.materiaNombre, path: canonicalHref },
          ]),
          buildLearningResourceJsonLd({
            name: bootstrap.materiaNombre,
            universityName: bootstrap.universidadNombre,
            careerName: bootstrap.carreraNombre,
            url: canonicalHref,
          }),
        ]}
      />
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-5 sm:px-8">
        <SeoBreadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Explorar', href: '/explorar' },
            { name: bootstrap.materiaNombre },
          ]}
        />
      </div>
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
