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


export type TutorQuickHelpKind = 'why_wrong' | 'simpler' | 'example';

type QuickHelpInput = {
  kind: TutorQuickHelpKind;
  question: string;
  selectedAnswer?: string | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  context?: string[];
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

function buildQuickHelpPrompt(input: QuickHelpInput) {
  const instruction =
    input.kind === 'why_wrong'
      ? 'Explicá específicamente por qué la respuesta elegida estaba mal o era incompleta y contrastala con la respuesta correcta.'
      : input.kind === 'simpler'
        ? 'Volvé a explicar el concepto con palabras más simples, frases cortas y sin agregar complejidad innecesaria.'
        : 'Dá un ejemplo concreto y breve que ayude a entender el mismo concepto. No uses exactamente el mismo caso de la pregunta.';

  const context = (input.context ?? []).filter(Boolean);
  const contextText = context.length
    ? context.map((item, index) => `Fuente ${index + 1}:\n${isolateUntrustedContent(item)}`).join('\n\n')
    : 'Sin fragmento de fuente adicional.';

  return [
    'Sos un tutor universitario claro y preciso.',
    instruction,
    'Basate en la pregunta, la respuesta del alumno, la respuesta correcta y la explicación disponible.',
    'Si hay una fuente, priorizala. No inventes citas, páginas ni información que no esté respaldada por los datos recibidos.',
    'No hagas preguntas de seguimiento y no abras una conversación. Entregá una sola respuesta útil de 60 a 140 palabras.',
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


export async function generateTutorQuickHelp(input: QuickHelpInput): Promise<{
  text: string;
  provider: string;
}> {
  const prompt = buildQuickHelpPrompt(input);
  const common = {
    prompt,
    temperature: 0.2,
  };

  const groqText = await tryProvider('groq', () =>
    requestGroqText({
      ...common,
      system: 'Sos un tutor académico que responde de forma breve, clara y accionable.',
      maxTokens: 300,
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
      system: 'Sos un tutor académico que responde de forma breve, clara y accionable.',
      maxTokens: 300,
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
      maxOutputTokens: 300,
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
    text: 'No se pudo generar esta ayuda en este momento. Intentá nuevamente en unos segundos.',
  };
}
