const TRANSIENT_DATA_ERROR_PATTERN =
  /(gateway timeout|bad gateway|failed to get project config|fetch failed|network|timeout|temporarily unavailable)/i;

const DEFAULT_RETRY_DELAYS_MS = [150, 450] as const;

export function isTransientDataError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return TRANSIENT_DATA_ERROR_PATTERN.test(message);
}

export async function withTransientDataRetry<T>(
  operation: () => Promise<T>,
  retryDelaysMs: readonly number[] = DEFAULT_RETRY_DELAYS_MS
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientDataError(error) || attempt === retryDelaysMs.length) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt]));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No se pudo cargar el catálogo.');
}
