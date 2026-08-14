import { logError } from '@/lib/observability';
import { requestGeminiText, requestGroqText } from '@/lib/ai/providers';
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

export async function generateTutorExplanation(input: ExplainInput): Promise<{
  text: string;
  provider: string;
}> {
  const prompt = buildPrompt(input);

  try {
    const geminiText = await requestGeminiText({
      prompt,
      temperature: 0.2,
      maxOutputTokens: 420,
    });
    if (geminiText) {
      return {
        text: truncateUtf8Text(geminiText.content, MAX_AI_EXPLANATION_CHARS),
        provider: geminiText.model,
      };
    }
  } catch (error) {
    logError('aiTutor.gemini', error);
  }

  try {
    const groqText = await requestGroqText({
      prompt,
      system: 'Sos un tutor académico que explica de forma clara y accionable.',
      temperature: 0.2,
      maxTokens: 420,
    });
    if (groqText) {
      return {
        text: truncateUtf8Text(groqText.content, MAX_AI_EXPLANATION_CHARS),
        provider: groqText.model,
      };
    }
  } catch (error) {
    logError('aiTutor.groq', error);
  }

  return {
    provider: 'fallback-local',
    text: 'No se pudo generar la explicación automática en este momento. Intenta nuevamente en unos segundos.',
  };
}
