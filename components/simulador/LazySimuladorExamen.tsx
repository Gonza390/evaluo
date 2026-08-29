'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { SimuladorExamenProps } from '@/components/simulador/SimuladorExamen';

const SIMULATOR_TOUR_GLOBAL_KEY = 'evaluo_simulator_tour:v2';
const SIMULATOR_TOUR_LEGACY_PREFIX = 'evaluo_simulator_tour:v1:';

function SimulatorLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6" aria-busy="true">
      <div className="w-full max-w-5xl border-y border-slate-200 bg-white px-1 py-8 sm:px-4">
        <div className="h-7 w-44 animate-pulse rounded-md bg-slate-100" />
        <div className="mt-6 h-4 w-full animate-pulse rounded-md bg-slate-100" />
        <div className="mt-3 h-4 w-4/5 animate-pulse rounded-md bg-slate-100" />
        <div className="mt-8 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const SimuladorExamenLazy = dynamic(() => import('@/components/simulador/SimuladorExamen'), {
  loading: SimulatorLoading,
});

function hasCompletedLegacySimulatorTour(storage: Storage) {
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (
      key?.startsWith(SIMULATOR_TOUR_LEGACY_PREFIX) &&
      storage.getItem(key) === 'done'
    ) {
      return true;
    }
  }

  return false;
}

export default function LazySimuladorExamen(props: SimuladorExamenProps) {
  const mode = props.mode ?? 'regular';
  const tourScopeKey = `${props.materiaId}:${props.parcial}:${mode}`;
  const [preparedTourScope, setPreparedTourScope] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storage = window.localStorage;
      const globalTourCompleted = storage.getItem(SIMULATOR_TOUR_GLOBAL_KEY) === 'done';
      const legacyTourCompleted = hasCompletedLegacySimulatorTour(storage);

      if (globalTourCompleted || legacyTourCompleted) {
        storage.setItem(SIMULATOR_TOUR_GLOBAL_KEY, 'done');
        storage.setItem(`${SIMULATOR_TOUR_LEGACY_PREFIX}${tourScopeKey}`, 'done');
      }
    } catch {
      // Si el navegador bloquea localStorage, no impedimos que cargue el simulador.
    } finally {
      setPreparedTourScope(tourScopeKey);
    }
  }, [tourScopeKey]);

  if (preparedTourScope !== tourScopeKey) {
    return <SimulatorLoading />;
  }

  return <SimuladorExamenLazy {...props} />;
}
