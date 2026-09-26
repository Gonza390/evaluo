import { StudyStatePanel } from '@/components/study-state-panel';

export default function DashboardLoading() {
  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center">
        <StudyStatePanel
          iconName="loader"
          tone="loading"
          eyebrow="Mi espacio"
          title="Cargando Evaluo"
          description="Estamos preparando tus materiales, progreso y próximos pasos para estudiar."
          className="w-full"
        />
      </div>
    </main>
  );
}
