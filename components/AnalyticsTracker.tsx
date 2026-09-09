'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttributionFromLocation, getAttributionSnapshot } from '@/lib/attribution';
import { useUser } from '@/hooks/useUser';

function getSessionKey() {
  const key = 'evaluo_session_key';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(key, value);
  return value;
}

function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

function getRouteContext() {
  const params = new URLSearchParams(window.location.search);
  const carreraId = params.get('carreraId') ?? params.get('carrera_id');
  const universidadId = params.get('universidadId') ?? params.get('universidad_id');
  const tab = params.get('tab');

  return {
    ...(carreraId ? { carrera_id: carreraId } : {}),
    ...(universidadId ? { universidad_id: universidadId } : {}),
    ...(tab ? { tab } : {}),
  };
}

function getEntryPageType(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/explorar/materia/')) return 'materia';
  if (pathname === '/explorar' || pathname.startsWith('/explorar/')) return 'explorar';
  if (pathname.startsWith('/pregunteros')) return 'pregunteros';
  if (pathname.startsWith('/simulador')) return 'simulador';
  if (pathname.startsWith('/materias')) return 'materias';
  if (pathname.startsWith('/recursos')) return 'recursos';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  return 'other';
}

async function track(eventName: string, payload: Record<string, unknown>) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        ...payload,
      }),
      keepalive: true,
    });
  } catch {
    // ignore tracking errors
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();
  const visibleSinceRef = useRef<number>(Date.now());
  const previousUserIdRef = useRef<string | null | undefined>(undefined);
  const acquisitionTrackedRef = useRef(false);
  const queryString = searchParams.toString();

  useEffect(() => {
    if (loading) {
      return;
    }

    const sessionKey = getSessionKey();
    const deviceType = getDeviceType();
    const currentTouch = captureAttributionFromLocation(
      window.location.search,
      window.location.pathname,
      document.referrer
    );
    const attribution = getAttributionSnapshot();
    const routeContext = getRouteContext();

    if (!acquisitionTrackedRef.current) {
      acquisitionTrackedRef.current = true;
      const landingPath = queryString ? `${pathname}?${queryString}` : pathname;

      void track('acquisition_touch', {
        session_key: sessionKey,
        path: pathname,
        device_type: deviceType,
        user_id: user?.id ?? null,
        metadata: {
          source: currentTouch?.source ?? 'direct',
          landing_path: landingPath,
          referrer: document.referrer || null,
          entry_page_type: getEntryPageType(pathname),
          attribution: currentTouch,
        },
      });
    }

    void track('page_view', {
      session_key: sessionKey,
      path: pathname,
      device_type: deviceType,
      user_id: user?.id ?? null,
      metadata:
        attribution || Object.keys(routeContext).length > 0
          ? { attribution, ...routeContext }
          : undefined,
    });
  }, [loading, pathname, queryString, user?.id]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const currentUserId = user?.id ?? null;

    if (previousUserIdRef.current === undefined) {
      previousUserIdRef.current = currentUserId;
      return;
    }

    if (!previousUserIdRef.current && currentUserId) {
      const sessionKey = getSessionKey();
      const deviceType = getDeviceType();
      const attribution = getAttributionSnapshot();

      void track('login_success', {
        session_key: sessionKey,
        user_id: currentUserId,
        path: pathname,
        device_type: deviceType,
        metadata: { source_path: pathname, attribution },
      });
    }

    previousUserIdRef.current = currentUserId;
  }, [loading, pathname, user?.id]);

  useEffect(() => {
    const sessionKey = getSessionKey();
    const deviceType = getDeviceType();
    const attribution = getAttributionSnapshot();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        visibleSinceRef.current = Date.now();
        return;
      }

      const engagementMs = Math.max(0, Date.now() - visibleSinceRef.current);
      void track('session_ping', {
        session_key: sessionKey,
        path: pathname,
        device_type: deviceType,
        metadata: { engagement_ms: engagementMs, attribution },
      });
    };

    const handleError = (event: ErrorEvent) => {
      void track('client_error', {
        session_key: sessionKey,
        path: pathname,
        device_type: deviceType,
        metadata: {
          message: event.message,
          source: event.filename,
          line: event.lineno,
          attribution,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      void track('client_error', {
        session_key: sessionKey,
        path: pathname,
        device_type: deviceType,
        metadata: {
          message:
            typeof event.reason === 'string'
              ? event.reason
              : (event.reason?.message ?? 'unhandled_rejection'),
          attribution,
        },
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      const engagementMs = Math.max(0, Date.now() - visibleSinceRef.current);
      void track('session_ping', {
        session_key: sessionKey,
        path: pathname,
        device_type: deviceType,
        metadata: { engagement_ms: engagementMs, attribution },
      });

      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [pathname]);

  return null;
}
