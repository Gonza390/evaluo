export default function Loading() {
  return (
    <div className="animate-page-enter min-h-full bg-[#F8FAFC]">
      <div className="w-full border-b border-[#E8EDF5] bg-[#F8FAFC]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center px-4 py-3 lg:px-8">
          <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>

      <section className="relative min-h-[220px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="hidden h-24 w-24 animate-pulse rounded-full bg-white/10 lg:block" />
            <div className="min-w-0 flex-1 space-y-4">
              <div className="h-10 w-72 max-w-full animate-pulse rounded-full bg-white/15" />
              <div className="h-4 w-[32rem] max-w-full animate-pulse rounded-full bg-white/10" />
              <div className="flex flex-wrap gap-2">
                <div className="h-8 w-36 animate-pulse rounded-full bg-white/10" />
                <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-3 xl:max-w-xl">
                <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
                <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-10">
        <section className="surface-panel px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-center gap-2 border-b border-[#E8EDF5] pb-3">
            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="surface-card h-48 animate-pulse rounded-[28px] bg-white/90"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
