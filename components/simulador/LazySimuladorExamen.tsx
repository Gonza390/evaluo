'use client';

import dynamic from 'next/dynamic';
import type { SimuladorExamenProps } from '@/components/simulador/SimuladorExamen';

const SimuladorExamenLazy = dynamic(() => import('@/components/simulador/SimuladorExamen'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-white p-6" aria-busy="true">
      <div className="w-full max-w-5xl border-y border-slate-200 bg-white px-1 py-8 sm:px-4">
        <div className="h-7 w-44 animate-pulse rounded-md bg-slate-100" />
        <div className="mt-6 h-4 w-full animate-pulse rounded-md bg-slate-100" />
        <div className="mt-3 h-4 w-4/5 animate-pulse rounded-md bg-slate-100" />
        <div className="mt-8 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  ),
});

export default function LazySimuladorExamen(props: SimuladorExamenProps) {
  return <SimuladorExamenLazy {...props} />;
}
