import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';

export default async function QuickPdfUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ materiaId?: string; source?: string }>;
}) {
  const { materiaId: requestedMateriaId = '', source = '' } = await searchParams;
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const legacyParams = new URLSearchParams();
    if (requestedMateriaId) legacyParams.set('materiaId', requestedMateriaId);
    if (source) legacyParams.set('source', source);
    const nextPath = `/dashboard/materiales/subir${legacyParams.toString() ? `?${legacyParams.toString()}` : ''}`;
    redirect(`/login?next=${encodeURIComponent(nextPath)}&reason=prepare-material`);
  }

  const [carrerasResult, materiasResult, relacionesResult, profileResult] = await Promise.all([
    supabase.from('carreras').select('id, universidad_id'),
    supabase.from('materias').select('id, carrera_id'),
    supabase.from('carrera_materias').select('carrera_id, materia_id'),
    supabase
      .from('profiles')
      .select('universidad_id, carrera_id')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  if (carrerasResult.error) throw carrerasResult.error;
  if (materiasResult.error) throw materiasResult.error;
  if (relacionesResult.error) throw relacionesResult.error;
  if (profileResult.error) throw profileResult.error;

  const carreras = carrerasResult.data ?? [];
  const materias = materiasResult.data ?? [];
  const carreraMaterias = relacionesResult.data ?? [];
  const profileCarreraId = String(profileResult.data?.carrera_id ?? '');
  const profileUniversidadId = String(profileResult.data?.universidad_id ?? '');

  const validCareer = (careerId: string) => carreras.some((item) => item.id === careerId);
  const materiaBelongsToCareer = (subjectId: string, careerId: string) => {
    const subject = materias.find((item) => item.id === subjectId);
    if (!subject || !careerId) return false;
    if (subject.carrera_id === careerId) return true;
    return carreraMaterias.some(
      (relation) => relation.carrera_id === careerId && relation.materia_id === subjectId
    );
  };

  let initialUniversidadId = profileUniversidadId;
  let initialCarreraId = validCareer(profileCarreraId) ? profileCarreraId : '';
  let initialMateriaId = '';

  const requestedSubject = materias.find((item) => item.id === requestedMateriaId);
  if (requestedSubject) {
    let contextualCareerId = '';

    if (profileCarreraId && materiaBelongsToCareer(requestedSubject.id, profileCarreraId)) {
      contextualCareerId = profileCarreraId;
    } else if (requestedSubject.carrera_id && validCareer(requestedSubject.carrera_id)) {
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
  }

  const params = new URLSearchParams({ openUpload: '1' });
  if (initialUniversidadId) params.set('universidadId', initialUniversidadId);
  if (initialCarreraId) params.set('carreraId', initialCarreraId);
  if (initialMateriaId) params.set('materiaId', initialMateriaId);

  redirect(`/dashboard/materiales?${params.toString()}`);
}
