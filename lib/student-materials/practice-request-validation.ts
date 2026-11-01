/**
 * Canonical material/session UUID validation for authenticated practice APIs.
 * Supabase UUIDs have five groups: 8-4-4-4-12, not 8-4-4-12.
 * Keep this shared to avoid modality-specific HTTP 400 failures.
 */
const practiceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPracticeUuid(value: unknown): value is string {
  return typeof value === 'string' && practiceUuid.test(value);
}
