import type { Json } from '@/types/supabase';
import { parseDashboardMateriaStates } from '@/lib/dashboard-state';

type AcademicProfileCompletionInput = {
  universidadId: unknown;
  carreraId: unknown;
  activeSubjects: unknown;
};

function hasValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function getAcademicProfileActiveSubjectIds(value: unknown): string[] {
  return parseDashboardMateriaStates(value as Json | null | undefined).map((subject) => subject.id);
}

export function hasCompleteAcademicProfile({
  universidadId,
  carreraId,
  activeSubjects,
}: AcademicProfileCompletionInput) {
  return (
    hasValue(universidadId) &&
    hasValue(carreraId) &&
    getAcademicProfileActiveSubjectIds(activeSubjects).length > 0
  );
}
