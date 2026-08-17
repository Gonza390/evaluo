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

export function ShellDataProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [profileSummary, setProfileSummary] =
    useState<ShellProfileSummary>(DEFAULT_PROFILE_SUMMARY);
  const [streak, setStreak] = useState<StreakSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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
        const [summary, streakSnapshot] = await Promise.all([
          getShellProfileSummary(user.id),
          getCachedStreakSnapshot(user.id, getArgentinaDayKey, shiftDayKey),
        ]);

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
  }, [user, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const value = useMemo<ShellDataContextValue>(
    () => ({ profileSummary, streak, isLoading, refresh }),
    [profileSummary, streak, isLoading, refresh],
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
