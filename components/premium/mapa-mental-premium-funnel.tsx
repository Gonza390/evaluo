'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  Circle,
  Crown,
  Lightbulb,
  Loader2,
  Map,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { ManualReferralCode } from '@/components/pricing/ManualReferralCode';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import {
  PREMIUM_MONTHLY_PRICE_ARS,
  PREMIUM_SEMESTER_PRICE_ARS,
  semesterEquivalentMonthlyPrice,
  semesterSavingsPercent,
} from '@/lib/payments/offers';

type BillingMode = 'monthly' | 'semester';
type FunnelStep = 1 | 2 | 3;

type MapaMentalPremiumFunnelProps = {
  initialStep?: FunnelStep;
  initialBillingMode?: BillingMode;
  materiaId?: string;
  returnTo?: string;
};

const SOURCE = 'material_mapa_mental';
const DISMISS_KEY = 'evaluo:mapa-mental-premium-dismissed-once';
const SLIDE_MS = 460;

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const benefitCards = [
  {
    icon: Map,
    title: 'Mapas mentales',
    description: 'Conectá los conceptos del material.',
  },
  {
    icon: Target,
    title: 'Práctica según tus errores',
    description: 'Reforzá los temas que más te cuestan.',
  },
  {
    icon: BrainCircuit,
    title: 'Simuladores completos',
    description: 'Practicá como si estuvieras rindiendo.',
  },
  {
    icon: Lightbulb,
    title: 'Explicaciones sin límite',
    description: 'Entendé por qué una respuesta está bien o mal.',
  },
] as const;

const comparisonRows = [
  'Mapas mentales',
  'Simuladores completos',
  'Explicaciones sin límite',
  'Práctica según tus errores',
  'Seguimiento por tema',
  'Nuevas funciones exclusivas',
] as const;

function StepBadge({ step }: { step: FunnelStep }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Paso ${step} de 3`}>
      {[1, 2, 3].map((item) => (
        <span
          key={item}
          className={`h-1 rounded-full transition-all duration-300 ${
            item === step ? 'w-7 bg-indigo-600' : item < step ? 'w-3 bg-indigo-300' : 'w-3 bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

function FeatureStatus({
  enabled,
  premium,
  index,
}: {
  enabled: boolean;
  premium?: boolean;
  index: number;
}) {
  const delay = premium ? 560 + index * 105 : 280 + index * 75;

  return (
    <span
      className={`premium-compare-mark mx-auto flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8 ${
        enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'
      }`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={enabled ? 'Incluido' : 'No incluido'}
    >
      {enabled ? (
        <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.8} aria-hidden="true" />
      ) : (
        <X className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} aria-hidden="true" />
      )}
    </span>
  );
}

export function MapaMentalPremiumFunnel({
  initialStep = 1,
  initialBillingMode = 'semester',
  materiaId,
  returnTo,
}: MapaMentalPremiumFunnelProps) {
  const router = useRouter();
  const [step, setStep] = useState<FunnelStep>(initialStep);
  const [incomingStep, setIncomingStep] = useState<FunnelStep | null>(null);
  const [billingMode, setBillingMode] = useState<BillingMode>(initialBillingMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transitionTimer = useRef<number | null>(null);

  const semesterMonthlyPrice = semesterEquivalentMonthlyPrice();
  const savingsPercent = semesterSavingsPercent();
  const selectedPrice = billingMode === 'semester' ? semesterMonthlyPrice : PREMIUM_MONTHLY_PRICE_ARS;
  const visibleStep = incomingStep ?? step;

  const flowSource = useMemo(() => `${SOURCE}:funnel_step_${step}`, [step]);

  useEffect(() => {
    trackMarketingEvent('premium_preview_viewed', {
      source: flowSource,
      materia_id: materiaId,
      funnel_step: step,
    });
  }, [flowSource, materiaId, step]);

  useEffect(
    () => () => {
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }
    },
    []
  );

  function continueTo(nextStep: FunnelStep) {
    if (incomingStep !== null) return;

    trackMarketingEvent(step === 1 ? 'premium_cta_clicked' : 'premium_preview_interacted', {
      source: `${SOURCE}:funnel`,
      materia_id: materiaId,
      funnel_step: step,
      next_step: nextStep,
    });

    setError(null);
    setIncomingStep(nextStep);
    transitionTimer.current = window.setTimeout(() => {
      setStep(nextStep);
      setIncomingStep(null);
      transitionTimer.current = null;
    }, SLIDE_MS);
  }

  function selectBillingMode(mode: BillingMode) {
    if (billingMode === mode) return;
    setBillingMode(mode);
    setError(null);
    trackMarketingEvent('premium_preview_interacted', {
      source: `${SOURCE}:billing_toggle`,
      materia_id: materiaId,
      offer_code: mode,
      funnel_step: 3,
    });
  }

  function closeFlow() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // El cierre sigue funcionando aunque sessionStorage no esté disponible.
    }

    trackMarketingEvent('premium_preview_interacted', {
      source: `${SOURCE}:funnel_close`,
      materia_id: materiaId,
      funnel_step: visibleStep,
    });

    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/explorar');
  }

  async function startCheckout() {
    const offerCode = billingMode;
    trackMarketingEvent('premium_checkout_clicked', {
      source: `${SOURCE}:funnel:${offerCode}`,
      materia_id: materiaId,
      plan_context: 'premium',
      offer_code: offerCode,
      billing_mode: offerCode === 'semester' ? 'fixed_term' : 'recurring',
      displayed_amount_ars: selectedPrice,
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
          source: SOURCE,
          materiaId,
          planContext: 'premium',
          offerCode,
          returnTo,
        }),
      });

      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (response.status === 401) {
        checkoutWindow?.close();
        const nextParams = new URLSearchParams({ step: '3', mode: offerCode });
        if (materiaId) nextParams.set('materia', materiaId);
        if (returnTo) nextParams.set('returnTo', returnTo);
        const nextPath = `/premium/mapa-mental?${nextParams.toString()}`;
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
              ? 'Los cupos de la opción de 6 meses están ocupados. Podés elegir Premium mensual.'
              : 'Ya existe un acceso Premium para esta cuenta.'
        );
        setLoading(false);
        return;
      }

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || 'checkout_error');
      }

      const providerUrl = new URL(payload.checkoutUrl);
      const isMercadoPagoUrl =
        providerUrl.protocol === 'https:' &&
        (providerUrl.hostname === 'mercadopago.com' ||
          providerUrl.hostname.endsWith('.mercadopago.com') ||
          providerUrl.hostname === 'mercadopago.com.ar' ||
          providerUrl.hostname.endsWith('.mercadopago.com.ar'));

      if (!isMercadoPagoUrl) throw new Error('invalid_checkout_url');

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

  function renderStep(targetStep: FunnelStep) {
    if (targetStep === 1) {
      return (
        <section className="funnel-step funnel-step-one mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-start overflow-y-auto px-1 py-4 text-center sm:justify-center sm:py-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-indigo-600 shadow-[0_12px_32px_rgba(79,70,229,0.12)] sm:h-14 sm:w-14">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </div>

          <h1 className="mt-4 max-w-4xl text-[1.7rem] font-extrabold leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem] lg:text-[2.7rem]">
            El <span className="text-indigo-600">83%</span> de los estudiantes llega mejor preparado a sus parciales
          </h1>
          <p className="mx-auto mt-2.5 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
            Premium transforma lo que estudiás en práctica enfocada en lo que más necesitás reforzar.
          </p>

          <div className="benefit-grid mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {benefitCards.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article
                  key={benefit.title}
                  className="benefit-card flex min-h-[72px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.05)] sm:min-h-[90px] sm:gap-4 sm:p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 sm:h-12 sm:w-12">
                    <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold leading-4 text-slate-950 sm:text-sm">{benefit.title}</h2>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs">{benefit.description}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => continueTo(2)}
            disabled={incomingStep !== null}
            className="mt-5 inline-flex h-11 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-[0_6px_0_0_#4338CA] transition hover:bg-indigo-700 active:translate-y-0.5 active:shadow-[0_4px_0_0_#4338CA] disabled:pointer-events-none"
          >
            Continuar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      );
    }

    if (targetStep === 2) {
      return (
        <section className="funnel-step funnel-step-two mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-start overflow-y-auto px-1 pb-4 pt-3 text-center sm:pt-5">
          <div className="shrink-0">
            <h1 className="mx-auto max-w-3xl text-[1.55rem] font-extrabold leading-[1.06] tracking-[-0.045em] text-slate-950 sm:text-[2rem] lg:text-[2.15rem]">
              Todo lo que necesitás para preparar mejor tu parcial
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
              Mirá la diferencia entre estudiar gratis y preparar el parcial con Premium.
            </p>
          </div>

          <div className="comparison-card relative mt-4 w-full max-w-3xl rounded-[1.65rem] border border-slate-200 bg-white/95 p-2 shadow-[0_16px_44px_rgba(15,23,42,0.065)] sm:p-2.5">
            <div className="premium-column-shell pointer-events-none absolute bottom-2 right-2 top-2 w-[78px] overflow-hidden rounded-[1.35rem] border border-indigo-200 bg-[linear-gradient(180deg,rgba(238,242,255,0.98),rgba(255,255,255,0.99),rgba(238,242,255,0.98))] shadow-[0_12px_30px_rgba(79,70,229,0.11)] sm:bottom-2.5 sm:right-2.5 sm:top-2.5 sm:w-[128px] sm:rounded-[1.5rem]">
              <div className="premium-column-sheen absolute -left-1/2 h-16 w-[200%] rotate-[-12deg] bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.96),transparent)] opacity-80" />
            </div>

            <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_58px_78px] items-center px-3 pb-2 pt-1.5 sm:grid-cols-[minmax(0,1fr)_98px_128px] sm:px-4 sm:pb-2.5 sm:pt-2">
              <span aria-hidden="true" />
              <span className="text-center text-[10px] font-extrabold uppercase tracking-[0.07em] text-slate-400 sm:text-[11px]">
                Gratis
              </span>
              <span className="mx-auto inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-2 py-1 text-[8px] font-extrabold tracking-[0.04em] text-white shadow-sm sm:px-2.5 sm:py-1.5 sm:text-[9px]">
                <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />
                PREMIUM
              </span>
            </div>

            <div className="relative z-10 overflow-hidden rounded-[1.25rem] border border-slate-100 bg-white/72">
              {comparisonRows.map((feature, index) => (
                <div
                  key={feature}
                  className="comparison-row grid min-h-[43px] grid-cols-[minmax(0,1fr)_58px_78px] items-center border-b border-slate-100 px-3 py-1.5 text-left last:border-0 sm:min-h-[47px] sm:grid-cols-[minmax(0,1fr)_98px_128px] sm:px-4 sm:py-2"
                >
                  <span className="pr-2 text-[10.5px] font-semibold leading-4 text-slate-800 sm:text-xs sm:leading-5">
                    {feature}
                  </span>
                  <FeatureStatus enabled={false} index={index} />
                  <FeatureStatus enabled premium index={index} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => continueTo(3)}
            disabled={incomingStep !== null}
            className="mx-auto mt-4 inline-flex h-11 w-full max-w-md shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-[0_6px_0_0_#4338CA] transition hover:bg-indigo-700 active:translate-y-0.5 active:shadow-[0_4px_0_0_#4338CA] disabled:pointer-events-none"
          >
            Continuar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      );
    }

    return (
      <section className="funnel-step mx-auto flex h-full w-full max-w-4xl flex-col justify-start overflow-y-auto px-1 py-4 sm:justify-center sm:py-3">
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Crown className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-3xl lg:text-[2.25rem]">
            Elegí cómo querés Premium
          </h1>
          <p className="mx-auto mt-1.5 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
            El acceso Premium es el mismo. Sólo cambia cómo preferís pagarlo.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectBillingMode('semester')}
            className={`relative min-w-0 rounded-2xl border-2 p-3.5 text-left transition sm:p-4 ${
              billingMode === 'semester'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-[0_12px_35px_rgba(79,70,229,0.11)]'
                : 'border-slate-200 bg-white hover:border-indigo-200'
            }`}
            aria-pressed={billingMode === 'semester'}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-indigo-600 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-white sm:text-[9px]">
                  Recomendado
                </span>
                <h2 className="mt-2 text-sm font-bold text-slate-950 sm:text-base">6 meses</h2>
              </div>
              {billingMode === 'semester' ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white sm:h-6 sm:w-6">
                  <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </span>
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-300 sm:h-6 sm:w-6" />
              )}
            </div>

            <div className="mt-2.5 flex min-w-0 items-end gap-1">
              <span className="truncate text-[1.35rem] font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                {currency.format(semesterMonthlyPrice)}
              </span>
              <span className="pb-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">/mes</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-4 text-slate-600 sm:text-[11px]">
              {currency.format(PREMIUM_SEMESTER_PRICE_ARS)} total · un único pago · sin renovación automática.
            </p>
            <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 sm:text-[10px]">
              Ahorrás {savingsPercent}%
            </p>
          </button>

          <button
            type="button"
            onClick={() => selectBillingMode('monthly')}
            className={`min-w-0 rounded-2xl border-2 p-3.5 text-left transition sm:p-4 ${
              billingMode === 'monthly'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-[0_12px_35px_rgba(79,70,229,0.11)]'
                : 'border-slate-200 bg-white hover:border-indigo-200'
            }`}
            aria-pressed={billingMode === 'monthly'}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-slate-600 sm:text-[9px]">
                  Flexible
                </span>
                <h2 className="mt-2 text-sm font-bold text-slate-950 sm:text-base">Mensual</h2>
              </div>
              {billingMode === 'monthly' ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white sm:h-6 sm:w-6">
                  <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </span>
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-300 sm:h-6 sm:w-6" />
              )}
            </div>

            <div className="mt-2.5 flex min-w-0 items-end gap-1">
              <span className="truncate text-[1.35rem] font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                {currency.format(PREMIUM_MONTHLY_PRICE_ARS)}
              </span>
              <span className="pb-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">/mes</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-4 text-slate-600 sm:text-[11px]">
              Renovación mensual automática. Podés cancelar futuras renovaciones cuando quieras.
            </p>
          </button>
        </div>

        <div className="mx-auto mt-3 w-full max-w-md">
          <ManualReferralCode offerCode={billingMode} variant="compact" />
        </div>

        <div className="mx-auto mt-3 w-full max-w-md">
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-[0_6px_0_0_#4338CA] transition hover:bg-indigo-700 active:translate-y-0.5 active:shadow-[0_4px_0_0_#4338CA] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {loading ? 'Abriendo Mercado Pago…' : 'Pago seguro'}
          </button>

          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-500 sm:text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
            Mercado Pago · conexión segura
          </p>

          {error ? (
            <p role="alert" className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center text-[11px] text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <main className="premium-funnel-shell relative h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(199,210,254,0.5),transparent_34%),linear-gradient(180deg,#F8FAFF_0%,#FFFFFF_58%,#F8FAFC_100%)] text-slate-950">
      <style>{`
        @keyframes evaluoSlideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0.72; }
        }
        @keyframes evaluoSlideInRight {
          from { transform: translateX(100%); opacity: 0.72; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes evaluoCompareMarkPop {
          0% { opacity: 0; transform: scale(0.42) translateY(4px); }
          64% { opacity: 1; transform: scale(1.14) translateY(-1px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes evaluoColumnBreathe {
          0%, 100% { box-shadow: 0 12px 30px rgba(79,70,229,0.10); }
          50% { box-shadow: 0 16px 36px rgba(79,70,229,0.17); }
        }
        @keyframes evaluoColumnSheen {
          0% { transform: translateY(-150%) rotate(-12deg); opacity: 0; }
          28% { opacity: 0.7; }
          62% { opacity: 0.32; }
          100% { transform: translateY(620%) rotate(-12deg); opacity: 0; }
        }
        .premium-slide-out { animation: evaluoSlideOutLeft ${SLIDE_MS}ms cubic-bezier(.72,0,.22,1) both; }
        .premium-slide-in { animation: evaluoSlideInRight ${SLIDE_MS}ms cubic-bezier(.72,0,.22,1) both; }
        .premium-compare-mark { opacity: 0; animation: evaluoCompareMarkPop 400ms cubic-bezier(.2,.8,.2,1) forwards; }
        .premium-column-shell { animation: evaluoColumnBreathe 2.8s ease-in-out infinite; }
        .premium-column-sheen { animation: evaluoColumnSheen 3.4s ease-in-out 900ms infinite; }
        @media (max-height: 720px) and (min-width: 640px) {
          .premium-funnel-shell .funnel-step-one h1 { font-size: 1.85rem; }
          .premium-funnel-shell .benefit-grid { margin-top: 0.75rem; gap: 0.6rem; }
          .premium-funnel-shell .benefit-card { min-height: 66px; padding: 0.7rem; }
          .premium-funnel-shell .funnel-step-two { padding-top: 0.2rem; }
          .premium-funnel-shell .funnel-step-two h1 { font-size: 1.65rem; }
          .premium-funnel-shell .funnel-step-two .comparison-card { margin-top: 0.55rem; }
          .premium-funnel-shell .funnel-step-two .comparison-row { min-height: 38px; padding-top: 0.25rem; padding-bottom: 0.25rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .premium-slide-out, .premium-slide-in, .premium-compare-mark, .premium-column-shell, .premium-column-sheen {
            animation: none !important;
          }
          .premium-compare-mark { opacity: 1; }
        }
      `}</style>

      <div className="pointer-events-none absolute -left-24 top-24 h-56 w-56 rounded-full bg-blue-100/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-64 w-64 rounded-full bg-indigo-100/45 blur-3xl" />

      <div className="relative mx-auto flex h-[100svh] w-full max-w-[1180px] flex-col px-4 pb-3 pt-3 sm:px-7 sm:pb-4 sm:pt-4 lg:px-10">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-2.5 py-1.5 text-[10px] font-extrabold tracking-[0.08em] text-white shadow-sm sm:text-[11px]">
            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
            EVALUO PREMIUM
          </div>
          <button
            type="button"
            onClick={closeFlow}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Cerrar Premium"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5 shrink-0 sm:mt-3">
          <StepBadge step={visibleStep} />
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden overscroll-contain">
          <div className={`absolute inset-0 ${incomingStep !== null ? 'premium-slide-out' : ''}`}>
            {renderStep(step)}
          </div>
          {incomingStep !== null ? (
            <div className="premium-slide-in absolute inset-0">{renderStep(incomingStep)}</div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
