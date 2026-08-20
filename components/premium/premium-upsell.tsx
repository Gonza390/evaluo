'use client';

import { useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

interface PremiumUpsellProps {
  title: string;
  description: string;
  source: string;
  features?: string[];
  ctaLabel?: string;
  materiaId?: string | null;
}

export function PremiumUpsell({
  title,
  description,
  source,
  features,
  ctaLabel = 'Quiero pasarme a Premium',
  materiaId,
}: PremiumUpsellProps) {
  useEffect(() => {
    trackMarketingEvent('premium_gate_viewed', {
      source,
      materia_id: materiaId ?? undefined,
    });
  }, [materiaId, source]);

  const handleUpgrade = () => {
    trackMarketingEvent('premium_cta_clicked', {
      source,
      materia_id: materiaId ?? undefined,
    });
    const params = new URLSearchParams({ source });
    if (materiaId) params.set('materia', materiaId);
    window.location.assign(`/pricing?${params.toString()}#elegir-plan`);
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 text-left shadow-[0_16px_40px_rgba(79,70,229,0.10)]">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      {features && features.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        onClick={handleUpgrade}
        className="mt-4 h-10 w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.26)] transition hover:opacity-95"
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
