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

/**
 * Evita una comprobación que sólo reorganiza la misma definición o cambia
 * palabras de una pregunta previa. No alcanza para validar la calidad
 * semántica: el prompt sigue exigiendo un contexto o tarea cognitiva nuevos.
 */
export function isDistinctReviewQuestion(candidate: string, original: string) {
  if (comparable(candidate) === comparable(original)) return false;

  // Ignorar fórmulas interrogativas que no representan nuevo aprendizaje.
  const stopwords = new Set([
    'segun', 'texto', 'pdf', 'que', 'como', 'cual', 'cuales',
    'para', 'por', 'las', 'los', 'del', 'con', 'de', 'el', 'la',
    'un', 'una', 'y', 'o', 'es', 'son', 'se', 'ser',
    'correctamente', 'mejor', 'siguiente', 'siguientes',
    'afirmacion', 'afirmaciones', 'opcion', 'opciones',
    'definicion', 'definiciones', 'describe', 'describen',
    'sobre', 'acerca', 'este', 'esta',
  ]);
  const tokens = (question: string) =>
    new Set(
      question
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gu, ' ')
        .split(' ')
        .filter((word) => word.length >= 3 && !stopwords.has(word))
    );
  const first = tokens(candidate);
  const second = tokens(original);
  if (!first.size || !second.size) return false;
  const shared = [...first].filter((word) => second.has(word)).length;
  if (first.size === second.size && shared === first.size) return false;
  return !(
    Math.min(first.size, second.size) >= 2 &&
    shared / Math.min(first.size, second.size) >= 0.85 &&
    shared / Math.max(first.size, second.size) >= 0.65
  );
}

/** Nunca se acepta una pregunta sin cita verificable ni una copia reformulada de la original. */
export function validateReviewQuestion(value: unknown, source: string, original: string) {
  const parsed = questionSchema.safeParse(value);
  if (!parsed.success) return null;
  const result = parsed.data;
  if (new Set(result.options.map(comparable)).size !== 3) return null;
  if (!isDistinctReviewQuestion(result.question, original)) return null;
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
