import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarDays, Clock3, FileText, Sparkles } from 'lucide-react';
import { PdfFirstUploadShell } from '@/components/dashboard/pdf-first-upload-shell';
import { StudentMaterialsWorkspace } from '@/components/dashboard/student-materials-workspace';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { createClientServer } from '@/lib/supabase-server';

function isMissingStudentMaterialsTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code ?? '') : '';
  const message = 'message' in error ? String(error.message ?? '') : '';

  return code === '42P01' || message.toLowerCase().includes('student_materials');
}

function formatExamDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export default async function DashboardMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{
    openUpload?: string;
    universidadId?: string;
    carreraId?: string;
    materiaId?: string;
    source?: string;
    examDate?: string;
    dailyMinutes?: string;
  }>;
}) {
  const {
    openUpload,
    universidadId,
    carreraId,
    materiaId,
    source = '',
    examDate = '',
    dailyMinutes = '',
  } = await searchParams;
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const params = new URLSearchParams();
    if (openUpload === '1') params.set('openUpload', '1');
    if (universidadId) params.set('universidadId', universidadId);
    if (carreraId) params.set('carreraId', carreraId);
    if (materiaId) params.set('materiaId', materiaId);
    if (source) params.set('source', source);
    if (examDate) params.set('examDate', examDate);
    if (dailyMinutes) params.set('dailyMinutes', dailyMinutes);
    const query = params.toString();
    const nextPath = query ? `/dashboard/materiales?${query}` : '/dashboard/materiales';
    redirect(`/login?next=${encodeURIComponent(nextPath)}&reason=prepare-material`);
  }

  try {
    const [
      materials,
      universidadesResult,
      carrerasResult,
      materiasResult,
      carreraMateriasResult,
      profileResult,
    ] = await Promise.all([
      fetchStudentMaterialsByUser(supabase, user.id),
      supabase.from('universidades').select('id, nombre').order('nombre'),
      supabase.from('carreras').select('id, nombre, universidad_id').order('nombre'),
      supabase.from('materias').select('id, nombre, carrera_id').order('nombre'),
      supabase.from('carrera_materias').select('carrera_id, materia_id'),
      supabase
        .from('profiles')
        .select('universidad_id, carrera_id')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    if (universidadesResult.error) throw universidadesResult.error;
    if (carrerasResult.error) throw carrerasResult.error;
    if (materiasResult.error) throw materiasResult.error;
    if (carreraMateriasResult.error) throw carreraMateriasResult.error;
    if (profileResult.error) throw profileResult.error;

    const universidades = universidadesResult.data ?? [];
    const carreras = carrerasResult.data ?? [];
    const materias = materiasResult.data ?? [];
    const carreraMaterias = carreraMateriasResult.data ?? [];

    const rawProfileUniversidadId = String(profileResult.data?.universidad_id ?? '');
    const profileUniversidadId = universidades.some(
      (universidad) => universidad.id === rawProfileUniversidadId
    )
      ? rawProfileUniversidadId
      : '';
    const requestedUniversidadId = String(universidadId ?? '');
    const resolvedUniversidadId = universidades.some(
      (universidad) => universidad.id === requestedUniversidadId
    )
      ? requestedUniversidadId
      : profileUniversidadId;

    const careerBelongsToUniversity = (candidateId: string, universityId: string) =>
      Boolean(
        candidateId &&
          universityId &&
          carreras.some(
            (carrera) =>
              carrera.id === candidateId && carrera.universidad_id === universityId
          )
      );
    const requestedCarreraId = String(carreraId ?? '');
    const profileCarreraId = String(profileResult.data?.carrera_id ?? '');
    const resolvedCarreraId = careerBelongsToUniversity(requestedCarreraId, resolvedUniversidadId)
      ? requestedCarreraId
      : careerBelongsToUniversity(profileCarreraId, resolvedUniversidadId)
        ? profileCarreraId
        : '';

    const subjectBelongsToCareer = (subjectId: string, careerId: string) => {
      if (!subjectId || !careerId) return false;
      const subject = materias.find((materia) => materia.id === subjectId);
      if (!subject) return false;
      if (subject.carrera_id === careerId) return true;
      return carreraMaterias.some(
        (relation) => relation.carrera_id === careerId && relation.materia_id === subjectId
      );
    };

    const requestedMateriaId = String(materiaId ?? '');
    const resolvedMateriaId = subjectBelongsToCareer(requestedMateriaId, resolvedCarreraId)
      ? requestedMateriaId
      : '';

    const uploadCarreraId = careerBelongsToUniversity(requestedCarreraId, profileUniversidadId)
      ? requestedCarreraId
      : careerBelongsToUniversity(profileCarreraId, profileUniversidadId)
        ? profileCarreraId
        : '';
    const uploadMateriaId = subjectBelongsToCareer(requestedMateriaId, uploadCarreraId)
      ? requestedMateriaId
      : '';

    const isSucesorioPlan = source === 'preguntero-derecho-sucesorio-p2';
    const formattedExamDate = formatExamDate(examDate);
    const parsedDailyMinutes = Number.parseInt(dailyMinutes, 10);
    const safeDailyMinutes = [30, 45, 60, 90].includes(parsedDailyMinutes)
      ? parsedDailyMinutes
      : null;

    return (
      <div className="animate-page-enter min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {isSucesorioPlan ? (
            <section className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.13em] text-indigo-700 uppercase">
                    Plan de estudio · Derecho Sucesorio · Parcial 2
                  </p>
                  <h1 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">
                    Subí tus apuntes para empezar con el plan que armaste
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    La materia ya está preseleccionada. El PDF que subas será la fuente para resumen, glosario, flashcards y ejercicios.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                    {formattedExamDate ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-indigo-100">
                        <CalendarDays className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
                        Rendís {formattedExamDate}
                      </span>
                    ) : null}
                    {safeDailyMinutes ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-indigo-100">
                        <Clock3 className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
                        {safeDailyMinutes} min por día
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <PdfFirstUploadShell
            universidades={universidades}
            carreras={carreras}
            materias={materias}
            carreraMaterias={carreraMaterias}
            initialUniversidadId={profileUniversidadId}
            initialCarreraId={uploadCarreraId}
            initialMateriaId={uploadMateriaId}
            initialExamDate={examDate}
            initialOpen={openUpload === '1'}
          >
            <StudentMaterialsWorkspace
              initialMaterials={materials}
              universidades={universidades}
              carreras={carreras}
              materias={materias}
              carreraMaterias={carreraMaterias}
              initialUniversidadId={resolvedUniversidadId}
              initialCarreraId={resolvedCarreraId}
              initialMateriaId={resolvedMateriaId}
              initialOpenUpload={false}
            />
          </PdfFirstUploadShell>
        </div>
      </div>
    );
  } catch (error) {
    if (!isMissingStudentMaterialsTableError(error)) {
      throw error;
    }

    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
        <div className="surface-panel flex w-full flex-col items-center justify-center gap-4 border-amber-200 bg-amber-50/70 px-6 py-8 text-center sm:px-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <FileText className="h-7 w-7" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              Falta activar el espacio de materiales
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              La tabla `student_materials` todavía no existe en la base de datos remota, así que
              esta sección no puede cargar ni guardar PDFs todavía.
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Aplicá la migración nueva de Supabase y volvé a entrar a esta pantalla.
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Volver al dashboard
            </Link>
            <Link
              href="/materias"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              Ir a materias
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
