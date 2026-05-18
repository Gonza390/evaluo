'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { captureAttributionFromLocation, getAttributionSnapshot } from '@/lib/attribution';

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
  const visibleSinceRef = useRef<number>(Date.now());

  useEffect(() => {
    const sessionKey = getSessionKey();
    const deviceType = getDeviceType();
    let userId: string | null = null;
    captureAttributionFromLocation(window.location.search, window.location.pathname);
    const attribution = getAttributionSnapshot();

    void supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null;
      void track('page_view', {
        session_key: sessionKey,
        path: pathname,
        device_type: deviceType,
        user_id: userId,
        metadata: attribution ? { attribution } : undefined,
      });
    });
  }, [pathname]);

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

    const { data: authSubscription } = supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === 'SIGNED_IN' && session?.user?.id) {
        void track('login_success', {
          session_key: sessionKey,
          user_id: session.user.id,
          path: pathname,
          device_type: deviceType,
          metadata: { source_path: pathname, attribution },
        });
      }
    });

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
      authSubscription.subscription.unsubscribe();
    };
  }, [pathname]);

  return null;
}
