'use client';

import { StudyStatePanel } from '@/components/study-state-panel';

export default function SimuladorError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <StudyStatePanel
        iconName="alert-triangle"
        tone="error"
        eyebrow="Simulador"
        title="No pudimos cargar esta práctica"
        description="El servicio de datos no respondió correctamente. Tu materia no fue eliminada; podés volver a intentarlo."
        primaryActionLabel="Reintentar"
        onPrimaryAction={reset}
        secondaryActionLabel="Volver al simulador"
        secondaryActionHref="/simulador"
        className="w-full max-w-lg"
      />
    </main>
  );
}
