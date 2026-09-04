'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

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
};

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function referralError(error: string | undefined, offerCode: ReferralOfferCode) {
  if (error === 'invalid_referral_code') return 'Ingresá un código válido.';
  if (error === 'referral_code_not_applicable') {
    return `Este código no aplica al plan ${offerCode === 'semester' ? 'de 6 meses' : 'mensual'}.`;
  }
  if (error === 'referral_already_attributed') {
    return 'Tu cuenta ya está asociada a otro código de referido.';
  }
  if (error === 'referral_code_limit_reached') return 'Este código alcanzó su límite de usos.';
  if (error === 'rate_limited') return 'Probaste varios códigos. Esperá unos minutos e intentá de nuevo.';
  if (error === 'referral_service_unavailable') {
    return 'No pudimos validar el código ahora. Intentá nuevamente en unos minutos.';
  }
  return 'El código no existe, venció o está pausado.';
}

export function ManualReferralCode({ offerCode }: ManualReferralCodeProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedReferral | null>(null);

  useEffect(() => {
    setApplied(null);
    setError(null);
  }, [offerCode]);

  async function applyCode() {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError('Ingresá tu código de descuento.');
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
        setError(referralError(payload.error, offerCode));
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
      setError('No pudimos validar el código ahora. Intentá nuevamente en unos minutos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mb-7 max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Tag className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          ¿Tenés un código de descuento?
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
            placeholder="Ej. MARCA20"
            autoComplete="off"
            spellCheck={false}
            className="h-11 rounded-xl bg-white font-medium uppercase tracking-wide"
            aria-label="Código de descuento"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-5"
            onClick={() => void applyCode()}
            loading={loading}
            disabled={!code.trim()}
          >
            Aplicar
          </Button>
        </div>

        {applied ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3 py-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-emerald-900">
                {applied.code} · {applied.discountPercent}% de descuento
              </p>
              <p className="mt-0.5 text-xs leading-5 text-emerald-800">
                {applied.brandName ? `${applied.brandName} · ` : ''}
                {offerCode === 'semester' ? 'Total por 6 meses' : 'Total mensual'}:{' '}
                <span className="font-bold">{currency.format(applied.amountArs)}</span>
                {' · '}Ahorrás {currency.format(applied.discountAmountArs)}.
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-emerald-700">
                El descuento y la disponibilidad se vuelven a confirmar al iniciar el pago.
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-2 text-xs leading-5 text-rose-600">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
