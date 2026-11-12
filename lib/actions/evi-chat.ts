'use server';

import { createClientServer } from '@/lib/supabase-server';
import { generateEviChatReply } from '@/lib/ai-tutor';
import { loadEviChatGrounding } from '@/lib/evi-chat-context';
import {
  EVI_CHAT_FREE_DAILY_LIMIT,
  EVI_CHAT_PREMIUM_DAILY_LIMIT,
  sanitizeEviChatInput,
  type EviChatReply,
} from '@/lib/evi-chat-contract';
import { resolveStudyLocale } from '@/lib/i18n/study-language';
import { hasPremiumAccess } from '@/lib/premium';
import { enforceStrictRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/observability';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Una respuesta de Evi sobre la pregunta que el estudiante está mirando. */
export async function askEviAction(input: {
  context: unknown;
  history: unknown;
  message: unknown;
  suggestion?: boolean;
}): Promise<EviChatReply> {
  const client = await createClientServer();
  const user = (await client.auth.getUser()).data.user;
  if (!user) return { success: false, message: 'Iniciá sesión para preguntarle a Evi.' };
  const english = resolveStudyLocale(user.user_metadata) === 'en';
  const parsed = sanitizeEviChatInput(input);
  if (!parsed)
    return {
      success: false,
      message: english ? 'Write your question again.' : 'Escribí tu pregunta de nuevo.',
    };

  try {
    const burst = await enforceStrictRateLimit({
      key: `evi-chat:burst:${user.id}`,
      limit: 6,
      windowMs: 60_000,
    });
    if (!burst.allowed)
      return {
        success: false,
        message: english
          ? 'Wait a minute before asking again.'
          : 'Esperá un minuto antes de volver a preguntar.',
      };

    const grounding = await loadEviChatGrounding(user.id, parsed.context);
    if (!grounding)
      return {
        success: false,
        message: english
          ? 'We could not find this question in your notes. Refresh and try again.'
          : 'No encontramos esta pregunta en tu apunte. Actualizá la pantalla e intentá de nuevo.',
      };

    const premium = await hasPremiumAccess(user.id);
    const daily = await enforceStrictRateLimit({
      key: `evi-chat:daily:${user.id}`,
      limit: premium ? EVI_CHAT_PREMIUM_DAILY_LIMIT : EVI_CHAT_FREE_DAILY_LIMIT,
      windowMs: DAY_MS,
    });
    if (!daily.allowed)
      return {
        success: false,
        limitReached: true,
        message: premium
          ? english
            ? 'You reached today’s questions. Evi will be back tomorrow.'
            : 'Llegaste al máximo de preguntas de hoy. Mañana Evi vuelve a estar disponible.'
          : english
            ? `You used your ${EVI_CHAT_FREE_DAILY_LIMIT} free questions for today. Come back tomorrow or go Premium for more.`
            : `Usaste tus ${EVI_CHAT_FREE_DAILY_LIMIT} preguntas gratis de hoy. Volvé mañana o pasate a Premium para seguir preguntando.`,
      };

    const result = await generateEviChatReply({
      locale: english ? 'en' : 'es',
      question: grounding.question.slice(0, 2000),
      chosen: grounding.chosen?.slice(0, 1000),
      correctAnswer: grounding.correctAnswer?.slice(0, 1000),
      explanation: grounding.explanation?.slice(0, 1600),
      excerpt: grounding.excerpt,
      page: grounding.page,
      history: parsed.history,
      message: parsed.message,
    });
    if (!result.text)
      return {
        success: false,
        message: english
          ? 'Evi could not answer right now. Try again in a few seconds.'
          : 'Evi no pudo responder ahora. Probá de nuevo en unos segundos.',
      };

    await trackServerAnalyticsEvent({
      eventName: 'evi_chat_message_sent',
      userId: user.id,
      path: '/dashboard/practicar',
      metadata: {
        context_kind: parsed.context.kind,
        material_id: grounding.materialId,
        study_error_id: parsed.context.kind === 'error' ? parsed.context.errorId : null,
        suggestion: Boolean(input.suggestion),
        turn: parsed.history.filter((item) => item.role === 'user').length + 1,
        premium,
      },
    });

    return {
      success: true,
      text: result.text,
      page: grounding.excerpt ? grounding.page : null,
      remaining: premium ? null : daily.remaining,
    };
  } catch (error) {
    logError('eviChat.ask', error, { userId: user.id, kind: parsed.context.kind });
    return {
      success: false,
      message: english
        ? 'Evi could not answer right now. Try again in a few seconds.'
        : 'Evi no pudo responder ahora. Probá de nuevo en unos segundos.',
    };
  }
}
