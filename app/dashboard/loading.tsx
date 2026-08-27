function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-100 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <section className="border-b border-slate-200 pb-6">
          <Pulse className="h-3 w-24 rounded-full" />
          <Pulse className="mt-3 h-9 w-72 max-w-full rounded-lg" />
          <Pulse className="mt-3 h-4 w-[32rem] max-w-full rounded-full" />
        </section>

        <section className="border-b border-slate-200 py-6">
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <Pulse key={index} className="h-8 w-20 shrink-0 rounded-md" />
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border-b border-slate-200 py-4">
                <Pulse className="h-4 w-2/3 rounded-full" />
                <Pulse className="mt-2 h-3 w-1/2 rounded-full" />
                <Pulse className="mt-4 h-9 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        </section>

        <section className="py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Pulse className="h-5 w-40 rounded-md" />
              <Pulse className="mt-2 h-3 w-64 max-w-full rounded-full" />
            </div>
            <Pulse className="h-4 w-20 rounded-full" />
          </div>
          <div className="mt-5 divide-y divide-slate-200 border-t border-slate-200">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="py-4">
                <Pulse className="h-4 w-1/2 rounded-full" />
                <Pulse className="mt-2 h-3 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
