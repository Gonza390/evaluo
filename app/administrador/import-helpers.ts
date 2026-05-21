export interface MateriaImportEntryInput {
  materia: string;
  carreras: string[];
}

function normalizeImportText(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isAcademicYearLabel(value: string) {
  const normalized = normalizeImportText(value);
  return /^(primer|segundo|tercer|cuarto|quinto|sexto)\s+ano$/.test(normalized);
}

function sanitizeCell(value: unknown) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function parseMateriasWorkbook(file: File): Promise<MateriaImportEntryInput[]> {
  const xlsx = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = xlsx.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
  if (!firstSheet) return [];

  const rows = xlsx.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
    header: 1,
    defval: '',
  });

  if (rows.length === 0) return [];

  const headers = (rows[0] ?? []).map((cell) => sanitizeCell(cell));
  const materiasByName = new Map<string, Set<string>>();

  for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
    const carreraName = headers[columnIndex];
    if (!carreraName) continue;
    if (isAcademicYearLabel(carreraName)) continue;

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const materiaName = sanitizeCell(rows[rowIndex]?.[columnIndex]);
      if (!materiaName) continue;
      if (isAcademicYearLabel(materiaName)) continue;

      const current = materiasByName.get(materiaName) ?? new Set<string>();
      current.add(carreraName);
      materiasByName.set(materiaName, current);
    }
  }

  return Array.from(materiasByName.entries())
    .map(([materia, carreras]) => ({
      materia,
      carreras: Array.from(carreras).sort((a, b) => a.localeCompare(b, 'es')),
    }))
    .sort((a, b) => a.materia.localeCompare(b.materia, 'es'));
}
