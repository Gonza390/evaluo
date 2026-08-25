'use client';

import dynamic from 'next/dynamic';
import type { SimuladorExamenProps } from '@/components/simulador/SimuladorExamen';

const SimuladorExamenLazy = dynamic(() => import('@/components/simulador/SimuladorExamen'), {
  loading: () => (
    <div
      className="flex min-h-screen items-center justify-center bg-indigo-50 p-6"
      aria-busy="true"
    >
      <div className="w-full max-w-5xl rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
        <div className="h-8 w-48 animate-pulse rounded-full bg-indigo-100" />
        <div className="mt-6 h-4 w-full animate-pulse rounded-full bg-white" />
        <div className="mt-3 h-4 w-4/5 animate-pulse rounded-full bg-white" />
        <div className="mt-8 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    </div>
  ),
});

export default function LazySimuladorExamen(props: SimuladorExamenProps) {
  return <SimuladorExamenLazy {...props} />;
}
