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
  const resolvedSearchParams = (await searchParams) ?? {};
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
    <div className="animate-page-enter mx-auto w-full max-w-6xl overflow-x-hidden px-4 pb-8 sm:px-6 sm:pb-10 [&_input]:shadow-none [&_p.text-slate-400]:text-slate-500 [&_.surface-card]:rounded-none [&_.surface-card]:border-x-0 [&_.surface-card]:border-t-0 [&_.surface-card]:border-b [&_.surface-card]:border-slate-200/90 [&_.surface-card]:bg-transparent [&_.surface-card]:shadow-none [&_.surface-card:hover]:translate-y-0 [&_.surface-card:hover]:border-indigo-200 [&_.surface-card:hover]:shadow-none [&_.surface-panel]:shadow-none">
      <ExplorarStaticIntro />
      <Suspense fallback={<p className="mt-4 text-sm text-slate-500">Cargando catálogo...</p>}>
        <ExplorarClient initialData={initialData} />
      </Suspense>
    </div>
  );
}
