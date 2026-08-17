import type { Json } from '@/types/supabase';

export interface DashboardMateriaState {
  id: string;
  name: string;
}

export interface DashboardAnalytics {
  subjectsCompleted: number;
  lastUpdatedAt: string | null;
}

export const defaultDashboardAnalytics: DashboardAnalytics = {
  subjectsCompleted: 0,
  lastUpdatedAt: null,
};

export function parseDashboardMateriaStates(value: Json | null | undefined) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): DashboardMateriaState[] => {
    if (!item || Array.isArray(item) || typeof item !== 'object') return [];
    if (typeof item.id !== 'string' || typeof item.name !== 'string') return [];
    return [{ id: item.id, name: item.name }];
  });
}

export function serializeDashboardMateriaStates(value: DashboardMateriaState[]): Json {
  return value.map((item) => ({ id: item.id, name: item.name }));
}

export function parseDashboardAnalytics(value: Json | null | undefined): DashboardAnalytics {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return defaultDashboardAnalytics;
  }

  return {
    subjectsCompleted: typeof value.subjectsCompleted === 'number' ? value.subjectsCompleted : 0,
    lastUpdatedAt: typeof value.lastUpdatedAt === 'string' ? value.lastUpdatedAt : null,
  };
}

export function serializeDashboardAnalytics(value: DashboardAnalytics): Json {
  return {
    subjectsCompleted: value.subjectsCompleted,
    lastUpdatedAt: value.lastUpdatedAt,
  };
}
