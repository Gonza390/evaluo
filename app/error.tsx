'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { StudyStatePanel } from '@/components/study-state-panel';
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
      <StudyStatePanel
        icon={AlertTriangle}
        tone="error"
        eyebrow="Problema temporal"
        title="Algo salió mal"
        description="Tuvimos un problema inesperado. Podés intentar nuevamente sin perder la sesión."
        primaryActionLabel="Reintentar"
        onPrimaryAction={reset}
        className="w-full max-w-xl"
      />
    </div>
  );
}
