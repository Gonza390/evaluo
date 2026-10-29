import { Skeleton } from '@/components/ui/skeleton';

/**
 * The loading shape mirrors Mi espacio so the interface feels stable
 * while Next.js resolves the dashboard's server data.
 */
export default function DashboardLoading() {
  return (
    <main aria-busy="true" aria-label="Cargando Mi espacio" className="min-h-full bg-white px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <span className="sr-only" role="status">Cargando materiales y progreso</span>
      <div className="mx-auto w-full max-w-[1240px] space-y-3">
        <section className="rounded-[1.25rem] border border-slate-100 bg-white px-4 py-5 sm:px-5" aria-hidden="true">
          <div className="mx-auto flex max-w-[760px] flex-col items-center gap-3">
            <Skeleton className="h-3 w-24 bg-slate-100" />
            <Skeleton className="h-6 w-3/5 max-w-80 bg-slate-100" />
            <Skeleton className="h-3.5 w-4/5 max-w-96 bg-slate-100" />
            <Skeleton className="mt-2 h-11 w-44 rounded-lg bg-slate-100" />
          </div>
        </section>
        <section className="rounded-[1.25rem] border border-slate-100 bg-white p-4" aria-hidden="true">
          <Skeleton className="h-3 w-20 bg-slate-100" />
          <Skeleton className="mt-3 h-3.5 w-64 max-w-full bg-slate-100" />
          <div className="mt-4 rounded-xl border border-slate-100 p-3">
            <Skeleton className="h-4 w-56 max-w-[80%] bg-slate-100" />
            <Skeleton className="mt-3 h-3 w-40 bg-slate-100" />
            <Skeleton className="mt-3 h-10 w-40 rounded-lg bg-slate-100" />
          </div>
        </section>
      </div>
    </main>
  );
}
