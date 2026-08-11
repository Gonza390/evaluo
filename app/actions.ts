'use server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdminActor, listAdminUserIds } from '@/lib/admin-users';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/observability';
import type { DashboardAnalytics, DashboardMateriaState } from '@/types/supabase';
import { requirePremiumUser } from '@/lib/premium';
import {
  buildWrongAnswersExplanations,
  type WrongAnswerExplanation,
} from '@/lib/simulator-wrong-answers';
import { safeRecordSimulatorTopicMemory } from '@/lib/simulator-topic-memory';

export interface Pregunta {
  id: string;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
  materia_id: string;
  parcial: number;
}

export interface DashboardState {
  lastSubject: DashboardMateriaState | null;
  activeSubjects: DashboardMateriaState[];
  finishedSubjects: DashboardMateriaState[];
  analytics: DashboardAnalytics;
}

export interface PartialStudyInsights {
  materiaId: string;
  parcial: number;
  totalPreguntasParcial: number;
  preguntasRespondidasParcial: number;
  preguntasAcertadasParcial: number;
  coberturaPorcentaje: number;
  modelosEstimadosRealizados: number;
  promedioAciertoPorcentaje: number;
  probabilidadAprobar: number;
}

export interface SimulatorRatingSummary {
  parcial: number;
  likes: number;
  dislikes: number;
  total: number;
  approvalPercent: number;
  averageScore: number;
}

export interface SimulatorUsageSummary {
  parcial: number;
  views: number;
}

const defaultDashboardAnalytics: DashboardAnalytics = {
  subjectsCompleted: 0,
  lastUpdatedAt: null,
};

const defaultDashboardState: DashboardState = {
  lastSubject: null,
  activeSubjects: [],
  finishedSubjects: [],
  analytics: defaultDashboardAnalytics,
};

function shuffleArray<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

async function selectDiverseSimulatorQuestions(
  supabase: Awaited<ReturnType<typeof createClientServer>>,
  pool: Pregunta[],
  materiaId: string,
  parcial: number,
  limit: number
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return shuffleArray(pool).slice(0, limit);
  }

  const poolIds = pool.map((question) => question.id).filter(Boolean);
  if (poolIds.length === 0) {
    return [];
  }

  const { data: seenRows, error: seenError } = await supabase
    .from('historial_respuestas')
    .select('pregunta_id, fecha_respuesta')
    .eq('usuario_id', user.id)
    .eq('materia_id', materiaId)
    .in('pregunta_id', poolIds)
    .order('fecha_respuesta', { ascending: false })
    .limit(5000);

  if (seenError) {
    logError('actions.selectDiverseSimulatorQuestions.seenRows', seenError, {
      materiaId,
      parcial,
      limit,
      poolSize: pool.length,
    });
    return shuffleArray(pool).slice(0, limit);
  }

  const seenQuestionIds = new Set(
    (seenRows ?? [])
      .map((row) => row.pregunta_id)
      .filter((value): value is string => Boolean(value))
  );

  const unseen = pool.filter((question) => !seenQuestionIds.has(question.id));
  const seen = pool.filter((question) => seenQuestionIds.has(question.id));

  const unseenTarget = Math.min(
    unseen.length,
    limit,
    limit >= 30 ? 20 : Math.max(limit - 10, 0)
  );
  const seenTarget = Math.max(0, limit - unseenTarget);

  const selected = [
    ...shuffleArray(unseen).slice(0, unseenTarget),
    ...shuffleArray(seen).slice(0, seenTarget),
  ];

  if (selected.length < Math.min(limit, pool.length)) {
    const selectedIds = new Set(selected.map((question) => question.id));
    const remainder = shuffleArray(pool.filter((question) => !selectedIds.has(question.id)));
    selected.push(...remainder.slice(0, Math.min(limit, pool.length) - selected.length));
  }

  return shuffleArray(selected).slice(0, limit);
}

function buildPreguntasBancoQuery(
  client: Awaited<ReturnType<typeof createClientServer>> | ReturnType<typeof createAdminClient>,
  materiaId: string,
  parcial: number,
  universidadId: string | undefined,
  carreraId: string | undefined,
  scope: 'strict' | 'university' | 'shared'
) {
  let query = client.from('preguntas_banco').select('*').eq('materia_id', materiaId);

  if (parcial === 3) {
    query = query.in('parcial', [1, 2]);
  } else {
    query = query.eq('parcial', parcial);
  }

  if (scope !== 'shared' && universidadId) {
    query = query.eq('universidad_id', universidadId);
  }

  if (scope === 'strict' && carreraId) {
    query = query.eq('carrera_id', carreraId);
  }

  return query;
}

/**
 * Obtiene 30 preguntas aleatorias de la base de datos para una materia y parcial específicos.
 */
export async function getPreguntasSimulador(
  materiaId: string,
  parcial: number,
  universidadId?: string,
  carreraId?: string
): Promise<Pregunta[]> {
  try {
    const supabase = await createClientServer();

    const runQuery = async (scope: 'strict' | 'university' | 'shared') =>
      buildPreguntasBancoQuery(supabase, materiaId, parcial, universidadId, carreraId, scope);

    let { data, error } = await runQuery('strict');

    if ((!data || data.length === 0) && !error && universidadId && carreraId) {
      ({ data, error } = await runQuery('university'));
    }

    if ((!data || data.length === 0) && !error) {
      ({ data, error } = await runQuery('shared'));
    }

    if (error) {
      logError('actions.getPreguntasSimulador.query', error, {
        materiaId,
        parcial,
        universidadId: universidadId ?? null,
        carreraId: carreraId ?? null,
      });
      throw new Error('No se pudieron obtener las preguntas.');
    }

    if (!data || data.length === 0) {
      return [];
    }

    const questionLimit = parcial === 3 ? 50 : 30;
    const diversified = await selectDiverseSimulatorQuestions(
      supabase,
      data as Pregunta[],
      materiaId,
      parcial,
      questionLimit
    );
    return diversified as Pregunta[];
  } catch (error) {
    logError('actions.getPreguntasSimulador', error, {
      materiaId,
      parcial,
      universidadId: universidadId ?? null,
      carreraId: carreraId ?? null,
    });
    return [];
  }
}

export async function getPreguntasSimuladorDemo(
  materiaId: string,
  parcial: number,
  universidadId?: string,
  carreraId?: string
): Promise<Pregunta[]> {
  try {
    const admin = createAdminClient();

    const runQuery = async (scope: 'strict' | 'university' | 'shared') =>
      buildPreguntasBancoQuery(admin, materiaId, parcial, universidadId, carreraId, scope);

    let { data, error } = await runQuery('strict');

    if ((!data || data.length === 0) && !error && universidadId && carreraId) {
      ({ data, error } = await runQuery('university'));
    }

    if ((!data || data.length === 0) && !error) {
      ({ data, error } = await runQuery('shared'));
    }

    if (error) {
      logError('actions.getPreguntasSimuladorDemo.query', error, {
        materiaId,
        parcial,
        universidadId: universidadId ?? null,
        carreraId: carreraId ?? null,
      });
      throw new Error('No se pudieron obtener las preguntas de muestra.');
    }

    if (!data || data.length === 0) {
      return [];
    }

    const shuffled = shuffleArray(data as Pregunta[]);
    const questionLimit = parcial === 3 ? 50 : 30;
    return shuffled.slice(0, questionLimit) as Pregunta[];
  } catch (error) {
    logError('actions.getPreguntasSimuladorDemo', error, {
      materiaId,
      parcial,
      universidadId: universidadId ?? null,
      carreraId: carreraId ?? null,
    });
    return [];
  }
}

export async function getPreguntasSimuladorErrores(
  materiaId: string,
  parcial?: number
): Promise<Pregunta[]> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: wrongHistory, error: wrongError } = await supabase
      .from('historial_respuestas')
      .select('pregunta_id')
      .eq('usuario_id', user.id)
      .eq('materia_id', materiaId)
      .eq('es_correcta', false)
      .order('fecha_respuesta', { ascending: false })
      .limit(500);

    if (wrongError || !wrongHistory || wrongHistory.length === 0) {
      return [];
    }

    const frequencies = new Map<string, number>();
    for (const row of wrongHistory) {
      const questionId = row.pregunta_id ?? '';
      if (!questionId) continue;
      frequencies.set(questionId, (frequencies.get(questionId) ?? 0) + 1);
    }

    const rankedIds = Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map(([id]) => id);

    if (rankedIds.length === 0) return [];

    let query = supabase
      .from('preguntas_banco')
      .select('*')
      .in('id', rankedIds);

    if (parcial) {
      query = query.eq('parcial', parcial);
    }

    const { data: questions, error: questionError } = await query;

    if (questionError || !questions || questions.length === 0) {
      return [];
    }

    const shuffled = shuffleArray(questions as Pregunta[]);
    return shuffled.slice(0, 30) as Pregunta[];
  } catch (error) {
    logError('actions.getPreguntasSimuladorErrores', error, { materiaId, parcial });
    return [];
  }
}

export async function getPreguntasSimuladorPremium(
  materiaId: string,
  parcial: number
): Promise<Pregunta[]> {
  try {
    const premiumCheck = await requirePremiumUser();
    if (!premiumCheck.ok) return [];
    const admin = createAdminClient();

    const { data: setRow } = await admin
      .from('premium_question_sets')
      .select('id')
      .eq('materia_id', materiaId)
      .eq('parcial', parcial)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (!setRow?.id) return [];

    const { data: rows } = await admin
      .from('premium_questions')
      .select('id, enunciado, opciones, respuesta_correcta')
      .eq('set_id', setRow.id)
      .order('orden', { ascending: true })
      .limit(50);

    return ((rows ?? []) as Array<{ id: string; enunciado: string; opciones: unknown; respuesta_correcta: string }>).map((row) => ({
      id: row.id,
      enunciado: row.enunciado,
      opciones: Array.isArray(row.opciones)
        ? (row.opciones.filter((o: unknown) => typeof o === 'string') as string[])
        : [],
      respuesta_correcta: row.respuesta_correcta,
      materia_id: materiaId,
      parcial,
    }));
  } catch (error) {
    logError('actions.getPreguntasSimuladorPremium', error, { materiaId, parcial });
    return [];
  }
}

/**
 * Actualiza el perfil del usuario con universidad y carrera.
 */
export async function updateProfile(
  userId: string,
  data: { universidad_id: string; carrera_id: string }
) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== userId) {
      throw new Error('No se encontró una sesión válida para actualizar el perfil.');
    }

    const universidadIdValue = String(data.universidad_id ?? '').trim();
    const carreraIdValue = String(data.carrera_id ?? '').trim();

    if (!universidadIdValue || !carreraIdValue) {
      throw new Error('Universidad y carrera son obligatorias.');
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      universidad_id: universidadIdValue,
      carrera_id: carreraIdValue,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logError('actions.updateProfile.upsert', error, { userId });
      throw error;
    }

    revalidatePath('/');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    logError('actions.updateProfile', error, { userId });
    return { success: false, error };
  }
}

/**
 * Verifica si el usuario tiene el perfil completo.
 */
export async function checkProfileStatus(userId: string) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== userId) {
      return { isComplete: false };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('universidad_id, carrera_id')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logError('actions.checkProfileStatus.query', error, { userId });
      return { isComplete: false };
    }

    const universidadIdValue = String(data?.universidad_id ?? '').trim();
    const carreraIdValue = String(data?.carrera_id ?? '').trim();

    if (!data || !universidadIdValue || !carreraIdValue) {
      return { isComplete: false };
    }

    return { isComplete: true };
  } catch (error) {
    logError('actions.checkProfileStatus', error, { userId });
    return { isComplete: false };
  }
}

/**
 * Registra la respuesta de un usuario a una pregunta en el historial.
 * Se realiza de forma silenciosa para el usuario.
 */
export async function registrarRespuestaUsuario(data: {
  usuario_id: string;
  pregunta_id: string;
  materia_id: string;
  es_correcta: boolean;
}) {
  try {
    const supabase = await createClientServer();

    const peso = data.es_correcta ? 1 : 3;

    const { error } = await supabase.from('historial_respuestas').insert({
      usuario_id: data.usuario_id,
      pregunta_id: data.pregunta_id,
      materia_id: data.materia_id,
      es_correcta: data.es_correcta,
      peso,
      fecha_respuesta: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    logError('actions.registrarRespuestaUsuario', error, {
      usuarioId: data.usuario_id,
      preguntaId: data.pregunta_id,
      materiaId: data.materia_id,
    });
    return { success: false, error };
  }
}

export async function finalizarSimuladorAction(data: {
  usuario_id: string;
  materia_id: string;
  parcial: number;
  total_preguntas: number;
  respuestas_correctas: number;
  answered_questions: number;
  tiempo_restante: number;
  premium_only?: boolean;
  wrong_question_ids?: string[];
  answered_question_ids?: string[];
}) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== data.usuario_id) {
      return { success: false, message: 'Sesion no valida.' };
    }

    const wrongQuestionIds = Array.from(new Set((data.wrong_question_ids ?? []).filter(Boolean)));
    const answeredQuestionIds = Array.from(
      new Set([...(data.answered_question_ids ?? []), ...wrongQuestionIds].filter(Boolean))
    );
    const wrongQuestionSet = new Set(wrongQuestionIds);

    const { data: attemptRow, error: attemptError } = await supabase
      .from('simulator_attempts')
      .insert({
        user_id: data.usuario_id,
        materia_id: data.materia_id,
        parcial: data.parcial,
        total_questions: data.total_preguntas,
        correct_answers: data.respuestas_correctas,
        wrong_answers: wrongQuestionIds.length,
        answered_questions: data.answered_questions,
        premium_only: Boolean(data.premium_only),
      })
      .select('id')
      .single();

    if (attemptError) {
      throw attemptError;
    }

    if (attemptRow?.id && wrongQuestionIds.length > 0) {
      const wrongRows = wrongQuestionIds.map((preguntaId) => ({
        attempt_id: attemptRow.id,
        user_id: data.usuario_id,
        materia_id: data.materia_id,
        parcial: data.parcial,
        pregunta_id: preguntaId,
      }));

      const { error: wrongInsertError } = await supabase
        .from('simulator_attempt_wrong_questions')
        .insert(wrongRows);

      if (wrongInsertError) {
        throw wrongInsertError;
      }
    }

    let memoryResult = { processed: 0, linked: 0 };
    if (attemptRow?.id && answeredQuestionIds.length > 0) {
      try {
        memoryResult = await safeRecordSimulatorTopicMemory({
          admin: createAdminClient(),
          userId: data.usuario_id,
          materiaId: data.materia_id,
          parcial: data.parcial,
          attemptId: attemptRow.id,
          answeredQuestions: answeredQuestionIds.map((preguntaId) => ({
            preguntaId,
            wasCorrect: !wrongQuestionSet.has(preguntaId),
          })),
        });
      } catch (memoryError) {
        logError('actions.finalizarSimulador.topicMemoryClient', memoryError, {
          usuarioId: data.usuario_id,
          materiaId: data.materia_id,
          parcial: data.parcial,
          attemptId: attemptRow.id,
        });
      }
    }

    return {
      success: true,
      finishedAt: new Date().toISOString(),
      attemptId: attemptRow?.id ?? null,
      topicMemory: memoryResult,
      summary: {
        materia_id: data.materia_id,
        parcial: data.parcial,
        total_preguntas: data.total_preguntas,
        respuestas_correctas: data.respuestas_correctas,
        answered_questions: data.answered_questions,
        tiempo_restante: data.tiempo_restante,
      },
    };
  } catch (error) {
    logError('actions.finalizarSimulador', error, {
      usuarioId: data.usuario_id,
      materiaId: data.materia_id,
      parcial: data.parcial,
    });
    return { success: false, message: 'No se pudo finalizar el simulador.' };
  }
}

export async function submitSimulatorRatingAction(data: {
  materia_id: string;
  parcial: number;
  vote_type: 1 | -1;
}) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { success: false, message: 'Debes iniciar sesión para valorar el simulador.' };
    }

    if (await isAdminActor(user)) {
      return { success: true };
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_name: 'simulator_rating',
      user_id: user.id,
      session_key: `simulator_rating:${user.id}`,
      path: `/simulador/${data.materia_id}/${data.parcial}`,
      device_type: null,
      metadata: {
        materia_id: data.materia_id,
        parcial: data.parcial,
        vote_type: data.vote_type,
      },
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    logError('actions.submitSimulatorRating', error, {
      materiaId: data.materia_id,
      parcial: data.parcial,
      voteType: data.vote_type,
    });
    return { success: false, message: 'No se pudo guardar tu valoración.' };
  }
}

export async function getSimulatorRatingsSummaryByMateria(
  materiaId: string
): Promise<SimulatorRatingSummary[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('analytics_events')
      .select('user_id, created_at, metadata')
      .eq('event_name', 'simulator_rating')
      .contains('metadata', { materia_id: materiaId })
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      throw error;
    }

    const latestByUserAndParcial = new Map<string, { parcial: number; vote: 1 | -1 }>();

    for (const row of data ?? []) {
      const metadata =
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : null;
      const parcial = Number(metadata?.parcial);
      const vote = Number(metadata?.vote_type) === -1 ? -1 : Number(metadata?.vote_type) === 1 ? 1 : null;
      const metadataMateriaId = typeof metadata?.materia_id === 'string' ? metadata.materia_id : null;
      const userId = row.user_id;

      if (!userId || !metadataMateriaId || metadataMateriaId !== materiaId || ![1, 2, 3].includes(parcial) || !vote) {
        continue;
      }

      const key = `${userId}:${parcial}`;
      if (!latestByUserAndParcial.has(key)) {
        latestByUserAndParcial.set(key, { parcial, vote });
      }
    }

    const summaryMap = new Map<number, { likes: number; dislikes: number }>();
    for (const { parcial, vote } of latestByUserAndParcial.values()) {
      const current = summaryMap.get(parcial) ?? { likes: 0, dislikes: 0 };
      if (vote === 1) current.likes += 1;
      if (vote === -1) current.dislikes += 1;
      summaryMap.set(parcial, current);
    }

    return [1, 2, 3].map((parcial) => {
      const likes = summaryMap.get(parcial)?.likes ?? 0;
      const dislikes = summaryMap.get(parcial)?.dislikes ?? 0;
      const total = likes + dislikes;
      return {
        parcial,
        likes,
        dislikes,
        total,
        approvalPercent: total > 0 ? Math.round((likes / total) * 100) : 0,
        averageScore: total > 0 ? (likes - dislikes) / total : 0,
      };
    });
  } catch (error) {
    logError('actions.getSimulatorRatingsSummaryByMateria', error, { materiaId });
    return [
      { parcial: 1, likes: 0, dislikes: 0, total: 0, approvalPercent: 0, averageScore: 0 },
      { parcial: 2, likes: 0, dislikes: 0, total: 0, approvalPercent: 0, averageScore: 0 },
      { parcial: 3, likes: 0, dislikes: 0, total: 0, approvalPercent: 0, averageScore: 0 },
    ];
  }
}

export async function getSimulatorUsageSummaryByMateria(
  materiaId: string
): Promise<SimulatorUsageSummary[]> {
  try {
    const admin = createAdminClient();
    const adminUserIds = new Set(await listAdminUserIds());
    const simulatorPathPrefix = `/simulador/${materiaId}/`;
    const rows: Array<{
      user_id: string | null;
      session_key: string | null;
      event_name: string;
      path: string | null;
      metadata: unknown | null;
      created_at: string | null;
    }> = [];

    let from = 0;
    const pageSize = 1000;

    while (true) {
      const to = from + pageSize - 1;
      const { data, error } = await admin
        .from('analytics_events')
        .select('user_id, session_key, event_name, path, metadata, created_at')
        .in('event_name', ['page_view', 'simulator_started'])
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      const chunk = data ?? [];
      rows.push(...chunk);

      if (chunk.length < pageSize || rows.length >= 5000) {
        break;
      }

      from += pageSize;
    }

    const viewsByParcial = new Map<number, number>();

    for (const row of rows) {
      if (row.user_id && adminUserIds.has(row.user_id)) continue;

      const metadata =
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : null;

      const metadataMateriaId = typeof metadata?.materia_id === 'string' ? metadata.materia_id : null;
      const metadataParcial = Number(metadata?.parcial);
      const path = row.path ?? '';
      const pathMatch = path.match(/^\/simulador\/([^/]+)\/(\d+)/);
      const pathMateriaId = pathMatch?.[1] ?? null;
      const pathParcial = pathMatch?.[2] ? Number(pathMatch[2]) : NaN;
      const parcial = Number.isFinite(metadataParcial)
        ? metadataParcial
        : Number.isFinite(pathParcial)
          ? pathParcial
          : null;
      const resolvedMateriaId = metadataMateriaId ?? pathMateriaId;

      if (!resolvedMateriaId || resolvedMateriaId !== materiaId) continue;
      if (!parcial || ![1, 2, 3].includes(parcial)) continue;
      if (!path.startsWith(simulatorPathPrefix)) continue;
      if (row.event_name !== 'page_view') continue;

      viewsByParcial.set(parcial, (viewsByParcial.get(parcial) ?? 0) + 1);
    }

    return [1, 2, 3].map((parcial) => ({
      parcial,
      views: viewsByParcial.get(parcial) ?? 0,
    }));
  } catch (error) {
    logError('actions.getSimulatorUsageSummaryByMateria', error, { materiaId });
    return [
      { parcial: 1, views: 0 },
      { parcial: 2, views: 0 },
      { parcial: 3, views: 0 },
    ];
  }
}

export async function getPreguntasSimuladorUltimoIntentoPremium(
  materiaId: string,
  parcial: number
): Promise<Pregunta[]> {
  try {
    const premiumCheck = await requirePremiumUser();
    if (!premiumCheck.ok || !premiumCheck.user?.id) return [];

    const supabase = await createClientServer();
    const userId = premiumCheck.user.id;

    const { data: latestAttempt, error: attemptError } = await supabase
      .from('simulator_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('materia_id', materiaId)
      .eq('parcial', parcial)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attemptError || !latestAttempt?.id) {
      return [];
    }

    const { data: wrongRows, error: wrongError } = await supabase
      .from('simulator_attempt_wrong_questions')
      .select('pregunta_id')
      .eq('attempt_id', latestAttempt.id)
      .order('created_at', { ascending: true });

    if (wrongError || !wrongRows || wrongRows.length === 0) {
      return [];
    }

    const wrongIds = Array.from(new Set(wrongRows.map((row) => row.pregunta_id).filter(Boolean)));
    if (wrongIds.length === 0) return [];

    const admin = createAdminClient();
    const { data: questions, error: questionError } = await admin
      .from('premium_questions')
      .select('id, enunciado, opciones, respuesta_correcta')
      .in('id', wrongIds);

    if (questionError || !questions || questions.length === 0) {
      return [];
    }

    const byId = new Map(
      questions.map((question) => [
        question.id,
        {
          id: question.id,
          enunciado: question.enunciado,
          opciones: Array.isArray(question.opciones)
            ? (question.opciones.filter((o: unknown) => typeof o === 'string') as string[])
            : [],
          respuesta_correcta: question.respuesta_correcta,
          materia_id: materiaId,
          parcial,
        } as Pregunta,
      ])
    );
    return wrongIds
      .map((id) => byId.get(id))
      .filter((question): question is Pregunta => Boolean(question))
      .slice(0, 30);
  } catch (error) {
    logError('actions.getPreguntasSimuladorUltimoIntentoPremium', error, { materiaId, parcial });
    return [];
  }
}

export async function getDashboardState(): Promise<DashboardState> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    const userId = user?.id;
    if (!userId) {
      return defaultDashboardState;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'last_subject_id, last_subject_name, active_subjects, finished_subjects, dashboard_analytics'
      )
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      lastSubject:
        data?.last_subject_id && data.last_subject_name
          ? { id: data.last_subject_id, name: data.last_subject_name }
          : null,
      activeSubjects: data?.active_subjects ?? [],
      finishedSubjects: data?.finished_subjects ?? [],
      analytics: data?.dashboard_analytics ?? defaultDashboardAnalytics,
    };
  } catch (error) {
    logError('actions.getDashboardState', error);
    return defaultDashboardState;
  }
}

export async function saveDashboardState(payload: DashboardState) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    const userId = user?.id;
    if (!userId) {
      throw new Error('No se encontró una sesión activa.');
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      last_subject_id: payload.lastSubject?.id ?? null,
      last_subject_name: payload.lastSubject?.name ?? null,
      active_subjects: payload.activeSubjects,
      finished_subjects: payload.finishedSubjects,
      dashboard_analytics: payload.analytics,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    logError('actions.saveDashboardState', error, {
      activeSubjects: payload.activeSubjects.length,
      finishedSubjects: payload.finishedSubjects.length,
    });
    return { success: false };
  }
}

export async function getPartialStudyInsights(
  materiaId: string,
  parcial: number
): Promise<PartialStudyInsights | null> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return null;
    }

    const { count: totalPreguntasParcial } = await supabase
      .from('preguntas_banco')
      .select('*', { count: 'exact', head: true })
      .eq('materia_id', materiaId)
      .eq('parcial', parcial);

    const { data: historialRows } = await supabase
      .from('historial_respuestas')
      .select('pregunta_id, es_correcta')
      .eq('usuario_id', user.id)
      .eq('materia_id', materiaId)
      .not('pregunta_id', 'is', null)
      .limit(5000);

    const uniqueQuestionIds = Array.from(
      new Set((historialRows ?? []).map((row) => row.pregunta_id).filter(Boolean))
    ) as string[];

    let preguntasParcialRespondidas = 0;
    let respuestasParcialTotal = 0;
    let respuestasParcialCorrectas = 0;

    if (uniqueQuestionIds.length > 0) {
      const { data: parcialQuestions } = await supabase
        .from('preguntas_banco')
        .select('id')
        .in('id', uniqueQuestionIds)
        .eq('parcial', parcial)
        .eq('materia_id', materiaId);

      const partialIds = new Set((parcialQuestions ?? []).map((q) => q.id));
      preguntasParcialRespondidas = partialIds.size;

      for (const row of historialRows ?? []) {
        const questionId = row.pregunta_id;
        if (!questionId || !partialIds.has(questionId)) continue;
        respuestasParcialTotal += 1;
        if (row.es_correcta) respuestasParcialCorrectas += 1;
      }
    }

    const total = totalPreguntasParcial ?? 0;
    const coberturaPorcentaje = total > 0 ? Math.round((preguntasParcialRespondidas / total) * 100) : 0;
    const modelosEstimadosRealizados = Math.max(0, Math.floor(respuestasParcialTotal / 30));
    const promedioAciertoPorcentaje =
      respuestasParcialTotal > 0
        ? Number(((respuestasParcialCorrectas / respuestasParcialTotal) * 100).toFixed(1))
        : 0;

    const practiceFactor = Math.min(100, modelosEstimadosRealizados * 20);
    const probabilityRaw =
      promedioAciertoPorcentaje * 0.5 + coberturaPorcentaje * 0.3 + practiceFactor * 0.2;
    const probabilidadAprobar = Math.max(5, Math.min(95, Math.round(probabilityRaw)));

    return {
      materiaId,
      parcial,
      totalPreguntasParcial: total,
      preguntasRespondidasParcial: preguntasParcialRespondidas,
      preguntasAcertadasParcial: respuestasParcialCorrectas,
      coberturaPorcentaje,
      modelosEstimadosRealizados,
      promedioAciertoPorcentaje,
      probabilidadAprobar,
    };
  } catch (error) {
    logError('actions.getPartialStudyInsights', error, { materiaId, parcial });
    return null;
  }
}

export async function getWrongAnswersExplanations(data: {
  materia_id: string;
  parcial: number;
  wrong_question_ids: string[];
}) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Debes iniciar sesión para ver explicaciones premium.' };
    }

    const materiaId = data.materia_id;
    if (!materiaId) {
      return { success: false, message: 'Materia no especificada.' };
    }

    const wrongIds = Array.from(new Set(data.wrong_question_ids.filter(Boolean)));
    if (wrongIds.length === 0) {
      return { success: true, explanations: [] as WrongAnswerExplanation[] };
    }

    const { explanations, metrics } = await buildWrongAnswersExplanations({
      materiaId,
      parcial: data.parcial,
      wrongQuestionIds: wrongIds,
      userId: user.id,
    });
    return { success: true, explanations, metrics };
  } catch (error) {
    logError('actions.getWrongAnswersExplanations', error, {
      materiaId: data.materia_id,
      parcial: data.parcial,
      wrongQuestionCount: data.wrong_question_ids.length,
    });
    return { success: false, message: 'No se pudieron generar las explicaciones.' };
  }
}
