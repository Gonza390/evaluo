/**
 * Ante un fallo transitorio de red, permitimos un único reintento acotado.
 * Los errores de permisos, columnas o datos no son transitorios.
 */
export function isTransientSimulatorCatalogError(error: unknown): boolean {
  let message = '';
  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String(error.message ?? '');
  }

  return /timeout|timed out|abort(?:ed)? due to timeout|fetch failed|econnreset|network request failed/i.test(
    message
  );
}
