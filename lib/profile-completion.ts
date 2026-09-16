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


/** Destinos del loop PDF-first (upload/modal). */
export function isPdfFirstActivationPath(path: string) {
  const pathname = path.split('?')[0].split('#')[0];
  return (
    pathname === '/dashboard/materiales' ||
    pathname === '/dashboard/materiales/' ||
    pathname.startsWith('/dashboard/materiales/')
  );
}

export function getPdfFirstActivationHref(existingSearch = '') {
  const params = new URLSearchParams(
    existingSearch.startsWith('?') ? existingSearch.slice(1) : existingSearch
  );
  params.set('openUpload', '1');
  return `/dashboard/materiales?${params.toString()}`;
}
