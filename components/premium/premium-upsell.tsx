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
          title: 'Conectá los temas de este PDF de un vistazo',
          description:
            'Visualizá los conceptos clave y cómo se relacionan para repasar más rápido y detectar qué temas necesitás reforzar.',
        }
      : { title, description };

  return (
    <section className="border-y border-slate-200 py-6 text-left">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-bold text-slate-950">
            {contextualCopy.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {contextualCopy.description}
          </p>
        </div>
      </div>

      {features && features.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        onClick={handleUpgrade}
        className="mt-5 h-10 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-none transition hover:bg-blue-700"
      >
        Ver Premium
      </Button>
    </section>
  );
}
