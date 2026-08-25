'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useUser } from '@/hooks/useUser';
import {
  getShellProfileSummary,
  getCachedStreakSnapshot,
  type ShellProfileSummary,
  type StreakSnapshot,
} from '@/lib/client-shell-cache';
import { getArgentinaDayKey, shiftDayKey } from '@/lib/calendar-utils';
import { logError } from '@/lib/observability';

type ShellDataContextValue = {
  profileSummary: ShellProfileSummary;
  streak: StreakSnapshot | null;
  isLoading: boolean;
  refresh: () => void;
};

const DEFAULT_PROFILE_SUMMARY: ShellProfileSummary = {
  carreraId: null,
  carreraNombre: null,
  universidadId: null,
  universidadNombre: null,
};

const ShellDataContext = createContext<ShellDataContextValue | null>(null);

function waitForIdle(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 1500 });
      return;
    }

    globalThis.setTimeout(resolve, 250);
  });
}

export function ShellDataProvider({
  children,
  initialProfileSummary,
}: {
  children: ReactNode;
  initialProfileSummary?: ShellProfileSummary;
}) {
  const { user } = useUser();
  const [profileSummary, setProfileSummary] = useState<ShellProfileSummary>(
    initialProfileSummary ?? DEFAULT_PROFILE_SUMMARY
  );
  const [streak, setStreak] = useState<StreakSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasLoadedInitialSnapshot, setHasLoadedInitialSnapshot] = useState(
    initialProfileSummary !== undefined
  );

  useEffect(() => {
    let active = true;

    async function loadShellData() {
      if (!user) {
        if (active) {
          setProfileSummary(DEFAULT_PROFILE_SUMMARY);
          setStreak(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const profilePromise =
          hasLoadedInitialSnapshot && refreshKey === 0
            ? Promise.resolve(initialProfileSummary ?? DEFAULT_PROFILE_SUMMARY)
            : getShellProfileSummary(user.id);
        const streakPromise = waitForIdle().then(() =>
          getCachedStreakSnapshot(user.id, getArgentinaDayKey, shiftDayKey)
        );
        const [summary, streakSnapshot] = await Promise.all([profilePromise, streakPromise]);

        if (active) {
          setProfileSummary(summary);
          setStreak(streakSnapshot);
        }
      } catch (error) {
        logError('shellDataProvider.load', error, { userId: user.id });
        if (active) {
          setProfileSummary(DEFAULT_PROFILE_SUMMARY);
          setStreak(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadShellData();

    return () => {
      active = false;
    };
  }, [user, refreshKey, hasLoadedInitialSnapshot, initialProfileSummary]);

  const refresh = useCallback(() => {
    setHasLoadedInitialSnapshot(false);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const value = useMemo<ShellDataContextValue>(
    () => ({ profileSummary, streak, isLoading, refresh }),
    [profileSummary, streak, isLoading, refresh]
  );

  return <ShellDataContext.Provider value={value}>{children}</ShellDataContext.Provider>;
}

export function useShellData(): ShellDataContextValue {
  const context = useContext(ShellDataContext);
  if (!context) {
    throw new Error('useShellData must be used within a ShellDataProvider');
  }
  return context;
}
