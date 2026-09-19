'use server';

import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdminActor, listAdminUserIds } from '@/lib/admin-users';
import { revalidateTag, unstable_cache } from 'next/cache';
import { logError } from '@/lib/observability';
import {
  requirePremiumUser,
  hasPremiumAccess,
  countErroresAttemptsThisWeek,
  FREE_ERRORS_REVIEWS_PER_WEEK,
} from '@/lib/premium';
import { safeRecordSimulatorTopicMemory } from '@/lib/simulator-topic-memory';
import { normalizeForCompare, parseCorrectAnswers } from '@/lib/simulator-core';
import { DEMO_TOTAL_QUESTIONS } from '@/lib/simulator-demo';
import {
  enforceServerActionRateLimit,
  getServerActionClientKey,
} from '@/lib/rate-limit';
import {
  getSimulatorQuestionTopicLabels,
  recordStudyErrorCorrect,
  recordStudyErrorFailure,
} from '@/lib/study-errors';

/**
 * Pregunta expuesta al cliente. NUNCA incluye `respuesta_correcta`: la
 * corrección ocurre en el servidor (ver `registrarRespuestaUsuario`).
 * `correctCount` permite el UX multi-respuesta sin revelar cuáles opciones
 * son correctas.
 */
export interface Pregunta {
  id: string;
  enunciado: string;
  opciones: string[];
  materia_id: string;
  parcial: number;
  correctCount: number;
}

export interface GradedPreguntaResult {
  correct: boolean;
  correct_indexes: number[];
}

export type GradeQuestionServerResult =
  | { success: false; message: string; error?: unknown }
  | { success: true; correct: boolean; correct_indexes: number[] };

export type FinalizarSimuladorServerResult =
  | { success: false; message: string }
  | {
      success: true;
      finishedAt: string;
      attemptId: string | null;
      topicMemory: { processed: number; linked: number };
      summary: {
        materia_id: string;
        parcial: number;
        total_preguntas: number;
        respuestas_correctas: number;
        answered_questions: number;
        tiempo_restante: number;
      };
      resultados: Record<string, GradedPreguntaResult>;
    };

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

type PreguntaBancoRow = {
  id: string;
  enunciado: string;
  opciones: unknown;
  respuesta_correcta: string;
  materia_id: string | null;
  parcial: number | null;
};

function sanitizePreguntaRow(row: PreguntaBancoRow): Pregunta {
  return {
    id: row.id,
    enunciado: row.enunciado,
    opciones: Array.isArray(row.opciones)
      ? (row.opciones.filter((option): option is string => typeof option === 'string') as string[])
      : [],
    materia_id: row.materia_id ?? '',
    parcial: row.parcial ?? 1,
    correctCount: parseCorrectAnswers(row.respuesta_correcta).length,
  };
}

function gradePregunta(input: {
  respuestaCorrecta: string;
  opciones: string[];
  respuestaSeleccionada: string[];
}): GradedPreguntaResult {
  const expected = parseCorrectAnswers(input.respuestaCorrecta).map(normalizeForCompare);
  const selected = input.respuestaSeleccionada.map(normalizeForCompare).filter(Boolean);
  const correct =
    selected.length === expected.length && selected.every((answer) => expected.includes(answer));
  const correctIndexes = input.opciones
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => expected.includes(normalizeForCompare(option)))
    .map(({ index }) => index);
  return { correct, correct_indexes: correctIndexes };
}

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
    .select('pregunta_id')
    .eq('usuario_id', user.id)
    .eq('materia_id', materiaId)
    .in('pregunta_id', poolIds)
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
  let query = client
    .from('preguntas_banco')
    .select('id, enunciado, opciones, respuesta_correcta, materia_id, parcial')
    .eq('materia_id', materiaId);

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
 * Pool de preguntas del banco para una materia/parcial/scope. Es casi estático
 * (cambia solo cuando se cargan preguntas nuevas), así que se cachea con el
 * Data Cache de Next. La diversificación por usuario queda fuera de la caché
 * (ver `selectDiverseSimulatorQuestions`).
 */
const loadPreguntasBancoPool = unstable_cache(
  async (
    materiaId: string,
    parcial: number,
    universidadId: string | undefined,
    carreraId: string | undefined
  ): Promise<Pregunta[]> => {
    // El banco se lee con service_role: nunca viaja la respuesta_correcta al cliente.
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

    return (data as PreguntaBancoRow[]).map(sanitizePreguntaRow);
  },
  ['preguntas-banco-pool'],
  { revalidate: 300, tags: ['preguntas-banco-pool'] }
);

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
    const clientKey = await getServerActionClientKey();
    const rateResult = await enforceServerActionRateLimit({
      key: `sim:get:${clientKey}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateResult.allowed) {
      return [];
    }

    const supabase = await createClientServer();

    const sanitized = await loadPreguntasBancoPool(materiaId, parcial, universidadId, carreraId);

    const questionLimit = parcial === 3 ? 50 : 30;
    const diversified = await selectDiverseSimulatorQuestions(
      supabase,
      sanitized,
      materiaId,
      parcial,
      questionLimit
    );
    return diversified;
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
  parcial: number
): Promise<Pregunta[]> {
  try {
    const clientKey = await getServerActionClientKey();
    const rateResult = await enforceServerActionRateLimit({
      key: `sim:demo:${clientKey}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateResult.allowed) {
      return [];
    }

    const admin = createAdminClient();

    const buildBaseQuery = () => {
      let query = admin
        .from('preguntas_banco')
        .select('id, enunciado, opciones, respuesta_correcta, materia_id, parcial')
        .eq('materia_id', materiaId);

      if (parcial === 3) {
        query = query.in('parcial', [1, 2]);
      } else {
        query = query.eq('parcial', parcial);
      }

      return query;
    };

    const { data: demoRows, error: demoError } = await buildBaseQuery()
      .eq('es_demo', true)
      .limit(DEMO_TOTAL_QUESTIONS);

    if (demoError) {
      logError('actions.getPreguntasSimuladorDemo.query', demoError, {
        materiaId,
        parcial,
      });
      throw new Error('No se pudieron obtener las preguntas de muestra.');
    }

    const demoQuestions = (demoRows ?? []) as PreguntaBancoRow[];

    // Si no alcanzamos el tope de preguntas demo, completamos con el banco general
    // para que el simulador de muestra no quede con muy pocas preguntas.
    if (demoQuestions.length < DEMO_TOTAL_QUESTIONS) {
      const demoIds = demoQuestions.map((question) => question.id);
      const fillQuery =
        demoIds.length > 0
          ? buildBaseQuery()
              .not('id', 'in', `(${demoIds.join(',')})`)
              .limit(50)
          : buildBaseQuery().limit(50);

      const { data: fillRows, error: fillError } = await fillQuery;

      if (fillError) {
        logError('actions.getPreguntasSimuladorDemo.fill', fillError, {
          materiaId,
          parcial,
        });
      } else {
        demoQuestions.push(...((fillRows ?? []) as PreguntaBancoRow[]));
      }
    }

    if (!demoQuestions.length) {
      return [];
    }

    const sanitized = demoQuestions.map(sanitizePreguntaRow);
    const shuffled = shuffleArray(sanitized);
    return shuffled.slice(0, DEMO_TOTAL_QUESTIONS);
  } catch (error) {
    logError('actions.getPreguntasSimuladorDemo', error, {
      materiaId,
      parcial,
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

    const isPremium = await hasPremiumAccess(user.id);
    if (!isPremium) {
      const weeklyReviews = await countErroresAttemptsThisWeek(user.id);
      if (weeklyReviews >= FREE_ERRORS_REVIEWS_PER_WEEK) {
        return [];
      }
    }

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

    const admin = createAdminClient();
    let query = admin
      .from('preguntas_banco')
      .select('id, enunciado, opciones, respuesta_correcta, materia_id, parcial')
      .in('id', rankedIds);

    if (parcial) {
      query = query.eq('parcial', parcial);
    }

    const { data: questions, error: questionError } = await query;

    if (questionError || !questions || questions.length === 0) {
      return [];
    }

    const sanitized = (questions as PreguntaBancoRow[]).map(sanitizePreguntaRow);
    const shuffled = shuffleArray(sanitized);
    return shuffled.slice(0, 30);
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

    return ((rows ?? []) as PreguntaBancoRow[]).map((row) =>
      sanitizePreguntaRow({ ...row, materia_id: materiaId, parcial })
    );
  } catch (error) {
    logError('actions.getPreguntasSimuladorPremium', error, { materiaId, parcial });
    return [];
  }
}

/**
 * Registra la respuesta de un usuario a una pregunta. La corrección ocurre en
 * el servidor con service_role: el cliente recibe `correct` y `correct_indexes`
 * (índices de las opciones correctas) pero nunca la respuesta correcta cruda.
 *
 * - Preguntas del banco: persiste el intento en historial_respuestas.
 * - Preguntas premium: solo se devuelve feedback (el FK de historial_respuestas
 *   apunta únicamente a preguntas_banco).
 */
export async function registrarRespuestaUsuario(data: {
  usuario_id: string;
  pregunta_id: string;
  materia_id: string;
  respuesta_seleccionada: string | string[];
}): Promise<GradeQuestionServerResult> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== data.usuario_id) {
      return { success: false, message: 'Sesion no valida.' };
    }

    const clientKey = await getServerActionClientKey();
    const rateResult = await enforceServerActionRateLimit({
      key: `sim:grade:${user.id}:${clientKey}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateResult.allowed) {
      return { success: false, message: 'Demasiados intentos. Volvé a intentar en unos segundos.' };
    }

    const selectedAnswers = (Array.isArray(data.respuesta_seleccionada)
      ? data.respuesta_seleccionada
      : [data.respuesta_seleccionada]
    )
      .filter((answer): answer is string => typeof answer === 'string')
      .map(normalizeForCompare)
      .filter(Boolean);

    const admin = createAdminClient();

    const { data: question, error: questionError } = await admin
      .from('preguntas_banco')
      .select('id, enunciado, opciones, respuesta_correcta, materia_id, parcial')
      .eq('id', data.pregunta_id)
      .eq('materia_id', data.materia_id)
      .maybeSingle();

    if (questionError || !question) {
      // Un usuario free no debe poder corregir preguntas premium pasando un ID
      // arbitrario: solo usuarios con acceso premium pueden obtener el feedback.
      const isPremium = await hasPremiumAccess(user.id);
      if (!isPremium) {
        return { success: false, message: 'No encontramos la pregunta a registrar.' };
      }

      const { data: premiumQuestion, error: premiumError } = await admin
        .from('premium_questions')
        .select('id, enunciado, opciones, respuesta_correcta, set_id')
        .eq('id', data.pregunta_id)
        .maybeSingle();

      if (premiumError || !premiumQuestion) {
        return { success: false, message: 'No encontramos la pregunta a registrar.' };
      }

      const opciones = Array.isArray(premiumQuestion.opciones)
        ? (premiumQuestion.opciones.filter((o: unknown) => typeof o === 'string') as string[])
        : [];
      const feedback = gradePregunta({
        respuestaCorrecta: premiumQuestion.respuesta_correcta,
        opciones,
        respuestaSeleccionada: selectedAnswers,
      });

      return { success: true, ...feedback };
    }

    const opciones = Array.isArray(question.opciones)
      ? (question.opciones.filter((o: unknown) => typeof o === 'string') as string[])
      : [];
    const feedback = gradePregunta({
      respuestaCorrecta: question.respuesta_correcta,
      opciones,
      respuestaSeleccionada: selectedAnswers,
    });

    const peso = feedback.correct ? 1 : 3;

    const { error } = await admin.from('historial_respuestas').insert({
      usuario_id: data.usuario_id,
      pregunta_id: data.pregunta_id,
      materia_id: data.materia_id,
      es_correcta: feedback.correct,
      peso,
      fecha_respuesta: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return { success: true, ...feedback };
  } catch (error) {
    logError('actions.registrarRespuestaUsuario', error, {
      usuarioId: data.usuario_id,
      preguntaId: data.pregunta_id,
      materiaId: data.materia_id,
    });
    return { success: false, message: 'No se pudo registrar la respuesta.', error };
  }
}

/**
 * Corrección server-side para el modo demo (sin sesión). Mismo contrato que
 * registrarRespuestaUsuario pero acotado a preguntas `es_demo` y con rate limit
 * por IP (no hay usuario que vincular).
 */
export async function corregirPreguntaDemo(data: {
  pregunta_id: string;
  materia_id: string;
  respuesta_seleccionada: string | string[];
}): Promise<GradeQuestionServerResult> {
  try {
    const clientKey = await getServerActionClientKey();
    const rateResult = await enforceServerActionRateLimit({
      key: `sim:demo-grade:${clientKey}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateResult.allowed) {
      return { success: false, message: 'Demasiados intentos. Volvé a intentar en unos segundos.' };
    }

    const admin = createAdminClient();
    const { data: question, error: questionError } = await admin
      .from('preguntas_banco')
      .select('id, enunciado, opciones, respuesta_correcta, materia_id, parcial')
      .eq('id', data.pregunta_id)
      .eq('materia_id', data.materia_id)
      .eq('es_demo', true)
      .maybeSingle();

    if (questionError || !question) {
      return { success: false, message: 'No encontramos la pregunta a corregir.' };
    }

    const selectedAnswers = (Array.isArray(data.respuesta_seleccionada)
      ? data.respuesta_seleccionada
      : [data.respuesta_seleccionada]
    )
      .filter((answer): answer is string => typeof answer === 'string')
      .map(normalizeForCompare)
      .filter(Boolean);

    const opciones = Array.isArray(question.opciones)
      ? (question.opciones.filter((o: unknown) => typeof o === 'string') as string[])
      : [];
    const feedback = gradePregunta({
      respuestaCorrecta: question.respuesta_correcta,
      opciones,
      respuestaSeleccionada: selectedAnswers,
    });

    return { success: true, ...feedback };
  } catch (error) {
    logError('actions.corregirPreguntaDemo', error, {
      preguntaId: data.pregunta_id,
      materiaId: data.materia_id,
    });
    return { success: false, message: 'No se pudo corregir la pregunta.', error };
  }
}

export async function finalizarSimuladorAction(data: {
  usuario_id: string;
  materia_id: string;
  parcial: number;
  total_preguntas: number;
  answered_questions: number;
  tiempo_restante: number;
  premium_only?: boolean;
  mode?: string;
  respuestas: Array<{ pregunta_id: string; respuesta_seleccionada: string | string[] }>;
}): Promise<FinalizarSimuladorServerResult> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== data.usuario_id) {
      return { success: false, message: 'Sesion no valida.' };
    }

    const clientKey = await getServerActionClientKey();
    const rateResult = await enforceServerActionRateLimit({
      key: `sim:finish:${user.id}:${clientKey}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateResult.allowed) {
      return { success: false, message: 'Demasiadas solicitudes. Volvé a intentar en unos segundos.' };
    }

    // 1) Re-corregir en el servidor: nada de lo reportado por el cliente se da por válido.
    const respuestas = (data.respuestas ?? []).filter(
      (entry) => typeof entry.pregunta_id === 'string' && entry.pregunta_id
    );
    const respuestaIds = Array.from(new Set(respuestas.map((entry) => entry.pregunta_id)));

    const admin = createAdminClient();

    // Gate premium: un usuario free no debe poder corregir preguntas premium
    // pasando IDs arbitrarios (mismo criterio que registrarRespuestaUsuario).
    const isPremium = await hasPremiumAccess(user.id);

    const [bancoRows, premiumRows] = await Promise.all([
      respuestaIds.length > 0
        ? admin
            .from('preguntas_banco')
            .select('id, enunciado, opciones, respuesta_correcta, materia_id, parcial')
            .in('id', respuestaIds)
        : Promise.resolve({ data: [] as PreguntaBancoRow[], error: null }),
      respuestaIds.length > 0 && isPremium
        ? admin
            .from('premium_questions')
            .select('id, enunciado, opciones, respuesta_correcta, set_id')
            .in('id', respuestaIds)
        : Promise.resolve({ data: [] as PreguntaBancoRow[], error: null }),
    ]);

    const bancoById = new Map(
      (bancoRows.data ?? []).map((question) => [question.id, question as PreguntaBancoRow])
    );
    const premiumById = new Map(
      (premiumRows.data ?? []).map((question) => [question.id, question as PreguntaBancoRow])
    );

    const resultados = new Map<string, GradedPreguntaResult>();
    const bancoWrongIds: string[] = [];
    const premiumWrongIds: string[] = [];
    let respuestasCorrectas = 0;
    const answeredIds: string[] = [];

    for (const entry of respuestas) {
      const selectedAnswers = (Array.isArray(entry.respuesta_seleccionada)
        ? entry.respuesta_seleccionada
        : [entry.respuesta_seleccionada]
      )
        .filter((answer): answer is string => typeof answer === 'string')
        .map(normalizeForCompare)
        .filter(Boolean);

      const question = bancoById.get(entry.pregunta_id) ?? premiumById.get(entry.pregunta_id);
      if (!question) continue;

      const opciones = Array.isArray(question.opciones)
        ? (question.opciones.filter((o: unknown) => typeof o === 'string') as string[])
        : [];
      const feedback = gradePregunta({
        respuestaCorrecta: question.respuesta_correcta,
        opciones,
        respuestaSeleccionada: selectedAnswers,
      });

      resultados.set(entry.pregunta_id, feedback);
      answeredIds.push(entry.pregunta_id);
      if (feedback.correct) {
        respuestasCorrectas += 1;
      } else if (bancoById.has(entry.pregunta_id)) {
        bancoWrongIds.push(entry.pregunta_id);
      } else {
        premiumWrongIds.push(entry.pregunta_id);
      }
    }

    const wrongQuestionIds = [...bancoWrongIds, ...premiumWrongIds];
    const answeredQuestionIds = Array.from(new Set(answeredIds));
    const simulatorTopicLabels = await getSimulatorQuestionTopicLabels(admin, bancoWrongIds);

    await Promise.all(
      respuestas.map(async (entry) => {
        const feedback = resultados.get(entry.pregunta_id);
        const question = bancoById.get(entry.pregunta_id) ?? premiumById.get(entry.pregunta_id);
        if (!feedback || !question) return;

        const sourceKey = `question:${entry.pregunta_id}`;
        if (feedback.correct) {
          await recordStudyErrorCorrect({
            userId: data.usuario_id,
            sourceType: 'simulator',
            sourceKey,
          });
          return;
        }

        const selectedAnswer = (Array.isArray(entry.respuesta_seleccionada)
          ? entry.respuesta_seleccionada
          : [entry.respuesta_seleccionada]
        )
          .filter((answer): answer is string => typeof answer === 'string')
          .join(' · ');

        await recordStudyErrorFailure({
          userId: data.usuario_id,
          materiaId: data.materia_id,
          sourceType: 'simulator',
          sourceKey,
          questionId: entry.pregunta_id,
          topic: simulatorTopicLabels.get(entry.pregunta_id) ?? null,
          prompt: question.enunciado,
          correctAnswer: question.respuesta_correcta,
          selectedAnswer,
          metadata: {
            parcial: data.parcial,
            premium: premiumById.has(entry.pregunta_id),
          },
        });
      })
    );

    // 2) Persistir el intento.
    const { data: attemptRow, error: attemptError } = await admin
      .from('simulator_attempts')
      .insert({
        user_id: data.usuario_id,
        materia_id: data.materia_id,
        parcial: data.parcial,
        total_questions: data.total_preguntas,
        correct_answers: respuestasCorrectas,
        wrong_answers: wrongQuestionIds.length,
        answered_questions: answeredQuestionIds.length,
        premium_only: Boolean(data.premium_only),
        mode: data.mode ?? 'regular',
      })
      .select('id')
      .single();

    if (attemptError) {
      throw attemptError;
    }

    // 3) Registrar errores (banco y premium en columnas separadas).
    if (attemptRow?.id && wrongQuestionIds.length > 0) {
      const wrongRows = [
        ...bancoWrongIds.map((preguntaId) => ({
          attempt_id: attemptRow.id,
          user_id: data.usuario_id,
          materia_id: data.materia_id,
          parcial: data.parcial,
          pregunta_id: preguntaId,
        })),
        ...premiumWrongIds.map((preguntaId) => ({
          attempt_id: attemptRow.id,
          user_id: data.usuario_id,
          materia_id: data.materia_id,
          parcial: data.parcial,
          premium_pregunta_id: preguntaId,
        })),
      ];

      const { error: wrongInsertError } = await admin
        .from('simulator_attempt_wrong_questions')
        .insert(wrongRows);

      if (wrongInsertError) {
        throw wrongInsertError;
      }
    }

    let memoryResult = { processed: 0, linked: 0 };
    if (attemptRow?.id && answeredQuestionIds.length > 0) {
      try {
        const wrongQuestionSet = new Set(wrongQuestionIds);
        memoryResult = await safeRecordSimulatorTopicMemory({
          admin,
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
        respuestas_correctas: respuestasCorrectas,
        answered_questions: answeredQuestionIds.length,
        tiempo_restante: data.tiempo_restante,
      },
      resultados: Object.fromEntries(resultados.entries()),
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

    // analytics_events no permite inserts desde el cliente (policy con check(false)),
    // por lo que la valoración se persiste con service_role.
    const admin = createAdminClient();
    const { error } = await admin.from('analytics_events').insert({
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

    // El voto es una acción explícita del usuario: invalida la caché de
    // ratings y del bootstrap de la materia para reflejarlo al instante.
    revalidateTag('simulator-ratings', 'max');
    revalidateTag('materia-bootstrap', 'max');

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

const loadSimulatorRatingsByMateria = unstable_cache(
  async (materiaId: string): Promise<SimulatorRatingSummary[]> => {
    const emptySummary = () =>
      [1, 2, 3].map((parcial) => ({
        parcial,
        likes: 0,
        dislikes: 0,
        total: 0,
        approvalPercent: 0,
        averageScore: 0,
      }));

    try {
      const admin = createAdminClient();
      // La función agregada no está en los tipos generados de Database.
      const rpc = admin.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc('get_simulator_ratings_summary', {
        p_materia_id: materiaId,
      });

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as Array<{ parcial: number; likes: number; dislikes: number }>;
      const byParcial = new Map(rows.map((row) => [row.parcial, row]));

      return [1, 2, 3].map((parcial) => {
        const row = byParcial.get(parcial);
        const likes = Number(row?.likes ?? 0);
        const dislikes = Number(row?.dislikes ?? 0);
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
      return emptySummary();
    }
  },
  ['simulator-ratings'],
  { revalidate: 600, tags: ['simulator-ratings', 'materia-bootstrap'] }
);

export async function getSimulatorRatingsSummaryByMateria(
  materiaId: string
): Promise<SimulatorRatingSummary[]> {
  return loadSimulatorRatingsByMateria(materiaId);
}

const loadSimulatorUsageByMateria = unstable_cache(
  async (materiaId: string): Promise<SimulatorUsageSummary[]> => {
    try {
      const admin = createAdminClient();
      const adminUserIds = new Set(await listAdminUserIds());
      const simulatorPathPrefix = `/simulador/${materiaId}/`;

      // Ventana de 90 días, filtrada por path y event_name en SQL: ya no se
      // descargan miles de filas para contar.
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await admin
        .from('analytics_events')
        .select('user_id, path')
        .eq('event_name', 'page_view')
        .like('path', `${simulatorPathPrefix}%`)
        .gte('created_at', ninetyDaysAgo);

      if (error) {
        throw error;
      }

      const viewsByParcial = new Map<number, number>();

      for (const row of data ?? []) {
        if (row.user_id && adminUserIds.has(row.user_id)) continue;

        const path = row.path ?? '';
        if (!path.startsWith(simulatorPathPrefix)) continue;

        const parcial = Number(path.slice(simulatorPathPrefix.length).split('/')[0]);
        if (!Number.isFinite(parcial) || ![1, 2, 3].includes(parcial)) continue;

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
  },
  ['simulator-usage'],
  { revalidate: 600, tags: ['simulator-usage'] }
);

export async function getSimulatorUsageSummaryByMateria(
  materiaId: string
): Promise<SimulatorUsageSummary[]> {
  return loadSimulatorUsageByMateria(materiaId);
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
      .select('pregunta_id, premium_pregunta_id')
      .eq('attempt_id', latestAttempt.id)
      .order('created_at', { ascending: true });

    if (wrongError || !wrongRows || wrongRows.length === 0) {
      return [];
    }

    const wrongIds = Array.from(
      new Set(
        wrongRows
          .flatMap((row) => [row.pregunta_id, row.premium_pregunta_id])
          .filter((id): id is string => Boolean(id))
      )
    );
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
        sanitizePreguntaRow({ ...(question as PreguntaBancoRow), materia_id: materiaId, parcial }),
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
