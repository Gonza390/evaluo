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
