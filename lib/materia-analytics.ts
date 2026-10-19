import { getAttributionSnapshot } from '@/lib/attribution';

function getAnalyticsSessionKey() {
  const key = 'evaluo_session_key';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(key, value);
  return value;
}

function getAnalyticsDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

export async function trackMateriaAnalyticsEvent(
  eventName: string,
  payload: {
    userId?: string | null;
    materiaId: string;
    carreraId?: string;
    universidadId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        session_key: getAnalyticsSessionKey(),
        user_id: payload.userId ?? null,
        path: window.location.pathname,
        device_type: getAnalyticsDeviceType(),
        metadata: {
          attribution: getAttributionSnapshot(),
          materia_id: payload.materiaId,
          carrera_id: payload.carreraId,
          universidad_id: payload.universidadId,
          ...(payload.metadata ?? {}),
        },
      }),
      keepalive: true,
    });
  } catch {
    // ignore tracking failures
  }
}
