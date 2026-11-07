/**
 * Países y regiones desde donde Creem no acepta pagos (docs.creem.io →
 * Merchant of Record → Supported countries, revisado el 7/11/2026).
 * Ahí no se muestra el botón de pago (se ofrece "Avisame") y el checkout
 * responde 403 antes de crear una sesión en Creem.
 * Las Antillas Neerlandesas se disolvieron en CW, SX y BQ: se bloquean las tres.
 */
export const CREEM_UNSUPPORTED_COUNTRIES: ReadonlySet<string> = new Set([
  'AF', 'AQ', 'BY', 'MM', 'BI', 'CF', 'TD', 'CU', 'CD', 'CG', 'ER', 'HT', 'IR',
  'IQ', 'LY', 'ML', 'AN', 'CW', 'SX', 'BQ', 'NI', 'KP', 'RU', 'SO', 'SS', 'SD',
  'SY', 'VE', 'YE', 'ZW',
]);

/** Regiones de Ucrania no soportadas (ISO 3166-2, cabecera x-vercel-ip-country-region). */
export const CREEM_UNSUPPORTED_UA_REGIONS: ReadonlySet<string> = new Set([
  '43', // Crimea
  '40', // Sevastopol
  '14', // Donetsk
  '09', // Luhansk
  '65', // Kherson
  '23', // Zaporizhzhia
]);

export function isCreemSupportedLocation(
  country: string | null | undefined,
  region?: string | null,
): boolean {
  const code = country?.trim().toUpperCase() ?? '';
  if (CREEM_UNSUPPORTED_COUNTRIES.has(code)) return false;
  if (code === 'UA') {
    const subdivision = (region ?? '').trim().toUpperCase().replace(/^UA-/, '');
    if (CREEM_UNSUPPORTED_UA_REGIONS.has(subdivision)) return false;
  }
  return true;
}
