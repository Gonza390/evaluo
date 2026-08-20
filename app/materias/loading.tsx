function MateriasSkeletonCard() {
  return (
    <div className="surface-card min-h-[184px] animate-pulse p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="h-10 w-10 rounded-full bg-white" />
          <div className="h-5 w-44 rounded-full bg-white" />
          <div className="h-4 w-60 max-w-full rounded-full bg-white" />
          <div className="h-4 w-40 rounded-full bg-white" />
        </div>
        <div className="h-9 w-9 rounded-xl bg-white" />
      </div>
      <div className="mt-6 h-11 rounded-xl bg-white" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-page-enter min-h-full bg-white">
      <div className="w-full border-b border-[#E8EDF5] bg-white">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center px-4 py-2.5 lg:px-8">
          <div className="h-4 w-40 animate-pulse rounded-full bg-white" />
        </div>
      </div>

      <section className="relative min-h-[240px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-4 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
              <div className="h-14 w-14 animate-pulse rounded-full border border-white/10 bg-white/10 sm:h-24 sm:w-24" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
                <div className="h-8 w-64 max-w-full animate-pulse rounded-full bg-white/15 sm:h-10" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-36 animate-pulse rounded-full bg-white/10" />
                  <div className="h-8 w-44 animate-pulse rounded-full bg-white/10" />
                  <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
                </div>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <div className="h-11 w-full animate-pulse rounded-2xl bg-white/10 sm:w-36" />
              <div className="h-11 w-full animate-pulse rounded-2xl bg-white/10 sm:w-40" />
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-2 py-3 sm:flex sm:gap-6">
            <div className="h-11 w-full animate-pulse rounded-xl bg-white sm:w-36" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-white sm:w-28" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-56 animate-pulse rounded-full bg-white" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-white" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-white sm:w-72" />
        </div>

        <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <MateriasSkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
