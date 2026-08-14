/**
 * Parseo compartido de respuestas JSON de los modelos. Tolerante a codigo
 * fenced (```json ... ```) y a texto de relleno antes/despues del objeto.
 */
export function extractJsonObject(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No se encontro JSON util en la respuesta del modelo.');
  }

  return JSON.parse(candidate.slice(start, end + 1));
}
