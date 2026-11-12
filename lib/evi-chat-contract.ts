// Contrato compartido del chat "Preguntale a Evi" (cliente y servidor).
// El cliente nunca envía el texto del apunte: el servidor lo busca y verifica
// que el material sea del estudiante.

export const EVI_CHAT_MAX_MESSAGE_CHARS = 600;
export const EVI_CHAT_MAX_HISTORY = 6;
export const EVI_CHAT_FREE_DAILY_LIMIT = 5;
export const EVI_CHAT_PREMIUM_DAILY_LIMIT = 60;

export type EviChatRole = 'user' | 'assistant';
export type EviChatMessage = { role: EviChatRole; text: string };

/** De qué pregunta estamos hablando. */
export type EviChatContext =
  | {
      kind: 'error';
      /** Un error guardado en Mis errores (study_errors.id). */
      errorId: string;
      materialId?: string | null;
      label: string;
    }
  | {
      kind: 'practice';
      materialId: string;
      /** Texto de la pregunta tal como la vio el estudiante. */
      question: string;
      chosen?: string | null;
      correctAnswer: string;
      explanation?: string | null;
      page?: number | null;
      label: string;
    };

export type EviChatReply =
  | { success: true; text: string; page: number | null; remaining: number | null }
  | { success: false; message: string; limitReached?: boolean };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

/** Valida y recorta lo que llega del cliente. Devuelve null si no es válido. */
export function sanitizeEviChatInput(input: {
  context: unknown;
  history: unknown;
  message: unknown;
}): { context: EviChatContext; history: EviChatMessage[]; message: string } | null {
  const message = cleanText(input.message, EVI_CHAT_MAX_MESSAGE_CHARS);
  if (message.length < 2) return null;
  const raw = input.context as Record<string, unknown> | null;
  if (!raw || typeof raw !== 'object') return null;
  let context: EviChatContext;
  if (raw.kind === 'error') {
    const errorId = cleanText(raw.errorId, 40);
    const materialId = raw.materialId ? cleanText(raw.materialId, 40) : null;
    if (!uuid.test(errorId) || (materialId && !uuid.test(materialId))) return null;
    context = { kind: 'error', errorId, materialId, label: cleanText(raw.label, 120) };
  } else if (raw.kind === 'practice') {
    const materialId = cleanText(raw.materialId, 40);
    const question = cleanText(raw.question, 2000);
    const correctAnswer = cleanText(raw.correctAnswer, 1000);
    const page = Number(raw.page);
    if (!uuid.test(materialId) || question.length < 3 || !correctAnswer) return null;
    context = {
      kind: 'practice',
      materialId,
      question,
      correctAnswer,
      chosen: cleanText(raw.chosen, 1000) || null,
      explanation: cleanText(raw.explanation, 1600) || null,
      page: Number.isInteger(page) && page > 0 && page < 10_000 ? page : null,
      label: cleanText(raw.label, 120),
    };
  } else {
    return null;
  }
  const history = (Array.isArray(input.history) ? input.history : [])
    .slice(-EVI_CHAT_MAX_HISTORY)
    .map((item) => {
      const entry = item as Record<string, unknown> | null;
      const role =
        entry?.role === 'assistant' ? 'assistant' : entry?.role === 'user' ? 'user' : null;
      const text = cleanText(entry?.text, role === 'assistant' ? 1200 : EVI_CHAT_MAX_MESSAGE_CHARS);
      return role && text ? { role, text } : null;
    })
    .filter((item): item is EviChatMessage => item !== null);
  return { context, history, message };
}

/** Sugerencias en la voz del estudiante; la primera se adapta a lo que eligió. */
export function eviChatSuggestions(chosen: string | null | undefined, english = false) {
  const other = chosen?.trim();
  const first =
    other &&
    other.length <= 60 &&
    !/^(verdadero|falso|true|false|no lo s[aá]b[ií]a|no s[eé]|sin respuesta|sin responder|no answer|i don.?t know)$/i.test(
      other
    )
      ? english
        ? `How is it different from “${other}”?`
        : `¿En qué se diferencia de «${other}»?`
      : null;
  const base = english
    ? ['Explain it more simply', 'Give me an example', 'Ask me a similar question']
    : ['Explicámelo más simple', 'Dame un ejemplo', 'Haceme una pregunta parecida'];
  return first ? [first, ...base] : base;
}
