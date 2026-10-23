/** Errores de Auth que requieren renovar la sesión interactiva, no reintentos de red. */
export function isTerminalAuthSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown; status?: unknown };
  const code = typeof value.code === 'string' ? value.code.toLowerCase() : '';
  const message = typeof value.message === 'string' ? value.message.toLowerCase() : '';
  return (
    ['session_not_found', 'refresh_token_not_found', 'invalid_refresh_token'].includes(code) ||
    /session not found|refresh token not found|invalid refresh token/.test(message)
  );
}
