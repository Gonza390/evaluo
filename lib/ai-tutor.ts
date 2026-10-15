import { buildStudyErrorReviewPrompt } from '@/lib/study-error-review-prompt';
import { logError } from '@/lib/observability';
import {
  requestGeminiText,
  requestGroqText,
  requestGroqJson,
  requestGeminiJson,
} from '@/lib/ai/providers';
import { extractJsonObject } from '@/lib/ai/json';
import {
  getNextInteractiveProviderOrder,
  type InteractiveAiProvider,
} from '@/lib/ai/interactive-provider-routing';
import { validateReviewQuestion, isCompleteReviewHelp } from '@/lib/study-error-review-contract';
import {
  isolateUntrustedContent,
  MAX_AI_EXPLANATION_CHARS,
  PROMPT_INJECTION_GUARD,
  truncateUtf8Text,
} from '@/lib/ai/safety';

type ExplainInput = {
  question: string;
  options: string[];
  correctAnswer: string;
  context: string[];
};

export type TutorQuickHelpKind = 'why_wrong' | 'simpler' | 'example';

type QuickHelpInput = {
  kind: TutorQuickHelpKind;
  question: string;
  selectedAnswer?: string | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  context?: string[];
  compact?: boolean;
};

type TutorProvider = InteractiveAiProvider;
type ProviderTextResult = { content: string; model: string; finishReason?: string } | null;

const unhealthyProviderUntil = new Map<TutorProvider, number>();

function buildPrompt(input: ExplainInput) {
  const contextText = input.context.length
    ? input.context.map((c, i) => `Fuente ${i + 1}:\n${isolateUntrustedContent(c)}`).join('\n\n')
    : 'Sin fuente interna disponible.';

  return [
    'Sos un tutor universitario claro, preciso y amable.',
    'Explicá por qué la respuesta correcta es correcta y por qué suelen confundirse las opciones incorrectas.',
    'Si hay fuentes, basate primero en ellas. Si no hay fuentes, da una explicación académica general y acláralo brevemente.',
    'Respuesta breve: 120 a 220 palabras.',
    PROMPT_INJECTION_GUARD,
    '',
    `Pregunta: ${isolateUntrustedContent(input.question)}`,
    `Opciones: ${input.options.map(isolateUntrustedContent).join(' | ')}`,
    `Respuesta correcta: ${isolateUntrustedContent(input.correctAnswer)}`,
    '',
    `Fuentes:\n${contextText}`,
  ].join('\n');
}

function buildQuickHelpPrompt(input: QuickHelpInput) {
  const instruction =
    input.kind === 'why_wrong'
      ? 'Explicá específicamente por qué la respuesta elegida estaba mal o era incompleta y contrastala con la respuesta correcta.'
      : input.kind === 'simpler'
        ? 'Volvé a explicar el concepto con palabras más simples, frases cortas y sin agregar complejidad innecesaria.'
        : 'Dá un ejemplo concreto y breve que ayude a entender el mismo concepto. No uses exactamente el mismo caso de la pregunta.';

  const context = (input.context ?? []).filter(Boolean);
  const contextText = context.length
    ? context
        .map((item, index) => `Fuente ${index + 1}:\n${isolateUntrustedContent(item)}`)
        .join('\n\n')
    : 'Sin fragmento de fuente adicional.';

  return [
    'Sos un tutor universitario claro y preciso.',
    'Hablale directamente al estudiante con voseo argentino: "Elegiste", "podés", "pensá". No lo llames "el alumno" ni juzgues su capacidad.',
    instruction,
    'Ordená la ayuda en párrafos cortos. Primero aclarás la confusión, después mostrás cómo pensar el concepto. No repitas literalmente las dos respuestas sin explicarlas.',
    'Basate en la pregunta, la respuesta del alumno, la respuesta correcta y la explicación disponible.',
    'Si hay una fuente, explicá sólo lo que se pueda sostener con ella. Si contradice la respuesta de la actividad, señalá esa diferencia sin justificar una respuesta falsa. No inventes citas, páginas ni información.',
    'No atribuyas procesos o consecuencias que el fragmento no describa. Usá texto sin Markdown y cerrá todas las frases.',
    input.compact
      ? 'No hagas preguntas de seguimiento. Explicá la confusión en 35 a 65 palabras, máximo 3 frases cortas, para que el estudiante pueda volver a intentarlo enseguida.'
      : 'No hagas preguntas de seguimiento y no abras una conversación. Entregá una sola respuesta útil de 60 a 140 palabras.',
    PROMPT_INJECTION_GUARD,
    '',
    `Pregunta: ${isolateUntrustedContent(input.question)}`,
    `Respuesta del alumno: ${isolateUntrustedContent(input.selectedAnswer ?? 'No disponible')}`,
    `Respuesta correcta: ${isolateUntrustedContent(input.correctAnswer ?? 'No disponible')}`,
    `Explicación disponible: ${isolateUntrustedContent(input.explanation ?? 'No disponible')}`,
    '',
    `Fuente:\n${contextText}`,
  ].join('\n');
}

function providerCooldownMs(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const status = Number(message.match(/\b(401|403|404|429|500|502|503|504)\b/)?.[1] ?? 0);

  if (status === 401 || status === 403) return 30 * 60 * 1000;
  if (status === 404) return 6 * 60 * 60 * 1000;
  if (status === 429) return 2 * 60 * 1000;
  if (status >= 500) return 60 * 1000;
  return 60 * 1000;
}

function providerIsHealthy(provider: TutorProvider) {
  const until = unhealthyProviderUntil.get(provider) ?? 0;
  if (until <= Date.now()) {
    unhealthyProviderUntil.delete(provider);
    return true;
  }
  return false;
}

async function tryProvider(
  provider: TutorProvider,
  request: () => Promise<ProviderTextResult>
): Promise<ProviderTextResult> {
  if (!providerIsHealthy(provider)) return null;

  try {
    const result = await request();
    if (result) unhealthyProviderUntil.delete(provider);
    return result;
  } catch (error) {
    unhealthyProviderUntil.set(provider, Date.now() + providerCooldownMs(error));
    logError(`aiTutor.${provider}`, error);
    return null;
  }
}

export async function generateTutorExplanation(input: ExplainInput): Promise<{
  text: string;
  provider: string;
}> {
  const prompt = buildPrompt(input);
  const common = {
    prompt,
    temperature: 0.2,
  };
  const providerOrder = await getNextInteractiveProviderOrder();

  for (const provider of providerOrder) {
    const result =
      provider === 'groq'
        ? await tryProvider('groq', () =>
            requestGroqText({
              ...common,
              system: 'Sos un tutor académico que explica de forma clara y accionable.',
              maxTokens: 420,
            })
          )
        : await tryProvider('gemini', () =>
            requestGeminiText({
              ...common,
              maxOutputTokens: 420,
            })
          );

    if (result) {
      return {
        text: truncateUtf8Text(result.content, MAX_AI_EXPLANATION_CHARS),
        provider: result.model,
      };
    }
  }

  return {
    provider: 'fallback-local',
    text: 'No pudimos generar la explicación en este momento. Intentá nuevamente en unos segundos.',
  };
}

export async function generateTutorQuickHelp(input: QuickHelpInput): Promise<{
  text: string;
  provider: string;
}> {
  const prompt = buildQuickHelpPrompt(input);
  const common = {
    prompt,
    temperature: 0.2,
  };
  const outputBudget = input.compact ? 260 : input.kind === 'why_wrong' ? 600 : 400;
  const providerOrder = await getNextInteractiveProviderOrder();

  for (const provider of providerOrder) {
    const result =
      provider === 'groq'
        ? await tryProvider('groq', () =>
            requestGroqText({
              ...common,
              system: 'Sos un tutor académico que responde de forma breve, clara y accionable.',
              maxTokens: outputBudget,
            })
          )
        : await tryProvider('gemini', () =>
            requestGeminiText({
              ...common,
              maxOutputTokens: outputBudget,
            })
          );

    if (result && isCompleteReviewHelp(result.content, result.finishReason)) {
      return {
        text: truncateUtf8Text(result.content, MAX_AI_EXPLANATION_CHARS),
        provider: result.model,
      };
    }
  }

  return {
    provider: 'fallback-local',
    text: 'No se pudo generar esta ayuda en este momento. Intentá nuevamente en unos segundos.',
  };
}

export type ReviewQuestionGenerationFailure =
  | 'provider_unavailable'
  | 'unsupported_by_source'
  | 'invalid_response';

export async function generateStudyErrorReviewQuestion(
  input: Parameters<typeof buildStudyErrorReviewPrompt>[0]
): Promise<
  | { question: NonNullable<ReturnType<typeof validateReviewQuestion>>; failureReason: null; providerOutcomes: string[] }
  | { question: null; failureReason: ReviewQuestionGenerationFailure; providerOutcomes: string[] }
> {
  const prompt = buildStudyErrorReviewPrompt(input);
  const providerOrder = await getNextInteractiveProviderOrder();
  const providerOutcomes: string[] = [];
  let receivedResponse = false;
  let abstained = false;
  let invalid = false;
  for (const provider of providerOrder) {
    const result =
      provider === 'groq'
        ? await tryProvider('groq', () =>
            requestGroqJson({
              prompt,
              system: 'Sos un docente. Respondé sólo JSON verificable con la fuente.',
              temperature: 0.2,
              maxTokens: 650,
            })
          )
        : await tryProvider('gemini', () =>
            requestGeminiJson({
              prompt,
              temperature: 0.2,
              maxOutputTokens: 650,
            })
          );
    if (!result) {
      providerOutcomes.push(`${provider}:unavailable`);
      continue;
    }
    receivedResponse = true;
    try {
      const payload = extractJsonObject(result.content);
      // Una abstención del primer proveedor no descarta otra interpretación
      // válida del PDF. Consultamos el fallback sin relajar la cita obligatoria.
      if (
        payload &&
        typeof payload === 'object' &&
        'supported' in payload &&
        payload.supported === false
      ) {
        abstained = true;
        providerOutcomes.push(`${provider}:abstained`);
        continue;
      }
      const question = validateReviewQuestion(payload, input.source, input.question);
      if (
        question &&
        (!input.previousQuestion ||
          validateReviewQuestion(payload, input.source, input.previousQuestion))
      ) {
        providerOutcomes.push(`${provider}:accepted`);
        return { question, failureReason: null, providerOutcomes };
      }
    } catch {
      // Rechazo del formato o de la evidencia: probar el proveedor alternativo.
    }
    invalid = true;
    providerOutcomes.push(`${provider}:invalid`);
  }
  return {
    question: null,
    failureReason: !receivedResponse
      ? 'provider_unavailable'
      : abstained && !invalid
        ? 'unsupported_by_source'
        : 'invalid_response',
    providerOutcomes,
  };
}
