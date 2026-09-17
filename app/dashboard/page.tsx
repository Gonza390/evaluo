import { redirect } from 'next/navigation';
import { PdfFirstUploadShell } from '@/components/dashboard/pdf-first-upload-shell';
import { MaeveDashboardChrome } from '@/components/dashboard/maeve-dashboard-chrome';
import { StudentMaterialsWorkspace } from '@/components/dashboard/student-materials-workspace';
import { ReferralPortalDashboardShortcut } from '@/components/referrals/ReferralPortalDashboardShortcut';
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

/**
 * Ship E — Dashboard = Maeve «mi espacio de estudio».
 * Own materials first + empty CTA «Subí tu PDF» (PdfFirstUploadShell / ?openUpload=1).
 * University/career catalog is demoted to a secondary link inside the workspace.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    openUpload?: string;
    universidadId?: string;
    carreraId?: string;
    materiaId?: string;
    examDate?: string;
  }>;
}) {
  const { openUpload, universidadId, carreraId, materiaId, examDate = '' } = await searchParams;
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
    if (examDate) params.set('examDate', examDate);
    const query = params.toString();
    const nextPath = query ? `/dashboard?${query}` : '/dashboard';
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
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
    const resolvedCarreraId = careerBelongsToUniversity(requestedCarreraId, profileUniversidadId)
      ? requestedCarreraId
      : careerBelongsToUniversity(profileCarreraId, profileUniversidadId)
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
    const uploadMateriaId = subjectBelongsToCareer(requestedMateriaId, resolvedCarreraId)
      ? requestedMateriaId
      : '';

    return (
      <div className="animate-page-enter min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
        <ReferralPortalDashboardShortcut />
        <div className="mx-auto max-w-6xl">
          <PdfFirstUploadShell
            universidades={universidades}
            carreras={carreras}
            materias={materias}
            carreraMaterias={carreraMaterias}
            initialUniversidadId={profileUniversidadId}
            initialCarreraId={resolvedCarreraId}
            initialMateriaId={uploadMateriaId}
            initialExamDate={examDate}
            initialOpen={openUpload === '1'}
          >
            <MaeveDashboardChrome
              materialsCount={materials.length}
              sharedMaterialsCount={materials.filter((m) => m.visibility === 'shared').length}
              initialCarreraId={resolvedCarreraId}
            >
              <StudentMaterialsWorkspace
                initialMaterials={materials}
                universidades={universidades}
                carreras={carreras}
                materias={materias}
                carreraMaterias={carreraMaterias}
                initialUniversidadId={profileUniversidadId}
                initialCarreraId={resolvedCarreraId}
                initialMateriaId={uploadMateriaId}
                initialOpenUpload={false}
              />
            </MaeveDashboardChrome>
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
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50/70 px-6 py-8 text-center">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            Falta activar el espacio de materiales
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            La tabla `student_materials` todavía no está disponible, así que este espacio no puede
            cargar ni guardar PDFs todavía.
          </p>
        </div>
      </div>
    );
  }
}
