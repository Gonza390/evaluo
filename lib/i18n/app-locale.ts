/** Locale preferences are not authorization claims. */
export const APP_LOCALE_STORAGE_KEY = 'evaluo_ui_locale';
export type AppLocale = 'es' | 'en';
export function parseAppLocale(value: unknown): AppLocale | null {
  return value === 'es' || value === 'en' ? value : null;
}
export function accountAppLocale(metadata: unknown): AppLocale | null {
  if (!metadata || typeof metadata !== 'object') return null;
  return parseAppLocale((metadata as Record<string, unknown>).ui_locale);
}
