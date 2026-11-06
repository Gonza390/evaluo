/** Canonicalize Google OAuth entry only for Vercel's master Previews.
 * Authentication cookies cannot be copied between separate vercel.app hosts.
 * The canonical host must still be authorized in Supabase Redirect URLs.
 */
export const EVALUO_MASTER_PREVIEW_HOST =
  'evaluo-git-master-olmosgonza69-9002s-projects.vercel.app';

type SearchParams = Record<string, string | string[] | undefined>;

export function previewLoginCanonicalUrl(input: {
  host: string | null | undefined;
  vercelEnvironment: string | undefined;
  branch: string | undefined;
  pathname: '/login' | '/en/login';
  searchParams?: SearchParams;
}): string | null {
  if (input.vercelEnvironment !== 'preview' || input.branch !== 'master') return null;
  const host = (input.host ?? '').trim().toLowerCase();
  if (host === EVALUO_MASTER_PREVIEW_HOST) return null;
  // Only redirect our project's generated deployment URLs. Never trust
  // x-forwarded-host or redirect arbitrary domains to the master preview.
  if (!/^evaluo-[a-z0-9-]+-olmosgonza69-9002s-projects\.vercel\.app$/.test(host)) return null;
  const destination = new URL('https://' + EVALUO_MASTER_PREVIEW_HOST + input.pathname);
  for (const [key, value] of Object.entries(input.searchParams ?? {})) {
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(key)) continue;
    if (typeof value === 'string' && value.length <= 2048) {
      destination.searchParams.set(key, value);
    }
  }
  return destination.toString();
}
