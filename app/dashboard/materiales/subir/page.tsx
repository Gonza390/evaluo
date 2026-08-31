import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Crown, FileUp } from 'lucide-react';
import { QuickPdfUpload } from '@/components/dashboard/quick-pdf-upload';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { hasPremiumAccess } from '@/lib/premium';
import { createPublicClient } from '@/lib/supabase-public';
import { createClientServer } from '@/lib/supabase-server';

const FREE_PDF_LIMIT = 2;
const FREE_PDF_WINDOW_DAYS = 15;
const PREMIUM_PDF_DAILY_LIMIT = 3;

type UploadQuota = {
  plan: 'free' | 'premium';
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
  nextAvailableAt: string | null;
};

function formatQuotaDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

export default async function QuickPdfUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ materiaId?: string; source?: string; previewQuota?: string }>;
}) {
  const {
    materiaId: requestedMateriaId = '',
    source = '',
    previewQuota = '',
  } = await searchParams;
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

  const now = new Date();
  const premium = await hasPremiumAccess(user.id);
  let uploadQuota: UploadQuota;

  if (premium) {
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from('student_materials')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', dayStart.toISOString());

    if (error) throw error;
    const used = count ?? 0;
    uploadQuota = {
      plan: 'premium',
      used,
      limit: PREMIUM_PDF_DAILY_LIMIT,
      remaining: Math.max(0, PREMIUM_PDF_DAILY_LIMIT - used),
      exhausted: used >= PREMIUM_PDF_DAILY_LIMIT,
      nextAvailableAt: null,
    };
  } else {
    const intervalStart = addDays(now, -FREE_PDF_WINDOW_DAYS);
    const { data, error } = await supabase
      .from('student_materials')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', intervalStart.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    const rows = data ?? [];
    const used = rows.length;
    uploadQuota = {
      plan: 'free',
      used,
      limit: FREE_PDF_LIMIT,
      remaining: Math.max(0, FREE_PDF_LIMIT - used),
      exhausted: used >= FREE_PDF_LIMIT,
      nextAvailableAt:
        used >= FREE_PDF_LIMIT && rows[0]?.created_at
          ? addDays(new Date(rows[0].created_at), FREE_PDF_WINDOW_DAYS).toISOString()
          : null,
    };
  }

  if (process.env.VERCEL_ENV !== 'production') {
    if (previewQuota === 'exhausted') {
      uploadQuota = {
        plan: 'free',
        used: 2,
        limit: 2,
        remaining: 0,
        exhausted: true,
        nextAvailableAt: addDays(now, 5).toISOString(),
      };
    } else if (previewQuota === 'free') {
      uploadQuota = {
        plan: 'free',
        used: 1,
        limit: 2,
        remaining: 1,
        exhausted: false,
        nextAvailableAt: null,
      };
    }
  }

  const publicClient = createPublicClient();
  const [universidadesResult, carrerasResult, materiasResult, relacionesResult, profileResult] =
    await Promise.all([
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

  if (universidadesResult.error) throw universidadesResult.error;
  if (carrerasResult.error) throw carrerasResult.error;
  if (materiasResult.error) throw materiasResult.error;
  if (relacionesResult.error) throw relacionesResult.error;
  if (profileResult.error) throw profileResult.error;

  const universidades = universidadesResult.data ?? [];
  const carreras = carrerasResult.data ?? [];
  const materias = materiasResult.data ?? [];
  const carreraMaterias = relacionesResult.data ?? [];

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
    source === 'materia' && requestedMateriaId
      ? `/explorar/materia/${requestedMateriaId}`
      : '/dashboard';
  const nextFreeDate = formatQuotaDate(uploadQuota.nextAvailableAt);

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

        {uploadQuota.exhausted && uploadQuota.plan === 'free' ? (
          <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="bg-[radial-gradient(circle_at_85%_12%,rgba(99,102,241,0.16),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-7 sm:px-7 sm:py-9">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                <Crown className="h-5 w-5" />
              </span>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                Límite del plan gratis
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
                Ya usaste tus 2 PDFs gratuitos
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                {nextFreeDate
                  ? `Podés volver a subir gratis a partir del ${nextFreeDate}, o pasar a Premium para seguir estudiando sin esperar.`
                  : 'Podés esperar a que se libere tu cupo gratuito o pasar a Premium para seguir estudiando sin esperar.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <TrackedLink
                  href="/pricing?source=pdf_limit&utm_source=product&utm_medium=pdf_limit&utm_campaign=pdf_activation"
                  eventName="cta_click"
                  payload={{
                    location: 'pdf_quota_exhausted',
                    cta_name: 'continuar_con_premium',
                    destination: '/pricing',
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Continuar con Premium
                  <Crown className="h-4 w-4" />
                </TrackedLink>
                <Link
                  href={returnHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  {source === 'materia' ? 'Volver a mi materia' : 'Volver al dashboard'}
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
              <p className="text-xs leading-5 text-slate-500">
                Premium te permite subir hasta 3 PDFs por día.
              </p>
            </div>
          </section>
        ) : uploadQuota.exhausted ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FileUp className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950">
              Llegaste al límite de PDFs de hoy
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Con Premium podés subir hasta 3 PDFs por día. Mañana vas a poder volver a cargar material.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">
                  {uploadQuota.plan === 'free'
                    ? `Te ${uploadQuota.remaining === 1 ? 'queda' : 'quedan'} ${uploadQuota.remaining} de 2 PDFs gratis`
                    : `Premium · te ${uploadQuota.remaining === 1 ? 'queda' : 'quedan'} ${uploadQuota.remaining} de 3 PDFs hoy`}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {uploadQuota.plan === 'free'
                    ? 'El cupo gratuito se calcula sobre los últimos 15 días.'
                    : 'El cupo Premium se renueva cada día.'}
                </p>
              </div>
              {uploadQuota.plan === 'free' ? (
                <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                  {uploadQuota.used}/2 usados
                </span>
              ) : null}
            </div>

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
