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
      metadata: attribution || Object.keys(routeContext).length > 0 ? { attribution, ...routeContext } : undefined,
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
        metadata: { engagement_ms: engagementMs, attribution, anonymous_id: anonymousId, page_type: pageType },
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
        metadata: { engagement_ms: engagementMs, attribution, anonymous_id: anonymousId, page_type: pageType },
      });

      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [pathname]);

  return null;
}
