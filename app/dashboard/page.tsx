import { redirect } from 'next/navigation';
import { CalendarDays, Clock3, Sparkles } from 'lucide-react';
import { StudyStatePanel } from '@/components/study-state-panel';
import { AcademicProfileReminder } from '@/components/dashboard/academic-profile-reminder';
import { LazyMaeveStudySpace } from '@/components/dashboard/lazy-maeve-study-space';
import { ReferralPortalDashboardShortcut } from '@/components/referrals/ReferralPortalDashboardShortcut';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { getPendingStudyErrorTopicCount } from '@/lib/study-errors';
import { getDashboardNextStudyAction } from '@/lib/dashboard-next-study-action';
import { createClientServer } from '@/lib/supabase-server';
import { isUuid } from '@/lib/uuid';

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

/**
 * Mi espacio canónico del usuario: materiales propios + upload PDF-first.
 * Los accesos legacy de /dashboard/materiales redirigen acá preservando contexto.
 */
export default async function DashboardPage({
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
    const nextPath = query ? `/dashboard?${query}` : '/dashboard';
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  try {
    // PDF-first: la pantalla no requiere descargar el catálogo académico.
    // Los datos de universidad/carrera se cargan solamente si se abre el formulario opcional.
    const [materials, pendingReinforcementCount] = await Promise.all([
      fetchStudentMaterialsByUser(supabase, user.id),
      getPendingStudyErrorTopicCount(user.id),
    ]);

    const nextStudyAction = await getDashboardNextStudyAction(user.id, materials);

    // Preguntar los datos académicos sólo después de tener un PDF listo.
    // El formulario de carga inicial y la guía del primer PDF no se interrumpen.
    const hasReadyMaterial = materials.some((material) => material.processing_status === 'ready');
    const profileContext = hasReadyMaterial && openUpload !== '1'
      ? await supabase
          .from('profiles')
          .select('universidad_id, carrera_id')
          .eq('id', user.id)
          .maybeSingle()
      : null;
    const needsAcademicContext = Boolean(
      profileContext && !profileContext.error &&
      (!profileContext.data?.universidad_id || !profileContext.data?.carrera_id)
    );

    // Conservamos el contexto específico de pregunteros y landings por materia.
    // La verificación de pertenencia y permisos se realiza en finalizePdfFirstUploadAction,
    // no mediante la descarga global de 784 materias y 1.401 relaciones.
    const resolvedUniversidadId = universidadId && isUuid(universidadId) ? universidadId : '';
    const resolvedCarreraId = carreraId && isUuid(carreraId) ? carreraId : '';
    const uploadMateriaId =
      materiaId && isUuid(materiaId) && resolvedUniversidadId && resolvedCarreraId
        ? materiaId
        : '';
    const requestedMateriaId = materiaId && isUuid(materiaId) ? materiaId : '';

    const isSucesorioPlan = source === 'preguntero-derecho-sucesorio-p2';
    const formattedExamDate = formatExamDate(examDate);
    const parsedDailyMinutes = Number.parseInt(dailyMinutes, 10);
    const safeDailyMinutes = [30, 45, 60, 90].includes(parsedDailyMinutes)
      ? parsedDailyMinutes
      : null;

    return (
      <div className="animate-page-enter min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
        <ReferralPortalDashboardShortcut />
        <div className="mx-auto max-w-6xl">
          {isSucesorioPlan ? (
            <section className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.13em] text-blue-700 uppercase">
                    Plan de estudio · Derecho Sucesorio · Parcial 2
                  </p>
                  <h1 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">
                    Subí tus apuntes para empezar con el plan que armaste
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    La materia ya está preseleccionada. El PDF que subas será la fuente para resumen, glosario, tarjetas y práctica.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                    {formattedExamDate ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-blue-100">
                        <CalendarDays className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                        Rendís {formattedExamDate}
                      </span>
                    ) : null}
                    {safeDailyMinutes ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-blue-100">
                        <Clock3 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                        {safeDailyMinutes} min por día
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <LazyMaeveStudySpace
            materials={materials}
            initialUniversidadId={resolvedUniversidadId}
            initialCarreraId={resolvedCarreraId}
            initialMateriaId={uploadMateriaId}
            initialExamDate={examDate}
            initialSource={source}
            trackingMateriaId={requestedMateriaId}
            initialOpen={openUpload === '1'}
            pendingReinforcementCount={pendingReinforcementCount}
            nextStudyAction={nextStudyAction}
          />
          {needsAcademicContext ? (
            <AcademicProfileReminder
              userId={user.id}
              missingUniversity={!profileContext?.data?.universidad_id}
            />
          ) : null}
        </div>
      </div>
    );
  } catch (error) {
    if (!isMissingStudentMaterialsTableError(error)) {
      throw error;
    }

    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
        <StudyStatePanel
          iconName="alert-triangle"
          tone="warning"
          eyebrow="Mi espacio"
          title="Falta activar el espacio de materiales"
          description="El almacenamiento de materiales todavía no está disponible, así que este espacio no puede cargar ni guardar PDFs por el momento."
          className="w-full"
        />
      </div>
    );
  }
}
