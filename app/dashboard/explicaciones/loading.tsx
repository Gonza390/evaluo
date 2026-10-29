import { Skeleton } from '@/components/ui/skeleton';

export default function ProgressLoading() {
  return (
    <div role="status" aria-label="Cargando progreso" className="mx-auto w-full max-w-[1240px] space-y-3 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <span className="sr-only">Cargando tu progreso de estudio</span>
      <div className="rounded-[20px] border border-slate-100 bg-white p-4" aria-hidden="true">
        <Skeleton className="h-5 w-36 bg-slate-100" />
        <Skeleton className="mt-3 h-3 w-64 max-w-full bg-slate-100" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-xl border border-slate-100 p-3">
              <Skeleton className="h-3 w-20 bg-slate-100" />
              <Skeleton className="mt-3 h-7 w-14 bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[20px] border border-slate-100 bg-white p-4" aria-hidden="true">
        <Skeleton className="h-5 w-40 bg-slate-100" />
        <Skeleton className="mt-4 h-28 w-full rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
