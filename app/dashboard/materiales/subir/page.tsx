import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getStudentMaterialUploadQuotaAction } from '@/app/dashboard/materiales/upload-actions';
import { QuickPdfUpload } from '@/components/dashboard/quick-pdf-upload';
import {
  PdfUploadLimitReached,
  PdfUploadQuotaStatus,
} from '@/components/pdf-activation/pdf-upload-quota';
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
    const params = new URLSearchParams();
    if (requestedMateriaId) params.set('materiaId', requestedMateriaId);
    if (source) params.set('source', source);
    const nextPath = `/dashboard/materiales/subir${params.toString() ? `?${params.toString()}` : ''}`;
    redirect(`/login?next=${encodeURIComponent(nextPath)}&reason=prepare-material`);
  }

  const [
    universidadesResult,
    carrerasResult,
    materiasResult,
    relacionesResult,
    profileResult,
    quotaResult,
  ] = await Promise.all([
    supabase.from('universidades').select('id, nombre').order('nombre'),
    supabase.from('carreras').select('id, nombre, universidad_id').order('nombre'),
    supabase.from('materias').select('id, nombre, carrera_id').order('nombre'),
    supabase.from('carrera_materias').select('carrera_id, materia_id'),
    supabase
      .from('profiles')
      .select('universidad_id, carrera_id')
      .eq('id', user.id)
      .maybeSingle(),
    getStudentMaterialUploadQuotaAction(),
  ]);

  if (universidadesResult.error) throw universidadesResult.error;
  if (carrerasResult.error) throw carrerasResult.error;
  if (materiasResult.error) throw materiasResult.error;
  if (relacionesResult.error) throw relacionesResult.error;
  if (profileResult.error) throw profileResult.error;
  if (!quotaResult.success || !quotaResult.quota) throw new Error(quotaResult.message);

  const universidades = universidadesResult.data ?? [];
  const carreras = carrerasResult.data ?? [];
  const materias = materiasResult.data ?? [];
  const carreraMaterias = relacionesResult.data ?? [];
  const quota = quotaResult.quota;

  const profileUniversidadId = String(profileResult.data?.universidad_id ?? '');
  const profileCarreraId = String(profileResult.data?.carrera_id ?? '');

  const validCareer = (careerId: string) => carreras.some((item) => item.id === careerId);
  const materiaBelongsToCareer = (subjectId: string, careerId: string) => {
    const subject = materias.find((item) => item.id === subjectId);
    if (!subject || !careerId) return false;
    if (subject.carrera_id === careerId) return true;
    return carreraMaterias.some(
      (relation) => relation.carrera_id === careerId && relation.materia_id === subjectId
    );
  };

  let initialUniversidadId = universidades.some((item) => item.id === profileUniversidadId)
    ? profileUniversidadId
    : '';
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
      initialUniversidadId = contextualCareer.universidad_id ?? '';
      initialMateriaId = requestedSubject.id;
    }
  }

  if (initialCarreraId) {
    const selectedCareer = carreras.find((item) => item.id === initialCarreraId);
    if (selectedCareer?.universidad_id) {
      initialUniversidadId = selectedCareer.universidad_id;
    }
  }

  const returnHref =
    source === 'materia' && requestedSubject
      ? `/explorar/materia/${requestedSubject.id}`
      : '/dashboard';
  const quotaExhausted = !quota.isPremium && (quota.remaining ?? 0) <= 0;

  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href={returnHref}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        {quotaExhausted ? (
          <PdfUploadLimitReached
            quota={quota}
            returnHref={returnHref}
            materiaId={requestedSubject?.id}
          />
        ) : (
          <>
            <PdfUploadQuotaStatus quota={quota} />
            <QuickPdfUpload
              universidades={universidades}
              carreras={carreras}
              materias={materias}
              carreraMaterias={carreraMaterias}
              initialUniversidadId={initialUniversidadId}
              initialCarreraId={initialCarreraId}
              initialMateriaId={initialMateriaId}
            />
          </>
        )}
      </div>
    </main>
  );
}
