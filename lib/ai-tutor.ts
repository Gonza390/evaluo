import { logError } from '@/lib/observability';

type ExplainInput = {
  question: string;
  options: string[];
  correctAnswer: string;
  context: string[];
};

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const AI_REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = AI_REQUEST_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildPrompt(input: ExplainInput) {
  const contextText = input.context.length
    ? input.context.map((c, i) => `Fuente ${i + 1}:\n${c}`).join('\n\n')
    : 'Sin fuente interna disponible.';

  return [
    'Sos un tutor universitario claro, preciso y amable.',
    'Explicá por qué la respuesta correcta es correcta y por qué suelen confundirse las opciones incorrectas.',
    'Si hay fuentes, basate primero en ellas. Si no hay fuentes, da una explicación académica general y acláralo brevemente.',
    'Respuesta breve: 120 a 220 palabras.',
    '',
    `Pregunta: ${input.question}`,
    `Opciones: ${input.options.join(' | ')}`,
    `Respuesta correcta: ${input.correctAnswer}`,
    '',
    `Fuentes:\n${contextText}`,
  ].join('\n');
}

async function callGemini(prompt: string) {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  const response = await fetchWithTimeout(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 420,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini devolvio ${response.status}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  return text || null;
}

async function callGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const response = await fetchWithTimeout(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Sos un tutor académico que explica de forma clara y accionable.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq devolvio ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return json.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function generateTutorExplanation(input: ExplainInput) {
  const prompt = buildPrompt(input);

  try {
    const geminiText = await callGemini(prompt);
    if (geminiText) {
      return { text: geminiText, provider: 'gemini-1.5-flash' as const };
    }
  } catch (error) {
    logError('aiTutor.gemini', error);
  }

  try {
    const groqText = await callGroq(prompt);
    if (groqText) {
      return { text: groqText, provider: 'groq-llama-3.3-70b' as const };
    }
  } catch (error) {
    logError('aiTutor.groq', error);
  }

  return {
    provider: 'fallback-local' as const,
    text: 'No se pudo generar la explicación automática en este momento. Intenta nuevamente en unos segundos.',
  };
}
