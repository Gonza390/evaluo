'use client';

import dynamic from 'next/dynamic';
import { useDeferredClientMount } from '@/components/performance/use-deferred-client-mount';

const CareerHeroActionsLazy = dynamic(
  () =>
    import('@/components/career-hero-actions').then(
      (module) => module.CareerHeroActions
    ),
  { ssr: false }
);

function CareerHeroActionsPlaceholder() {
  return (
    <div
      className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center"
      aria-hidden="true"
    >
      <span className="min-h-11 rounded-2xl border border-white/15 bg-white/10 sm:w-44" />
      <span className="min-h-11 rounded-2xl border border-white/10 bg-white/10 sm:w-40" />
    </div>
  );
}

export function LazyCareerHeroActions({
  carreraId,
  carreraNombre,
}: {
  carreraId: string;
  carreraNombre: string;
}) {
  const ready = useDeferredClientMount(500, 1000);

  if (!ready) {
    return <CareerHeroActionsPlaceholder />;
  }

  return (
    <CareerHeroActionsLazy carreraId={carreraId} carreraNombre={carreraNombre} />
  );
}
