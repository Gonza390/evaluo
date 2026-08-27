import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { StudentMaterialsWorkspace } from '@/components/dashboard/student-materials-workspace';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { createPublicClient } from '@/lib/supabase-public';
import { createClientServer } from '@/lib/supabase-server';

function isMissingStudentMaterialsTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code ?? '') : '';
  const message = 'message' in error ? String(error.message ?? '') : '';

  return code === '42P01' || message.toLowerCase().includes('student_materials');
}

export default async function DashboardMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{
    openUpload?: string;
    universidadId?: string;
    carreraId?: string;
    materiaId?: string;
  }>;
}) {
  const { openUpload, universidadId, carreraId, materiaId } = await searchParams;
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
    const query = params.toString();
    const nextPath = query ? `/dashboard/materiales?${query}` : '/dashboard/materiales';
    redirect(`/login?next=${encodeURIComponent(nextPath)}&reason=prepare-material`);
  }

  try {
    const publicClient = createPublicClient();

    const [
      materials,
      universidadesResult,
      carrerasResult,
      materiasResult,
      carreraMateriasResult,
      profileResult,
    ] = await Promise.all([
      fetchStudentMaterialsByUser(supabase, user.id),
      publicClient.from('universidades').select('id, nombre').order('nombre'),
      publicClient.from('carreras').select('id, nombre, universidad_id').order('nombre'),
      publicClient.from('materias').select('id, nombre, carrera_id').order('nombre'),
      publicClient.from('carrera_materias').select('carrera_id, materia_id'),
      supabase
        .from('profiles')
        .select('universidad_id, carrera_id')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    if (universidadesResult.error) {
      throw universidadesResult.error;
    }

    if (carrerasResult.error) {
      throw carrerasResult.error;
    }

    if (materiasResult.error) {
      throw materiasResult.error;
    }

    if (carreraMateriasResult.error) {
      throw carreraMateriasResult.error;
    }

    if (profileResult.error) {
      throw profileResult.error;
    }

    const universidades = universidadesResult.data ?? [];
    const carreras = carrerasResult.data ?? [];
    const materias = materiasResult.data ?? [];
    const carreraMaterias = carreraMateriasResult.data ?? [];

    const profileUniversidadId = String(profileResult.data?.universidad_id ?? '');
    const requestedUniversidadId = String(universidadId ?? '');
    const resolvedUniversidadId = universidades.some(
      (universidad) => universidad.id === requestedUniversidadId
    )
      ? requestedUniversidadId
      : profileUniversidadId;

    const isCareerValid = (candidateId: string) =>
      carreras.some(
        (carrera) =>
          carrera.id === candidateId &&
          (!resolvedUniversidadId || carrera.universidad_id === resolvedUniversidadId)
      );
    const requestedCarreraId = String(carreraId ?? '');
    const profileCarreraId = String(profileResult.data?.carrera_id ?? '');
    const resolvedCarreraId = isCareerValid(requestedCarreraId)
      ? requestedCarreraId
      : isCareerValid(profileCarreraId)
        ? profileCarreraId
        : '';

    const requestedMateriaId = String(materiaId ?? '');
    const isMateriaValid = materias.some((materia) => {
      if (materia.id !== requestedMateriaId || !resolvedCarreraId) return false;
      if (materia.carrera_id === resolvedCarreraId) return true;
      return carreraMaterias.some(
        (relation) =>
          relation.carrera_id === resolvedCarreraId && relation.materia_id === requestedMateriaId
      );
    });
    const resolvedMateriaId = isMateriaValid ? requestedMateriaId : '';

    return (
      <div className="animate-page-enter from-background/95 min-h-screen bg-gradient-to-br via-white/80 to-emerald-50/20 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <StudentMaterialsWorkspace
            initialMaterials={materials}
            universidades={universidades}
            carreras={carreras}
            materias={materias}
            carreraMaterias={carreraMaterias}
            initialUniversidadId={resolvedUniversidadId}
            initialCarreraId={resolvedCarreraId}
            initialMateriaId={resolvedMateriaId}
            initialOpenUpload={openUpload === '1'}
          />
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
