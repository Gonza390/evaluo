'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import type { PremiumOfferCode } from '@/lib/payments/offers';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

type PaymentCheckoutCardProps = {
  features: string[];
  source?: string;
  materiaId?: string;
  offerCode?: Extract<PremiumOfferCode, 'monthly' | 'semester' | 'recovery'>;
  featured?: boolean;
};

type PremiumOffer = {
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

const FALLBACK_OFFER: PremiumOffer = {
  monthlyPriceArs: 12990,
  monthlyReferencePriceArs: 15990,
  semesterPriceArs: 45000,
  semesterEquivalentMonthlyArs: 7500,
  semesterSavingsPercent: 42,
  semesterLimit: 50,
  semesterSold: 0,
  semesterReserved: 0,
  semesterRemaining: null,
  semesterAvailable: false,
};

function normalizedOffer(payload: Partial<PremiumOffer>): PremiumOffer {
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

export function PaymentCheckoutCard({
  features,
  source = 'pricing_direct',
  materiaId,
  offerCode = 'monthly',
  featured = false,
}: PaymentCheckoutCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [offer, setOffer] = useState<PremiumOffer | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    'loading' | 'active' | 'attention' | 'inactive'
  >('loading');

  useEffect(() => {
    let cancelled = false;

    void fetch('/api/payments/status', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return 'inactive';
        if (!response.ok) return 'inactive';
        const payload = (await response.json()) as { status?: string };
        if (['active', 'approved', 'authorized'].includes(payload.status ?? '')) return 'active';
        if (['past_due', 'paused'].includes(payload.status ?? '')) return 'attention';
        return 'inactive';
      })
      .then((status) => {
        if (!cancelled) setSubscriptionStatus(status);
      })
      .catch(() => {
        if (!cancelled) setSubscriptionStatus('inactive');
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
    if (offerCode === 'recovery') return 9990;
    return offer.monthlyPriceArs;
  }, [offer, offerCode]);

  useEffect(() => {
    if (!offer || !displayedPrice || offerCode === 'recovery') return;
    trackMarketingEvent('premium_preview_viewed', {
      source: `${source}:${offerCode}`,
    });
  }, [displayedPrice, offer, offerCode, source]);

  const isSemester = offerCode === 'semester';
  const isRecovery = offerCode === 'recovery';
  const semesterSoldOut = isSemester && offer ? !offer.semesterAvailable : false;
  const billingLabel = isSemester ? 'pago único' : '/mes';

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
        body: JSON.stringify({ source, materiaId, planContext: 'premium', offerCode }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (response.status === 401) {
        checkoutWindow?.close();
        const nextPath = `${window.location.pathname}${window.location.search}`;
        window.location.assign(
          `/login?mode=login&intent=premium&next=${encodeURIComponent(nextPath)}`
        );
        return;
      }
      if (response.status === 403) {
        checkoutWindow?.close();
        setError('Esta oferta ya no está disponible para esta cuenta.');
        setLoading(false);
        return;
      }
      if (response.status === 409) {
        checkoutWindow?.close();
        setError(
          payload.error === 'checkout_in_progress'
            ? 'Ya tenés un pago en curso. Completalo desde Mercado Pago o esperá unos minutos.'
            : payload.error === 'semester_sold_out'
              ? 'Los 50 cupos de esta oferta ya están ocupados.'
              : 'Ya existe un acceso Premium para esta cuenta. Revisalo desde Configuración.'
        );
        setLoading(false);
        return;
      }
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || 'checkout_error');
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
      setError('No pudimos abrir Mercado Pago. Intentá nuevamente en unos minutos.');
      setLoading(false);
    }
  }

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-3xl bg-white p-6 sm:p-8 ${
        featured
          ? 'border-2 border-indigo-300 shadow-xl shadow-indigo-100/60'
          : 'border border-slate-200'
      }`}
    >
      {featured && isSemester ? (
        <div className="absolute right-5 top-5 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Recomendado
        </div>
      ) : null}

      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          {isSemester ? 'Premium · 6 meses' : isRecovery ? 'Oferta especial' : 'Premium mensual'}
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
          {isSemester ? '6 meses de Premium' : 'Premium'}
        </h2>

        <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-4xl font-bold tracking-tight text-slate-950">
            {displayedPrice ? currency.format(displayedPrice) : 'Consultando…'}
          </span>
          {displayedPrice ? <span className="pb-1 text-sm text-slate-600">{billingLabel}</span> : null}
        </div>

        {offer && !isRecovery ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {isSemester ? (
              <>
                <span className="text-slate-500 line-through">
                  {currency.format(offer.monthlyPriceArs * 6)}
                </span>
                <span className="font-bold text-emerald-700">
                  Ahorrás {offer.semesterSavingsPercent}%
                </span>
              </>
            ) : offer.monthlyReferencePriceArs > offer.monthlyPriceArs ? (
              <>
                <span className="text-slate-500 line-through">
                  {currency.format(offer.monthlyReferencePriceArs)}
                </span>
                <span className="font-bold text-emerald-700">Precio de lanzamiento</span>
              </>
            ) : null}
          </div>
        ) : null}

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {!offer
            ? 'Verificando precio y disponibilidad.'
            : isSemester
              ? `Equivale a ${currency.format(offer.semesterEquivalentMonthlyArs)} por mes. Pagás una sola vez y tenés Premium durante 6 meses.`
              : isRecovery
                ? 'Precio especial mensual para retomar tu checkout de Premium.'
                : 'Renovación mensual automática. Podés cancelar futuras renovaciones cuando quieras.'}
        </p>

        {isSemester ? (
          <div className="mt-3 text-[11px] leading-4 text-indigo-800">
            <p className="font-bold">
              {offer?.semesterRemaining == null
                ? 'Verificando los 50 cupos…'
                : offer.semesterRemaining > 0
                  ? `${offer.semesterRemaining} de ${offer.semesterLimit} cupos disponibles ahora`
                  : 'Los 50 cupos están ocupados'}
            </p>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
              El cupo se descuenta con compras aprobadas y reservas de checkout recientes.
            </p>
          </div>
        ) : null}
      </div>

      {subscriptionStatus === 'active' ? (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-bold text-slate-950">Tu Premium está activo</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Ya tenés acceso a todas las funciones incluidas en este plan.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {subscriptionStatus === 'attention' ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Tu suscripción necesita atención</p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            Revisá el pago pendiente antes de intentar una nueva compra.
          </p>
        </div>
      ) : null}

      <ul className="mt-7 flex-1 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-800">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50">
              <Check className="h-3.5 w-3.5 text-indigo-700" aria-hidden="true" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {subscriptionStatus === 'active' ? (
          <Button asChild className="h-12 w-full rounded-xl text-sm font-semibold">
            <Link href="/dashboard">
              <Crown className="mr-2 h-4 w-4" />
              Usar mi Premium
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : subscriptionStatus === 'attention' ? (
          <Button asChild variant="outline" className="h-12 w-full rounded-xl text-sm font-semibold">
            <Link href="/configuracion">Revisar mi suscripción</Link>
          </Button>
        ) : (
          <Button
            className="h-12 w-full rounded-xl text-sm font-semibold"
            onClick={startCheckout}
            disabled={
              loading ||
              subscriptionStatus === 'loading' ||
              !offer ||
              semesterSoldOut
            }
          >
            {loading || subscriptionStatus === 'loading' || !offer ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {loading
              ? 'Abriendo Mercado Pago…'
              : subscriptionStatus === 'loading' || !offer
                ? 'Verificando tu plan…'
                : semesterSoldOut
                  ? 'Cupos agotados'
                  : isSemester
                    ? 'Elegir 6 meses'
                    : isRecovery
                      ? 'Retomar Premium por $9.990'
                      : 'Elegir Premium mensual'}
            {!loading && subscriptionStatus === 'inactive' && offer && !semesterSoldOut ? (
              <ArrowRight className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        )}

        {error ? (
          <p role="alert" className="mt-3 text-center text-xs text-red-600">
            {error}
          </p>
        ) : null}
        {checkoutUrl && !error ? (
          <div role="status" className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3 text-center">
            <p className="text-xs font-semibold text-slate-950">Mercado Pago está abierto</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-600">
              Si cerraste esa pestaña, podés volver a abrir el checkout desde acá.
            </p>
            <button
              type="button"
              onClick={() => window.open(checkoutUrl, 'evaluo-mercadopago')}
              className="mt-2 text-xs font-semibold text-indigo-700 underline-offset-4 hover:underline"
            >
              Volver a abrir Mercado Pago
            </button>
          </div>
        ) : null}

        <p className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-slate-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-700" />
          {isSemester
            ? 'Pago seguro con Mercado Pago · Sin renovación automática'
            : 'Pago seguro con Mercado Pago · Renovación mensual'}
        </p>
      </div>
    </article>
  );
}