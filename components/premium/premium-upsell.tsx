'use client';

import { useCallback, useEffect } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
import { StudyStatePanel } from '@/components/study-state-panel';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { premiumDashboardHref } from '@/lib/premium-flow';

interface PremiumUpsellProps {
  title: string;
  description: string;
  source: string;
  features?: string[];
  ctaLabel?: string;
  materiaId?: string | null;
  parcial?: number;
}

export function PremiumUpsell({
  title,
  description,
  source,
  features,
  ctaLabel = 'Ver Premium',
  materiaId,
  parcial,
}: PremiumUpsellProps) {
  const currentReturnTo = useCallback(() => {
    const url = new URL(window.location.href);
    if (source === 'material_mapa_mental') {
      url.searchParams.set('tab', 'mapa');
    }
    return `${url.pathname}${url.search}${url.hash}`;
  }, [source]);

  useEffect(() => {
    trackMarketingEvent('premium_gate_viewed', {
      source,
      materia_id: materiaId ?? undefined,
    });
    // Nunca redirigir automáticamente a una venta: el alumno decide
    // si quiere abrir Premium desde la actividad que estaba estudiando.
  }, [source, materiaId]);

  const handleUpgrade = () => {
    trackMarketingEvent('premium_cta_clicked', {
      source,
      materia_id: materiaId ?? undefined,
    });

    window.location.assign(premiumDashboardHref({
      source, materiaId, parcial, returnTo: currentReturnTo(),
    }));
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
    <StudyStatePanel
      icon={Sparkles}
      tone="premium"
      eyebrow="Función Premium"
      title={contextualCopy.title}
      description={contextualCopy.description}
      primaryActionLabel={ctaLabel}
      onPrimaryAction={handleUpgrade}
      secondaryText="Mirá los beneficios y elegí el plan que mejor te quede."
      className="min-h-[440px] w-full sm:min-h-[500px]"
    >
      {features && features.length > 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 text-left">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.1em] text-blue-700 uppercase">
            <Crown className="h-3.5 w-3.5" />
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
    </StudyStatePanel>
  );
}
