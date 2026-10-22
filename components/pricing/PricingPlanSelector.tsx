'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck } from 'lucide-react';
import { ManualReferralCode } from '@/components/pricing/ManualReferralCode';
import { PaymentCheckoutCard } from '@/components/pricing/PaymentCheckoutCard';


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
  // Las tres alternativas están visibles. El único selector pendiente es para
  // validar a qué modalidad Premium corresponde un código de referido.
  const [referralPlan, setReferralPlan] = useState<BillingMode>('monthly');

  return (
    <>
      <div className="mx-auto grid max-w-6xl items-stretch gap-5 lg:auto-rows-fr lg:grid-cols-3 lg:gap-6">
        <article className="flex h-full min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 min-[360px]:p-6 sm:p-8">
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
              Subí tus apuntes, practicá y reforzá tus errores. Ideal para empezar a estudiar con Evaluo.
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
              href="/estudiar-pdf-con-ia"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Empezá gratis con tu PDF
            </Link>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-slate-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              Sin tarjeta · Empezá gratis
            </p>
          </div>
        </article>

        <div className="h-full min-w-0 [&>article]:h-full">
          <PaymentCheckoutCard
            features={premiumFeatures}
            source={source}
            materiaId={materiaId}
            offerCode="monthly"
            featured
          />
        </div>

        <div className="h-full min-w-0 [&>article]:h-full">
          <PaymentCheckoutCard
            features={premiumFeatures}
            source={source}
            materiaId={materiaId}
            offerCode="semester"
          />
        </div>
      </div>

      <details className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-center text-sm font-semibold text-slate-700">
          ¿Tenés un código de descuento?
        </summary>
        <div className="mt-4">
          <div className="mb-3 flex justify-center gap-2" aria-label="Plan para aplicar el código">
            <button
              type="button"
              aria-pressed={referralPlan === 'monthly'}
              onClick={() => setReferralPlan('monthly')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${referralPlan === 'monthly' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Mensual
            </button>
            <button
              type="button"
              aria-pressed={referralPlan === 'semester'}
              onClick={() => setReferralPlan('semester')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${referralPlan === 'semester' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              6 meses
            </button>
          </div>
          <ManualReferralCode offerCode={referralPlan} variant="compact" />
        </div>
      </details>
    </>
  );
}
