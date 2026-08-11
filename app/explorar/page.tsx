import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ExplorarStaticIntro } from './explorar-static-intro';
import { ExplorarClient } from './explorar-client';
import { fetchExplorarData } from './data';

export const revalidate = 600;

type ExplorarPageProps = {
  searchParams?: Promise<{
    universidadId?: string;
    unild?: string;
    uniId?: string;
    universidad?: string;
  }>;
};

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const resolvedSearchParams =
    (await searchParams) ?? {};
  const initialData = await fetchExplorarData();
  const legacyUniversityId =
    resolvedSearchParams.universidadId ||
    resolvedSearchParams.unild ||
    resolvedSearchParams.uniId;
  const presetUniversityName = resolvedSearchParams.universidad?.trim().toLowerCase();

  if (legacyUniversityId) {
    redirect(`/universidad/${legacyUniversityId}`);
  }

  if (presetUniversityName) {
    const matchedUniversity = initialData.universidades.find(
      (universidad) => universidad.nombre.trim().toLowerCase() === presetUniversityName
    );

    if (matchedUniversity) {
      redirect(`/universidad/${matchedUniversity.id}`);
    }
  }

  return (
    <div className="animate-page-enter mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-3 sm:px-6 sm:py-6">
      <ExplorarStaticIntro />
      <Suspense fallback={<p className="mt-4 text-sm text-slate-500">Cargando catálogo...</p>}>
        <ExplorarClient initialData={initialData} />
      </Suspense>
    </div>
  );
}
