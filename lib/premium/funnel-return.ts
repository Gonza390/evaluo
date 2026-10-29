/** Return to a Premium-gated feature without depending on sessionStorage.
 * Accept only same-site relative paths; the source-specific marker avoids
 * automatically reopening the funnel after the student explicitly closes it.
 */
export const PREMIUM_RETURN_PARAM = 'premiumReturn';

export function withPremiumDismissMarker(
  returnTo: string | undefined,
  source: string,
  fallback: string
): string {
  const origin = 'https://evaluo.local';
  const safePath = (value: string | undefined): string | null => {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
    try {
      const url = new URL(value, origin);
      if (url.origin !== origin) return null;
      return url.pathname + url.search + url.hash;
    } catch {
      return null;
    }
  };
  const path = safePath(returnTo) ?? safePath(fallback) ?? '/dashboard';
  const url = new URL(path, origin);
  url.searchParams.set(PREMIUM_RETURN_PARAM, source);
  return url.pathname + url.search + url.hash;
}

export function isPremiumFunnelDismissReturn(search: string, source: string): boolean {
  return new URLSearchParams(search).get(PREMIUM_RETURN_PARAM) === source;
}
