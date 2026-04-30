export function getUniversityRoute(universityId: string) {
  return `/universidad/${universityId}`;
}

export function getCareerRoute(careerId: string) {
  return `/materias?carreraId=${careerId}`;
}

export function getMateriaRoute(materiaId: string, carreraId?: string | null) {
  const params = new URLSearchParams();

  if (carreraId) {
    params.set('carreraId', carreraId);
  }

  const query = params.toString();
  return query ? `/explorar/materia/${materiaId}?${query}` : `/explorar/materia/${materiaId}`;
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
