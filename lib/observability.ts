export function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : JSON.stringify(error),
  };
}

export function logInfo(scope: string, details?: Record<string, unknown>) {
  console.info(`[${scope}]`, details ?? {});
}

export function logError(scope: string, error: unknown, details?: Record<string, unknown>) {
  const normalized = normalizeError(error);
  const entry = {
    scope,
    ...normalized,
    ...(details ? { details } : {}),
  };
  console.error(`[${scope}]`, {
    ...normalized,
    ...(details ? { details } : {}),
  });
  void forwardError(entry);
}

async function forwardError(entry: Record<string, unknown>) {
  const url = process.env.ERROR_REPORT_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'logError', ...entry }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // best-effort, nunca romper el flujo de la app
  }
}
