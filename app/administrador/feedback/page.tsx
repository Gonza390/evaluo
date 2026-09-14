import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, MessageSquareText, Phone } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

type FeedbackView = 'general' | 'simuladores';

type ProductFeedbackRow = {
  id: string;
  user_id: string | null;
  path: string | null;
  device_type: string | null;
  metadata: unknown;
  created_at: string;
};

type ProductFeedbackMetadata = {
  category?: string;
  message?: string;
  phone?: string;
  source_path?: string;
};

type SimulatorFeedbackRow = {
  id: string;
  user_id: string;
  materia_id: string | null;
  parcial: number | null;
  mode: string;
  reason: string;
  comment: string | null;
  path: string;
  created_at: string;
};

type SimulatorAnalyticsRow = {
  id: string;
  event_name: 'simulator_needs_feedback' | 'simulator_rating';
  user_id: string | null;
  path: string | null;
  metadata: unknown;
  created_at: string;
};

type SimulatorAnalyticsMetadata = {
  reason?: string;
  mode?: string;
  phase?: string;
  materia_id?: string;
  parcial?: number;
  vote_type?: number;
};

type SimulatorDisplayItem = {
  key: string;
  kind: 'submitted' | 'needs' | 'rating';
  userId: string | null;
  materiaId: string | null;
  parcial: number | null;
  mode: string | null;
  reason: string | null;
  comment: string | null;
  phase: string | null;
  voteType: number | null;
  path: string | null;
  createdAt: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  problema: 'Problema',
  sugerencia: 'Sugerencia',
  contenido: 'Contenido',
  otro: 'Otro',
};

const REASON_LABELS: Record<string, string> = {
  more_questions: 'Más preguntas',
  better_explanations: 'Mejores explicaciones',
  summaries: 'Resúmenes',
  exam_similarity: 'Preguntas más parecidas al parcial',
  confusing_experience: 'Una experiencia más clara',
};

const MODE_LABELS: Record<string, string> = {
  regular: 'Simulador',
  errores: 'Repaso de errores',
  premium: 'Premium',
  ultimo_intento: 'Último intento',
  unknown: 'Simulador',
};

const PHASE_LABELS: Record<string, string> = {
  gate: 'Durante el simulador',
  finished: 'Al finalizar',
  abandoned: 'Antes de salir',
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatParcial(parcial: number | null) {
  if (!parcial) return '—';
  return parcial === 3 ? 'Mixto 1 + 2' : `Parcial ${parcial}`;
}

function readMetadata(value: unknown): ProductFeedbackMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const raw = value as Record<string, unknown>;
  return {
    category: typeof raw.category === 'string' ? raw.category : undefined,
    message: typeof raw.message === 'string' ? raw.message : undefined,
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    source_path: typeof raw.source_path === 'string' ? raw.source_path : undefined,
  };
}

function readSimulatorMetadata(value: unknown): SimulatorAnalyticsMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const raw = value as Record<string, unknown>;
  const parcialValue = typeof raw.parcial === 'number' ? raw.parcial : Number(raw.parcial);
  const voteValue = typeof raw.vote_type === 'number' ? raw.vote_type : Number(raw.vote_type);

  return {
    reason: typeof raw.reason === 'string' ? raw.reason : undefined,
    mode: typeof raw.mode === 'string' ? raw.mode : undefined,
    phase: typeof raw.phase === 'string' ? raw.phase : undefined,
    materia_id: typeof raw.materia_id === 'string' ? raw.materia_id : undefined,
    parcial: Number.isFinite(parcialValue) ? parcialValue : undefined,
    vote_type: Number.isFinite(voteValue) ? voteValue : undefined,
  };
}

function UserIdentity({
  userId,
  profileById,
  emailById,
}: {
  userId: string | null;
  profileById: Map<string, string | null>;
  emailById: Map<string, string | null>;
}) {
  const userName = userId
    ? profileById.get(userId) || 'Usuario sin nombre'
    : 'Usuario anónimo';
  const email = userId ? emailById.get(userId) || 'Email no disponible' : 'Sin cuenta asociada';

  return (
    <div className="min-w-[180px]">
      <p className="truncate text-sm font-medium text-slate-800">{userName}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
    </div>
  );
}

function simulatorTypeLabel(kind: SimulatorDisplayItem['kind']) {
  if (kind === 'rating') return 'Valoración';
  if (kind === 'submitted') return 'Comentario';
  return 'Encuesta rápida';
}

function simulatorResponseLabel(item: SimulatorDisplayItem) {
  if (item.kind === 'rating') {
    if (item.voteType === 1) return 'Sí, sirvió';
    if (item.voteType === -1) return 'No sirvió';
    return 'Valoración registrada';
  }

  return item.reason ? REASON_LABELS[item.reason] ?? item.reason : 'Sin respuesta identificada';
}

function simulatorMomentLabel(item: SimulatorDisplayItem) {
  if (item.phase) return PHASE_LABELS[item.phase] ?? item.phase;
  if (item.kind === 'rating') return 'Al finalizar';
  return 'En el simulador';
}

export default async function FeedbackAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const activeView: FeedbackView = params.view === 'simuladores' ? 'simuladores' : 'general';

  const admin = createAdminClient();
  const db = admin as unknown as SupabaseClient;

  const [productResponse, simulatorResponse, simulatorAnalyticsResponse] = await Promise.all([
    db
      .from('analytics_events')
      .select('id,user_id,path,device_type,metadata,created_at')
      .eq('event_name', 'product_feedback')
      .order('created_at', { ascending: false })
      .limit(200),
    db
      .from('simulator_feedback')
      .select('id,user_id,materia_id,parcial,mode,reason,comment,path,created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    db
      .from('analytics_events')
      .select('id,event_name,user_id,path,metadata,created_at')
      .in('event_name', ['simulator_needs_feedback', 'simulator_rating'])
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const productFeedback = (productResponse.data ?? []) as ProductFeedbackRow[];
  const simulatorFeedback = (simulatorResponse.data ?? []) as SimulatorFeedbackRow[];
  const simulatorAnalytics = (simulatorAnalyticsResponse.data ?? []) as SimulatorAnalyticsRow[];

  const filteredSimulatorAnalytics = simulatorAnalytics.filter((event) => {
    if (event.event_name !== 'simulator_needs_feedback' || !event.user_id) return true;

    const metadata = readSimulatorMetadata(event.metadata);
    if (!metadata.reason) return true;

    const eventTime = new Date(event.created_at).getTime();
    return !simulatorFeedback.some((item) => {
      if (
        item.user_id !== event.user_id ||
        item.reason !== metadata.reason ||
        item.path !== event.path
      ) {
        return false;
      }

      const submittedTime = new Date(item.created_at).getTime();
      return Math.abs(submittedTime - eventTime) <= 15 * 60 * 1000;
    });
  });

  const simulatorItems: SimulatorDisplayItem[] = [
    ...simulatorFeedback.map((item) => ({
      key: `submitted-${item.id}`,
      kind: 'submitted' as const,
      userId: item.user_id,
      materiaId: item.materia_id,
      parcial: item.parcial,
      mode: item.mode,
      reason: item.reason,
      comment: item.comment,
      phase: null,
      voteType: null,
      path: item.path,
      createdAt: item.created_at,
    })),
    ...filteredSimulatorAnalytics.map((item) => {
      const metadata = readSimulatorMetadata(item.metadata);
      return {
        key: `${item.event_name}-${item.id}`,
        kind: item.event_name === 'simulator_rating' ? ('rating' as const) : ('needs' as const),
        userId: item.user_id,
        materiaId: metadata.materia_id ?? null,
        parcial: metadata.parcial ?? null,
        mode: metadata.mode ?? null,
        reason: metadata.reason ?? null,
        comment: null,
        phase: metadata.phase ?? null,
        voteType: metadata.vote_type ?? null,
        path: item.path,
        createdAt: item.created_at,
      };
    }),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 200);

  const userIds = Array.from(
    new Set(
      [
        ...productFeedback.map((item) => item.user_id),
        ...simulatorItems.map((item) => item.userId),
      ].filter((id): id is string => Boolean(id))
    )
  );
  const materiaIds = Array.from(
    new Set(
      simulatorItems
        .map((item) => item.materiaId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const [profilesResponse, materiasResponse, authUsersResponse] = await Promise.all([
    userIds.length
      ? admin.from('profiles').select('id,nombre').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    materiaIds.length
      ? admin.from('materias').select('id,nombre').in('id', materiaIds)
      : Promise.resolve({ data: [], error: null }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const profileById = new Map(
    (profilesResponse.data ?? []).map((profile) => [profile.id, profile.nombre?.trim() || null])
  );
  const materiaById = new Map(
    (materiasResponse.data ?? []).map((materia) => [materia.id, materia.nombre?.trim() || 'Materia'])
  );
  const emailById = new Map(
    (authUsersResponse.data?.users ?? []).map((user) => [user.id, user.email ?? null])
  );

  const withPhone = productFeedback.filter((item) => Boolean(readMetadata(item.metadata).phone?.trim())).length;
  const totalFeedback = productFeedback.length + simulatorItems.length;
  const simulatorSourceWarning = Boolean(simulatorResponse.error || simulatorAnalyticsResponse.error);

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <MessageSquareText className="h-4 w-4" />
              Feedback
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">Voz del usuario</h1>
            <p className="mt-1 text-sm text-slate-500">
              Comentarios de Ayuda y señales recogidas en los simuladores.
            </p>
          </div>

          <Link
            href="/administrador"
            className="inline-flex h-9 items-center gap-2 self-start text-sm font-medium text-slate-500 transition hover:text-slate-900 sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </Link>
        </header>

        <div className="flex flex-wrap gap-x-7 gap-y-2 border-b border-slate-200 py-4 text-sm text-slate-500">
          <span><strong className="font-semibold text-slate-900">{totalFeedback}</strong> total</span>
          <span><strong className="font-semibold text-slate-900">{productFeedback.length}</strong> general</span>
          <span><strong className="font-semibold text-slate-900">{simulatorItems.length}</strong> simuladores</span>
          <span><strong className="font-semibold text-slate-900">{withPhone}</strong> con teléfono</span>
        </div>

        <nav className="flex gap-6 border-b border-slate-200" aria-label="Tipos de feedback">
          <Link
            href="/administrador/feedback?view=general"
            prefetch={false}
            className={`border-b-2 px-0 py-3 text-sm font-semibold transition ${
              activeView === 'general'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            General <span className="ml-1 font-normal text-slate-400">{productFeedback.length}</span>
          </Link>
          <Link
            href="/administrador/feedback?view=simuladores"
            prefetch={false}
            className={`border-b-2 px-0 py-3 text-sm font-semibold transition ${
              activeView === 'simuladores'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Simuladores <span className="ml-1 font-normal text-slate-400">{simulatorItems.length}</span>
          </Link>
        </nav>

        {activeView === 'general' ? (
          productResponse.error ? (
            <p className="border-b border-rose-200 py-5 text-sm text-rose-700">
              No se pudo cargar el feedback general en este momento.
            </p>
          ) : productFeedback.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm font-semibold text-slate-800">Todavía no hay feedback general.</p>
              <p className="mt-1 text-sm text-slate-500">Los comentarios enviados desde Ayuda van a aparecer acá.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="w-[150px] py-3 pr-5">Fecha</th>
                    <th className="w-[120px] py-3 pr-5">Categoría</th>
                    <th className="py-3 pr-5">Comentario</th>
                    <th className="w-[220px] py-3 pr-5">Usuario</th>
                    <th className="w-[170px] py-3 pr-5">Contacto</th>
                    <th className="w-[180px] py-3">Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {productFeedback.map((item) => {
                    const metadata = readMetadata(item.metadata);
                    const category = metadata.category || 'otro';
                    const phone = metadata.phone?.trim() || '';
                    const sourcePath = metadata.source_path || item.path || '—';
                    const phoneHref = phone ? phone.replace(/[^\d+]/g, '') : '';

                    return (
                      <tr key={item.id} className="border-b border-slate-100 align-top text-sm">
                        <td className="py-4 pr-5 text-xs whitespace-nowrap text-slate-500">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="py-4 pr-5">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            {CATEGORY_LABELS[category] ?? category}
                          </span>
                        </td>
                        <td className="max-w-[420px] py-4 pr-5 leading-6 text-slate-800">
                          {metadata.message || 'Sin comentario.'}
                        </td>
                        <td className="py-4 pr-5">
                          <UserIdentity
                            userId={item.user_id}
                            profileById={profileById}
                            emailById={emailById}
                          />
                        </td>
                        <td className="py-4 pr-5">
                          {phone ? (
                            <a
                              href={`tel:${phoneHref}`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:underline"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {phone}
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-4">
                          <p className="max-w-[180px] truncate text-xs text-slate-500" title={sourcePath}>
                            {sourcePath}
                          </p>
                          {item.device_type ? (
                            <p className="mt-1 text-xs text-slate-400">{item.device_type}</p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <>
            {simulatorSourceWarning ? (
              <p className="border-b border-amber-200 py-4 text-sm text-amber-700">
                Una de las fuentes de feedback del simulador no pudo cargarse. Se muestran los datos disponibles.
              </p>
            ) : null}

            {simulatorItems.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-semibold text-slate-800">Todavía no hay feedback de simuladores.</p>
                <p className="mt-1 text-sm text-slate-500">Las nuevas respuestas van a aparecer acá.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <th className="w-[150px] py-3 pr-5">Fecha</th>
                      <th className="w-[125px] py-3 pr-5">Tipo</th>
                      <th className="py-3 pr-5">Respuesta</th>
                      <th className="w-[240px] py-3 pr-5">Materia</th>
                      <th className="w-[130px] py-3 pr-5">Parcial</th>
                      <th className="w-[150px] py-3 pr-5">Momento</th>
                      <th className="w-[220px] py-3">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulatorItems.map((item) => {
                      const materia = item.materiaId
                        ? materiaById.get(item.materiaId) || 'Materia'
                        : 'Materia no identificada';

                      return (
                        <tr key={item.key} className="border-b border-slate-100 align-top text-sm">
                          <td className="py-4 pr-5 text-xs whitespace-nowrap text-slate-500">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="py-4 pr-5">
                            <span className="text-xs font-medium text-slate-600">
                              {simulatorTypeLabel(item.kind)}
                            </span>
                          </td>
                          <td className="max-w-[360px] py-4 pr-5">
                            <p className={`font-medium ${item.kind === 'rating' && item.voteType === -1 ? 'text-rose-700' : 'text-slate-900'}`}>
                              {simulatorResponseLabel(item)}
                            </p>
                            {item.comment ? (
                              <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">{item.comment}</p>
                            ) : null}
                          </td>
                          <td className="py-4 pr-5">
                            <p className="font-medium text-slate-800">{materia}</p>
                            {item.mode ? (
                              <p className="mt-1 text-xs text-slate-400">{MODE_LABELS[item.mode] ?? item.mode}</p>
                            ) : null}
                          </td>
                          <td className="py-4 pr-5 text-sm text-slate-600">
                            {formatParcial(item.parcial)}
                          </td>
                          <td className="py-4 pr-5 text-xs text-slate-500">
                            {simulatorMomentLabel(item)}
                          </td>
                          <td className="py-4">
                            <UserIdentity
                              userId={item.userId}
                              profileById={profileById}
                              emailById={emailById}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
