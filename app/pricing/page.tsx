import Link from 'next/link';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-14">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold text-slate-900">Plan Premium</h1>
        <p className="mt-3 text-slate-600">
          Desbloquea simuladores premium, explicaciones completas y seguimiento avanzado para aprobar mas rapido.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Gratis</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Hasta 3 explicaciones por simulador</li>
              <li>Simuladores base por parcial</li>
              <li>Acceso general a la plataforma</li>
            </ul>
          </section>
          <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-indigo-900">Premium</h2>
            <ul className="mt-3 space-y-2 text-sm text-indigo-800">
              <li>Simulador Premium (50 preguntas)</li>
              <li>Explicaciones completas de todas tus incorrectas</li>
              <li>Analisis y progreso avanzado para aprobar</li>
            </ul>
            <button
              type="button"
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Quiero pasarme a Premium
            </button>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/dashboard" className="text-sm font-semibold text-indigo-700 hover:text-indigo-800">
            Volver al dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
