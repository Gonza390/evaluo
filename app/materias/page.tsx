import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { getCarreraById, getUniversidadById } from '@/services/api-server';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { StudyStatePanel } from '@/components/study-state-panel';
import { CareerHeroServer } from '@/components/career-hero-server';
import { MateriaCatalogSection } from './materia-catalog-section';

export const revalidate = 600;

function MateriaCatalogFallback() {
  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-2 py-3 sm:flex sm:gap-6">
            <div className="h-11 rounded-xl bg-slate-100 sm:w-32" />
            <div className="h-11 rounded-xl bg-slate-100 sm:w-28" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-7 w-44 animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-72" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="min-h-[184px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}

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
      robots: { index: false, follow: true },
    };
  }

  try {
    const carreraData = await getCarreraById(carreraId);
    if (!carreraData) {
      return {
        title: 'Materias',
        robots: { index: false, follow: true },
      };
    }

    const universidadData = carreraData.universidad_id
      ? await getUniversidadById(carreraData.universidad_id)
      : null;
    const canonicalHref = universidadData
      ? `/estudiar/${buildSeoEntitySlug(universidadData.nombre, universidadData.id)}/${buildSeoEntitySlug(carreraData.nombre, carreraData.id)}`
      : undefined;

    return {
      title: `${carreraData.nombre} | Materias`,
      description: `Explorá las materias de ${carreraData.nombre}${universidadData ? ` en ${universidadData.nombre}` : ''} y estudiá con materiales y simuladores en Evaluo.`,
      robots: { index: false, follow: true },
      ...(canonicalHref
        ? {
            alternates: { canonical: canonicalHref },
            openGraph: {
              title: `${carreraData.nombre} | Evaluo`,
              description: `Materias, recursos y simuladores para ${carreraData.nombre}.`,
              url: canonicalHref,
            },
          }
        : {}),
    };
  } catch {
    return {
      title: 'Materias',
      robots: { index: false, follow: true },
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
          iconName="book-open"
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

  try {
    const carreraData = await getCarreraById(carreraId);
    if (!carreraData) {
      return (
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
          <StudyStatePanel
            iconName="book-open"
            tone="warning"
            className="w-full"
            title="No encontramos esta carrera"
            description="La carrera ya no está disponible o el enlace cambió."
            secondaryText="Volvé a explorar para elegir otra carrera."
            primaryActionLabel="Volver a explorar"
            primaryActionHref="/explorar"
            secondaryActionLabel="Ir al inicio"
            secondaryActionHref="/"
          />
        </div>
      );
    }

    const universidadData = carreraData.universidad_id
      ? await getUniversidadById(carreraData.universidad_id)
      : null;
    const careerCanonicalHref = universidadData
      ? `/estudiar/${buildSeoEntitySlug(universidadData.nombre, universidadData.id)}/${buildSeoEntitySlug(carreraData.nombre, carreraData.id)}`
      : `/materias?carreraId=${encodeURIComponent(carreraId)}`;

    return (
      <>
        <JsonLd
          data={buildBreadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Explorar', path: '/explorar' },
            ...(universidadData
              ? [{ name: universidadData.nombre, path: `/universidad/${universidadData.id}` }]
              : []),
            { name: carreraData.nombre, path: careerCanonicalHref },
          ])}
        />
        <CareerHeroServer
          carreraId={carreraId}
          carreraNombre={carreraData.nombre}
          carreraData={carreraData}
          universidadNombre={universidadData?.nombre ?? undefined}
          universidadId={universidadData?.id ?? undefined}
        />
        <Suspense fallback={<MateriaCatalogFallback />}>
          <MateriaCatalogSection
            carreraId={carreraId}
            carreraNombre={carreraData.nombre}
            carreraData={carreraData}
            universidadNombre={universidadData?.nombre ?? undefined}
            universidadId={universidadData?.id ?? undefined}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
        <StudyStatePanel
          iconName="book-open"
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
}
