'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

type ReferralOfferCode = 'monthly' | 'semester';

type AppliedReferral = {
  code: string;
  discountPercent: number;
  brandName: string;
  partnerName: string;
  baseAmountArs: number;
  discountAmountArs: number;
  amountArs: number;
  attributed: boolean;
};

type ManualReferralCodeProps = {
  offerCode: ReferralOfferCode;
  variant?: 'default' | 'compact';
  hideHeading?: boolean;
};

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function referralError(error: string | undefined, offerCode: ReferralOfferCode, english: boolean) {
  const tr=(es:string,en:string)=>english?en:es;
  if (error === 'invalid_referral_code') return tr("Ingresá un código válido.","Enter a valid code.");
  if (error === 'referral_code_not_applicable') {
    return english ? `This code does not apply to the ${offerCode === 'semester' ? '6-month' : 'monthly'} plan.` : `Este código no aplica al plan ${offerCode === 'semester' ? 'de 6 meses' : 'mensual'}.`;
  }
  if (error === 'referral_already_attributed') {
    return tr("Tu cuenta ya está asociada a otro código de referido.","Your account is already linked to another referral code.");
  }
  if (error === 'referral_code_limit_reached') return tr("Este código alcanzó su límite de usos.","This code has reached its usage limit.");
  if (error === 'rate_limited') return tr("Probaste varios códigos. Esperá unos minutos e intentá de nuevo.","Too many attempts. Please wait a few minutes and try again.");
  if (error === 'referral_service_unavailable') {
    return tr("No pudimos validar el código ahora. Intentá nuevamente en unos minutos.","We could not validate your code. Please try again shortly.");
  }
  return tr("El código no existe, venció o está pausado.","This code is invalid, expired or paused.");
}

export function ManualReferralCode({
  offerCode,
  variant = 'default',
  hideHeading = false,
}: ManualReferralCodeProps) {
  const english = useOptionalAppLocale() === 'en';
  const tr = (es:string,en:string)=>english?en:es;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedReferral | null>(null);
  const compact = variant === 'compact';

  useEffect(() => {
    setApplied(null);
    setError(null);
  }, [offerCode]);

  async function applyCode() {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError(tr('Ingresá tu código de descuento.','Enter your discount code.'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, offerCode }),
      });
      const payload = (await response.json()) as Partial<AppliedReferral> & { error?: string };
      if (!response.ok || !payload.code) {
        setApplied(null);
        setError(referralError(payload.error, offerCode, english));
        return;
      }

      const nextApplied: AppliedReferral = {
        code: String(payload.code),
        discountPercent: Number(payload.discountPercent ?? 0),
        brandName: String(payload.brandName ?? ''),
        partnerName: String(payload.partnerName ?? ''),
        baseAmountArs: Number(payload.baseAmountArs ?? 0),
        discountAmountArs: Number(payload.discountAmountArs ?? 0),
        amountArs: Number(payload.amountArs ?? 0),
        attributed: Boolean(payload.attributed),
      };
      setCode(nextApplied.code);
      setApplied(nextApplied);
      trackMarketingEvent('referral_code_applied', {
        referral_code: nextApplied.code,
        offer_code: offerCode,
        discount_percent: nextApplied.discountPercent,
      });
    } catch {
      setApplied(null);
      setError(tr('No pudimos validar el código ahora. Intentá nuevamente en unos minutos.','We could not validate your code. Please try again shortly.'))
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div className={hideHeading ? "w-full text-left" : "w-full border-t border-slate-200 pt-3 text-left"}>
        {!hideHeading ? <div className="flex items-center gap-2 text-etiqueta font-semibold text-slate-600 sm:text-chico">
          <Tag className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          {tr('¿Tenés un código de descuento?','Have a discount code?')}
        </div> : null}

        <div className={hideHeading ? "flex gap-2" : "mt-2 flex gap-2"}>
          <Input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32));
              setApplied(null);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void applyCode();
              }
            }}
            placeholder={hideHeading ? tr("Código","Code") : tr("Ej. MARCA20","e.g. BRAND20")}
            autoComplete="off"
            spellCheck={false}
            className="h-10 min-w-0 rounded-xl bg-white text-chico font-medium uppercase tracking-etiqueta sm:text-cuerpo"
            aria-label={tr("Código de descuento","Discount code")}
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 rounded-xl px-4 text-chico sm:text-cuerpo"
            onClick={() => void applyCode()}
            loading={loading}
            disabled={!code.trim()}
          >
            {tr('Aplicar','Apply')}
          </Button>
        </div>

        {applied ? (
          <div className="mt-2 flex items-start gap-2 text-etiqueta leading-4 text-emerald-700 sm:text-chico">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-semibold">
                {applied.code} · {applied.discountPercent}% {tr('aplicado','applied')}.
              </span>{' '}
              {tr('Total','Total')} {offerCode === 'semester' ? tr('por 6 meses','for 6 months') : tr('mensual','monthly')}:{' '}
              <span className="font-semibold">{currency.format(applied.amountArs)}</span> · {tr('ahorrás','you save')}{' '}
              {currency.format(applied.discountAmountArs)}.
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-2 text-etiqueta leading-4 text-rose-600 sm:text-chico">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto mb-7 max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="flex items-center gap-2 text-cuerpo font-semibold text-slate-900">
          <Tag className="h-4 w-4 text-blue-600" aria-hidden="true" />
          {tr('¿Tenés un código de descuento?','Have a discount code?')}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32));
              setApplied(null);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void applyCode();
              }
            }}
            placeholder={tr("Ej. MARCA20","e.g. BRAND20")}
            autoComplete="off"
            spellCheck={false}
            className="h-11 rounded-xl bg-white font-medium uppercase tracking-etiqueta"
            aria-label={tr("Código de descuento","Discount code")}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-5"
            onClick={() => void applyCode()}
            loading={loading}
            disabled={!code.trim()}
          >
            {tr('Aplicar','Apply')}
          </Button>
        </div>

        {applied ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3 py-3 text-cuerpo">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-emerald-900">
                {applied.code} · {applied.discountPercent}% {tr('de descuento','off')}
              </p>
              <p className="mt-0.5 text-chico leading-5 text-emerald-800">
                {applied.brandName ? `${applied.brandName} · ` : ''}
                {offerCode === 'semester' ? tr('Total por 6 meses','Total for 6 months') : tr('Total mensual','Monthly total')}:{' '}
                <span className="font-semibold">{currency.format(applied.amountArs)}</span>
                {' · '}{tr('Ahorrás','You save')} {currency.format(applied.discountAmountArs)}.
              </p>
              <p className="mt-0.5 text-etiqueta leading-4 text-emerald-700">
                {tr('El descuento y la disponibilidad se vuelven a confirmar al iniciar el pago.','Discount and availability are verified again at checkout.')}
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-2 text-chico leading-5 text-rose-600">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
