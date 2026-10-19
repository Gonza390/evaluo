'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getPremiumStatus } from '@/lib/actions/premium';
import { useUser } from '@/hooks/useUser';

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
const premiumCache = new Map<string, boolean>();
const inFlightByUser = new Map<string, Promise<boolean>>();

function resolvePremium(userId: string): Promise<boolean> {
  const cached = premiumCache.get(userId);
  if (cached !== undefined) return Promise.resolve(cached);

  const inFlight = inFlightByUser.get(userId);
  if (inFlight) return inFlight;

  const promise = getPremiumStatus()
    .then((result) => {
      if (premiumCache.size >= PREMIUM_CACHE_MAX) {
        const oldestKey = premiumCache.keys().next().value;
        if (typeof oldestKey === 'string') premiumCache.delete(oldestKey);
      }
      premiumCache.set(userId, result.isPremium);
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

  useEffect(() => {
    let active = true;

    if (loading) return;

    if (!user) {
      setIsPremium(false);
      setPremiumLoading(false);
      return;
    }

    setPremiumLoading(true);
    void resolvePremium(user.id)
      .then((result) => {
        if (!active) return;
        setIsPremium(result);
      })
      .finally(() => {
        if (active) setPremiumLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loading, user]);

  return {
    isPremium: premiumAccessOverride || isPremium,
    premiumLoading: premiumAccessOverride ? false : premiumLoading,
  };
}
