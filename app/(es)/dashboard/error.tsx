'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { StudyStatePanel } from '@/components/study-state-panel';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const english = useOptionalAppLocale() === 'en';
  const tr = (es: string, en: string) => english ? en : es;
  useEffect(() => {
    console.error('Dashboard render failed', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <StudyStatePanel
        icon={AlertTriangle}
        tone="error"
        eyebrow={tr("Mi espacio","My space")}
        title={tr("No pudimos cargar tu panel","We could not load your dashboard")}
        description={tr("Tus materias y tu progreso no fueron borrados. Ocurrió un problema al consultar los datos del panel.","Your subjects and progress are still saved. We encountered an error loading the dashboard.")}
        secondaryText={tr("Podés volver a intentarlo ahora.","You can try again now.")}
        primaryActionLabel={tr("Reintentar","Try again")}
        onPrimaryAction={reset}
        className="mx-auto w-full max-w-xl"
      />
    </main>
  );
}
