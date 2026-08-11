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
  console.error(`[${scope}]`, {
    ...normalized,
    ...(details ? { details } : {}),
  });
}
