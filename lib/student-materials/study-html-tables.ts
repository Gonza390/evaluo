/**
 * Convierte tablas HTML simples del resumen generado en tablas Markdown
 * que el lector estructurado ya representa de forma segura.
 * Nunca insertamos HTML sin sanitizar con dangerouslySetInnerHTML.
 */
const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó',
  Uacute: 'Ú', Ntilde: 'Ñ',
};

function decodeCellText(value: string): string {
  return value
    .replace(/<br\s*\/?>/giu, ' · ')
    .replace(/<\/(?:p|div|li)\s*>/giu, ' · ')
    .replace(/<(?:strong|b)\b[^>]*>/giu, '**')
    .replace(/<\/(?:strong|b)\s*>/giu, '**')
    .replace(/<[^>]*>/gu, '')
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/giu, (entity, code: string) => {
      if (code.startsWith('#')) {
        const hex = code[1]?.toLowerCase() === 'x';
        const number = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
        return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff)
          ? String.fromCodePoint(number)
          : entity;
      }
      return ENTITY_MAP[code] ?? ENTITY_MAP[code.toLowerCase()] ?? entity;
    })
    .replace(/\|/gu, '∣')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function normalizeStudyHtmlTables(input: string): string {
  return input.replace(/<table\b[^>]*>[\s\S]*?<\/table\s*>/giu, (table) => {
    const rows = Array.from(table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/giu))
      .map((match) =>
        Array.from(
          (match[1] ?? '').matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)\s*>/giu)
        ).map((cell) => decodeCellText(cell[1] ?? ''))
      )
      .filter((row) => row.length > 0);
    if (!rows.length) return decodeCellText(table);
    const width = Math.max(...rows.map((row) => row.length));
    if (width < 2) return rows.map((row) => row.join(' · ')).join('\n');
    const formatRow = (row: string[]) =>
      '| ' + Array.from({ length: width }, (_, index) => row[index] ?? '').join(' | ') + ' |';
    const header = formatRow(rows[0]);
    const separator = formatRow(Array.from({ length: width }, () => '---'));
    return '\n' + [header, separator, ...rows.slice(1).map(formatRow)].join('\n') + '\n';
  });
}
