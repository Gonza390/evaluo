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
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';

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
  searchParams?: Promise<{
    carreraId?: string;
    tab?: string;
    modulo?: string;
  }>;
}

export const revalidate = 600;

function resolveMateriaId(routeValue: string) {
  return getCanonicalMateriaId(parseSeoEntitySlug(routeValue).id);
}

function buildMateriaQuery(searchParams: {
  carreraId?: string;
  tab?: string;
  modulo?: string;
}) {
  const params = new URLSearchParams();
  const carreraId = searchParams.carreraId?.trim();
  const tab = searchParams.tab?.trim();
  const modulo = searchParams.modulo?.trim();

  if (carreraId) params.set('carreraId', carreraId);
  if (tab) params.set('tab', tab);
  if (modulo) params.set('modulo', modulo);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalMateriaId = resolveMateriaId(resolvedParams.id);
  const [bootstrap, contentSignals] = await Promise.all([
    getMateriaBootstrap({
      materiaId: canonicalMateriaId,
      requestedCarreraId: '',
    }),
    getMateriaSeoContentSignals(canonicalMateriaId),
  ]);
  const materiaNombre = bootstrap.materiaNombre?.trim() || 'Materia';
  const carreraNombre = bootstrap.carreraNombre?.trim();
  const canonicalHref = `/explorar/materia/${buildSeoEntitySlug(materiaNombre, canonicalMateriaId)}`;
  const description = carreraNombre
    ? `Explorá los temas, recursos y actividades disponibles para estudiar ${materiaNombre} de ${carreraNombre} en Evaluo.`
    : `Explorá los temas, recursos y actividades disponibles para estudiar ${materiaNombre} en Evaluo.`;
  const socialTitle = `${materiaNombre} | Evaluo`;

  return {
    title: `Guía y recursos de ${materiaNombre}`,
    description,
    alternates: {
      canonical: canonicalHref,
    },
    openGraph: {
      title: socialTitle,
      description: carreraNombre
        ? `Recursos y actividades para estudiar ${materiaNombre} en ${carreraNombre}.`
        : `Recursos y actividades para estudiar ${materiaNombre} en Evaluo.`,
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
    searchParams ??
      Promise.resolve({} as {
        carreraId?: string;
        tab?: string;
        modulo?: string;
      }),
  ]);
  const parsedMateriaId = parseSeoEntitySlug(resolvedParams.id).id;
  const canonicalMateriaId = getCanonicalMateriaId(parsedMateriaId);

  if (canonicalMateriaId !== parsedMateriaId) {
    redirect(`/explorar/materia/${canonicalMateriaId}${buildMateriaQuery(resolvedSearchParams)}`);
  }

  const materiaId = canonicalMateriaId;
  if (!isUuid(materiaId)) {
    return notFound();
  }

  const requestedCarreraId = resolvedSearchParams.carreraId?.trim() ?? '';
  const [bootstrap, contentSignals] = await Promise.all([
    getMateriaBootstrap({
      materiaId,
      requestedCarreraId,
    }),
    getMateriaSeoContentSignals(materiaId),
  ]);

  if (bootstrap.materiaFound === false) {
    return notFound();
  }

  const canonicalSegment = buildSeoEntitySlug(bootstrap.materiaNombre, materiaId);
  if (resolvedParams.id.includes('--') && resolvedParams.id !== canonicalSegment) {
    redirect(`/explorar/materia/${canonicalSegment}${buildMateriaQuery(resolvedSearchParams)}`);
  }

  const requestedTab = resolvedSearchParams.tab?.trim();
  const hasExplicitSupportedTab =
    requestedTab === 'resumenes' || requestedTab === 'trabajos' || requestedTab === 'pregunteros';

  if (!hasExplicitSupportedTab && !contentSignals.hasSummaries && contentSignals.hasQuestions) {
    const params = new URLSearchParams();
    params.set('tab', 'pregunteros');
    if (requestedCarreraId) {
      params.set('carreraId', requestedCarreraId);
    }
    redirect(`/explorar/materia/${canonicalSegment}?${params.toString()}`);
  }

  const canonicalHref = `/explorar/materia/${canonicalSegment}`;

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
