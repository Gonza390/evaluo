'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttributionFromLocation, getAttributionSnapshot } from '@/lib/attribution';
import {
  getAnalyticsAnonymousId,
  getAnalyticsDeviceType,
  getAnalyticsPageType,
  getAnalyticsSessionKey,
} from '@/lib/analytics-client';
import { trackProductAnalyticsEvent } from '@/lib/product-analytics-client';
import { useUser } from '@/hooks/useUser';

function getRouteContext() {
  const params = new URLSearchParams(window.location.search);
  const carreraId = params.get('carreraId') ?? params.get('carrera_id');
  const universidadId = params.get('universidadId') ?? params.get('universidad_id');
  const tab = params.get('tab');
  const pathname = window.location.pathname;

  return {
    anonymous_id: getAnalyticsAnonymousId(),
    page_type: getAnalyticsPageType(pathname),
    ...(carreraId ? { carrera_id: carreraId } : {}),
    ...(universidadId ? { universidad_id: universidadId } : {}),
    ...(tab ? { tab } : {}),
  };
}

function getStudyContentType(pathname: string) {
  if (pathname.startsWith('/materiales/')) return 'student_material';
  if (pathname.startsWith('/recursos/')) return 'resource';
  if (pathname.startsWith('/resumenes/')) return 'summary';
  if (pathname.startsWith('/estudiar/')) return 'study';
  return null;
}

function getMateriaIdFromPath(pathname: string) {
  if (!pathname.startsWith('/explorar/materia/')) return null;
  const match = pathname.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );
  return match?.[0] ?? null;
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
  const queryString = searchParams.toString();

  useEffect(() => {
    if (loading) {
      return;
    }

    const sessionKey = getAnalyticsSessionKey();
    const deviceType = getAnalyticsDeviceType();
    captureAttributionFromLocation(window.location.search, window.location.pathname);
    const attribution = getAttributionSnapshot();
    const routeContext = getRouteContext();

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

    const acquisitionKey = `evaluo_acquisition_touch:${sessionKey}`;
    if (!window.sessionStorage.getItem(acquisitionKey)) {
      window.sessionStorage.setItem(acquisitionKey, '1');
      void trackProductAnalyticsEvent('acquisition_touch', {
        entry_page_type: getAnalyticsPageType(pathname),
      });
    }
  }, [loading, pathname, queryString, user?.id]);

  useEffect(() => {
    const materiaId = getMateriaIdFromPath(pathname);
    if (!materiaId) return;

    let active = true;
    void fetch(`/api/analytics/content-availability?materia_id=${encodeURIComponent(materiaId)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          available?: boolean;
          resumenCount?: number;
          sharedMaterialCount?: number;
        };
      })
      .then((payload) => {
        if (!active || !payload) return;
        void trackProductAnalyticsEvent(payload.available ? 'content_available' : 'content_empty', {
          materia_id: materiaId,
          resumen_count: payload.resumenCount ?? 0,
          shared_material_count: payload.sharedMaterialCount ?? 0,
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [pathname]);

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
      const sessionKey = getAnalyticsSessionKey();
      const deviceType = getAnalyticsDeviceType();
      const attribution = getAttributionSnapshot();

      void track('login_success', {
        session_key: sessionKey,
        user_id: currentUserId,
        path: pathname,
        device_type: deviceType,
        metadata: {
          source_path: pathname,
          attribution,
          anonymous_id: getAnalyticsAnonymousId(),
          page_type: getAnalyticsPageType(pathname),
        },
      });

      const createdAt = user?.created_at ? new Date(user.created_at).getTime() : 0;
      const isNewUser = createdAt > 0 && Date.now() - createdAt < 10 * 60 * 1000;
      if (isNewUser) {
        const provider =
          String(user?.app_metadata?.provider ?? user?.user_metadata?.provider ?? '').trim() ||
          'email';
        void track('signup_completed', {
          session_key: sessionKey,
          user_id: currentUserId,
          path: pathname,
          device_type: deviceType,
          metadata: {
            provider,
            location: 'auth_callback',
            attribution,
            anonymous_id: getAnalyticsAnonymousId(),
            page_type: getAnalyticsPageType(pathname),
          },
        });
      }
    }

    previousUserIdRef.current = currentUserId;
  }, [loading, pathname, user?.id]);

  useEffect(() => {
    const contentType = getStudyContentType(pathname);
    if (!contentType || pathname.startsWith('/demo/')) return;

    void trackProductAnalyticsEvent('study_content_opened', {
      content_type: contentType,
    });

    let activeMs = 0;
    let lastTick = Date.now();
    let completed = false;

    const timer = window.setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        activeMs += Math.max(0, now - lastTick);
      }
      lastTick = now;

      if (!completed && activeMs >= 90_000) {
        completed = true;
        void trackProductAnalyticsEvent('meaningful_study_completed', {
          content_type: contentType,
          criterion: 'active_90s',
          active_ms: activeMs,
        });
      }
    }, 1_000);

    const resetTick = () => {
      lastTick = Date.now();
    };
    document.addEventListener('visibilitychange', resetTick);
    window.addEventListener('focus', resetTick);
    window.addEventListener('blur', resetTick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', resetTick);
      window.removeEventListener('focus', resetTick);
      window.removeEventListener('blur', resetTick);
    };
  }, [pathname]);

  useEffect(() => {
    const sessionKey = getAnalyticsSessionKey();
    const deviceType = getAnalyticsDeviceType();
    const attribution = getAttributionSnapshot();
    const anonymousId = getAnalyticsAnonymousId();
    const pageType = getAnalyticsPageType(pathname);

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
        metadata: {
          engagement_ms: engagementMs,
          attribution,
          anonymous_id: anonymousId,
          page_type: pageType,
        },
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
          anonymous_id: anonymousId,
          page_type: pageType,
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
          anonymous_id: anonymousId,
          page_type: pageType,
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
        metadata: {
          engagement_ms: engagementMs,
          attribution,
          anonymous_id: anonymousId,
          page_type: pageType,
        },
      });

      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [pathname]);

  return null;
}
