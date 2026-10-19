import 'server-only';

import { logError, logInfo } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { classifyAIKeyHttpStatus, type AIKeyHealthStatus } from '@/lib/ai/key-health-utils';

type AIProvider = 'gemini_pdf' | 'gemini_app' | 'groq' | 'nvidia';
export type AIKeyHealthItem = {
  name: string;
  provider: AIProvider;
  status: AIKeyHealthStatus;
  httpStatus: number | null;
  latencyMs: number | null;
};
export type AIKeyHealthReport = {
  checkedAt: string;
  healthy: number;
  total: number;
  checks: AIKeyHealthItem[];
};

const REQUEST_TIMEOUT_MS = 10_000;

// Nombres de variables, no valores de credenciales. Nunca se registra la key.
const EXPECTED_KEYS: ReadonlyArray<{ name: string; provider: AIProvider }> = [
  { name: 'GEMINI_API_KEY', provider: 'gemini_pdf' },
  { name: 'GEMINI_PDF_API_KEY_2', provider: 'gemini_pdf' },
  { name: 'GEMINI_PDF_API_KEY_3', provider: 'gemini_pdf' },
  { name: 'GEMINI_APP_API_KEY_1', provider: 'gemini_app' },
  { name: 'GEMINI_APP_API_KEY_2', provider: 'gemini_app' },
  { name: 'GEMINI_APP_API_KEY_3', provider: 'gemini_app' },
  { name: 'GEMINI_APP_API_KEY_4', provider: 'gemini_app' },
  { name: 'GROQ_APP_API_KEY', provider: 'groq' },
  { name: 'GROQ_API_KEY_FALLBACK', provider: 'groq' },
  { name: 'NVIDIA_API_KEY', provider: 'nvidia' },
];

async function probeKey(entry: (typeof EXPECTED_KEYS)[number]): Promise<AIKeyHealthItem> {
  const secret = process.env[entry.name]?.trim();
  if (!secret) {
    return { name: entry.name, provider: entry.provider, status: 'missing', httpStatus: null, latencyMs: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();
  let status: AIKeyHealthStatus = 'network_error';
  let httpStatus: number | null = null;

  try {
    const isGemini = entry.provider === 'gemini_pdf' || entry.provider === 'gemini_app';
    const isGroq = entry.provider === 'groq';
    const url = isGemini
      ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'
      : isGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : (process.env.NVIDIA_URL || 'https://integrate.api.nvidia.com/v1/chat/completions');

    const requestBody = isGemini
      ? {
          contents: [{ parts: [{ text: 'Respondé únicamente OK' }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 8 },
        }
      : {
          model: isGroq
            ? process.env.GROQ_SUMMARY_MODEL || 'openai/gpt-oss-20b'
            : process.env.NVIDIA_CHAT_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
          messages: [{ role: 'user', content: 'Reply OK' }],
          temperature: 0,
          max_tokens: 8,
        };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isGemini ? { 'x-goog-api-key': secret } : { Authorization: `Bearer ${secret}` }),
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      cache: 'no-store',
    });
    httpStatus = response.status;
    status = classifyAIKeyHttpStatus(response.status);
    await response.body?.cancel().catch(() => undefined);
  } catch (error) {
    status = controller.signal.aborted ? 'timeout' : 'network_error';
    // No registrar el objeto error: las URLs/headers podrían incluir secretos.
    void error;
  } finally {
    clearTimeout(timeout);
  }

  return {
    name: entry.name,
    provider: entry.provider,
    status,
    httpStatus,
    latencyMs: Date.now() - startedAt,
  };
}

function parseReport(value: unknown): AIKeyHealthReport | null {
  if (!value || typeof value !== 'object') return null;
  const report = value as Partial<AIKeyHealthReport>;
  if (!Array.isArray(report.checks) || typeof report.checkedAt !== 'string') return null;
  const checkedAt = Date.parse(report.checkedAt);
  if (!Number.isFinite(checkedAt)) return null;
  const checks = report.checks.filter(
    (check): check is AIKeyHealthItem =>
      typeof check?.name === 'string' &&
      typeof check.provider === 'string' &&
      typeof check.status === 'string'
  );
  return {
    checkedAt: report.checkedAt,
    healthy: checks.filter((check) => check.status === 'ok').length,
    total: checks.length,
    checks,
  };
}

export async function getLatestAIKeyHealthReport(): Promise<AIKeyHealthReport | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('analytics_events')
    .select('metadata')
    .eq('event_name', 'ai_key_health_check')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const metadata = data?.metadata as Record<string, unknown> | null | undefined;
  return parseReport(metadata?.report);
}

export async function runAIKeyHealthCheck(): Promise<AIKeyHealthReport> {
  const checks: AIKeyHealthItem[] = [];
  // Tres pruebas en paralelo para reducir tiempo y evitar ráfagas de cuota.
  for (let index = 0; index < EXPECTED_KEYS.length; index += 3) {
    const batch = EXPECTED_KEYS.slice(index, index + 3);
    checks.push(...await Promise.all(batch.map(probeKey)));
  }

  const report: AIKeyHealthReport = {
    checkedAt: new Date().toISOString(),
    healthy: checks.filter((check) => check.status === 'ok').length,
    total: checks.length,
    checks,
  };

  const admin = createAdminClient();
  const { error } = await admin.from('analytics_events').insert({
    event_name: 'ai_key_health_check',
    session_key: 'server:ai-key-health',
    path: '/api/internal/ai-key-health',
    metadata: { report },
  });
  if (error) {
    logError('aiKeyHealth.store', error, { checks: report.total });
    throw error;
  }

  if (report.healthy !== report.total) {
    // Observabilidad explícita de las fallas sin exponer credenciales ni bodies.
    logError('aiKeyHealth.degraded', new Error('Una o más credenciales de IA no superaron la comprobación'), {
      affected: checks.filter((c) => c.status !== 'ok').map(({ name, status, httpStatus }) => ({
        name, status, httpStatus,
      })),
    });
  } else {
    logInfo('aiKeyHealth.healthy', { healthy: report.healthy, total: report.total });
  }
  return report;
}
