const ATTRIBUTION_QUERY_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ref_user',
  'acq',
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

export function appendPregunteroAttribution(href: string, searchParams: SearchParams) {
  const query = new URLSearchParams();

  for (const key of ATTRIBUTION_QUERY_KEYS) {
    const value = searchParams[key];
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized?.trim()) query.set(key, normalized.trim());
  }

  const serialized = query.toString();
  return serialized ? `${href}?${serialized}` : href;
}

/**
 * Agrega a `href` los parámetros de atribución (utm_*, ref_user) que traiga la
 * URL actual (`search`), sin pisar los que `href` ya tenga. `acq` no se copia:
 * lo define la página que arma el link.
 *
 * Existe para que las páginas SEO no lean `searchParams` en el servidor (eso
 * las vuelve dinámicas y sin caché): el link sale cacheado y el navegador le
 * suma la atribución de la visita.
 */
export function mergeAttributionFromSearch(href: string, search: string) {
  if (!search || search === '?') return href;
  const incoming = new URLSearchParams(search);
  const [path, existingQuery = ''] = href.split('?');
  const hashIndex = existingQuery.indexOf('#');
  const queryPart = hashIndex >= 0 ? existingQuery.slice(0, hashIndex) : existingQuery;
  const hash = hashIndex >= 0 ? existingQuery.slice(hashIndex) : '';
  const query = new URLSearchParams(queryPart);
  let changed = false;

  for (const key of ATTRIBUTION_QUERY_KEYS) {
    if (key === 'acq' || query.has(key)) continue;
    const value = incoming.get(key)?.trim();
    if (value) {
      query.set(key, value);
      changed = true;
    }
  }

  if (!changed) return href;
  return `${path}?${query.toString()}${hash}`;
}
