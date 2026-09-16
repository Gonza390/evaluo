import { redirect } from 'next/navigation';
import { PdfFirstUpload } from '@/components/dashboard/pdf-first-upload';
import { createClientServer } from '@/lib/supabase-server';

export default async function PdfFirstUploadPage({
  searchParams,
}: {
  searchParams: Promise<{
    materiaId?: string;
    source?: string;
    examDate?: string;
    dailyMinutes?: string;
  }>;
}) {
  const {
    materiaId: requestedMateriaId = '',
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
    if (requestedMateriaId) params.set('materiaId', requestedMateriaId);
    if (source) params.set('source', source);
    if (examDate) params.set('examDate', examDate);
    if (dailyMinutes) params.set('dailyMinutes', dailyMinutes);
    const nextPath = `/dashboard/materiales/subir${params.toString() ? `?${params.toString()}` : ''}`;
    redirect(`/login?next=${encodeURIComponent(nextPath)}&reason=prepare-material`);
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

  const profileUniversidadId = universidades.some(
    (item) => item.id === profileResult.data?.universidad_id
  )
    ? String(profileResult.data?.universidad_id ?? '')
    : '';

  const profileCarreraId = carreras.some(
    (item) =>
      item.id === profileResult.data?.carrera_id &&
      (!profileUniversidadId || item.universidad_id === profileUniversidadId)
  )
    ? String(profileResult.data?.carrera_id ?? '')
    : '';

  const subjectBelongsToCareer = (subjectId: string, careerId: string) => {
    const subject = materias.find((item) => item.id === subjectId);
    if (!subject || !careerId) return false;
    if (subject.carrera_id === careerId) return true;
    return carreraMaterias.some(
      (relation) => relation.carrera_id === careerId && relation.materia_id === subjectId
    );
  };

  let initialUniversidadId = profileUniversidadId;
  let initialCarreraId = profileCarreraId;
  let initialMateriaId = '';

  const requestedSubject = materias.find((item) => item.id === requestedMateriaId);
  if (requestedSubject) {
    let contextualCareerId = '';

    if (profileCarreraId && subjectBelongsToCareer(requestedSubject.id, profileCarreraId)) {
      contextualCareerId = profileCarreraId;
    } else if (
      requestedSubject.carrera_id &&
      carreras.some((item) => item.id === requestedSubject.carrera_id)
    ) {
      contextualCareerId = requestedSubject.carrera_id;
    } else {
      contextualCareerId =
        carreraMaterias.find(
          (relation) => relation.materia_id === requestedSubject.id && relation.carrera_id
        )?.carrera_id ?? '';
    }

    const contextualCareer = carreras.find((item) => item.id === contextualCareerId);
    if (contextualCareer) {
      initialCarreraId = contextualCareer.id;
      initialUniversidadId = contextualCareer.universidad_id ?? initialUniversidadId;
      initialMateriaId = requestedSubject.id;
    }
  } else {
    const lastSubjectId = String(profileResult.data?.last_subject_id ?? '');
    if (initialCarreraId && subjectBelongsToCareer(lastSubjectId, initialCarreraId)) {
      initialMateriaId = lastSubjectId;
    }
  }

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
