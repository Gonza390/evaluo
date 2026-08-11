import type { Json } from '@/types/supabase';
import { getAttributionSnapshot } from '@/lib/attribution';

function randomId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getAnalyticsSessionKey() {
  const key = 'evaluo_session_key';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const value = randomId();
  window.localStorage.setItem(key, value);
  return value;
}

export function getAnalyticsAnonymousId() {
  const key = 'evaluo_anonymous_id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const value = randomId();
  window.localStorage.setItem(key, value);
  return value;
}

export function getAnalyticsDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

export function getAnalyticsPageType(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/explorar/materia/')) return 'materia';
  if (pathname === '/explorar') return 'explorar';
  if (pathname.startsWith('/universidad/')) return 'universidad';
  if (pathname.startsWith('/materias')) return 'materias';
  if (pathname.startsWith('/recursos/')) return 'recursos';
  if (pathname.startsWith('/pricing')) return 'pricing';
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/simulador')) return 'simulador';
  return 'other';
}

export async function trackClientAnalyticsEvent(input: {
  eventName: string;
  path?: string;
  userId?: string | null;
  metadata?: Record<string, Json | undefined>;
}) {
  const pathname = input.path ?? window.location.pathname;
  const pageType = getAnalyticsPageType(pathname);
  const metadata = {
    attribution: getAttributionSnapshot(),
    anonymous_id: getAnalyticsAnonymousId(),
    page_type: pageType,
    ...input.metadata,
  };

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: input.eventName,
        user_id: input.userId ?? null,
        session_key: getAnalyticsSessionKey(),
        path: pathname,
        device_type: getAnalyticsDeviceType(),
        metadata,
      }),
      keepalive: true,
    });
  } catch {
    // ignore tracking failures
  }
}
