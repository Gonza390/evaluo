import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarLoading() {
  return (
    <div role="status" aria-label="Cargando calendario" className="mx-auto w-full max-w-[1240px] space-y-3 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <span className="sr-only">Cargando tus fechas y actividades</span>
      <section className="rounded-[20px] border border-slate-100 bg-white p-4" aria-hidden="true">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-6 w-36 rounded-lg bg-slate-100" />
          <Skeleton className="h-9 w-24 rounded-lg bg-slate-100" />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, index) => (
            <Skeleton key={index} className="h-12 rounded-lg bg-slate-100 sm:h-20" />
          ))}
        </div>
      </section>
    </div>
  );
}
