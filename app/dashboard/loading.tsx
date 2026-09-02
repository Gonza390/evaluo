import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-[-0.035em] text-slate-950">
                Cargando Evaluo
              </h1>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Estamos preparando esta vista para vos.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
