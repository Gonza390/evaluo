import { logError } from '@/lib/observability';
import { requestGeminiText, requestGroqText, requestNvidiaText } from '@/lib/ai/providers';
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

type TutorProvider = 'groq' | 'nvidia' | 'gemini';
type ProviderTextResult = { content: string; model: string } | null;

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

  const groqText = await tryProvider('groq', () =>
    requestGroqText({
      ...common,
      system: 'Sos un tutor académico que explica de forma clara y accionable.',
      maxTokens: 420,
    })
  );
  if (groqText) {
    return {
      text: truncateUtf8Text(groqText.content, MAX_AI_EXPLANATION_CHARS),
      provider: groqText.model,
    };
  }

  const nvidiaText = await tryProvider('nvidia', () =>
    requestNvidiaText({
      ...common,
      system: 'Sos un tutor académico que explica de forma clara y accionable.',
      maxTokens: 420,
    })
  );
  if (nvidiaText) {
    return {
      text: truncateUtf8Text(nvidiaText.content, MAX_AI_EXPLANATION_CHARS),
      provider: nvidiaText.model,
    };
  }

  const geminiText = await tryProvider('gemini', () =>
    requestGeminiText({
      ...common,
      maxOutputTokens: 420,
    })
  );
  if (geminiText) {
    return {
      text: truncateUtf8Text(geminiText.content, MAX_AI_EXPLANATION_CHARS),
      provider: geminiText.model,
    };
  }

  return {
    provider: 'fallback-local',
    text: 'No se pudo generar la explicación automática en este momento. Intenta nuevamente en unos segundos.',
  };
}
