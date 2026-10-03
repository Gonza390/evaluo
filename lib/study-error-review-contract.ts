import { z } from 'zod';

export type ReviewHelpKind = 'why_wrong' | 'simpler' | 'example';
export type ReviewQuestion = { id: string; question: string; options: string[] };
export type ReviewAnswerResult = {
  success: boolean;
  correct?: boolean;
  correctIndex?: number;
  feedback?: string;
  resolvedAt?: string | null;
  replayed?: boolean;
  message?: string;
};

/** Una respuesta cortada no sirve como ayuda, aunque el proveedor devuelva HTTP 200. */
export function isCompleteReviewHelp(text: string, finishReason?: string) {
  if (/^(length|max_tokens)$/i.test(finishReason ?? '')) return false;
  const trimmed = text.trim();
  return trimmed.length >= 40 && trimmed.length <= 4000 && /[.!?][\s”"')\]*_]*$/.test(trimmed);
}

const questionSchema = z.object({
  supported: z.literal(true),
  question: z.string().trim().min(20).max(1000),
  options: z.array(z.string().trim().min(2).max(400)).length(3),
  correctIndex: z.number().int().min(0).max(2),
  feedback: z.string().trim().min(20).max(1600),
  evidenceQuote: z.string().trim().min(20).max(1600),
});

function comparable(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es');
}

/** Nunca se acepta una pregunta sin cita verificable ni una copia de la original. */
export function validateReviewQuestion(value: unknown, source: string, original: string) {
  const parsed = questionSchema.safeParse(value);
  if (!parsed.success) return null;
  const result = parsed.data;
  if (new Set(result.options.map(comparable)).size !== 3) return null;
  if (comparable(result.question) === comparable(original)) return null;
  if (!comparable(source).includes(comparable(result.evidenceQuote))) return null;
  return result;
}

export function publicReviewQuestion(row: {
  id: string;
  question: string;
  options: string[];
}): ReviewQuestion {
  // Lista explícita: ni el índice correcto ni el feedback viajan antes de responder.
  return { id: row.id, question: row.question, options: row.options };
}
