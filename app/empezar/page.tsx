import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  FileUp,
  LockKeyhole,
  Sparkles,
  Target,
} from 'lucide-react';
import { getDashboardBootstrap } from '@/lib/data/dashboard-bootstrap';
import { createClientServer } from '@/lib/supabase-server';

export default async function EmpezarPage() {
  const bootstrap = await getDashboardBootstrap();

  if (bootstrap.status === 'login') {
    redirect('/login?next=%2Fempezar&reason=guided-start');
  }

  if (bootstrap.status === 'complete-profile') {
    redirect('/completar-perfil?next=%2Fempezar');
  }

  const firstSubject = bootstrap.state.lastSubject ?? bootstrap.state.activeSubjects[0] ?? null;
  const careerId = bootstrap.academicProfile?.carreraId ?? null;
  const universityId = bootstrap.academicProfile?.universidadId ?? null;
  let hasPendingAcademicContext = false;

  if (careerId || firstSubject?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CI unblock for PDF-first merge
    const supabase = (await createClientServer()) as any;
    const [careerResult, subjectResult] = await Promise.all([
      careerId
        ? supabase.from('carreras').select('approval_status').eq('id', careerId).maybeSingle()
        : Promise.resolve({ data: null }),
      firstSubject?.id
        ? supabase.from('materias').select('approval_status').eq('id', firstSubject.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    hasPendingAcademicContext =
      Boolean(careerResult.data && careerResult.data.approval_status !== 'approved') ||
      Boolean(subjectResult.data && subjectResult.data.approval_status !== 'approved');
  }

  const uploadParams = new URLSearchParams({ openUpload: '1', source: 'onboarding' });
  if (universityId) uploadParams.set('universidadId', universityId);
  if (careerId) uploadParams.set('carreraId', careerId);
  if (firstSubject?.id) uploadParams.set('materiaId', firstSubject.id);
  const uploadHref = `/dashboard?${uploadParams.toString()}`;

  const careerLabel = bootstrap.academicProfile?.carreraNombre ?? null;
  const universityLabel = bootstrap.academicProfile?.universidadNombre ?? null;
  const academicContext = [careerLabel, universityLabel].filter(Boolean).join(' · ');

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.16em] text-blue-600 uppercase">
            Empezá con tu propio material
          </p>
          <h1 className="mt-3 text-[2.05rem] leading-[1.03] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2.9rem]">
            Subí los apuntes que entran en tu examen y empezá a estudiar sobre ellos.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Evaluo procesa tu PDF para ayudarte a entenderlo, practicarlo y detectar qué temas
            necesitás reforzar antes de rendir.
          </p>
          {academicContext ? (
            <p className="mt-3 text-sm font-semibold text-slate-500">{academicContext}</p>
          ) : null}
        </header>

        <section className="mt-8 border-y border-slate-200 py-7 sm:mt-10 sm:py-9">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FileUp className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">
                    Primer paso
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-slate-950 sm:text-2xl">
                    Prepará tu primer PDF
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                <div>
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Procesamos tus apuntes</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Convertimos el PDF en un espacio de estudio listo para trabajar.
                  </p>
                </div>
                <div>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Estudiás sobre ese material</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Resumen, conceptos clave, tarjetas y ejercicios salen de tus propios apuntes.
                  </p>
                </div>
                <div>
                  <Target className="h-4 w-4 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Descubrís qué reforzar</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Evaluo detecta tus errores y te lleva al tema que conviene volver a estudiar.
                  </p>
                </div>
              </div>

              {hasPendingAcademicContext ? (
                <div className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <p>
                    Tu carrera o materia todavía está en revisión. Podés empezar igual: tu PDF y ese
                    contexto se mantienen privados mientras lo revisamos.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <p>
                    Tu PDF puede quedar privado. No necesitás compartir tus apuntes para estudiar con
                    Evaluo.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:border-l lg:border-slate-200 lg:pl-7">
              <Link
                href={uploadHref}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Subir mis apuntes y empezar
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo/material-estudio"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-center text-sm font-semibold text-slate-500 transition hover:text-blue-700"
              >
                Ver cómo queda un PDF procesado
              </Link>
              <p className="mt-4 text-center text-xs leading-5 text-slate-400 lg:text-left">
                Elegís el archivo, Evaluo lo procesa y después te guía dentro de ese material.
              </p>
            </div>
          </div>
        </section>

        <div className="py-6 text-center">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-slate-400 transition hover:text-slate-700"
          >
            Ir a mi espacio sin subir un PDF ahora
          </Link>
        </div>
      </div>
    </main>
  );
}
