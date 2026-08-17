'use server';

import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { hasPremiumAccess } from '@/lib/premium';
import {
  buildWrongAnswersExplanations,
  type WrongAnswerExplanation,
} from '@/lib/simulator-wrong-answers';
import {
  enforceStrictRateLimit,
  getServerActionClientKey,
} from '@/lib/rate-limit';

/**
 * Resuelve los IDs de preguntas del banco que pertenecen a `materia_id` +
 * `parcial`. Para `parcial === 3` (integrador) se aceptan parciales 1 y 2.
 * `demoOnly` acota además a preguntas marcadas como demo.
 */
async function fetchBancoQuestionIdsScoped(
  admin: ReturnType<typeof createAdminClient>,
  materiaId: string,
  parcial: number,
  ids: string[],
  demoOnly: boolean
): Promise<string[]> {
  if (ids.length === 0) return [];
  let query = admin
    .from('preguntas_banco')
    .select('id')
    .eq('materia_id', materiaId)
    .in('id', ids);

  if (demoOnly) {
    query = query.eq('es_demo', true);
  }

  if (parcial === 3) {
    query = query.in('parcial', [1, 2]);
  } else {
    query = query.eq('parcial', parcial);
  }

  const { data, error } = await query;
  if (error) {
    logError('actions.fetchBancoQuestionIdsScoped', error, { materiaId, parcial, demoOnly });
    return [];
  }
  return (data ?? []).map((row) => row.id);
}

/**
 * Resuelve los IDs de preguntas premium que pertenecen a `materia_id` +
 * `parcial` (vía premium_question_sets). Solo se usa para usuarios premium.
 */
async function fetchPremiumQuestionIdsScoped(
  admin: ReturnType<typeof createAdminClient>,
  materiaId: string,
  parcial: number,
  ids: string[]
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data: premiumRows, error } = await admin
    .from('premium_questions')
    .select('id, set_id')
    .in('id', ids);

  if (error || !premiumRows || premiumRows.length === 0) {
    if (error) {
      logError('actions.fetchPremiumQuestionIdsScoped', error, { materiaId, parcial });
    }
    return [];
  }

  const setIds = Array.from(new Set(premiumRows.map((row) => row.set_id)));
  const { data: setRows, error: setError } = await admin
    .from('premium_question_sets')
    .select('id')
    .eq('materia_id', materiaId)
    .eq('parcial', parcial)
    .in('id', setIds);

  if (setError) {
    logError('actions.fetchPremiumQuestionIdsScoped.sets', setError, { materiaId, parcial });
    return [];
  }

  const validSetIds = new Set((setRows ?? []).map((row) => row.id));
  return premiumRows.filter((row) => validSetIds.has(row.set_id)).map((row) => row.id);
}

/**
 * Verifica que el usuario realmente respondió las preguntas del banco usando
 * `historial_respuestas` (se escribe al corregir cada respuesta en vivo, antes
 * de finalizar el intento). Ante un fallo del store se devuelve el conjunto de
 * entrada (fallback al acotado por materia/parcial ya aplicado), para no
 * denegar explicaciones legítimas por un error transitorio.
 */
async function filterAnsweredBancoQuestionIds(
  supabase: Awaited<ReturnType<typeof createClientServer>>,
  userId: string,
  materiaId: string,
  ids: string[]
): Promise<Set<string>> {
  if (ids.length === 0) return new Set<string>();

  const { data, error } = await supabase
    .from('historial_respuestas')
    .select('pregunta_id')
    .eq('usuario_id', userId)
    .eq('materia_id', materiaId)
    .in('pregunta_id', ids);

  if (error) {
    logError('actions.filterAnsweredBancoQuestionIds', error, { materiaId });
    return new Set(ids);
  }

  return new Set(
    (data ?? [])
      .map((row) => row.pregunta_id)
      .filter((id): id is string => Boolean(id))
  );
}

export async function getWrongAnswersExplanations(data: {
  materia_id: string;
  parcial: number;
  wrong_question_ids: string[];
  chosen_answers?: Record<string, number | number[] | null>;
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

    const isPremium = await hasPremiumAccess(user.id);
    const limitedWrongIds = isPremium ? wrongIds : wrongIds.slice(0, 3);

    // Validación server-side contra IDOR: solo se explican preguntas de esta
    // materia/parcial. Las preguntas del banco además deben haber sido
    // respondidas por el usuario (historial_respuestas); `premium_questions`
    // queda acotado a usuarios premium y a su materia/parcial.
    const admin = createAdminClient();
    const bancoScoped = await fetchBancoQuestionIdsScoped(
      admin,
      materiaId,
      data.parcial,
      limitedWrongIds,
      false
    );
    const premiumScoped = isPremium
      ? await fetchPremiumQuestionIdsScoped(admin, materiaId, data.parcial, limitedWrongIds)
      : [];

    const answeredBanco = await filterAnsweredBancoQuestionIds(
      supabase,
      user.id,
      materiaId,
      bancoScoped
    );
    const premiumAllowed = new Set(premiumScoped);

    const authorizedIds = limitedWrongIds.filter(
      (id) => answeredBanco.has(id) || premiumAllowed.has(id)
    );
    if (authorizedIds.length === 0) {
      return { success: true, explanations: [] as WrongAnswerExplanation[] };
    }

    const { explanations, metrics } = await buildWrongAnswersExplanations({
      materiaId,
      parcial: data.parcial,
      wrongQuestionIds: authorizedIds,
      userId: user.id,
      chosenAnswers: data.chosen_answers,
    });
    return { success: true, explanations, metrics, premium: isPremium };
  } catch (error) {
    logError('actions.getWrongAnswersExplanations', error, {
      materiaId: data.materia_id,
      parcial: data.parcial,
      wrongQuestionCount: data.wrong_question_ids.length,
    });
    return { success: false, message: 'No se pudieron generar las explicaciones.' };
  }
}

/**
 * Versión demo: genera la explicación de IA de un único error SIN requerir login.
 * Es el "momento aha" que convierte al visitante anónimo: práctica + IA, sin cuenta.
 * Limitado a 1 explicación y con rate limit por IP.
 */
export async function getWrongAnswersExplanationsDemo(data: {
  materia_id: string;
  parcial: number;
  wrong_question_ids: string[];
  chosen_answers?: Record<string, number | number[] | null>;
}) {
  try {
    const clientKey = await getServerActionClientKey();
    const rateResult = await enforceStrictRateLimit({
      key: `demo:explanations:${clientKey}`,
      limit: 5,
      windowMs: 60_000,
    });
    if (!rateResult.allowed) {
      return { success: false, message: 'Demasiados intentos. Probá de nuevo en un momento.' };
    }

    const materiaId = data.materia_id;
    if (!materiaId) {
      return { success: false, message: 'Materia no especificada.' };
    }

    const wrongIds = Array.from(new Set(data.wrong_question_ids.filter(Boolean))).slice(0, 1);
    if (wrongIds.length === 0) {
      return { success: true, explanations: [] as WrongAnswerExplanation[] };
    }

    // Validación server-side: solo preguntas `es_demo` de esta materia/parcial.
    // `premium_questions` queda totalmente excluido del path demo.
    const admin = createAdminClient();
    const validDemoIds = await fetchBancoQuestionIdsScoped(
      admin,
      materiaId,
      data.parcial,
      wrongIds,
      true
    );
    if (validDemoIds.length === 0) {
      return { success: true, explanations: [] as WrongAnswerExplanation[] };
    }

    const { explanations, metrics } = await buildWrongAnswersExplanations({
      materiaId,
      parcial: data.parcial,
      wrongQuestionIds: validDemoIds,
      chosenAnswers: data.chosen_answers,
      includePremium: false,
      includeCorrectAnswer: false,
      demo: true,
    });

    return { success: true, explanations, metrics, premium: false };
  } catch (error) {
    logError('actions.getWrongAnswersExplanationsDemo', error, {
      materiaId: data.materia_id,
      parcial: data.parcial,
    });
    return { success: false, message: 'No se pudieron generar las explicaciones.' };
  }
}
