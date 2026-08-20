const ATTRIBUTION_QUERY_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ref_user',
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
