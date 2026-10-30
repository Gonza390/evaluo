'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { StudyStatePanel } from '@/components/study-state-panel';

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
    <main className="min-h-screen bg-white px-6 py-16">
      <StudyStatePanel
        icon={AlertTriangle}
        tone="error"
        eyebrow="Mi espacio"
        title="No pudimos cargar tu panel"
        description="Tus materias y tu progreso no fueron borrados. Ocurrió un problema al consultar los datos del panel."
        secondaryText="Podés volver a intentarlo ahora."
        primaryActionLabel="Reintentar"
        onPrimaryAction={reset}
        className="mx-auto w-full max-w-xl"
      />
    </main>
  );
}
