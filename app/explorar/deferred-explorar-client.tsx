'use client';

import dynamic from 'next/dynamic';
import type { ExplorarData } from './data';
import { useDeferredClientMount } from '@/components/performance/use-deferred-client-mount';

const ExplorarClientLazy = dynamic(
  () => import('./explorar-client').then((module) => module.ExplorarClient),
  { ssr: false }
);

function ExploreCatalogPlaceholder() {
  return (
    <div className="mt-4 min-h-screen" aria-busy="true" aria-label="Preparando catálogo">
      <div className="h-11 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-3 h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export function DeferredExplorarClient({ initialData }: { initialData: ExplorarData }) {
  const ready = useDeferredClientMount(450, 1100);

  if (!ready) {
    return <ExploreCatalogPlaceholder />;
  }

  return <ExplorarClientLazy initialData={initialData} />;
}
