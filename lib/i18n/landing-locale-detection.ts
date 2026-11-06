import { parseAppLocale, type AppLocale } from './app-locale';

/** Only a first-visit homepage hint; not a billing or authorization decision. */
const SPANISH_SPEAKING_COUNTRIES = new Set([
  'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GQ',
  'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'ES', 'UY', 'VE',
]);

function browserLocale(acceptLanguage: string | null): AppLocale | null {
  if (!acceptLanguage) return null;
  return acceptLanguage
    .slice(0, 512)
    .split(',')
    .map((part, order) => {
      const [tag, ...params] = part.trim().split(';');
      const rawQuality = params.map(p => p.trim()).find(p => /^q=/i.test(p));
      const quality = rawQuality ? Number(rawQuality.slice(2)) : 1;
      const language = tag?.trim().split('-')[0]?.toLowerCase();
      return { language, quality, order };
    })
    .filter(entry => entry.quality > 0 && entry.quality <= 1 && Number.isFinite(entry.quality))
    .sort((a, b) => b.quality - a.quality || a.order - b.order)
    .map(entry => parseAppLocale(entry.language))
    .find((value): value is AppLocale => value !== null) ?? null;
}

export function detectLandingLocale(input: {
  savedLocale?: unknown;
  acceptLanguage?: string | null;
  country?: string | null;
}): AppLocale {
  const saved = parseAppLocale(input.savedLocale);
  if (saved) return saved;

  const browser = browserLocale(input.acceptLanguage ?? null);
  if (browser) return browser;

  const country = input.country?.trim().toUpperCase();
  if (country && /^[A-Z]{2}$/.test(country) && country !== 'ZZ' && country !== 'XX') {
    return SPANISH_SPEAKING_COUNTRIES.has(country) ? 'es' : 'en';
  }
  return 'es';
}
