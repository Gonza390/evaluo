// /explorar/materia/[id] tiene dos rutas:
// - /explorar/materia/[id]: dinámica; lee carreraId, tab, modulo y creador.
// - /explorar/materia-cache/[id]: misma página, cacheada (ISR), sin esos parámetros.
// proxy.ts reescribe a la cacheada cuando la visita no trae ninguno de ellos
// (la gran mayoría: Google, links compartidos sin creador, navegación interna).

export const MATERIA_DYNAMIC_QUERY_KEYS = ['carreraId', 'tab', 'modulo', 'creador'] as const;

const PUBLIC_MATERIA_PATH = /^\/explorar\/materia\/([^/]+)\/?$/;
const CACHED_MATERIA_PATH = /^\/explorar\/materia-cache\/([^/]+)\/?$/;

/** Ruta interna cacheada para esta visita, o null si debe ir a la dinámica. */
export function getMateriaCacheRewritePath(
  pathname: string,
  searchParams: URLSearchParams
): string | null {
  const match = PUBLIC_MATERIA_PATH.exec(pathname);
  if (!match) return null;
  const needsDynamicPage = MATERIA_DYNAMIC_QUERY_KEYS.some((key) =>
    Boolean(searchParams.get(key)?.trim())
  );
  return needsDynamicPage ? null : `/explorar/materia-cache/${match[1]}`;
}

/** Un acceso directo a la ruta interna vuelve a la URL pública. */
export function getMateriaCacheDirectRedirectPath(pathname: string): string | null {
  const match = CACHED_MATERIA_PATH.exec(pathname);
  return match ? `/explorar/materia/${match[1]}` : null;
}
