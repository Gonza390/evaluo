import { redirect } from 'next/navigation';
import { PdfFirstUpload } from '@/components/dashboard/pdf-first-upload';
import { createClientServer } from '@/lib/supabase-server';

export default async function NewStudentMaterialPage() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/login?mode=signup&next=%2Fdashboard%2Fmateriales%2Fnuevo&reason=prepare-material'
    );
  }

  const [universidadesResult, carrerasResult, materiasResult, relationsResult, profileResult] =
    await Promise.all([
      supabase.from('universidades').select('id, nombre').order('nombre'),
      supabase.from('carreras').select('id, nombre, universidad_id').order('nombre'),
      supabase.from('materias').select('id, nombre, carrera_id').order('nombre'),
      supabase.from('carrera_materias').select('carrera_id, materia_id'),
      supabase
        .from('profiles')
        .select('universidad_id, carrera_id, last_subject_id')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

  if (universidadesResult.error) throw universidadesResult.error;
  if (carrerasResult.error) throw carrerasResult.error;
  if (materiasResult.error) throw materiasResult.error;
  if (relationsResult.error) throw relationsResult.error;
  if (profileResult.error) throw profileResult.error;

  const universidades = universidadesResult.data ?? [];
  const carreras = carrerasResult.data ?? [];
  const materias = materiasResult.data ?? [];
  const carreraMaterias = relationsResult.data ?? [];

  const initialUniversidadId = universidades.some(
    (item) => item.id === profileResult.data?.universidad_id
  )
    ? String(profileResult.data?.universidad_id ?? '')
    : '';

  const initialCarreraId = carreras.some(
    (item) =>
      item.id === profileResult.data?.carrera_id &&
      (!initialUniversidadId || item.universidad_id === initialUniversidadId)
  )
    ? String(profileResult.data?.carrera_id ?? '')
    : '';

  const lastSubjectId = String(profileResult.data?.last_subject_id ?? '');
  const initialMateriaId =
    initialCarreraId &&
    materias.some((item) => {
      if (item.id !== lastSubjectId) return false;
      if (item.carrera_id === initialCarreraId) return true;
      return carreraMaterias.some(
        (relation) =>
          relation.carrera_id === initialCarreraId && relation.materia_id === lastSubjectId
      );
    })
      ? lastSubjectId
      : '';

  return (
    <main className="min-h-screen bg-white px-4 py-5 sm:px-6 lg:px-8">
      <PdfFirstUpload
        universidades={universidades}
        carreras={carreras}
        materias={materias}
        carreraMaterias={carreraMaterias}
        initialUniversidadId={initialUniversidadId}
        initialCarreraId={initialCarreraId}
        initialMateriaId={initialMateriaId}
      />
    </main>
  );
}
