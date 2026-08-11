'use client';

export type AttributionSnapshot = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ref_user?: string;
  landing_path?: string;
  captured_at?: string;
};

const STORAGE_KEYS = {
  firstTouch: 'evaluo_attribution_first_touch',
  latestTouch: 'evaluo_attribution_latest_touch',
} as const;

function canUseStorage() {
  return typeof window !== 'undefined';
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeValue(value: string | null) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function readStoredSnapshot(key: string): AttributionSnapshot | null {
  if (!canUseStorage()) return null;
  return safeParse<AttributionSnapshot | null>(window.localStorage.getItem(key), null);
}

function writeStoredSnapshot(key: string, value: AttributionSnapshot) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function captureAttributionFromLocation(
  search: string = window.location.search,
  pathname: string = window.location.pathname
) {
  if (!canUseStorage()) return;

  const params = new URLSearchParams(search);
  const snapshot: AttributionSnapshot = {
    utm_source: normalizeValue(params.get('utm_source')),
    utm_medium: normalizeValue(params.get('utm_medium')),
    utm_campaign: normalizeValue(params.get('utm_campaign')),
    utm_content: normalizeValue(params.get('utm_content')),
    utm_term: normalizeValue(params.get('utm_term')),
    ref_user: normalizeValue(params.get('ref_user')),
    landing_path: pathname,
    captured_at: new Date().toISOString(),
  };

  const hasAttribution = Object.entries(snapshot).some(
    ([key, value]) => key !== 'landing_path' && key !== 'captured_at' && value
  );

  if (!hasAttribution) return;

  const currentFirstTouch = readStoredSnapshot(STORAGE_KEYS.firstTouch);
  if (!currentFirstTouch) {
    writeStoredSnapshot(STORAGE_KEYS.firstTouch, snapshot);
  }

  writeStoredSnapshot(STORAGE_KEYS.latestTouch, snapshot);
}

export function getAttributionSnapshot(): AttributionSnapshot | null {
  if (!canUseStorage()) return null;

  const firstTouch = readStoredSnapshot(STORAGE_KEYS.firstTouch);
  const latestTouch = readStoredSnapshot(STORAGE_KEYS.latestTouch);

  if (!firstTouch && !latestTouch) return null;

  return {
    ...(firstTouch ?? {}),
    latest_utm_source: latestTouch?.utm_source,
    latest_utm_medium: latestTouch?.utm_medium,
    latest_utm_campaign: latestTouch?.utm_campaign,
    latest_utm_content: latestTouch?.utm_content,
    latest_utm_term: latestTouch?.utm_term,
    latest_ref_user: latestTouch?.ref_user,
  } as AttributionSnapshot & Record<string, string | undefined>;
}

export function buildShareReferralUrl(path: string, userId: string) {
  if (typeof window === 'undefined') return path;

  const url = new URL(path, window.location.origin);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'resultado_simulador');
  url.searchParams.set('ref_user', userId);
  return url.toString();
}
