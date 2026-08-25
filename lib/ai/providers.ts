import { logError } from '@/lib/observability';

export type AiProviderName = 'gemini' | 'groq' | 'nvidia' | 'github';

export type AiUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

export type ProviderResult = {
  provider: AiProviderName;
  model: string;
  content: string;
  usage?: AiUsage;
};

const AI_REQUEST_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 12_000) || 12_000
);
const GITHUB_MODELS_ENDPOINT =
  process.env.GITHUB_MODELS_URL ?? 'https://models.github.ai/inference/chat/completions';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const NVIDIA_ENDPOINT =
  process.env.NVIDIA_URL ?? 'https://integrate.api.nvidia.com/v1/chat/completions';

// Modelos estandarizados. Gemini queda fijado a una version estable para que
// calidad, cuota y coste no cambien silenciosamente por un alias `latest`.
const GITHUB_MODELS_PRIMARY_SUMMARY_MODEL =
  process.env.GITHUB_MODELS_SUMMARY_MODEL ?? 'openai/gpt-4o-mini';
const GITHUB_MODELS_FALLBACK_SUMMARY_MODEL =
  process.env.GITHUB_MODELS_FALLBACK_MODEL ?? 'openai/gpt-4.1-mini';
export const PINNED_GEMINI_SUMMARY_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_PRIMARY_SUMMARY_MODEL = PINNED_GEMINI_SUMMARY_MODEL;
const GEMINI_FALLBACK_SUMMARY_MODEL = PINNED_GEMINI_SUMMARY_MODEL;
const GROQ_PRIMARY_SUMMARY_MODEL =
  process.env.GROQ_PDF_MODEL ?? process.env.GROQ_SUMMARY_MODEL ?? 'openai/gpt-oss-20b';
// No mantenemos un fallback Groq hardcodeado: los modelos retirados generaban
// un 404 en cada artefacto antes de llegar al proveedor sano.
const GROQ_FALLBACK_SUMMARY_MODEL = process.env.GROQ_FALLBACK_MODEL;
const NVIDIA_PRIMARY_SUMMARY_MODEL =
  process.env.NVIDIA_SUMMARY_MODEL ?? 'meta/llama-3.3-70b-instruct';
const NVIDIA_FALLBACK_SUMMARY_MODEL =
  process.env.NVIDIA_FALLBACK_MODEL ?? 'meta/llama-3.1-8b-instruct';

export function getGeminiSummaryModels() {
  return uniqueConfiguredValues([GEMINI_PRIMARY_SUMMARY_MODEL, GEMINI_FALLBACK_SUMMARY_MODEL]);
}

export function getGroqSummaryModels() {
  return uniqueConfiguredValues([GROQ_PRIMARY_SUMMARY_MODEL, GROQ_FALLBACK_SUMMARY_MODEL]).filter(
    (model) => model !== 'llama-3.1-8b-instant'
  );
}

export function getGithubModelsSummaryModels() {
  return uniqueConfiguredValues([
    GITHUB_MODELS_PRIMARY_SUMMARY_MODEL,
    GITHUB_MODELS_FALLBACK_SUMMARY_MODEL,
  ]);
}

export function getNvidiaSummaryModels() {
  return uniqueConfiguredValues([NVIDIA_PRIMARY_SUMMARY_MODEL, NVIDIA_FALLBACK_SUMMARY_MODEL]);
}

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
  return values.filter(
    (value, index, array): value is string => Boolean(value) && array.indexOf(value) === index
  );
}

function parseOpenAiUsage(json: Record<string, unknown>): AiUsage | undefined {
  const usage = json?.usage;
  if (!usage || typeof usage !== 'object') return undefined;

  const record = usage as Record<string, unknown>;
  const promptTokens = typeof record.prompt_tokens === 'number' ? record.prompt_tokens : null;
  const completionTokens =
    typeof record.completion_tokens === 'number' ? record.completion_tokens : null;
  const totalTokens = typeof record.total_tokens === 'number' ? record.total_tokens : null;

  if (promptTokens === null && completionTokens === null && totalTokens === null) return undefined;
  return { promptTokens, completionTokens, totalTokens };
}

function parseGeminiUsage(json: Record<string, unknown>): AiUsage | undefined {
  const usage = json?.usageMetadata;
  if (!usage || typeof usage !== 'object') return undefined;

  const record = usage as Record<string, unknown>;
  const promptTokens = typeof record.promptTokenCount === 'number' ? record.promptTokenCount : null;
  const completionTokens =
    typeof record.candidatesTokenCount === 'number' ? record.candidatesTokenCount : null;
  const totalTokens = typeof record.totalTokenCount === 'number' ? record.totalTokenCount : null;

  if (promptTokens === null && completionTokens === null && totalTokens === null) return undefined;
  return { promptTokens, completionTokens, totalTokens };
}

function isJsonModeRejectedError(errorText: string) {
  return /json|response_format|structured output|schema/i.test(errorText);
}

type OpenAiCompatibleRequest = {
  prompt: string;
  system: string;
  temperature: number;
  maxTokens: number;
};

type OpenAiCompatibleConfig = {
  endpoint: string;
  provider: AiProviderName;
  logScope: string;
  headers: (token: string) => Record<string, string>;
  transientStatuses: number[];
  apiKeys: () => string[];
  models: () => string[];
};

async function requestOpenAiCompatibleJson(
  cfg: OpenAiCompatibleConfig,
  input: OpenAiCompatibleRequest
): Promise<ProviderResult | null> {
  const apiKeys = cfg.apiKeys();
  const models = cfg.models();
  if (apiKeys.length === 0 || models.length === 0) return null;

  let lastErrorMessage = '';

  for (const apiKey of apiKeys) {
    for (const model of models) {
      const body: Record<string, unknown> = {
        model,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.prompt },
        ],
        response_format: { type: 'json_object' },
      };

      let response = await fetchWithTimeout(cfg.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...cfg.headers(apiKey),
        },
        body: JSON.stringify(body),
      });

      // Algunos modelos no soportan JSON mode y responden 400. Reintentamos
      // una sola vez sin response_format antes de descartar el modelo.
      if (response.status === 400) {
        const errorText = await response.text().catch(() => '');
        if (isJsonModeRejectedError(errorText)) {
          delete body.response_format;
          response = await fetchWithTimeout(cfg.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...cfg.headers(apiKey),
            },
            body: JSON.stringify(body),
          });
        } else {
          throw new Error(`${cfg.provider} ${model} devolvio 400: ${errorText.slice(0, 200)}`);
        }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (cfg.transientStatuses.includes(response.status)) {
          lastErrorMessage = `${cfg.provider} ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`;
          continue;
        }

        throw new Error(
          `${cfg.provider} ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`
        );
      }

      const json = (await response.json()) as Record<string, unknown>;
      const choices = json?.choices;
      const content = Array.isArray(choices)
        ? (
            (choices[0] as Record<string, unknown> | undefined)?.message as
              | Record<string, unknown>
              | undefined
          )?.content
        : undefined;

      const normalized = typeof content === 'string' ? content.trim() : '';
      if (!normalized) continue;

      return {
        provider: cfg.provider,
        model,
        content: normalized,
        usage: parseOpenAiUsage(json),
      };
    }
  }

  if (lastErrorMessage) {
    throw new Error(lastErrorMessage);
  }

  return null;
}

async function requestOpenAiCompatibleText(
  cfg: OpenAiCompatibleConfig,
  input: OpenAiCompatibleRequest
): Promise<ProviderResult | null> {
  const apiKeys = cfg.apiKeys();
  const models = cfg.models();
  if (apiKeys.length === 0 || models.length === 0) return null;

  let lastErrorMessage = '';

  for (const apiKey of apiKeys) {
    for (const model of models) {
      const body = {
        model,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.prompt },
        ],
      };

      const response = await fetchWithTimeout(cfg.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...cfg.headers(apiKey),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (cfg.transientStatuses.includes(response.status)) {
          lastErrorMessage = `${cfg.provider} ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`;
          continue;
        }

        throw new Error(
          `${cfg.provider} ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`
        );
      }

      const json = (await response.json()) as Record<string, unknown>;
      const choices = json?.choices;
      const content = Array.isArray(choices)
        ? (
            (choices[0] as Record<string, unknown> | undefined)?.message as
              | Record<string, unknown>
              | undefined
          )?.content
        : undefined;

      const normalized = typeof content === 'string' ? content.trim() : '';
      if (!normalized) continue;

      return {
        provider: cfg.provider,
        model,
        content: normalized,
        usage: parseOpenAiUsage(json),
      };
    }
  }

  if (lastErrorMessage) {
    throw new Error(lastErrorMessage);
  }

  return null;
}

const GITHUB_MODELS_TRANSIENT_STATUSES = [401, 403, 404, 429, 500, 503];
const GROQ_TRANSIENT_STATUSES = [401, 404, 429, 500, 503];

export async function requestGitHubModelsJson(input: OpenAiCompatibleRequest) {
  const config: OpenAiCompatibleConfig = {
    endpoint: GITHUB_MODELS_ENDPOINT,
    provider: 'github',
    logScope: 'aiProviders.github',
    transientStatuses: GITHUB_MODELS_TRANSIENT_STATUSES,
    apiKeys: () =>
      uniqueConfiguredValues([process.env.GITHUB_MODELS_TOKEN, process.env.GITHUB_PAT]),
    models: getGithubModelsSummaryModels,
    headers: (token) => ({
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    }),
  };

  try {
    return await requestOpenAiCompatibleJson(config, input);
  } catch (error) {
    logError(config.logScope, error);
    throw error;
  }
}

export async function requestGroqJson(input: OpenAiCompatibleRequest) {
  const config: OpenAiCompatibleConfig = {
    endpoint: GROQ_ENDPOINT,
    provider: 'groq',
    logScope: 'aiProviders.groq',
    transientStatuses: GROQ_TRANSIENT_STATUSES,
    apiKeys: () => uniqueConfiguredValues([process.env.GROQ_PDF_API_KEY, process.env.GROQ_API_KEY]),
    models: getGroqSummaryModels,
    headers: (token) => ({
      Authorization: `Bearer ${token}`,
    }),
  };

  try {
    return await requestOpenAiCompatibleJson(config, input);
  } catch (error) {
    logError(config.logScope, error);
    throw error;
  }
}

export async function requestGroqText(input: OpenAiCompatibleRequest) {
  const config: OpenAiCompatibleConfig = {
    endpoint: GROQ_ENDPOINT,
    provider: 'groq',
    logScope: 'aiProviders.groq.text',
    transientStatuses: GROQ_TRANSIENT_STATUSES,
    apiKeys: () => uniqueConfiguredValues([process.env.GROQ_API_KEY, process.env.GROQ_PDF_API_KEY]),
    models: getGroqSummaryModels,
    headers: (token) => ({
      Authorization: `Bearer ${token}`,
    }),
  };

  try {
    return await requestOpenAiCompatibleText(config, input);
  } catch (error) {
    logError(config.logScope, error);
    throw error;
  }
}

const NVIDIA_TRANSIENT_STATUSES = [401, 403, 404, 429, 500, 503];

export async function requestNvidiaJson(input: OpenAiCompatibleRequest) {
  const config: OpenAiCompatibleConfig = {
    endpoint: NVIDIA_ENDPOINT,
    provider: 'nvidia',
    logScope: 'aiProviders.nvidia',
    transientStatuses: NVIDIA_TRANSIENT_STATUSES,
    apiKeys: () => uniqueConfiguredValues([process.env.NVIDIA_API_KEY]),
    models: getNvidiaSummaryModels,
    headers: (token) => ({
      Authorization: `Bearer ${token}`,
    }),
  };

  try {
    return await requestOpenAiCompatibleJson(config, input);
  } catch (error) {
    logError(config.logScope, error);
    throw error;
  }
}

export async function requestNvidiaText(input: OpenAiCompatibleRequest) {
  const config: OpenAiCompatibleConfig = {
    endpoint: NVIDIA_ENDPOINT,
    provider: 'nvidia',
    logScope: 'aiProviders.nvidia.text',
    transientStatuses: NVIDIA_TRANSIENT_STATUSES,
    apiKeys: () => uniqueConfiguredValues([process.env.NVIDIA_API_KEY]),
    models: getNvidiaSummaryModels,
    headers: (token) => ({
      Authorization: `Bearer ${token}`,
    }),
  };

  try {
    return await requestOpenAiCompatibleText(config, input);
  } catch (error) {
    logError(config.logScope, error);
    throw error;
  }
}

type GeminiRequest = {
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
  responseSchema?: Record<string, unknown>;
  responseMimeType?: 'application/json' | 'text/plain';
};

async function requestGeminiCommon(input: GeminiRequest) {
  const apiKeys = uniqueConfiguredValues([
    process.env.GEMINI_SUMMARY_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GOOGLE_AI_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ]);
  const models = getGeminiSummaryModels();
  if (apiKeys.length === 0 || models.length === 0) return null;

  let lastErrorMessage = '';

  for (const apiKey of apiKeys) {
    for (const model of models) {
      const url = `${GEMINI_ENDPOINT}/${model}:generateContent`;
      const generationConfig: Record<string, unknown> = {
        temperature: input.temperature,
        maxOutputTokens: input.maxOutputTokens,
      };

      if (input.responseMimeType === 'application/json') {
        generationConfig.responseMimeType = 'application/json';
        if (input.responseSchema) {
          generationConfig.responseSchema = input.responseSchema;
        }
      }

      const response = await fetchWithTimeout(`${url}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input.prompt }] }],
          generationConfig,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if ([401, 404, 429, 500, 503].includes(response.status)) {
          lastErrorMessage = `Gemini ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`;
          continue;
        }

        throw new Error(`Gemini ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const json = (await response.json()) as Record<string, unknown>;
      const candidates = json?.candidates;
      const content = Array.isArray(candidates)
        ? ((candidates[0] as Record<string, unknown> | undefined)?.content as
            | Record<string, unknown>
            | undefined)
        : undefined;
      const parts = content?.parts;
      const text = Array.isArray(parts)
        ? parts
            .map((part) => (part as Record<string, unknown> | undefined)?.text ?? '')
            .join('')
            .trim()
        : '';

      if (!text) continue;

      return {
        provider: 'gemini' as const,
        model,
        content: text,
        usage: parseGeminiUsage(json),
      };
    }
  }

  if (lastErrorMessage) {
    throw new Error(lastErrorMessage);
  }

  return null;
}

export async function requestGeminiJson(input: GeminiRequest) {
  try {
    return await requestGeminiCommon({ ...input, responseMimeType: 'application/json' });
  } catch (error) {
    logError('aiProviders.gemini.json', error);
    throw error;
  }
}

export async function requestGeminiText(input: GeminiRequest) {
  try {
    return await requestGeminiCommon({ ...input, responseMimeType: 'text/plain' });
  } catch (error) {
    logError('aiProviders.gemini.text', error);
    throw error;
  }
}

async function runGeminiInlineJson(input: {
  prompt: string;
  inlineParts: Array<{ mimeType: string; data: string }>;
  temperature: number;
  maxOutputTokens: number;
  responseSchema?: Record<string, unknown>;
  logScope: string;
}) {
  const apiKeys = uniqueConfiguredValues([
    process.env.GEMINI_SUMMARY_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GOOGLE_AI_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ]);
  const models = getGeminiSummaryModels();
  if (apiKeys.length === 0 || models.length === 0) return null;

  let lastErrorMessage = '';

  for (const apiKey of apiKeys) {
    for (const model of models) {
      const url = `${GEMINI_ENDPOINT}/${model}:generateContent`;
      const generationConfig: Record<string, unknown> = {
        temperature: input.temperature,
        maxOutputTokens: input.maxOutputTokens,
      };

      if (input.responseSchema) {
        generationConfig.responseMimeType = 'application/json';
        generationConfig.responseSchema = input.responseSchema;
      }

      let response: Response;
      try {
        response = await fetchWithTimeout(
          `${url}?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    ...input.inlineParts.map((part) => ({
                      inlineData: { mimeType: part.mimeType, data: part.data },
                    })),
                    { text: input.prompt },
                  ],
                },
              ],
              generationConfig,
            }),
          },
          90_000
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastErrorMessage = `Gemini ${input.logScope} ${model} timeout`;
          continue;
        }
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if ([400, 401, 404, 429, 500, 503].includes(response.status)) {
          lastErrorMessage = `Gemini ${input.logScope} ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`;
          continue;
        }

        throw new Error(
          `Gemini ${input.logScope} ${model} devolvio ${response.status}: ${errorText.slice(0, 200)}`
        );
      }

      const json = (await response.json()) as Record<string, unknown>;
      const candidates = json?.candidates;
      const content = Array.isArray(candidates)
        ? ((candidates[0] as Record<string, unknown> | undefined)?.content as
            | Record<string, unknown>
            | undefined)
        : undefined;
      const parts = content?.parts;
      const text = Array.isArray(parts)
        ? parts
            .map((part) => (part as Record<string, unknown> | undefined)?.text ?? '')
            .join('')
            .trim()
        : '';

      if (!text) continue;

      return {
        provider: 'gemini' as const,
        model,
        content: text,
        usage: parseGeminiUsage(json),
      };
    }
  }

  if (lastErrorMessage) {
    throw new Error(lastErrorMessage);
  }

  return null;
}

export async function requestGeminiPdfJson(input: {
  prompt: string;
  pdfBuffer: Buffer;
  temperature: number;
  maxOutputTokens: number;
  responseSchema?: Record<string, unknown>;
}) {
  try {
    return await runGeminiInlineJson({
      ...input,
      inlineParts: [{ mimeType: 'application/pdf', data: input.pdfBuffer.toString('base64') }],
      logScope: 'pdf',
    });
  } catch (error) {
    logError('aiProviders.gemini.pdf', error);
    throw error;
  }
}

export async function requestGeminiImagesJson(input: {
  prompt: string;
  images: Buffer[];
  temperature: number;
  maxOutputTokens: number;
  responseSchema?: Record<string, unknown>;
}) {
  if (input.images.length === 0) {
    return null;
  }

  try {
    return await runGeminiInlineJson({
      prompt: input.prompt,
      inlineParts: input.images.map((image) => ({
        mimeType: 'image/png',
        data: image.toString('base64'),
      })),
      temperature: input.temperature,
      maxOutputTokens: input.maxOutputTokens,
      responseSchema: input.responseSchema,
      logScope: 'vision',
    });
  } catch (error) {
    logError('aiProviders.gemini.vision', error);
    throw error;
  }
}
