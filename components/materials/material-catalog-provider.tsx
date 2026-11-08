'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useUser } from '@/hooks/useUser';
import { usePathname } from 'next/navigation';

export type ReadyMaterial = { id: string; title: string };
type CatalogSnapshot = { userId: string; materials: ReadyMaterial[]; loadedAt: number };
type CatalogContextValue = {
  materials: ReadyMaterial[] | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  seed: (items: ReadyMaterial[]) => void;
};

const STALE_AFTER_MS = 30_000;
const CatalogContext = createContext<CatalogContextValue | null>(null);

export function MaterialCatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();
  const userId = user?.id ?? null;
  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const inFlight = useRef<{ userId: string; promise: Promise<void> } | null>(null);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const refresh = useCallback(async (force = true) => {
    if (!userId) return;
    const current = snapshotRef.current;
    if (!force && current?.userId === userId && Date.now() - current.loadedAt < STALE_AFTER_MS) return;
    if (inFlight.current?.userId === userId) return inFlight.current.promise;
    setLoadingId(userId);
    setErrorId(null);
    const task = (async () => {
      try {
        const response = await fetch('/api/account/material-catalog', { cache: 'no-store' });
        if (!response.ok) throw new Error('catalog_unavailable');
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== 'object' || !('materials' in payload) || !Array.isArray(payload.materials)) {
          throw new Error('catalog_invalid');
        }
        const items = payload.materials.filter((item): item is ReadyMaterial =>
          Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.title === 'string'));
        setSnapshot({ userId, materials: items, loadedAt: Date.now() });
      } catch {
        setErrorId(userId);
      } finally {
        setLoadingId(null);
      }
    })();
    inFlight.current = { userId, promise: task };
    try { await task; } finally { if (inFlight.current?.promise === task) inFlight.current = null; }
  }, [userId]);

  const ensureFresh = useCallback(() => {
    // Do not request a catalog on every private page. Refresh only a catalog
    // already used by the session; screens needing it trigger their own load.
    if (snapshotRef.current?.userId === userId) void refresh(false);
  }, [refresh, userId]);
  useEffect(() => {
    if (!userId) return;
    const onFocus = () => ensureFresh();
    const onCatalogChanged = () => { void refresh(true); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('evaluo:materials-changed', onCatalogChanged);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('evaluo:materials-changed', onCatalogChanged);
    };
  }, [userId, ensureFresh, refresh]);

  useEffect(() => {
    // Navigation into Practicar revalidates silently so uploads and newly-ready
    // documents appear, while the cached cards remain immediately visible.
    if (pathname === '/dashboard/practicar' && snapshotRef.current?.userId === userId) {
      void refresh(true);
    }
  }, [pathname, userId, refresh]);

  const seed = useCallback((materials: ReadyMaterial[]) => {
    if (!userId) return;
    setSnapshot({ userId, materials, loadedAt: Date.now() });
    setErrorId(null);
  }, [userId]);

  const materials = userId && snapshot?.userId === userId ? snapshot.materials : null;
  const value = useMemo<CatalogContextValue>(() => ({
    materials, loading: Boolean(userId && loadingId === userId), error: Boolean(userId && errorId === userId),
    refresh: () => refresh(true), seed,
  }), [materials, userId, loadingId, errorId, refresh, seed]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useMaterialCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useMaterialCatalog must be used within MaterialCatalogProvider');
  return context;
}

/** Seed the shared catalog from an existing server-rendered page without an extra request. */
export function MaterialCatalogSeed({ materials }: { materials: ReadyMaterial[] }) {
  const { seed } = useMaterialCatalog();
  useEffect(() => { seed(materials); }, [seed, materials]);
  return null;
}
