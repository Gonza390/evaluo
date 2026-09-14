import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ArrowLeft,
  CalendarClock,
  MessageSquareText,
  MonitorSmartphone,
  Phone,
  UserRound,
} from 'lucide-react';
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

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(value));
  } catch {
    return value;
  }
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

function UserIdentity({
  userId,
  profileById,
  emailById,
}: {
  userId: string | null;
  profileById: Map<string, string | null>;
  emailById: Map<string, string | null>;
}) {
  const userName = userId ? profileById.get(userId) || 'Usuario sin nombre' : 'Usuario no identificado';
  const email = userId ? emailById.get(userId) || 'Email no disponible' : 'Email no disponible';

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <UserRound className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{userName}</p>
        <p className="truncate text-xs text-slate-500">{email}</p>
      </div>
    </div>
  );
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

  const [productResponse, simulatorResponse] = await Promise.all([
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
  ]);

  const productFeedback = (productResponse.data ?? []) as ProductFeedbackRow[];
  const simulatorFeedback = (simulatorResponse.data ?? []) as SimulatorFeedbackRow[];

  const userIds = Array.from(
    new Set(
      [
        ...productFeedback.map((item) => item.user_id),
        ...simulatorFeedback.map((item) => item.user_id),
      ].filter((id): id is string => Boolean(id))
    )
  );
  const materiaIds = Array.from(
    new Set(
      simulatorFeedback
        .map((item) => item.materia_id)
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
  const totalFeedback = productFeedback.length + simulatorFeedback.length;

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-indigo-700 uppercase">
              <MessageSquareText className="h-4 w-4" />
              Voz del usuario
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950">Feedback</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Comentarios enviados desde Ayuda y respuestas recogidas al finalizar simuladores.
            </p>
          </div>

          <Link
            href="/administrador"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </Link>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Total visible</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{totalFeedback}</p>
            <p className="mt-1 text-xs text-slate-500">Últimos 200 de cada origen.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Feedback general</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{productFeedback.length}</p>
            <p className="mt-1 text-xs text-slate-500">Enviado desde Ayuda.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Simuladores</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{simulatorFeedback.length}</p>
            <p className="mt-1 text-xs text-slate-500">Comentarios de preparación.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Con teléfono</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{withPhone}</p>
            <p className="mt-1 text-xs text-slate-500">Usuarios que esperan contacto rápido.</p>
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <Link
            href="/administrador/feedback?view=general"
            prefetch={false}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeView === 'general'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            General ({productFeedback.length})
          </Link>
          <Link
            href="/administrador/feedback?view=simuladores"
            prefetch={false}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeView === 'simuladores'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Simuladores ({simulatorFeedback.length})
          </Link>
        </div>

        {activeView === 'general' ? (
          productResponse.error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
              No se pudo cargar el feedback general en este momento.
            </div>
          ) : productFeedback.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <MessageSquareText className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Todavía no hay feedback general.</p>
              <p className="mt-1 text-sm text-slate-500">Los comentarios enviados desde Ayuda van a aparecer acá.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {productFeedback.map((item) => {
                const metadata = readMetadata(item.metadata);
                const category = metadata.category || 'otro';
                const phone = metadata.phone?.trim() || '';
                const sourcePath = metadata.source_path || item.path || 'Página no identificada';
                const phoneHref = phone ? phone.replace(/[^\d+]/g, '') : '';

                return (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                            {CATEGORY_LABELS[category] ?? category}
                          </span>
                          {item.device_type ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              <MonitorSmartphone className="h-3.5 w-3.5" />
                              {item.device_type}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 break-all text-xs text-slate-500">{sourcePath}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                        <CalendarClock className="h-4 w-4" />
                        {formatDate(item.created_at)}
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-semibold tracking-[0.1em] text-slate-500 uppercase">Comentario</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {metadata.message || 'Sin comentario.'}
                      </p>
                    </div>

                    {phone ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <p className="text-xs font-semibold tracking-[0.1em] text-emerald-700 uppercase">Contacto rápido</p>
                        <a
                          href={`tel:${phoneHref}`}
                          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {phone}
                        </a>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <UserIdentity
                        userId={item.user_id}
                        profileById={profileById}
                        emailById={emailById}
                      />
                      {item.user_id ? (
                        <code className="break-all text-[10px] text-slate-400">{item.user_id}</code>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : simulatorResponse.error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            No se pudo cargar el feedback del simulador en este momento.
          </div>
        ) : simulatorFeedback.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <MessageSquareText className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-800">Todavía no hay feedback de simuladores.</p>
            <p className="mt-1 text-sm text-slate-500">Las nuevas respuestas van a aparecer acá.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {simulatorFeedback.map((item) => {
              const materia = item.materia_id
                ? materiaById.get(item.materia_id) || 'Materia'
                : 'Materia no identificada';

              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                          {REASON_LABELS[item.reason] ?? item.reason}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {MODE_LABELS[item.mode] ?? item.mode}
                        </span>
                        {item.parcial ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Parcial {item.parcial}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-base font-bold text-slate-950">{materia}</h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                      <CalendarClock className="h-4 w-4" />
                      {formatDate(item.created_at)}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold tracking-[0.1em] text-slate-500 uppercase">Comentario</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {item.comment || 'Sin comentario adicional.'}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <UserIdentity
                      userId={item.user_id}
                      profileById={profileById}
                      emailById={emailById}
                    />
                    <code className="break-all text-[10px] text-slate-400">{item.user_id}</code>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
