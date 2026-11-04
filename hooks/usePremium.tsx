'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getPremiumStatus } from '@/lib/actions/premium';
import { useUser } from '@/hooks/useUser';
import { PREMIUM_ACCESS_CHANGED_EVENT } from '@/lib/premium-access-events';

// Permite abrir features concretas en una sección sin alterar el estado real
// de la suscripción del usuario ni desbloquear Premium globalmente.
const PremiumAccessOverrideContext = createContext(false);

export function PremiumAccessOverrideProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  return (
    <PremiumAccessOverrideContext.Provider value={enabled}>
      {children}
    </PremiumAccessOverrideContext.Provider>
  );
}

// Caché compartida a nivel de módulo: evita un round-trip al servidor por cada
// consumidor de usePremium dentro de la misma sesión de página. La promesa se
// comparte por userId para que los montajes concurrentes hagan una sola llamada
// y no haya race conditions al cambiar de cuenta (logout → login con otra).
const PREMIUM_CACHE_MAX = 64;
const premiumCache = new Map<string, { value: boolean; storedAt: number }>();
const PREMIUM_CACHE_TTL_MS = 30_000;
const inFlightByUser = new Map<string, Promise<boolean>>();

function resolvePremium(userId: string): Promise<boolean> {
  const cached = premiumCache.get(userId);
  if (cached && Date.now() - cached.storedAt < PREMIUM_CACHE_TTL_MS) return Promise.resolve(cached.value);
  premiumCache.delete(userId);

  const inFlight = inFlightByUser.get(userId);
  if (inFlight) return inFlight;

  const promise = getPremiumStatus()
    .then((result) => {
      if (result.unavailable) throw new Error('premium_access_unavailable');
      if (premiumCache.size >= PREMIUM_CACHE_MAX) {
        const oldestKey = premiumCache.keys().next().value;
        if (typeof oldestKey === 'string') premiumCache.delete(oldestKey);
      }
      premiumCache.set(userId, {value: result.isPremium, storedAt: Date.now()});
      return result.isPremium;
    })
    .finally(() => {
      inFlightByUser.delete(userId);
    });

  inFlightByUser.set(userId, promise);
  return promise;
}

export function usePremium() {
  const premiumAccessOverride = useContext(PremiumAccessOverrideContext);
  const { user, loading } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(true);
  const [premiumUnavailable, setPremiumUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    if (loading) return;

    if (!user) {
      setIsPremium(false);
      setPremiumLoading(false);
      return;
    }

    setPremiumLoading(true);
    setPremiumUnavailable(false);
    void resolvePremium(user.id)
      .then((result) => {
        if (!active) return;
        setIsPremium(result);
        setPremiumUnavailable(false);
      })
      .catch(() => {
        // No reemplazar una suscripción previamente confirmada por Free ante
        // un fallo transitorio de red/Supabase.
        if (active) setPremiumUnavailable(true);
      })
      .finally(() => {
        if (active) setPremiumLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loading, user]);


  // La compra y la cancelación deben actualizar los controles ya montados.
  // Si se pagó en otra pestaña, al regresar también se revalida el permiso.
  useEffect(() => {
    if (loading || !user?.id) return;
    let alive = true;
    const userId = user.id;
    const refresh = () => {
      premiumCache.delete(userId);
      setPremiumLoading(true);
      void resolvePremium(userId)
        .then(value => {
          if (!alive) return;
          setIsPremium(value);
          setPremiumUnavailable(false);
        })
        .catch(() => {
          if (alive) setPremiumUnavailable(true);
        })
        .finally(() => {
          if (alive) setPremiumLoading(false);
        });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener(PREMIUM_ACCESS_CHANGED_EVENT, refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.removeEventListener(PREMIUM_ACCESS_CHANGED_EVENT, refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loading, user?.id]);

  return {
    isPremium: premiumAccessOverride || isPremium,
    premiumLoading: premiumAccessOverride ? false : premiumLoading,
    premiumUnavailable,
  };
}
