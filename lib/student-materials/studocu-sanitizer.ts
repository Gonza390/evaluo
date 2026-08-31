const STUDOCU_STANDALONE_NOISE_PATTERNS: RegExp[] = [
  /^messages\.pdf_cover_[a-z0-9_]+$/i,
  /^messages\.studocu_[a-z0-9_]+$/i,
  /^messages\.downloaded_by$/i,
  /^scan\s+to\s+open\s+on\s+studocu$/i,
  /^studocu\s+is\s+not\s+sponsored\s+or\s+endorsed\s+by\s+any\s+college\s+or\s+university$/i,
  /^this\s+document\s+is\s+available\s+on(?:\s+studocu)?$/i,
  /^(?:downloaded\s+by|descargado\s+por)\b.*$/i,
  /^lomoar\s+cpsd\b.*$/i,
];

const STUDOCU_INLINE_NOISE_PATTERNS: RegExp[] = [
  /\bmessages\.pdf_cover_[a-z0-9_]+\b/gi,
  /\bmessages\.studocu_[a-z0-9_]+\b/gi,
  /\bmessages\.downloaded_by\b/gi,
  /\bscan\s+to\s+open\s+on\s+studocu\b/gi,
  /\bstudocu\s+is\s+not\s+sponsored\s+or\s+endorsed\s+by\s+any\s+college\s+or\s+university\b/gi,
  /\bthis\s+document\s+is\s+available\s+on(?:\s+studocu)?\b/gi,
  /\blomoar\s+cpsd\b/gi,
];

function cleanInlineStudocuNoise(value: string) {
  let cleaned = value;

  for (const pattern of STUDOCU_INLINE_NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Estos sellos suelen incluir una identidad o email después del prefijo.
  // Eliminamos el resto de esa línea para que no termine persistido ni enviado a IA.
  cleaned = cleaned.replace(/\b(?:downloaded\s+by|descargado\s+por)\b.*$/i, ' ');

  return cleaned.replace(/[ \t]{2,}/g, ' ').trim();
}

export function isStudocuNoiseLine(value: string) {
  const line = value.replace(/\s+/g, ' ').trim();
  if (!line) return false;
  return STUDOCU_STANDALONE_NOISE_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Quita metadatos, sellos y mensajes promocionales típicos de Studocu del
 * texto extraído. No modifica el PDF original ni intenta borrar contenido
 * gráfico: sólo sanea la representación textual que alimenta chunks e IA.
 *
 * La limpieza es conservadora: cuando una marca aparece embebida junto a
 * contenido académico, se elimina únicamente el fragmento conocido y se
 * conserva el resto de la línea y la estructura de párrafos del documento.
 */
export function sanitizeStudocuExtractedText(value: string) {
  if (!value) return '';

  const cleanedLines = value
    .replace(/\r/g, '')
    .split('\n')
    .map((rawLine) => {
      const line = rawLine.trim();
      if (!line) return '';
      if (isStudocuNoiseLine(line)) return '';
      return cleanInlineStudocuNoise(line);
    });

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
