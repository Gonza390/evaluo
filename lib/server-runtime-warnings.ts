import 'server-only';

/**
 * Diagnóstico exclusivamente Node.js: no importar desde Edge ni cliente.
 * Reporta una sola vez la pila DEP0005 para identificar su paquete de origen.
 */
const traceProcess = process as typeof process & { __evaluoBufferWarningTrace?: boolean };

export function installDeprecatedBufferTrace() {
  if (traceProcess.__evaluoBufferWarningTrace) return;
  traceProcess.__evaluoBufferWarningTrace = true;

  // Sin esta opción, la pila de DEP0005 puede contener sólo el mensaje
  // genérico y no el archivo que invocó al constructor obsoleto.
  // No suprimir la advertencia: necesitamos su origen antes de tocar dependencias.
  (traceProcess as typeof process & { traceDeprecation?: boolean }).traceDeprecation = true;

  let reported = false;
  process.on('warning', (warning: Error & { code?: string }) => {
    if (warning.code !== 'DEP0005' || reported) return;
    reported = true;
    const frames = warning.stack?.split('\n').slice(0, 12).join('\n');
    console.warn('[runtime.bufferDeprecation.origin]', {
      code: warning.code,
      frames,
    });
  });
}
