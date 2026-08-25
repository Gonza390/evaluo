export default function AdministradorLoading() {
  return (
    <main className="min-h-screen bg-white px-5 py-8" aria-busy="true" aria-label="Cargando panel">
      <div className="mx-auto max-w-[1480px] animate-pulse">
        <div className="mb-8 h-8 w-48 rounded-xl bg-slate-100" />
        <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="rounded-[22px] border border-slate-100 p-4">
            <div className="mb-6 h-10 rounded-xl bg-slate-100" />
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-11 rounded-xl bg-slate-100" />
              ))}
            </div>
          </aside>
          <section className="space-y-5">
            <div className="h-20 rounded-[22px] bg-slate-100" />
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-32 rounded-[22px] bg-slate-100" />
              ))}
            </div>
            <div className="h-[420px] rounded-[22px] bg-slate-100" />
          </section>
        </div>
      </div>
    </main>
  );
}
