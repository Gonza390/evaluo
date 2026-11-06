/** IANA time-zone helpers for exam dates. No authorization logic depends on this preference. */
export const DEFAULT_ACCOUNT_TIME_ZONE = 'America/Argentina/Buenos_Aires';

export function parseAccountTimeZone(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 90 ||
      !/^[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+){0,3}$/.test(value)) return null;
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function accountTimeZone(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object') return DEFAULT_ACCOUNT_TIME_ZONE;
  const preference = (metadata as Record<string, unknown>).time_zone;
  return parseAccountTimeZone(preference) ?? DEFAULT_ACCOUNT_TIME_ZONE;
}

export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const validZone = parseAccountTimeZone(timeZone) ?? DEFAULT_ACCOUNT_TIME_ZONE;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: validZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}
