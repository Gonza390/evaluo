import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';

export function getUniversityRoute(universityId: string) {
  return `/universidad/${universityId}`;
}

export function getCareerRoute(careerId: string) {
  return `/materias?carreraId=${careerId}`;
}

function getClientMateriaRouteSegment(materiaId: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return materiaId;
  }

  const prefix = '/explorar/materia/';
  if (!window.location.pathname.startsWith(prefix)) {
    return materiaId;
  }

  const currentSegment = decodeURIComponent(
    window.location.pathname.slice(prefix.length).split('/')[0] ?? ''
  );
  const currentMateriaId = parseSeoEntitySlug(currentSegment).id;

  if (currentMateriaId !== materiaId) {
    return materiaId;
  }

  if (currentSegment.includes('--')) {
    return currentSegment;
  }

  const materiaNombre = document.querySelector('h1')?.textContent?.trim();
  return materiaNombre ? buildSeoEntitySlug(materiaNombre, materiaId) : materiaId;
}

export function getMateriaRoute(materiaId: string, carreraId?: string | null) {
  const params = new URLSearchParams();

  if (carreraId) {
    params.set('carreraId', carreraId);
  }

  const routeSegment = getClientMateriaRouteSegment(materiaId);
  const query = params.toString();
  return query
    ? `/explorar/materia/${routeSegment}?${query}`
    : `/explorar/materia/${routeSegment}`;
}

export function getDashboardMateriaRoute(materiaId: string) {
  return `/dashboard/materia/${materiaId}`;
}

export function getResourceRoute(materiaId: string, tipo: string, nombre?: string, resourceId?: string) {
  const params = new URLSearchParams({ tipo });

  if (nombre) {
    params.set('nombre', nombre);
  }

  if (resourceId) {
    params.set('resource', resourceId);
  }

  return `/recursos/${materiaId}?${params.toString()}`;
}

export function getStudentMaterialRoute(materialId: string) {
  return `/materiales/${materialId}`;
}

export function getSimulatorRoute(
  materiaId: string,
  parcial: number,
  universidadId?: string | null,
  carreraId?: string | null
) {
  const params = new URLSearchParams();

  if (universidadId) {
    params.set('universidad_id', universidadId);
  }

  if (carreraId) {
    params.set('carrera_id', carreraId);
  }

  const query = params.toString();
  return query
    ? `/simulador/${materiaId}/${parcial}?${query}`
    : `/simulador/${materiaId}/${parcial}`;
}
