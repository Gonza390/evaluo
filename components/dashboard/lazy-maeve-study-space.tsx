'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { MaeveStudySpace } from '@/components/dashboard/maeve-study-space';

const MaeveStudySpaceLazy = dynamic(
  () =>
    import('@/components/dashboard/maeve-study-space').then((module) => module.MaeveStudySpace),
  {
    loading: () => (
      <div className="mx-auto max-w-xl space-y-4" aria-busy="true">
        <div className="min-h-[180px] animate-pulse rounded-[1.35rem] border border-slate-200/80 bg-slate-50" />
        <div className="min-h-[240px] animate-pulse rounded-2xl border border-slate-200/80 bg-slate-50" />
      </div>
    ),
  }
);

export function LazyMaeveStudySpace(props: ComponentProps<typeof MaeveStudySpace>) {
  return <MaeveStudySpaceLazy {...props} />;
}
