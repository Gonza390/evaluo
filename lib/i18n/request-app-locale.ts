import 'server-only';

import { cookies } from 'next/headers';
import { APP_LOCALE_STORAGE_KEY, accountAppLocale, parseAppLocale, type AppLocale } from '@/lib/i18n/app-locale';

/**
 * Idioma de la app para páginas del servidor.
 *
 * Primero la cookie `evaluo_ui_locale`: AppLocaleProvider la mantiene igual al idioma de la
 * cuenta y la actualiza en el momento en que el alumno cambia el idioma en Configuración.
 * Los metadatos del JWT (`getClaims`) recién se actualizan cuando se renueva la sesión
 * (hasta una hora después), por eso quedan como respaldo.
 * Es solo una preferencia de pantalla: nunca da permisos.
 */
export async function requestAppLocale(userMetadata?: unknown): Promise<AppLocale> {
  const cookieLocale = parseAppLocale((await cookies()).get(APP_LOCALE_STORAGE_KEY)?.value);
  return cookieLocale ?? accountAppLocale(userMetadata) ?? 'es';
}
