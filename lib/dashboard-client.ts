import { logError } from '@/lib/observability';

export type DashboardRecentResourceType = 'Resumen' | 'TP' | 'Preguntero' | 'Recurso';

export interface DashboardRecentResource {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  type: DashboardRecentResourceType;
  openedAt: string;
  href?: string | null;
}

const STORAGE_KEYS = {
  recentResources: 'evaluo_recent_resources',
  activityLog: 'evaluo_activity_log',
} as const;

function canUseStorage() {
  return typeof window !== 'undefined';
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logError('dashboardClient.safeParse', error);
    return fallback;
  }
}

export function readRecentResources(): DashboardRecentResource[] {
  if (!canUseStorage()) {
    return [];
  }

  return safeParse<DashboardRecentResource[]>(
    window.localStorage.getItem(STORAGE_KEYS.recentResources),
    []
  );
}

export function pushRecentResource(entry: DashboardRecentResource) {
  if (!canUseStorage()) {
    return;
  }

  const nextEntries = [
    entry,
    ...readRecentResources().filter(
      (item) =>
        !(
          item.id === entry.id &&
          item.type === entry.type &&
          item.subjectId === entry.subjectId &&
          (item.href ?? null) === (entry.href ?? null)
        )
    ),
  ].slice(0, 12);

  window.localStorage.setItem(STORAGE_KEYS.recentResources, JSON.stringify(nextEntries));
}

export function readActivityLog(): string[] {
  if (!canUseStorage()) {
    return [];
  }

  return safeParse<string[]>(window.localStorage.getItem(STORAGE_KEYS.activityLog), []);
}

export function pushActivityHit(timestamp = new Date().toISOString()) {
  if (!canUseStorage()) {
    return;
  }

  const nextLog = [timestamp, ...readActivityLog()].slice(0, 120);
  window.localStorage.setItem(STORAGE_KEYS.activityLog, JSON.stringify(nextLog));
}

export function getWeeklyActivitySeries(activityLog: string[], fallbackTimestamp?: string | null) {
  const formatter = new Intl.DateTimeFormat('es-AR', { weekday: 'short' });
  const today = new Date();
  const series: Array<{ day: string; count: number }> = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const count = activityLog.filter((value) => {
      const current = new Date(value);
      return current >= date && current < nextDate;
    }).length;

    series.push({
      day: formatter.format(date).replace('.', ''),
      count,
    });
  }

  if (activityLog.length === 0 && fallbackTimestamp) {
    const fallbackDate = new Date(fallbackTimestamp);
    const lastPoint = series[series.length - 1];
    const isSameDay =
      fallbackDate.getFullYear() === today.getFullYear() &&
      fallbackDate.getMonth() === today.getMonth() &&
      fallbackDate.getDate() === today.getDate();

    if (isSameDay && lastPoint) {
      lastPoint.count = Math.max(lastPoint.count, 1);
    }
  }

  return series;
}
