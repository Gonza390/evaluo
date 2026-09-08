'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPremiumStatus } from '@/lib/actions/premium';
import { useUser } from '@/hooks/useUser';

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
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(true);
  const calendarIsFree = pathname === '/calendario';

  useEffect(() => {
    let active = true;

    // El calendario es una herramienta de retención para todos los usuarios.
    // Dentro de esta ruta tratamos las capacidades antes gated (eventos y
    // recordatorios) como incluidas en Free, sin alterar el estado de suscripción
    // en el resto del producto.
    if (calendarIsFree) {
      setIsPremium(true);
      setPremiumLoading(false);
      return;
    }

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
  }, [calendarIsFree, loading, user]);

  return { isPremium, premiumLoading };
}
