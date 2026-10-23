'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { isTerminalAuthSessionError } from '@/lib/auth-session-errors';

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
  const sessionCheckInFlightRef = useRef(false);

  useEffect(() => {
    let disposed = false;

    const recordActivity = (force = false) => {
      if (!hasSessionRef.current || signingOutRef.current) return;

      const now = Date.now();
      if (!force && now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;

      writeLastActivity(now);
      lastWriteRef.current = now;
    };

    const redirectToLogin = (reason: 'inactive' | 'auth-expired') => {
      if (disposed) return;
      signingOutRef.current = true;
      hasSessionRef.current = false;
      clearLastActivity();
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const nextPath = window.location.pathname.startsWith('/login') ? '/dashboard' : currentPath;
      window.location.replace(`/login?reason=${reason}&next=${encodeURIComponent(nextPath)}`);
    };

    const expireSession = async (reason: 'inactive' | 'auth-expired' = 'inactive') => {
      if (signingOutRef.current || disposed) return;
      signingOutRef.current = true;
      hasSessionRef.current = false;
      clearLastActivity();

      try {
        await supabase.auth.signOut({ scope: 'local' });
      } finally {
        redirectToLogin(reason);
      }
    };

    const checkSession = async (recordIfActive = false) => {
      if (sessionCheckInFlightRef.current || signingOutRef.current) return;
      sessionCheckInFlightRef.current = true;
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (disposed) return;
        if (error) {
          if (isTerminalAuthSessionError(error)) await expireSession('auth-expired');
          return; // No cerrar una sesión válida por un corte de red temporal.
        }

        const hadSession = hasSessionRef.current;
        hasSessionRef.current = Boolean(session);
        if (!session) {
          clearLastActivity();
          if (hadSession) await expireSession('auth-expired');
          return;
        }

        const lastActivity = readLastActivity();
        if (lastActivity === null) {
          recordActivity(true);
          return;
        }

        if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
          await expireSession('inactive');
          return;
        }

        if (recordIfActive) recordActivity(true);
      } catch {
        // No generar promesas rechazadas si el proveedor tiene un corte temporal.
      } finally {
        sessionCheckInFlightRef.current = false;
      }
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      const previouslyAuthenticated = hasSessionRef.current;
      hasSessionRef.current = Boolean(session);
      if (!session) {
        clearLastActivity();
        if (event === 'SIGNED_OUT' && previouslyAuthenticated && !signingOutRef.current) {
          // No llamar a supabase.auth.signOut desde onAuthStateChange:
          // GoTrue puede mantener su lock de sesión mientras entrega el evento.
          redirectToLogin('auth-expired');
        }
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
