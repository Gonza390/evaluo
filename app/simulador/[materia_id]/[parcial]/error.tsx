'use client';

import Link from 'next/link';

export default function SimuladorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold tracking-[0.16em] text-indigo-700 uppercase">Simulador</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          No pudimos cargar esta práctica
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          El servicio de datos no respondió correctamente. Tu materia no fue eliminada; podés volver a intentarlo.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Reintentar
          </button>
          <Link
            href="/simulador"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Volver al simulador
          </Link>
        </div>
      </div>
    </main>
  );
}
