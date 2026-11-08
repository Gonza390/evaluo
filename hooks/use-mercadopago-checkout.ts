'use client';

import { useEffect, useMemo, useState } from 'react';
import { premiumPurchaseDisplayState } from '@/lib/payments/status';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import {
  PREMIUM_MONTHLY_PRICE_ARS,
  PREMIUM_MONTHLY_REFERENCE_PRICE_ARS,
  PREMIUM_RECOVERY_PRICE_ARS,
  semesterSavingsPercent,
  type PremiumOfferCode,
} from '@/lib/payments/offers';

/**
 * Lógica compartida del checkout de Mercado Pago (Argentina, ARS).
 * La usan la tarjeta clásica (`PaymentCheckoutCard`) y la página pública /pricing.
 * El servidor recalcula el importe: el cliente solo envía el precio que mostró
 * (`expectedBaseAmountArs`) para detectar cambios de precio.
 */

export type MercadoPagoOfferCode = Extract<PremiumOfferCode, 'monthly' | 'semester' | 'recovery'>;

export type PremiumOffer = {
  monthlyPriceArs: number;
  monthlyReferencePriceArs: number;
  semesterPriceArs: number;
  semesterEquivalentMonthlyArs: number;
  semesterSavingsPercent: number;
  semesterLimit: number;
  semesterSold: number;
  semesterReserved: number;
  semesterRemaining: number | null;
  semesterAvailable: boolean;
};

export type PremiumSubscriptionDisplayStatus =
  | 'loading'
  | 'active'
  | 'attention'
  | 'inactive'
  | 'unavailable';

export const FALLBACK_OFFER: PremiumOffer = {
  monthlyPriceArs: PREMIUM_MONTHLY_PRICE_ARS,
  monthlyReferencePriceArs: PREMIUM_MONTHLY_REFERENCE_PRICE_ARS,
  semesterPriceArs: 45000,
  semesterEquivalentMonthlyArs: 7500,
  semesterSavingsPercent: semesterSavingsPercent(),
  semesterLimit: 50,
  semesterSold: 0,
  semesterReserved: 0,
  semesterRemaining: null,
  semesterAvailable: false,
};

export function normalizedOffer(payload: Partial<PremiumOffer>): PremiumOffer {
  const numberOr = (value: unknown, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  const remaining =
    payload.semesterRemaining == null
      ? null
      : numberOr(payload.semesterRemaining, FALLBACK_OFFER.semesterRemaining ?? 0);
  return {
    monthlyPriceArs: numberOr(payload.monthlyPriceArs, FALLBACK_OFFER.monthlyPriceArs),
    monthlyReferencePriceArs: numberOr(
      payload.monthlyReferencePriceArs,
      FALLBACK_OFFER.monthlyReferencePriceArs
    ),
    semesterPriceArs: numberOr(payload.semesterPriceArs, FALLBACK_OFFER.semesterPriceArs),
    semesterEquivalentMonthlyArs: numberOr(
      payload.semesterEquivalentMonthlyArs,
      FALLBACK_OFFER.semesterEquivalentMonthlyArs
    ),
    semesterSavingsPercent: numberOr(
      payload.semesterSavingsPercent,
      FALLBACK_OFFER.semesterSavingsPercent
    ),
    semesterLimit: numberOr(payload.semesterLimit, FALLBACK_OFFER.semesterLimit),
    semesterSold: numberOr(payload.semesterSold, 0),
    semesterReserved: numberOr(payload.semesterReserved, 0),
    semesterRemaining: remaining,
    semesterAvailable: Boolean(payload.semesterAvailable),
  };
}

type Options = {
  offerCode: MercadoPagoOfferCode;
  source: string;
  materiaId?: string;
  parcial?: number;
  returnTo?: string;
  english: boolean;
  /** Si es false, el hook no registra `premium_preview_viewed` (lo hace quien lo use). */
  trackPreview?: boolean;
};

export function useMercadoPagoCheckout({
  offerCode,
  source,
  materiaId,
  parcial,
  returnTo,
  english,
  trackPreview = true,
}: Options) {
  const tr = (es: string, en: string) => (english ? en : es);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [offer, setOffer] = useState<PremiumOffer | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<PremiumSubscriptionDisplayStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    void fetch('/api/payments/status', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return 'inactive';
        if (!response.ok) return 'unavailable';
        const payload = (await response.json()) as { plan?: string; status?: string };
        return premiumPurchaseDisplayState(payload);
      })
      .then((status) => {
        if (!cancelled) setSubscriptionStatus(status);
      })
      .catch(() => {
        if (!cancelled) setSubscriptionStatus('unavailable');
      });

    void fetch('/api/payments/offer', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return FALLBACK_OFFER;
        return normalizedOffer((await response.json()) as Partial<PremiumOffer>);
      })
      .then((nextOffer) => {
        if (!cancelled) setOffer(nextOffer);
      })
      .catch(() => {
        if (!cancelled) setOffer(FALLBACK_OFFER);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayedPrice = useMemo(() => {
    if (!offer) return null;
    if (offerCode === 'semester') return offer.semesterPriceArs;
    if (offerCode === 'recovery') return PREMIUM_RECOVERY_PRICE_ARS;
    return offer.monthlyPriceArs;
  }, [offer, offerCode]);

  useEffect(() => {
    if (!trackPreview || !offer || !displayedPrice || offerCode === 'recovery') return;
    trackMarketingEvent('premium_preview_viewed', {
      source: `${source}:${offerCode}`,
    });
  }, [displayedPrice, offer, offerCode, source, trackPreview]);

  const isSemester = offerCode === 'semester';
  const semesterSoldOut = isSemester && offer ? !offer.semesterAvailable : false;

  // Si cambia el plan elegido, los mensajes del intento anterior ya no aplican.
  useEffect(() => {
    setError(null);
    setCheckoutUrl(null);
  }, [offerCode]);

  async function startCheckout() {
    trackMarketingEvent('premium_checkout_clicked', {
      source: `${source}:${offerCode}`,
      materia_id: materiaId,
      plan_context: 'premium',
      offer_code: offerCode,
      billing_mode: isSemester ? 'fixed_term' : 'recurring',
      displayed_amount_ars: displayedPrice,
      semester_remaining: offer?.semesterRemaining ?? null,
    });
    setLoading(true);
    setError(null);
    const checkoutWindow = window.open(
      '/pricing/resultado?estado=preparando',
      'evaluo-mercadopago'
    );
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          materiaId,
          parcial,
          returnTo,
          planContext: 'premium',
          offerCode,
          expectedBaseAmountArs: displayedPrice,
        }),
      });
      const payload = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
        baseAmountArs?: number;
        amountArs?: number;
      };
      if (response.status === 401) {
        checkoutWindow?.close();
        const nextPath = `${window.location.pathname}${window.location.search}`;
        window.location.assign(
          `${english ? '/en/login' : '/login'}?mode=login&intent=premium&next=${encodeURIComponent(nextPath)}`
        );
        return;
      }
      if (response.status === 403) {
        checkoutWindow?.close();
        setError(
          tr(
            'Esta oferta ya no está disponible para esta cuenta.',
            'This offer is no longer available for this account.'
          )
        );
        setLoading(false);
        return;
      }
      if (response.status === 409) {
        checkoutWindow?.close();
        setError(
          payload.error === 'price_changed'
            ? tr(
                'El precio se actualizó. Recargá la página para ver el importe antes de continuar.',
                'The price changed. Reload to see the amount before continuing.'
              )
            : payload.error === 'checkout_in_progress'
              ? tr(
                  'Ya tenés un pago en curso. Completalo desde Mercado Pago o esperá unos minutos.',
                  'You have a payment in progress. Complete it in Mercado Pago or wait a few minutes.'
                )
              : payload.error === 'semester_sold_out'
                ? tr(
                    'Los 50 cupos de esta oferta ya están ocupados.',
                    'All 50 places in this offer are taken.'
                  )
                : tr(
                    'Ya existe un acceso Premium para esta cuenta. Revisalo desde Configuración.',
                    'This account already has Premium access. Check Settings.'
                  )
        );
        setLoading(false);
        return;
      }
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || 'checkout_error');
      if (
        payload.baseAmountArs !== displayedPrice ||
        !Number.isFinite(payload.amountArs) ||
        (payload.amountArs ?? 0) <= 0 ||
        (payload.amountArs ?? 0) > displayedPrice!
      ) {
        throw new Error('checkout_amount_mismatch');
      }
      const providerUrl = new URL(payload.checkoutUrl);
      const isMercadoPagoUrl =
        providerUrl.protocol === 'https:' &&
        (providerUrl.hostname === 'mercadopago.com' ||
          providerUrl.hostname.endsWith('.mercadopago.com') ||
          providerUrl.hostname === 'mercadopago.com.ar' ||
          providerUrl.hostname.endsWith('.mercadopago.com.ar'));
      if (!isMercadoPagoUrl) throw new Error('invalid_checkout_url');

      setCheckoutUrl(providerUrl.toString());
      setLoading(false);
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.opener = null;
        checkoutWindow.location.replace(providerUrl.toString());
      } else {
        window.location.assign(providerUrl.toString());
      }
    } catch {
      checkoutWindow?.close();
      setError(
        tr(
          'No pudimos abrir Mercado Pago. Intentá nuevamente en unos minutos.',
          'We could not open Mercado Pago. Please try again in a few minutes.'
        )
      );
      setLoading(false);
    }
  }

  const canStart =
    !loading &&
    subscriptionStatus !== 'loading' &&
    subscriptionStatus !== 'unavailable' &&
    Boolean(offer) &&
    !semesterSoldOut;

  return {
    offer,
    displayedPrice,
    subscriptionStatus,
    loading,
    error,
    checkoutUrl,
    semesterSoldOut,
    canStart,
    startCheckout,
  };
}
