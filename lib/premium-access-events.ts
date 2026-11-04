'use client';

/** Señal local para volver a consultar los permisos después de pagar o cancelar. */
export const PREMIUM_ACCESS_CHANGED_EVENT = 'evaluo:premium-access-changed';

export function notifyPremiumAccessChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PREMIUM_ACCESS_CHANGED_EVENT));
  }
}
