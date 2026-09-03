'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PaymentCheckoutCard } from '@/components/pricing/PaymentCheckoutCard';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type BillingMode = 'monthly' | 'semester';

type PricingPlanSelectorProps = {
  freeFeatures: string[];
  premiumFeatures: string[];
  source: string;
  materiaId?: string;
};

export function PricingPlanSelector({
  freeFeatures,
  premiumFeatures,
  source,
  materiaId,
}: PricingPlanSelectorProps) {
  const [billingMode, setBillingMode] = useState<BillingMode>('semester');

  function chooseBillingMode(nextMode: BillingMode) {
    if (nextMode === billingMode) return;
    setBillingMode(nextMode);
    trackMarketingEvent('premium_preview_interacted', {
      source: `${source}:billing_toggle`,
      offer_code: nextMode,
    });
  }

  return (
    <>
      <div
        className="mx-auto mb-8 flex w-fit rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm"
        role="tablist"
        aria-label="Modalidad de pago Premium"
      >
        <button
          type="button"
          role="tab"
          aria-selected={billingMode === 'monthly'}
          onClick={() => chooseBillingMode('monthly')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:px-6 ${
            billingMode === 'monthly'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          Mensual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={billingMode === 'semester'}
          onClick={() => chooseBillingMode('semester')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:px-6 ${
            billingMode === 'semester'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          6 meses
          <span
            className={`ml-2 hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline ${
              billingMode === 'semester'
                ? 'bg-white/15 text-white'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            Mejor precio
          </span>
        </button>
      </div>

      <div className="mx-auto grid max-w-5xl items-stretch gap-6 lg:auto-rows-fr lg:grid-cols-2">
        <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              Gratis
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">Empezá sin pagar</h2>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight text-slate-950">$0</span>
              <span className="pb-1 text-sm text-slate-600">para siempre</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Explorá materias, estudiá materiales compartidos y probá las herramientas básicas de Evaluo.
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

          <Link
            href="/explorar"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Seguir gratis
          </Link>
        </article>

        <div className="h-full [&>article]:h-full">
          <PaymentCheckoutCard
            features={premiumFeatures}
            source={source}
            materiaId={materiaId}
            offerCode={billingMode}
            featured
          />
        </div>
      </div>
    </>
  );
}
