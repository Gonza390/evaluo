'use client';

import { useEffect } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
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

  const contextualCopy =
    source === 'material_mapa_mental'
      ? {
          title: 'Mapa mental',
          description:
            'Conectá los temas y conceptos clave de este PDF para repasar más rápido y detectar qué necesitás reforzar.',
        }
      : { title, description };

  return (
    <section className="flex min-h-[440px] w-full items-center justify-center px-4 py-10 text-center sm:min-h-[500px] sm:px-6">
      <div className="w-full max-w-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm">
          <Sparkles className="h-6 w-6" />
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-blue-700 uppercase">
          <Crown className="h-3.5 w-3.5" />
          Función Premium
        </div>

        <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.8rem]">
          {contextualCopy.title}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-[15px]">
          {contextualCopy.description}
        </p>

        {features && features.length > 0 ? (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left">
            <p className="text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">
              Con Premium desbloqueás
            </p>
            <ul className="mt-3 space-y-2.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button
          onClick={handleUpgrade}
          className="mt-6 h-11 w-full max-w-sm rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-none transition hover:bg-blue-700"
        >
          Ver Premium
        </Button>

        <p className="mt-3 text-xs leading-5 text-slate-400">
          Mirá los beneficios y elegí el plan que mejor te quede.
        </p>
      </div>
    </section>
  );
}
