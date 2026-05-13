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

export function getAdminUserBadgeLabel(
  user: { email?: string | null; user_metadata?: { full_name?: string | null } } | null
) {
  const fullName = String(user?.user_metadata?.full_name ?? '').trim();
  if (fullName) {
    const initials = fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    return initials || 'AD';
  }

  const email = String(user?.email ?? '');
  return email.slice(0, 2).toUpperCase() || 'AD';
}

export function getAdminUserDisplayName(
  user: { email?: string | null; user_metadata?: { full_name?: string | null } } | null
) {
  return String(user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Administrador');
}

export function getUploadActionLabel(input: {
  recursoType: 'Preguntero' | 'Resumen' | 'Trabajo Práctico';
  isPremiumSimulatorUpload: boolean;
  usarIAEnCarga: boolean;
  isExcelSelected: boolean;
  uploading: boolean;
}) {
  if (!input.uploading) {
    return 'INICIAR CARGA';
  }

  if (input.recursoType !== 'Preguntero') {
    return 'SUBIENDO...';
  }

  if (input.isPremiumSimulatorUpload) {
    return 'IMPORTANDO PREMIUM...';
  }

  if (input.usarIAEnCarga && !input.isExcelSelected) {
    return 'PROCESANDO CON IA...';
  }

  return 'PROCESANDO...';
}

export function getUploadModeLabel(input: {
  recursoType: 'Preguntero' | 'Resumen' | 'Trabajo Práctico';
  isPremiumSimulatorUpload: boolean;
  usarIAEnCarga: boolean;
  isExcelSelected: boolean;
}) {
  if (input.recursoType !== 'Preguntero') {
    return 'Transferencia';
  }

  if (input.isPremiumSimulatorUpload) {
    return 'Simulador Premium';
  }

  if (input.usarIAEnCarga && !input.isExcelSelected) {
    return 'Inteligencia Artificial';
  }

  return 'Procesamiento local';
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
  return stats?.daily_usage ?? [];
}

export function getMateriasUsoChartData(stats: AdminAnalyticsStats | null): AdminPiePoint[] {
  return (stats?.top_materias ?? []).slice(0, 5).map((item) => ({
    name: item.name,
    value: item.views,
  }));
}

export function getRetentionChartData(stats: AdminAnalyticsStats | null): AdminRetentionPoint[] {
  return stats?.retention_series ?? [];
}
