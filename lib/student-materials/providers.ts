const AI_REQUEST_TIMEOUT_MS = 20_000;
const GITHUB_MODELS_ENDPOINT =
  process.env.GITHUB_MODELS_URL ?? 'https://models.github.ai/inference/chat/completions';
const GITHUB_MODELS_PRIMARY_SUMMARY_MODEL =
  process.env.GITHUB_MODELS_SUMMARY_MODEL ?? 'openai/gpt-4o-mini';
const GITHUB_MODELS_FALLBACK_SUMMARY_MODEL =
  process.env.GITHUB_MODELS_FALLBACK_MODEL ?? 'openai/gpt-4.1-mini';
const GEMINI_PRIMARY_SUMMARY_MODEL = process.env.GEMINI_SUMMARY_MODEL ?? 'gemini-2.5-flash';
const GEMINI_FALLBACK_SUMMARY_MODEL = process.env.GEMINI_FALLBACK_SUMMARY_MODEL ?? 'gemini-2.0-flash-001';
const GROQ_PRIMARY_SUMMARY_MODEL = process.env.GROQ_PDF_MODEL ?? process.env.GROQ_SUMMARY_MODEL ?? 'llama-3.3-70b-versatile';
const GROQ_FALLBACK_SUMMARY_MODEL = process.env.GROQ_FALLBACK_MODEL ?? 'llama-3.1-8b-instant';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

type ProviderResult = {
  model: string;
  content: string;
};

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

function uniqueConfiguredValues(values: Array<string | undefined>) {
  return values.filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
}

export async function requestGitHubModelsJson(input: {
  prompt: string;
  system: string;
  temperature: number;
  maxTokens: number;
}): Promise<ProviderResult | null> {
  const tokens = uniqueConfiguredValues([
    process.env.GITHUB_MODELS_TOKEN,
    process.env.GITHUB_PAT,
  ]);
  if (tokens.length === 0) {
    return null;
  }

  const models = uniqueConfiguredValues([
    GITHUB_MODELS_PRIMARY_SUMMARY_MODEL,
    GITHUB_MODELS_FALLBACK_SUMMARY_MODEL,
  ]);
  let lastErrorMessage = '';

  for (const token of tokens) {
    for (const model of models) {
      const response = await fetchWithTimeout(GITHUB_MODELS_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: input.temperature,
          max_tokens: input.maxTokens,
          messages: [
            {
              role: 'system',
              content: input.system,
            },
            {
              role: 'user',
              content: input.prompt,
            },
          ],
          response_format: {
            type: 'json_object',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if ([401, 403, 404, 429, 500, 503].includes(response.status)) {
          lastErrorMessage = `GitHub Models ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`;
          continue;
        }

        throw new Error(`GitHub Models ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = json.choices?.[0]?.message?.content?.trim() ?? null;
      if (!content) {
        continue;
      }

      return {
        model,
        content,
      };
    }
  }

  if (lastErrorMessage) {
    throw new Error(lastErrorMessage);
  }

  return null;
}

export async function requestGroqJson(input: {
  prompt: string;
  system: string;
  temperature: number;
  maxTokens: number;
}): Promise<ProviderResult | null> {
  const apiKeys = uniqueConfiguredValues([process.env.GROQ_PDF_API_KEY, process.env.GROQ_API_KEY]);
  if (apiKeys.length === 0) {
    return null;
  }

  const models = uniqueConfiguredValues([GROQ_PRIMARY_SUMMARY_MODEL, GROQ_FALLBACK_SUMMARY_MODEL]);
  let lastErrorMessage = '';

  for (const apiKey of apiKeys) {
    for (const model of models) {
      const response = await fetchWithTimeout(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: input.temperature,
          max_tokens: input.maxTokens,
          messages: [
            {
              role: 'system',
              content: input.system,
            },
            {
              role: 'user',
              content: input.prompt,
            },
          ],
          response_format: {
            type: 'json_object',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if ([401, 404, 429, 500, 503].includes(response.status)) {
          lastErrorMessage = `Groq ${model} devolvió ${response.status}: ${errorText.slice(0, 200)}`;
          continue;
        }

        throw new Error(`Groq ${model} devolvió ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = json.choices?.[0]?.message?.content?.trim() ?? null;
      if (!content) {
        continue;
      }

      return {
        model,
        content,
      };
    }
  }

  if (lastErrorMessage) {
    throw new Error(lastErrorMessage);
  }

  return null;
}

export async function requestGeminiJson(input: {
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
  responseSchema?: Record<string, unknown>;
}): Promise<ProviderResult | null> {
  const apiKeys = uniqueConfiguredValues([
    process.env.GEMINI_SUMMARY_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_AI_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ]);
  if (apiKeys.length === 0) {
    return null;
  }

  const models = uniqueConfiguredValues([GEMINI_PRIMARY_SUMMARY_MODEL, GEMINI_FALLBACK_SUMMARY_MODEL]);
  let lastErrorMessage = '';

  for (const apiKey of apiKeys) {
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetchWithTimeout(`${url}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input.prompt }] }],
          generationConfig: {
            temperature: input.temperature,
            maxOutputTokens: input.maxOutputTokens,
            responseMimeType: 'application/json',
            ...(input.responseSchema ? { responseSchema: input.responseSchema } : {}),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if ([401, 404, 429, 500, 503].includes(response.status)) {
          lastErrorMessage = `Gemini ${model} devolvió ${response.status}: ${errorText.slice(0, 200)}`;
          continue;
        }

        throw new Error(`Gemini ${model} devolvió ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const json = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const content =
        json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? null;

      if (!content) {
        continue;
      }

      return {
        model,
        content,
      };
    }
  }

  if (lastErrorMessage) {
    throw new Error(lastErrorMessage);
  }

  return null;
}
