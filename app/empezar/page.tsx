import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, BookOpen, FileUp, Globe2, LockKeyhole } from 'lucide-react';
import { getDashboardBootstrap } from '@/lib/data/dashboard-bootstrap';
import { getMateriaRoute } from '@/lib/routes';

export default async function EmpezarPage() {
  const bootstrap = await getDashboardBootstrap();

  if (bootstrap.status === 'login') {
    redirect('/login?next=%2Fempezar&reason=guided-start');
  }

  if (bootstrap.status === 'complete-profile') {
    redirect('/completar-perfil?next=%2Fempezar');
  }

  const firstSubject = bootstrap.state.lastSubject ?? bootstrap.state.activeSubjects[0] ?? null;
  const exploreHref = firstSubject ? getMateriaRoute(firstSubject.id) : '/explorar';
  const careerLabel = bootstrap.academicProfile?.carreraNombre ?? 'tu carrera';
  const universityLabel = bootstrap.academicProfile?.universidadNombre ?? null;

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-slate-200 pb-8 sm:pb-10">
          <p className="text-xs font-bold tracking-[0.16em] text-blue-600 uppercase">Tu espacio ya está listo</p>
          <h1 className="mt-3 max-w-2xl text-[2rem] leading-[1.03] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2.7rem]">
            Elegí cómo querés empezar a estudiar.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            {universityLabel ? `${careerLabel} · ${universityLabel}. ` : `${careerLabel}. `}
            Podés usar el material que ya existe en tu materia o preparar tus propios apuntes.
          </p>
        </header>

        <section className="divide-y divide-slate-200 border-b border-slate-200">
          <Link
            href={exploreHref}
            className="group grid gap-4 py-7 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-start sm:gap-5"
          >
            <BookOpen className="h-5 w-5 text-blue-600" />
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">01</p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
                Explorar contenido de mi materia
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Abrí resúmenes, pregunteros y apuntes que otros estudiantes ya compartieron para esa
                materia.
              </p>
              {firstSubject ? (
                <p className="mt-3 text-sm font-semibold text-slate-800">{firstSubject.name}</p>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 sm:pt-7">
              Ir a estudiar
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/dashboard/materiales?openUpload=1"
            className="group grid gap-4 py-7 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-start sm:gap-5"
          >
            <FileUp className="h-5 w-5 text-blue-600" />
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">02</p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
                Subir mi propio PDF
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Subí un apunte y Evaluo procesa su contenido para armar resumen, glosario, tarjetas
                y ejercicios sobre ese material.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 sm:pt-7">
              Subir mi PDF
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </section>

        <section className="grid gap-5 py-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-slate-700">
              <Globe2 className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold tracking-[0.14em] uppercase">Comunidad Evaluo</p>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
              Compartir tu material es opcional.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Podés compartir un PDF con tu materia para que otros estudiantes lo encuentren, o
              mantenerlo privado y usarlo solo en tu espacio.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-blue-600" />
                Compartir es opcional
              </span>
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole className="h-3.5 w-3.5" />
                También podés mantenerlo privado
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/materiales?openUpload=1"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Hacer mi primer aporte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
