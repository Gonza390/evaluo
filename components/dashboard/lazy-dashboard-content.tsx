'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { DashboardContent } from '@/components/dashboard/dashboard-content';

const DashboardContentLazy = dynamic(
  () =>
    import('@/components/dashboard/dashboard-content').then((module) => module.DashboardContent),
  {
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]" aria-busy="true">
        <div className="surface-panel min-h-[320px] animate-pulse bg-white/80" />
        <div className="grid gap-4">
          <div className="surface-panel min-h-[150px] animate-pulse bg-white/80" />
          <div className="surface-panel min-h-[150px] animate-pulse bg-white/80" />
        </div>
      </div>
    ),
  }
);

export function LazyDashboardContent(props: ComponentProps<typeof DashboardContent>) {
  return <DashboardContentLazy {...props} />;
}
