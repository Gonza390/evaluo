'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUser } from '@/hooks/useUser';

type PremiumSnapshot = { userId: string; premium: boolean };
type PremiumStatusContextValue = {
  /** null means loading, unavailable, or not authenticated; it never means Free. */
  isPremium: boolean | null;
  isLoading: boolean;
  error: boolean;
  refresh: () => void;
};

const PremiumStatusContext = createContext<PremiumStatusContextValue | null>(null);

/**
 * UI-only entitlement snapshot shared by private client screens.
 * Server actions and API routes MUST still authorize protected operations.
 */
export function PremiumStatusProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const userId = user?.id ?? null;
  const [snapshot, setSnapshot] = useState<PremiumSnapshot | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [failedUserId, setFailedUserId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    let active = true;
    setPendingUserId(userId);
    setFailedUserId(null);
    void fetch('/api/account/premium-status', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error('premium_status_unavailable');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('premium' in data) ||
          typeof data.premium !== 'boolean') throw new Error('invalid_premium_snapshot');
      if (active) setSnapshot({ userId, premium: data.premium });
    }).catch(() => {
      if (active) setFailedUserId(userId);
    }).finally(() => {
      if (active) setPendingUserId(null);
    });
    return () => { active = false; controller.abort(); };
  }, [userId, revision]);

  useEffect(() => {
    const onPremiumChange = () => refresh();
    window.addEventListener('evaluo:premium-status-changed', onPremiumChange);
    return () => window.removeEventListener('evaluo:premium-status-changed', onPremiumChange);
  }, [refresh]);

  const isLoading = userLoading || Boolean(userId && (pendingUserId === userId ||
    (snapshot?.userId !== userId && failedUserId !== userId)));
  const isPremium = !userId || isLoading || failedUserId === userId ||
    snapshot?.userId !== userId ? null : snapshot.premium;

  const value = useMemo<PremiumStatusContextValue>(() => ({
    isPremium, isLoading, error: Boolean(userId && failedUserId === userId), refresh,
  }), [isPremium, isLoading, userId, failedUserId, refresh]);

  return <PremiumStatusContext.Provider value={value}>{children}</PremiumStatusContext.Provider>;
}

export function usePremiumStatus(): PremiumStatusContextValue {
  const value = useContext(PremiumStatusContext);
  if (!value) throw new Error('usePremiumStatus must be used within PremiumStatusProvider');
  return value;
}
