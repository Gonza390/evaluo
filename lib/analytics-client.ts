import type { Json } from '@/types/supabase';
import { getAttributionSnapshot } from '@/lib/attribution';

const ANALYTICS_BATCH_SIZE = 10;
const ANALYTICS_MAX_REQUEST_BATCH = 20;
const ANALYTICS_FLUSH_MS = 5_000;
const SESSION_PING_INTERVAL_MS = 5 * 60_000;
const SESSION_PING_STORAGE_KEY = 'evaluo_session_ping_last';

type AnalyticsQueueItem = {
  event_name: string;
  user_id: string | null;
  session_key: string;
  path: string;
  device_type: string;
  metadata: Record<string, Json | undefined>;
};

const analyticsQueue: AnalyticsQueueItem[] = [];
let analyticsFlushTimer: number | null = null;
let lifecycleListenersInstalled = false;

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
  if (pathname.startsWith('/resumenes/')) return 'resumenes';
  if (pathname.startsWith('/pregunteros')) return 'pregunteros';
  if (pathname.startsWith('/estudiar/')) return 'estudiar';
  if (pathname.startsWith('/simulador-parcial')) return 'simulador-parcial';
  if (pathname.startsWith('/pricing')) return 'pricing';
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/simulador')) return 'simulador';
  if (pathname.startsWith('/calendario')) return 'calendario';
  return 'other';
}

function shouldSkipSessionPing(eventName: string) {
  if (eventName !== 'session_ping') return false;

  try {
    const now = Date.now();
    const previous = Number(window.sessionStorage.getItem(SESSION_PING_STORAGE_KEY) ?? 0);
    if (Number.isFinite(previous) && now - previous < SESSION_PING_INTERVAL_MS) {
      return true;
    }
    window.sessionStorage.setItem(SESSION_PING_STORAGE_KEY, String(now));
  } catch {
    // Si sessionStorage no esta disponible, mantenemos el tracking normal.
  }

  return false;
}

async function flushAnalyticsQueue(preferBeacon = false) {
  if (analyticsFlushTimer) {
    window.clearTimeout(analyticsFlushTimer);
    analyticsFlushTimer = null;
  }
  if (analyticsQueue.length === 0) return;

  const events = analyticsQueue.splice(0, ANALYTICS_MAX_REQUEST_BATCH);
  const body = JSON.stringify({ events });

  if (preferBeacon && typeof navigator.sendBeacon === 'function') {
    const sent = navigator.sendBeacon(
      '/api/analytics/track',
      new Blob([body], { type: 'application/json' })
    );
    if (sent) {
      if (analyticsQueue.length > 0) scheduleAnalyticsFlush();
      return;
    }
  }

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // Analytics nunca debe bloquear la experiencia principal.
  } finally {
    if (analyticsQueue.length > 0) scheduleAnalyticsFlush();
  }
}

function scheduleAnalyticsFlush() {
  if (analyticsFlushTimer) return;
  analyticsFlushTimer = window.setTimeout(() => {
    void flushAnalyticsQueue(false);
  }, ANALYTICS_FLUSH_MS);
}

function installAnalyticsLifecycleListeners() {
  if (lifecycleListenersInstalled) return;
  lifecycleListenersInstalled = true;

  window.addEventListener('pagehide', () => {
    void flushAnalyticsQueue(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushAnalyticsQueue(true);
    }
  });
}

export async function trackClientAnalyticsEvent(input: {
  eventName: string;
  path?: string;
  userId?: string | null;
  metadata?: Record<string, Json | undefined>;
}) {
  if (shouldSkipSessionPing(input.eventName)) return;

  const pathname = input.path ?? window.location.pathname;
  const pageType = getAnalyticsPageType(pathname);
  const metadata = {
    attribution: getAttributionSnapshot(),
    anonymous_id: getAnalyticsAnonymousId(),
    page_type: pageType,
    ...input.metadata,
  };

  analyticsQueue.push({
    event_name: input.eventName,
    user_id: input.userId ?? null,
    session_key: getAnalyticsSessionKey(),
    path: pathname,
    device_type: getAnalyticsDeviceType(),
    metadata,
  });

  installAnalyticsLifecycleListeners();

  if (analyticsQueue.length >= ANALYTICS_BATCH_SIZE) {
    void flushAnalyticsQueue(false);
  } else {
    scheduleAnalyticsFlush();
  }
}
