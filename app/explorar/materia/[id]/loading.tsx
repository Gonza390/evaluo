export default function Loading() {
  return (
    <div className="animate-page-enter min-h-full bg-[#F5F7FB]">
      <div className="w-full border-b border-[#E8EDF5] bg-[#F8FAFC]">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center px-4 py-2.5 lg:px-8">
          <div className="h-4 w-52 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>

      <section className="relative min-h-[238px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div className="relative mx-auto flex h-full max-w-7xl px-4 py-4 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
              <div className="hidden h-24 w-24 animate-pulse rounded-full bg-white/10 sm:block" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
                <div className="h-8 w-72 max-w-full animate-pulse rounded-full bg-white/15 sm:h-10" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
                  <div className="h-8 w-48 animate-pulse rounded-full bg-white/10" />
                  <div className="h-8 w-44 animate-pulse rounded-full bg-white/10" />
                </div>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <div className="h-11 w-full animate-pulse rounded-2xl bg-white/10 sm:w-32" />
              <div className="h-11 w-full animate-pulse rounded-2xl bg-white/10 sm:w-36" />
              <div className="col-span-2 h-11 w-full animate-pulse rounded-2xl bg-[#2563EB]/60 sm:hidden" />
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-3 gap-2 py-2.5 sm:flex sm:gap-6">
            <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-36" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-40" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-32" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-60 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-full bg-white sm:w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="surface-card animate-pulse p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="h-[148px] w-[112px] rounded-[22px] bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-5 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-4 w-1/3 rounded-full bg-slate-100" />
                  <div className="h-4 w-full rounded-full bg-slate-100" />
                  <div className="h-4 w-5/6 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="h-10 w-24 rounded-2xl bg-slate-100" />
                <div className="h-10 w-28 rounded-2xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
