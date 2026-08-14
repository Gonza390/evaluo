'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logError } from '@/lib/observability';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError('app.globalError', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <h2 className="text-2xl font-bold text-slate-950">Algo salió mal</h2>
        <p className="mt-3 text-sm text-slate-600">
          Tuvimos un problema inesperado. Puedes intentar nuevamente sin perder la sesión.
        </p>
        <Button onClick={reset} className="mt-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
