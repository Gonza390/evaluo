import { Skeleton } from '@/components/ui/skeleton';

export default function StudyPlanLoading() {
  return (
    <main role="status" aria-label="Cargando plan de estudio" aria-busy="true" className="mx-auto w-full max-w-[1240px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <span className="sr-only">Cargando materiales y actividades</span>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-7 w-40 rounded-lg bg-slate-100" />
        <Skeleton className="h-9 w-32 rounded-lg bg-slate-100" />
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-4">
          <section className="rounded-[16px] border border-slate-200 bg-white p-4">
            <Skeleton className="mb-4 h-5 w-24 bg-slate-100" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-[76px] shrink-0 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5 bg-slate-100" />
                <Skeleton className="h-3 w-2/5 bg-slate-100" />
              </div>
            </div>
          </section>
          <Skeleton className="h-5 w-24 bg-slate-100" />
          <section className="overflow-hidden rounded-[16px] border border-slate-200 bg-white">
            <Skeleton className="mx-3 my-3 h-3 w-28 bg-slate-100" />
            {[0,1,2].map(item=><div key={item} className="flex gap-3 border-t border-slate-100 p-3">
              <Skeleton className="size-9 shrink-0 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5 bg-slate-100" />
                <Skeleton className="h-3 w-1/3 bg-slate-100" />
              </div>
            </div>)}
          </section>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[205px] rounded-[18px] bg-slate-100" />
          <section className="rounded-[16px] border border-slate-200 bg-white p-4">
            <Skeleton className="mb-4 h-5 w-32 bg-slate-100" />
            {[0,1,2].map(item=><Skeleton key={item} className="mb-3 h-9 w-full rounded-lg bg-slate-100" />)}
          </section>
        </div>
      </div>
    </main>
  );
}
