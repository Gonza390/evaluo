'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { MaterialStudyWorkspace } from '@/components/material-study-workspace';

const MaterialStudyWorkspaceLazy = dynamic(
  () =>
    import('@/components/material-study-workspace').then(
      (module) => module.MaterialStudyWorkspace
    ),
  {
    loading: () => (
      <div className="mx-auto min-h-[70vh] w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="h-14 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="min-h-[520px] animate-pulse rounded-[24px] border border-slate-200 bg-slate-50" />
          <div className="min-h-[520px] animate-pulse rounded-[24px] border border-slate-200 bg-slate-50" />
        </div>
      </div>
    ),
  }
);

export function LazyMaterialStudyWorkspace(
  props: ComponentProps<typeof MaterialStudyWorkspace>
) {
  return <MaterialStudyWorkspaceLazy {...props} />;
}
