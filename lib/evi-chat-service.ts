import 'server-only';
import { createClientServer } from '@/lib/supabase-server';
import { loadEviChatGrounding, type EviChatGrounding } from '@/lib/evi-chat-context';
import {
  EVI_CHAT_FREE_DAILY_LIMIT,
  EVI_CHAT_PREMIUM_DAILY_LIMIT,
  sanitizeEviChatInput,
  type EviChatContext,
  type EviChatMessage,
} from '@/lib/evi-chat-contract';
import { resolveStudyLocale } from '@/lib/i18n/study-language';
import { hasPremiumAccess } from '@/lib/premium';
import { enforceStrictRateLimit } from '@/lib/rate-limit';

const DAY_MS = 24 * 60 * 60 * 1000;

export type EviChatPrepared = {
  ok: true;
  userId: string;
  english: boolean;
  premium: boolean;
  remaining: number | null;
  context: EviChatContext;
  history: EviChatMessage[];
  message: string;
  grounding: EviChatGrounding;
};

export type EviChatRejected = {
  ok: false;
  status: number;
  message: string;
  limitReached?: boolean;
};

/**
 * Todo lo que hay que comprobar antes de gastar IA: sesión, entrada válida,
 * ráfagas, que la pregunta sea del estudiante y el cupo diario. El cupo se
 * consume recién cuando la pregunta existe.
 */
export async function prepareEviChat(input: {
  context: unknown;
  history: unknown;
  message: unknown;
}): Promise<EviChatPrepared | EviChatRejected> {
  const client = await createClientServer();
  const user = (await client.auth.getUser()).data.user;
  if (!user) return { ok: false, status: 401, message: 'Iniciá sesión para preguntarle a Evi.' };
  const english = resolveStudyLocale(user.user_metadata) === 'en';
  const parsed = sanitizeEviChatInput(input);
  if (!parsed)
    return {
      ok: false,
      status: 400,
      message: english ? 'Write your question again.' : 'Escribí tu pregunta de nuevo.',
    };

  const burst = await enforceStrictRateLimit({
    key: `evi-chat:burst:${user.id}`,
    limit: 6,
    windowMs: 60_000,
  });
  if (!burst.allowed)
    return {
      ok: false,
      status: 429,
      message: english
        ? 'Wait a minute before asking again.'
        : 'Esperá un minuto antes de volver a preguntar.',
    };

  const grounding = await loadEviChatGrounding(user.id, parsed.context);
  if (!grounding)
    return {
      ok: false,
      status: 404,
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
      ok: false,
      status: 429,
      limitReached: true,
      message: premium
        ? english
          ? 'You reached today’s questions. Evi will be back tomorrow.'
          : 'Llegaste al máximo de preguntas de hoy. Mañana Evi vuelve a estar disponible.'
        : english
          ? `You used your ${EVI_CHAT_FREE_DAILY_LIMIT} free questions for today. Come back tomorrow or go Premium for more.`
          : `Usaste tus ${EVI_CHAT_FREE_DAILY_LIMIT} preguntas gratis de hoy. Volvé mañana o pasate a Premium para seguir preguntando.`,
    };

  return {
    ok: true,
    userId: user.id,
    english,
    premium,
    remaining: premium ? null : daily.remaining,
    context: parsed.context,
    history: parsed.history,
    message: parsed.message,
    grounding,
  };
}
