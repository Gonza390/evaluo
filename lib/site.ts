export const SITE_NAME = 'Evaluo';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://evaluo.com.ar';

export function toAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
