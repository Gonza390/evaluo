'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard render failed', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-emerald-50/30 px-6 py-16">
      <section className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          No pudimos cargar tu panel
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          Tus materias y tu progreso no fueron borrados. Ocurrió un problema al
          consultar los datos del panel. Podés volver a intentarlo ahora.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      </section>
    </main>
  );
}
