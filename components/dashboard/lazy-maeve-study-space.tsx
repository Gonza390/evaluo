'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { MaeveStudySpace } from '@/components/dashboard/maeve-study-space';

const MaeveStudySpaceLazy = dynamic(
  () =>
    import('@/components/dashboard/maeve-study-space').then((module) => module.MaeveStudySpace),
  {
    loading: () => (
      <div className="mx-auto max-w-[760px] space-y-3" aria-busy="true">
        <div className="min-h-[160px] animate-pulse rounded-[1.25rem] border border-slate-200/80 bg-slate-50" />
        <div className="min-h-[180px] animate-pulse rounded-xl border border-slate-200/80 bg-slate-50" />
      </div>
    ),
  }
);

export function LazyMaeveStudySpace(props: ComponentProps<typeof MaeveStudySpace>) {
  return <MaeveStudySpaceLazy {...props} />;
}
