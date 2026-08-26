'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';

const DEFAULT_IDLE_MINUTES = 60;
const MIN_IDLE_MINUTES = 15;
const MAX_IDLE_MINUTES = 24 * 60;
const LAST_ACTIVITY_KEY = 'evaluo_auth_last_activity_at';
const ACTIVITY_WRITE_THROTTLE_MS = 15_000;

function resolveIdleTimeoutMs() {
  const configured = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES ?? DEFAULT_IDLE_MINUTES);
  const minutes = Number.isFinite(configured)
    ? Math.min(MAX_IDLE_MINUTES, Math.max(MIN_IDLE_MINUTES, configured))
    : DEFAULT_IDLE_MINUTES;

  return minutes * 60_000;
}

const IDLE_TIMEOUT_MS = resolveIdleTimeoutMs();

function readLastActivity() {
  try {
    const value = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeLastActivity(timestamp = Date.now()) {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  } catch {
    // Browsers with restricted storage can still use the Supabase session normally.
  }
}

function clearLastActivity() {
  try {
    window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export default function SessionIdleGuard() {
  const signingOutRef = useRef(false);
  const hasSessionRef = useRef(false);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    let disposed = false;

    const recordActivity = (force = false) => {
      if (!hasSessionRef.current || signingOutRef.current) return;

      const now = Date.now();
      if (!force && now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;

      writeLastActivity(now);
      lastWriteRef.current = now;
    };

    const expireSession = async () => {
      if (signingOutRef.current || disposed) return;
      signingOutRef.current = true;
      hasSessionRef.current = false;
      clearLastActivity();

      try {
        await supabase.auth.signOut({ scope: 'local' });
      } finally {
        if (disposed) return;
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const nextPath = window.location.pathname.startsWith('/login') ? '/dashboard' : currentPath;
        window.location.replace(`/login?reason=inactive&next=${encodeURIComponent(nextPath)}`);
      }
    };

    const checkSession = async (recordIfActive = false) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (disposed) return;
      hasSessionRef.current = Boolean(session);

      if (!session) {
        clearLastActivity();
        return;
      }

      const lastActivity = readLastActivity();
      if (lastActivity === null) {
        recordActivity(true);
        return;
      }

      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        await expireSession();
        return;
      }

      if (recordIfActive) recordActivity(true);
    };

    const handleActivity = () => recordActivity(false);
    const handleFocus = () => void checkSession(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkSession(true);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = window.setInterval(() => {
      void checkSession(false);
    }, 60_000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hasSessionRef.current = Boolean(session);
      if (!session) {
        clearLastActivity();
        return;
      }

      if (readLastActivity() === null) recordActivity(true);
    });

    void checkSession(false);

    return () => {
      disposed = true;
      subscription.unsubscribe();
      window.clearInterval(interval);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, handleActivity);
      }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
