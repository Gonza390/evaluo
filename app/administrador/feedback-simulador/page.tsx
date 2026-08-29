import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ArrowLeft,
  CalendarClock,
  MessageSquareText,
  UserRound,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

type FeedbackRow = {
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

export default async function SimulatorFeedbackAdminPage() {
  const admin = createAdminClient();
  const db = admin as unknown as SupabaseClient;
  const { data, error } = await db
    .from('simulator_feedback')
    .select('id,user_id,materia_id,parcial,mode,reason,comment,path,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const feedback = (data ?? []) as FeedbackRow[];
  const userIds = Array.from(new Set(feedback.map((item) => item.user_id)));
  const materiaIds = Array.from(
    new Set(feedback.map((item) => item.materia_id).filter((id): id is string => Boolean(id)))
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

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-indigo-700 uppercase">
              <MessageSquareText className="h-4 w-4" />
              Voz del usuario
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Feedback del simulador
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Motivos y comentarios enviados desde la pregunta “¿Qué te faltó para sentirte más preparado?”.
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

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Respuestas visibles</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{feedback.length}</p>
            <p className="mt-1 text-xs text-slate-500">Se muestran las últimas 200.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Usuarios identificados</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">{userIds.length}</p>
            <p className="mt-1 text-xs text-slate-500">Cada registro conserva el ID del usuario.</p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            No se pudo cargar el feedback del simulador en este momento.
          </div>
        ) : feedback.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <MessageSquareText className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-800">Todavía no hay feedback guardado.</p>
            <p className="mt-1 text-sm text-slate-500">Las nuevas respuestas van a aparecer acá.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {feedback.map((item) => {
              const userName = profileById.get(item.user_id) || 'Usuario sin nombre';
              const email = emailById.get(item.user_id) || 'Email no disponible';
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
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{userName}</p>
                        <p className="truncate text-xs text-slate-500">{email}</p>
                      </div>
                    </div>
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
