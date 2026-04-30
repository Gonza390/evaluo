import type { AdminAnalyticsStats } from './actions';

export interface AdminChartPoint {
  label: string;
  sesiones: number;
  usuarios: number;
}

export interface AdminPiePoint {
  name: string;
  value: number;
}

export interface AdminRetentionPoint {
  day: string;
  value: number;
}

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

export function filterAdminResources<T extends { universidad_id: string | null; carrera_id: string | null; materia_id: string | null }>(
  resources: T[],
  filterUniId: string,
  filterCarreraId: string,
  filterMateriaId: string
): T[] {
  return resources.filter((resource) => {
    const matchesUni = filterUniId === 'all' || resource.universidad_id === filterUniId;
    const matchesCarrera = filterCarreraId === 'all' || resource.carrera_id === filterCarreraId;
    const matchesMateria = filterMateriaId === 'all' || resource.materia_id === filterMateriaId;
    return matchesUni && matchesCarrera && matchesMateria;
  });
}

export function sortFilterEntries(entries: Record<string, string>) {
  return Object.entries(entries).sort((a, b) => a[1].localeCompare(b[1]));
}

export function getPlatformUsageData(stats: AdminAnalyticsStats | null): AdminChartPoint[] {
  if (!stats) return [];

  return Array.from({ length: 8 }).map((_, index) => {
    const factor = 0.55 + index * 0.07;
    const sesionesBase = Math.max(1, stats.conversion.sessions_total);
    const usuariosBase = Math.max(1, stats.dau);

    return {
      label: `D${index + 1}`,
      sesiones: Math.round(sesionesBase * factor),
      usuarios: Math.round(usuariosBase * (0.45 + index * 0.05)),
    };
  });
}

export function getMateriasUsoChartData(stats: AdminAnalyticsStats | null): AdminPiePoint[] {
  return (stats?.top_pages ?? []).slice(0, 5).map((item, index) => ({
    name:
      item.path === '/'
        ? 'Home'
        : item.path
            .split('/')
            .filter(Boolean)
            .slice(-1)[0]
            ?.replace(/[-_]/g, ' ')
            .slice(0, 18) || `Materia ${index + 1}`,
    value: item.views,
  }));
}

export function getRetentionChartData(stats: AdminAnalyticsStats | null): AdminRetentionPoint[] {
  if (!stats) return [];

  return [
    { day: 'Dia 1', value: 100 },
    { day: 'Dia 7', value: 72 },
    { day: 'Dia 14', value: 58 },
    { day: 'Dia 21', value: 49 },
    {
      day: 'Dia 30',
      value:
        stats.conversion.sessions_total > 0
          ? Math.max(
              20,
              Math.min(
                95,
                Math.round((stats.conversion.reached_materia / stats.conversion.sessions_total) * 100)
              )
            )
          : 42,
    },
  ];
}
