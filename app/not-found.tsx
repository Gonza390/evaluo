import Link from 'next/link';
import { ArrowLeft, BookOpen, Compass, ListChecks } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[72vh] bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_100%)] px-4 py-16 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs font-bold tracking-[0.16em] text-blue-600 uppercase">Página no encontrada</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-4xl">
          Ese contenido ya no está disponible
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          El enlace puede haber cambiado o apuntar a contenido que ya no existe. Podés seguir
          estudiando desde cualquiera de estas secciones.
        </p>

        <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
          <Link
            href="/explorar"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.20)] transition hover:opacity-95"
          >
            <BookOpen className="h-4 w-4" />
            Explorar materias
          </Link>
          <Link
            href="/pregunteros"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:text-blue-700"
          >
            <ListChecks className="h-4 w-4" />
            Ir a Pregunteros
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
