function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-100 ${className}`} />;
}

export default function Loading() {
  return (
    <div className="min-h-full bg-white">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
        <Pulse className="h-4 w-32 rounded-full" />

        <header className="mt-7 border-b border-slate-200 pb-7 sm:pb-9">
          <Pulse className="h-3 w-24 rounded-full" />
          <Pulse className="mt-3 h-10 w-80 max-w-full rounded-lg" />
          <Pulse className="mt-4 h-4 w-[32rem] max-w-full rounded-full" />
          <div className="mt-6 flex flex-wrap gap-5">
            <Pulse className="h-4 w-28 rounded-full" />
            <Pulse className="h-4 w-28 rounded-full" />
            <Pulse className="h-4 w-32 rounded-full" />
          </div>
        </header>

        <div className="flex gap-6 border-b border-slate-200 pt-5">
          <Pulse className="h-8 w-20 rounded-md" />
          <Pulse className="h-8 w-24 rounded-md" />
        </div>

        <section className="py-8 sm:py-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Pulse className="h-6 w-44 rounded-md" />
              <Pulse className="mt-2 h-3 w-64 max-w-full rounded-full" />
            </div>
            <Pulse className="h-10 w-full rounded-lg sm:w-64" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-[28px] border border-slate-200 bg-slate-50" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
