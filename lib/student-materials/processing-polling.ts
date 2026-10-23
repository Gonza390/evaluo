/**
 * Serializa consultas periódicas de estado. Las Server Actions pueden fallar
 * durante una navegación, un refresh de sesión o un despliegue: una respuesta
 * transitoria no debe generar llamadas solapadas ni promesas sin manejar.
 */
export function createSingleFlightPolling<T>() {
  let inFlight = false;
  let consecutiveFailures = 0;

  return {
    async run(task: () => Promise<T>): Promise<
      | { kind: 'busy' }
      | { kind: 'success'; value: T }
      | { kind: 'error'; consecutiveFailures: number }
    > {
      if (inFlight) return { kind: 'busy' };
      inFlight = true;

      try {
        const value = await task();
        consecutiveFailures = 0;
        return { kind: 'success', value };
      } catch {
        consecutiveFailures += 1;
        return { kind: 'error', consecutiveFailures };
      } finally {
        inFlight = false;
      }
    },
    reset() {
      // No libera un request en curso; sólo reinicia el contador de errores.
      consecutiveFailures = 0;
    },
  };
}
