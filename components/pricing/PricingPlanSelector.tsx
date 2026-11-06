'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck } from 'lucide-react';
import { ManualReferralCode } from '@/components/pricing/ManualReferralCode';
import { PaymentCheckoutCard } from '@/components/pricing/PaymentCheckoutCard';
import { CreemCheckoutCard } from '@/components/pricing/CreemCheckoutCard';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { useCheckoutMarket } from '@/hooks/use-checkout-market';


type BillingMode = 'monthly' | 'semester';

type PricingPlanSelectorProps = {
  locale?: 'es' | 'en';
  freeFeatures: string[];
  premiumFeatures: string[];
  source: string;
  materiaId?: string;
  parcial?: number;
  returnTo?: string;
};

export function PricingPlanSelector({
  freeFeatures,
  premiumFeatures,
  source,
  materiaId,
  parcial,
  returnTo,
  locale: forcedLocale,
}: PricingPlanSelectorProps) {
  const currentLocale = useOptionalAppLocale();
  const english = (forcedLocale ?? currentLocale) === 'en';
  const tr = (es: string, en: string) => english ? en : es;
  // Cada usuario ve únicamente los planes de su país. El selector local
  // se usa para aplicar el código de referido a mensual o semestral ARS.
  const [referralPlan, setReferralPlan] = useState<BillingMode>('monthly');
  const market = useCheckoutMarket();

  return (
    <>
      <div className={`mx-auto grid items-stretch gap-5 lg:auto-rows-fr lg:gap-6 ${market?.market === 'international' ? 'max-w-4xl lg:grid-cols-2' : 'max-w-6xl lg:grid-cols-3'}`}>
        <article className="flex h-full min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 min-[360px]:p-6 sm:p-8">
          <div>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              {tr("Gratis","Free")}
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{tr("Descubrí tu progreso","Discover your progress")}</h2>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight text-slate-950">$0</span>
              <span className="pb-1 text-sm text-slate-600">{tr("para siempre","forever")}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {tr("Empezá con tus apuntes, descubrí qué sabés y reconocé los temas que necesitás reforzar.","Start with your notes, find out what you know and identify topics to review.")}
            </p>
          </div>

          <ul className="mt-7 flex-1 space-y-4">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-800">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Check className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href={english ? "/en/login?mode=signup" : "/estudiar-pdf-con-ia"}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {tr("Empezá gratis con tu PDF","Start free with your PDF")}
            </Link>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-slate-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              {tr("Sin tarjeta · Empezá gratis","No card required · Start free")}
            </p>
          </div>
        </article>

        {market === null ? (
          <div className="flex min-h-[380px] items-center justify-center text-sm text-slate-600">{tr("Consultando precios para tu región…","Checking prices for your region…")}</div>
        ) : market.market === 'unknown' ? (
          <div role="alert" className="col-span-full rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm leading-6 text-amber-900">
            {tr('No pudimos confirmar tu país. Por seguridad no se mostrará una opción de pago hasta que podamos verificar tu región.', 'We could not confirm your country. Payment options remain unavailable until your region can be verified.')}
          </div>
        ) : market.market === 'international' ? (
          <CreemCheckoutCard locale={english ? "en" : "es"} features={premiumFeatures} mode="live" available={market.creemAvailable} />
        ) : (
          <>
        <div className="h-full min-w-0 [&>article]:h-full">
          <PaymentCheckoutCard
            features={premiumFeatures}
            source={source}
            materiaId={materiaId}
            parcial={parcial}
            returnTo={returnTo}
            offerCode="monthly"
            featured
            locale={english ? "en" : "es"}
          />
        </div>

        <div className="h-full min-w-0 [&>article]:h-full">
          <PaymentCheckoutCard
            features={premiumFeatures}
            source={source}
            materiaId={materiaId}
            parcial={parcial}
            returnTo={returnTo}
            offerCode="semester"
            locale={english ? "en" : "es"}
          />
        </div>
          </>
        )}
      </div>

      {market?.market === 'argentina' ? <details className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-center text-sm font-semibold text-slate-700">
          {tr("¿Tenés un código de descuento?","Have a discount code?")}
        </summary>
        <div className="mt-4">
          <div className="mb-3 flex justify-center gap-2" aria-label={tr("Plan para aplicar el código","Plan to apply discount code")}>
            <button
              type="button"
              aria-pressed={referralPlan === 'monthly'}
              onClick={() => setReferralPlan('monthly')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${referralPlan === 'monthly' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              {tr("Mensual","Monthly")}
            </button>
            <button
              type="button"
              aria-pressed={referralPlan === 'semester'}
              onClick={() => setReferralPlan('semester')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${referralPlan === 'semester' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              {tr("6 meses","6 months")}
            </button>
          </div>
          <ManualReferralCode offerCode={referralPlan} variant="compact" />
        </div>
      </details> : null}
    </>
  );
}
