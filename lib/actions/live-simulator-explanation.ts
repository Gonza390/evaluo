'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { hasPremiumAccess } from '@/lib/premium';
import { logError } from '@/lib/observability';
import { enforceStrictRateLimit } from '@/lib/rate-limit';
import { buildWrongAnswersExplanations } from '@/lib/simulator-wrong-answers';
import { getLiveWrongAnswerExplanationDemo } from '@/lib/actions/errores';

const FREE_LIVE_EXPLANATIONS_LIMIT = 5;
const LIVE_EXPLANATION_WINDOW_MS = 3 * 60 * 60 * 1000;

function normalizeQuestionText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeAttemptKey(value: string | undefined) {
  const normalized = (value ?? '').trim();
  return /^[a-zA-Z0-9_-]{8,80}$/.test(normalized) ? normalized : null;
}

async function findBancoQuestionId(input: {
  materiaId: string;
  parcial: number;
  enunciado: string;
}) {
  const admin = createAdminClient();
  let query = admin
    .from('preguntas_banco')
    .select('id, enunciado')
    .eq('materia_id', input.materiaId)
    .limit(500);

  query =
    input.parcial === 3 ? query.in('parcial', [1, 2]) : query.eq('parcial', input.parcial);

  const { data, error } = await query;
  if (error) {
    logError('liveExplanation.lookupBanco', error, {
      materiaId: input.materiaId,
      parcial: input.parcial,
    });
    return null;
  }

  const match = (data ?? []).find(
    (row) => normalizeQuestionText(row.enunciado ?? '') === input.enunciado
  );
  return match?.id ?? null;
}

async function findPremiumQuestionId(input: {
  materiaId: string;
  parcial: number;
  enunciado: string;
}) {
  const admin = createAdminClient();
  const { data: sets, error: setsError } = await admin
    .from('premium_question_sets')
    .select('id')
    .eq('materia_id', input.materiaId)
    .eq('parcial', input.parcial);

  if (setsError || !sets?.length) {
    if (setsError) {
      logError('liveExplanation.lookupPremiumSets', setsError, {
        materiaId: input.materiaId,
        parcial: input.parcial,
      });
    }
    return null;
  }

  const { data, error } = await admin
    .from('premium_questions')
    .select('id, enunciado')
    .in(
      'set_id',
      sets.map((set) => set.id)
    )
    .limit(500);

  if (error) {
    logError('liveExplanation.lookupPremium', error, {
      materiaId: input.materiaId,
      parcial: input.parcial,
    });
    return null;
  }

  const match = (data ?? []).find(
    (row) => normalizeQuestionText(row.enunciado ?? '') === input.enunciado
  );
  return match?.id ?? null;
}

export async function getLiveWrongAnswerExplanation(data: {
  materia_id: string;
  parcial: number;
  enunciado: string;
  attempt_key?: string;
}) {
  try {
    const materiaId = data.materia_id?.trim();
    const parcial = Number(data.parcial);
    const enunciado = normalizeQuestionText(data.enunciado ?? '');

    if (!materiaId || !enunciado || ![1, 2, 3].includes(parcial)) {
      return { success: false, message: 'No pudimos identificar esta pregunta.' };
    }

    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return await getLiveWrongAnswerExplanationDemo({
        materia_id: materiaId,
        parcial,
        enunciado,
      });
    }

    const isPremium = await hasPremiumAccess(user.id);
    const bancoQuestionId = await findBancoQuestionId({ materiaId, parcial, enunciado });

    let questionId = bancoQuestionId;
    let premiumQuestion = false;

    if (questionId) {
      const { data: answered, error: answeredError } = await supabase
        .from('historial_respuestas')
        .select('pregunta_id')
        .eq('usuario_id', user.id)
        .eq('materia_id', materiaId)
        .eq('pregunta_id', questionId)
        .limit(1)
        .maybeSingle();

      if (answeredError) {
        logError('liveExplanation.verifyAnswered', answeredError, {
          materiaId,
          preguntaId: questionId,
        });
        return { success: false, message: 'No pudimos validar tu respuesta todavía.' };
      }

      if (!answered?.pregunta_id) {
        return { success: false, message: 'Esperá un instante y volvé a intentar.' };
      }
    } else if (isPremium) {
      questionId = await findPremiumQuestionId({ materiaId, parcial, enunciado });
      premiumQuestion = Boolean(questionId);
    }

    if (!questionId) {
      return {
        success: false,
        message: 'La explicación todavía no está disponible para esta pregunta.',
      };
    }

    let remaining: number | null = null;
    if (!isPremium) {
      const attemptKey = normalizeAttemptKey(data.attempt_key);
      if (!attemptKey) {
        return { success: false, message: 'No pudimos validar esta sesión del simulador.' };
      }

      const rate = await enforceStrictRateLimit({
        key: `simulator:live-explanation:${user.id}:${attemptKey}`,
        limit: FREE_LIVE_EXPLANATIONS_LIMIT,
        windowMs: LIVE_EXPLANATION_WINDOW_MS,
      });

      remaining = rate.remaining;
      if (!rate.allowed) {
        return {
          success: false,
          limitReached: true,
          limit: FREE_LIVE_EXPLANATIONS_LIMIT,
          remaining: 0,
          message:
            'Ya usaste las 5 explicaciones con IA incluidas en Free para este simulador. La respuesta correcta sigue marcada en verde.',
        };
      }
    }

    const { explanations, dailyLimitReached } = await buildWrongAnswersExplanations({
      materiaId,
      parcial,
      wrongQuestionIds: [questionId],
      userId: user.id,
      includePremium: isPremium || premiumQuestion,
      includeCorrectAnswer: true,
    });

    const explanation = explanations[0];
    if (!explanation) {
      return {
        success: false,
        message: dailyLimitReached
          ? 'Alcanzaste el límite diario de funciones con IA. Podés volver a intentarlo mañana.'
          : 'No pudimos generar la explicación en este momento.',
      };
    }

    return {
      success: true,
      explanations: [explanation],
      premium: isPremium,
      limit: isPremium ? null : FREE_LIVE_EXPLANATIONS_LIMIT,
      remaining,
    };
  } catch (error) {
    logError('actions.getLiveWrongAnswerExplanation', error, {
      materiaId: data.materia_id,
      parcial: data.parcial,
    });
    return { success: false, message: 'No se pudo generar la explicación en este momento.' };
  }
}
