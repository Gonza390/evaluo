'use client';

export type AttributionSnapshot = {
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ref_user?: string;
  share_id?: string;
  referrer?: string;
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

function normalizeSource(value: string | null) {
  const normalized = normalizeValue(value)?.toLowerCase();
  if (!normalized) return undefined;

  const aliases: Record<string, string> = {
    wa: 'whatsapp',
    whatsapp: 'whatsapp',
    ig: 'instagram',
    instagram: 'instagram',
    linkedin: 'linkedin',
    'linked-in': 'linkedin',
    google: 'google',
  };

  return aliases[normalized] ?? normalized;
}

function sourceFromReferrer(referrer: string | null) {
  const normalized = normalizeValue(referrer);
  if (!normalized) return undefined;

  try {
    const host = new URL(normalized).hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'evaluo.com.ar' || host.endsWith('.evaluo.com.ar')) return undefined;
    if (host === 'accounts.google.com') return undefined;
    if (host === 'google.com' || /^google\.[a-z.]+$/.test(host)) return 'google';
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'linkedin';
    if (host === 'whatsapp.com' || host.endsWith('.whatsapp.com') || host === 'wa.me') {
      return 'whatsapp';
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function readStoredSnapshot(key: string): AttributionSnapshot | null {
  if (!canUseStorage()) return null;
  return safeParse<AttributionSnapshot | null>(window.localStorage.getItem(key), null);
}

function writeStoredSnapshot(key: string, value: AttributionSnapshot) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function detectAcquisitionSource(search: string, referrer: string | null = null) {
  const params = new URLSearchParams(search);
  return normalizeSource(params.get('utm_source')) ?? sourceFromReferrer(referrer);
}

export function captureAttributionFromLocation(
  search: string = window.location.search,
  pathname: string = window.location.pathname,
  referrer: string | null = typeof document !== 'undefined' ? document.referrer : null
) {
  if (!canUseStorage()) return;

  const params = new URLSearchParams(search);
  const source = detectAcquisitionSource(search, referrer);
  const snapshot: AttributionSnapshot = {
    source,
    utm_source: normalizeSource(params.get('utm_source')),
    utm_medium: normalizeValue(params.get('utm_medium')),
    utm_campaign: normalizeValue(params.get('utm_campaign')),
    utm_content: normalizeValue(params.get('utm_content')),
    utm_term: normalizeValue(params.get('utm_term')),
    ref_user: normalizeValue(params.get('ref_user')),
    share_id: normalizeValue(params.get('share_id')),
    referrer: normalizeValue(referrer),
    landing_path: pathname,
    captured_at: new Date().toISOString(),
  };

  const hasAttribution = Object.entries(snapshot).some(
    ([key, value]) =>
      key !== 'landing_path' && key !== 'captured_at' && key !== 'referrer' && Boolean(value)
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
    latest_source: latestTouch?.source,
    latest_utm_source: latestTouch?.utm_source,
    latest_utm_medium: latestTouch?.utm_medium,
    latest_utm_campaign: latestTouch?.utm_campaign,
    latest_utm_content: latestTouch?.utm_content,
    latest_utm_term: latestTouch?.utm_term,
    latest_ref_user: latestTouch?.ref_user,
    latest_share_id: latestTouch?.share_id,
    latest_referrer: latestTouch?.referrer,
    latest_landing_path: latestTouch?.landing_path,
    latest_captured_at: latestTouch?.captured_at,
  } as AttributionSnapshot & Record<string, string | undefined>;
}

export function createShareTrackingId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `share_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function buildShareReferralUrl(
  path: string,
  userId?: string | null,
  options: { campaign?: string; shareId?: string } = {}
) {
  if (typeof window === 'undefined') return path;

  const url = new URL(path, window.location.origin);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', options.campaign ?? 'resultado_simulador');
  if (userId) url.searchParams.set('ref_user', userId);
  if (options.shareId) url.searchParams.set('share_id', options.shareId);
  return url.toString();
}
