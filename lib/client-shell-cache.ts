'use client';

import { supabase } from '@/lib/supabase-client';

const SHELL_PROFILE_TTL_MS = 5 * 60 * 1000;
const STREAK_TTL_MS = 5 * 60 * 1000;

export type ShellProfileSummary = {
  carreraId: string | null;
  carreraNombre: string | null;
  universidadId: string | null;
  universidadNombre: string | null;
};

export type StreakSnapshot = {
  todayKey: string;
  streakDays: number;
  streakDayKeys: string[];
};

type LegacyStreakSnapshot = {
  todayKey: string;
  streakDays: number;
  streakDayKeys?: string[];
  activeDayKeys?: string[];
};

type PersistentStreakState = {
  lastSeenDayKey: string;
  streakDays: number;
  streakDayKeys: string[];
};

function readCachedJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readLocalJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCachedJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore cache write failures.
  }
}

function writeLocalJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore cache write failures.
  }
}

function getShellProfileCacheKey(userId: string) {
  return `evaluo_shell_profile:${userId}`;
}

function getStreakCacheKey(userId: string) {
  return `evaluo_shell_streak:v2:${userId}`;
}

function getPersistentStreakKey(userId: string) {
  return `evaluo_streak_state:v1:${userId}`;
}

type TimedValue<T> = {
  value: T;
  expiresAt: number;
};

function normalizeStreakDayKeys(dayKeys: string[], todayKey: string) {
  const normalized = Array.from(
    new Set(dayKeys.map((value) => String(value).trim()).filter(Boolean))
  );

  normalized.sort((left, right) => right.localeCompare(left));

  if (!normalized.includes(todayKey)) {
    normalized.unshift(todayKey);
  }

  return normalized;
}

function readPersistentStreakState(userId: string): PersistentStreakState | null {
  return readLocalJson<PersistentStreakState>(getPersistentStreakKey(userId));
}

function writePersistentStreakState(userId: string, value: PersistentStreakState) {
  writeLocalJson(getPersistentStreakKey(userId), value);
}

export async function getShellProfileSummary(userId: string): Promise<ShellProfileSummary> {
  const cacheKey = getShellProfileCacheKey(userId);
  const cached = readCachedJson<TimedValue<ShellProfileSummary>>(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('carrera_id, universidad_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const carreraId = String(profile?.carrera_id ?? '').trim();
  const universidadId = String(profile?.universidad_id ?? '').trim();

  const [carreraResponse, universidadResponse] = await Promise.all([
    carreraId
      ? supabase.from('carreras').select('id, nombre').eq('id', carreraId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    universidadId
      ? supabase.from('universidades').select('nombre').eq('id', universidadId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (carreraResponse.error) {
    throw carreraResponse.error;
  }

  if (universidadResponse.error) {
    throw universidadResponse.error;
  }

  const value: ShellProfileSummary = {
    carreraId: carreraResponse.data?.id ?? null,
    carreraNombre: carreraResponse.data?.nombre ?? null,
    universidadId: universidadId || null,
    universidadNombre: universidadResponse.data?.nombre ?? null,
  };

  writeCachedJson(cacheKey, {
    value,
    expiresAt: Date.now() + SHELL_PROFILE_TTL_MS,
  });

  return value;
}

export async function getCachedStreakSnapshot(
  userId: string,
  getArgentinaDayKey: (dateInput: Date | string) => string,
  shiftDayKey: (dayKey: string, offset: number) => string
): Promise<StreakSnapshot> {
  const todayKey = getArgentinaDayKey(new Date());
  const cacheKey = getStreakCacheKey(userId);
  const cached = readCachedJson<TimedValue<LegacyStreakSnapshot>>(cacheKey);
  const persistentState = readPersistentStreakState(userId);

  if (cached && cached.expiresAt > Date.now() && cached.value.todayKey === todayKey) {
    return {
      todayKey: cached.value.todayKey,
      streakDays: cached.value.streakDays,
      streakDayKeys: cached.value.streakDayKeys ?? cached.value.activeDayKeys ?? [],
    };
  }

  if (cached?.value?.todayKey) {
    const cachedDayKeys = cached.value.streakDayKeys ?? cached.value.activeDayKeys ?? [];
    const yesterdayKey = shiftDayKey(todayKey, -1);

    if (cached.value.todayKey === yesterdayKey) {
      const migratedSnapshot = {
        todayKey,
        streakDays: Math.max(1, cached.value.streakDays) + 1,
        streakDayKeys: normalizeStreakDayKeys([todayKey, ...cachedDayKeys], todayKey),
      };

      writePersistentStreakState(userId, {
        lastSeenDayKey: todayKey,
        streakDays: migratedSnapshot.streakDays,
        streakDayKeys: migratedSnapshot.streakDayKeys,
      });

      writeCachedJson(cacheKey, {
        value: migratedSnapshot,
        expiresAt: Date.now() + STREAK_TTL_MS,
      });

      return migratedSnapshot;
    }
  }

  if (persistentState) {
    const yesterdayKey = shiftDayKey(todayKey, -1);
    const normalizedDayKeys = normalizeStreakDayKeys(persistentState.streakDayKeys, todayKey);

    if (persistentState.lastSeenDayKey === todayKey) {
      const snapshot = {
        todayKey,
        streakDays: Math.max(1, persistentState.streakDays),
        streakDayKeys: normalizedDayKeys,
      };

      writeCachedJson(cacheKey, {
        value: snapshot,
        expiresAt: Date.now() + STREAK_TTL_MS,
      });

      return snapshot;
    }

    if (persistentState.lastSeenDayKey === yesterdayKey) {
      const nextDayKeys = normalizeStreakDayKeys(
        [todayKey, ...persistentState.streakDayKeys],
        todayKey
      );
      const snapshot = {
        todayKey,
        streakDays: persistentState.streakDays + 1,
        streakDayKeys: nextDayKeys,
      };

      writePersistentStreakState(userId, {
        lastSeenDayKey: todayKey,
        streakDays: snapshot.streakDays,
        streakDayKeys: snapshot.streakDayKeys,
      });

      writeCachedJson(cacheKey, {
        value: snapshot,
        expiresAt: Date.now() + STREAK_TTL_MS,
      });

      return snapshot;
    }

    const resetSnapshot = {
      todayKey,
      streakDays: 1,
      streakDayKeys: [todayKey],
    };

    writePersistentStreakState(userId, {
      lastSeenDayKey: todayKey,
      streakDays: resetSnapshot.streakDays,
      streakDayKeys: resetSnapshot.streakDayKeys,
    });

    writeCachedJson(cacheKey, {
      value: resetSnapshot,
      expiresAt: Date.now() + STREAK_TTL_MS,
    });

    return resetSnapshot;
  }

  const since = new Date();
  since.setDate(since.getDate() - 60);

  const { data, error } = await supabase
    .from('analytics_events')
    .select('created_at')
    .eq('user_id', userId)
    .in('event_name', ['page_view', 'login_success', 'session_ping'])
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  const activeDayKeys = new Set(
    (data ?? []).map((row) => getArgentinaDayKey(row.created_at)).filter(Boolean)
  );

  activeDayKeys.add(todayKey);

  let streak = 0;
  let cursor = todayKey;

  while (activeDayKeys.has(cursor)) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  const streakDayKeys: string[] = [];
  let streakCursor = todayKey;

  while (activeDayKeys.has(streakCursor)) {
    streakDayKeys.push(streakCursor);
    streakCursor = shiftDayKey(streakCursor, -1);
  }

  const snapshot = {
    todayKey,
    streakDays: streak,
    streakDayKeys,
  };

  writePersistentStreakState(userId, {
    lastSeenDayKey: todayKey,
    streakDays: snapshot.streakDays,
    streakDayKeys: snapshot.streakDayKeys,
  });

  writeCachedJson(cacheKey, {
    value: snapshot,
    expiresAt: Date.now() + STREAK_TTL_MS,
  });

  return snapshot;
}

export async function getCachedStreakDays(
  userId: string,
  getArgentinaDayKey: (dateInput: Date | string) => string,
  shiftDayKey: (dayKey: string, offset: number) => string
): Promise<number> {
  const snapshot = await getCachedStreakSnapshot(userId, getArgentinaDayKey, shiftDayKey);
  return snapshot.streakDays;
}
