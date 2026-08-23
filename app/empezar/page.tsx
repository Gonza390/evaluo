import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, BookOpen, FileUp, Globe2, LockKeyhole, Sparkles } from 'lucide-react';
import { getDashboardBootstrap } from '@/lib/data/dashboard-bootstrap';
import { getMateriaRoute } from '@/lib/routes';

export default async function EmpezarPage() {
  const bootstrap = await getDashboardBootstrap();

  if (bootstrap.status === 'login') {
    redirect('/login?next=%2Fempezar');
  }

  if (bootstrap.status === 'complete-profile') {
    redirect('/completar-perfil?next=%2Fempezar');
  }

  const firstSubject = bootstrap.state.lastSubject ?? bootstrap.state.activeSubjects[0] ?? null;
  const exploreHref = firstSubject ? getMateriaRoute(firstSubject.id) : '/explorar';
  const careerLabel = bootstrap.academicProfile?.carreraNombre ?? 'tu carrera';
  const universityLabel = bootstrap.academicProfile?.universidadNombre ?? null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_48%,#F8FAFC_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(135deg,#2563EB_0%,#4F46E5_52%,#6366F1_100%)] px-5 py-8 text-white sm:px-8 sm:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Tu espacio ya está listo
            </div>
            <h1 className="mt-4 max-w-2xl text-[2rem] leading-[1.02] font-bold tracking-[-0.06em] sm:text-[2.7rem]">
              Empezá por tu materia. Evaluo hace el resto más simple.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 sm:text-base">
              {universityLabel ? `${careerLabel} · ${universityLabel}. ` : `${careerLabel}. `}
              Podés estudiar con lo que ya compartió la comunidad o convertir tus propios apuntes
              en un espacio de estudio.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
            <Link
              href={exploreHref}
              className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(37,99,235,0.10)] sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-bold tracking-[0.14em] text-blue-600 uppercase">
                Camino 1
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
                Explorar contenido de mi materia
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Abrí resúmenes, pregunteros y apuntes que otros estudiantes ya compartieron para
                esa materia.
              </p>
              {firstSubject ? (
                <p className="mt-3 text-sm font-semibold text-slate-800">{firstSubject.name}</p>
              ) : null}
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                Ir a estudiar
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>

            <Link
              href="/dashboard/materiales?openUpload=1"
              className="group rounded-[1.5rem] border border-amber-200/80 bg-[linear-gradient(135deg,#FFF7ED_0%,#FFFBEB_100%)] p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_18px_45px_rgba(245,158,11,0.12)] sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white">
                <FileUp className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-bold tracking-[0.14em] text-amber-700 uppercase">
                Camino 2
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
                Subir mi propio PDF
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Subí un apunte y Evaluo procesa su contenido para armar resumen, glosario, tarjetas
                y ejercicios sobre ese material.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                Subir mi primer PDF
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/60 p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-emerald-700">
                <Globe2 className="h-5 w-5" />
                <p className="text-xs font-bold tracking-[0.14em] uppercase">Comunidad Evaluo</p>
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950 sm:text-2xl">
                Lo que compartís hace crecer tu materia
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Cuando subís un PDF podés compartirlo con la materia para que otros alumnos lo
                encuentren y estudien con ese aporte. Si el material es sólo para vos, también podés
                mantenerlo privado.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-emerald-700 shadow-sm">
                  <Globe2 className="h-3.5 w-3.5" />
                  Compartir es opcional
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  También podés mantenerlo privado
                </span>
              </div>
            </div>

            <Link
              href="/dashboard/materiales?openUpload=1"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Hacer mi primer aporte
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
