import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Eye,
  FileUp,
  LockKeyhole,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { LazyMaeveStudySpace } from '@/components/dashboard/lazy-maeve-study-space';
import { getDashboardBootstrap } from '@/lib/data/dashboard-bootstrap';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
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
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=%2Fempezar&reason=guided-start');
  }

  let hasPendingAcademicContext = false;

  if (careerId || firstSubject?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- approval_status is ahead of generated DB types
    const approvalClient = supabase as any;
    const [careerResult, subjectResult] = await Promise.all([
      careerId
        ? approvalClient.from('carreras').select('approval_status').eq('id', careerId).maybeSingle()
        : Promise.resolve({ data: null }),
      firstSubject?.id
        ? approvalClient.from('materias').select('approval_status').eq('id', firstSubject.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    hasPendingAcademicContext =
      Boolean(careerResult.data && careerResult.data.approval_status !== 'approved') ||
      Boolean(subjectResult.data && subjectResult.data.approval_status !== 'approved');
  }

  const [
    materials,
    universidadesResult,
    carrerasResult,
    materiasResult,
    carreraMateriasResult,
  ] = await Promise.all([
    fetchStudentMaterialsByUser(supabase, user.id),
    supabase.from('universidades').select('id, nombre').order('nombre'),
    supabase.from('carreras').select('id, nombre, universidad_id').order('nombre'),
    supabase.from('materias').select('id, nombre, carrera_id').order('nombre'),
    supabase.from('carrera_materias').select('carrera_id, materia_id'),
  ]);

  const universidades = universidadesResult.data ?? [];
  const carreras = carrerasResult.data ?? [];
  const materias = materiasResult.data ?? [];
  const carreraMaterias = carreraMateriasResult.data ?? [];

  const uploadParams = new URLSearchParams({ openUpload: '1', source: 'onboarding' });
  if (universityId) uploadParams.set('universidadId', universityId);
  if (careerId) uploadParams.set('carreraId', careerId);
  if (firstSubject?.id) uploadParams.set('materiaId', firstSubject.id);
  const uploadHref = `/dashboard?${uploadParams.toString()}`;

  const academicContext = [
    bootstrap.academicProfile?.carreraNombre,
    bootstrap.academicProfile?.universidadNombre,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-white">
      <div
        className="pointer-events-none select-none opacity-80 blur-[1.5px]"
        aria-hidden="true"
      >
        <LazyMaeveStudySpace
          materials={materials}
          universidades={universidades}
          carreras={carreras}
          materias={materias}
          carreraMaterias={carreraMaterias}
          initialUniversidadId={universityId ?? ''}
          initialCarreraId={careerId ?? ''}
          initialMateriaId={firstSubject?.id ?? ''}
          initialOpen={false}
        />
      </div>

      <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/22 px-3 py-4 backdrop-blur-[5px] sm:px-5 sm:py-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-pdf-title"
          className="relative my-auto w-full max-w-[540px] overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.28)]"
        >
          <Link
            href="/dashboard"
            aria-label="Cerrar y entrar a mi espacio"
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:right-4 sm:top-4"
          >
            <X className="h-5 w-5" />
          </Link>

          <div className="max-h-[calc(100vh-2rem)] overflow-y-auto px-5 pb-5 pt-7 sm:max-h-[calc(100vh-3rem)] sm:px-8 sm:pb-7 sm:pt-8">
            <header className="pr-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                Empezá con tus apuntes
              </p>
              <h1
                id="onboarding-pdf-title"
                className="mx-auto mt-3 max-w-[420px] text-[1.8rem] font-bold leading-[1.06] tracking-[-0.055em] text-slate-950 sm:text-[2.15rem]"
              >
                Subí el material que entra en tu examen
              </h1>
              <p className="mx-auto mt-3 max-w-[430px] text-sm leading-6 text-slate-600 sm:text-[15px]">
                Evaluo procesa tu PDF para ayudarte a estudiar, practicar y detectar qué temas necesitás reforzar.
              </p>
              {academicContext ? (
                <p className="mt-2 text-xs font-semibold text-slate-400">{academicContext}</p>
              ) : null}
            </header>

            <div className="mx-auto mt-6 max-w-[430px] space-y-4 sm:mt-7">
              <div className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <FileUp className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Procesamos tu PDF</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Organizamos el contenido para que puedas estudiarlo sin empezar de cero.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <BookOpen className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Estudiás sobre ese material</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Resumen, conceptos clave, tarjetas y práctica salen de tus propios apuntes.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Target className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Descubrís qué reforzar</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Evaluo detecta tus errores y te lleva al tema que conviene volver a estudiar.
                  </p>
                </div>
              </div>
            </div>

            {hasPendingAcademicContext ? (
              <div className="mx-auto mt-5 flex max-w-[430px] items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500">
                <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                Tu carrera o materia está en revisión, pero podés empezar ahora. Tu material se mantiene privado.
              </div>
            ) : null}

            <div className="mx-auto mt-6 max-w-[430px]">
              <Link
                href={uploadHref}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-center text-sm font-semibold text-white shadow-[0_12px_28px_rgba(79,70,229,0.24)] transition hover:bg-indigo-700"
              >
                Subir mis apuntes y empezar
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/demo/material-estudio"
                className="mt-2.5 inline-flex min-h-10 w-full items-center justify-center gap-2 text-center text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
              >
                <Eye className="h-4 w-4" />
                Ver cómo queda un PDF procesado
              </Link>

              <Link
                href="/dashboard"
                className="mt-1 inline-flex min-h-9 w-full items-center justify-center text-center text-xs font-semibold text-slate-400 transition hover:text-slate-700"
              >
                Ahora no
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
