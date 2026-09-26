'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Crown, Loader2, Sparkles } from 'lucide-react';
import { StudyStatePanel } from '@/components/study-state-panel';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

interface PremiumUpsellProps {
  title: string;
  description: string;
  source: string;
  features?: string[];
  ctaLabel?: string;
  materiaId?: string | null;
  parcial?: number;
}

const PREMIUM_FLOWS: Record<string, { route: string; dismissKey: string }> = {
  material_mapa_mental: {
    route: '/premium/mapa-mental',
    dismissKey: 'evaluo:mapa-mental-premium-dismissed-once',
  },
  errores_review: {
    route: '/premium/errores',
    dismissKey: 'evaluo:errores-premium-dismissed-once',
  },
};

export function PremiumUpsell({
  title,
  description,
  source,
  features,
  ctaLabel = 'Ver Premium',
  materiaId,
  parcial,
}: PremiumUpsellProps) {
  const flow = PREMIUM_FLOWS[source] ?? null;
  const [flowDismissed, setFlowDismissed] = useState(false);

  const currentReturnTo = useCallback(() => {
    const url = new URL(window.location.href);
    if (source === 'material_mapa_mental') {
      url.searchParams.set('tab', 'mapa');
    }
    return `${url.pathname}${url.search}${url.hash}`;
  }, [source]);

  const openContextualFlow = useCallback(() => {
    if (!flow) return false;
    const params = new URLSearchParams();
    if (materiaId) params.set('materia', materiaId);
    if (parcial) params.set('parcial', String(parcial));
    params.set('returnTo', currentReturnTo());
    window.location.assign(`${flow.route}?${params.toString()}`);
    return true;
  }, [currentReturnTo, flow, materiaId, parcial]);

  useEffect(() => {
    trackMarketingEvent('premium_gate_viewed', {
      source,
      materia_id: materiaId ?? undefined,
    });

    if (!flow) return;

    try {
      const dismissedOnce = window.sessionStorage.getItem(flow.dismissKey) === '1';
      if (dismissedOnce) {
        window.sessionStorage.removeItem(flow.dismissKey);
        setFlowDismissed(true);
        return;
      }
    } catch {
      // El flujo puede abrirse aunque sessionStorage no esté disponible.
    }

    openContextualFlow();
  }, [flow, materiaId, openContextualFlow, source]);

  const handleUpgrade = () => {
    trackMarketingEvent('premium_cta_clicked', {
      source,
      materia_id: materiaId ?? undefined,
    });

    if (openContextualFlow()) return;

    const params = new URLSearchParams({ source });
    if (materiaId) params.set('materia', materiaId);
    window.location.assign(`/pricing?${params.toString()}#elegir-plan`);
  };

  if (flow && !flowDismissed) {
    return (
      <StudyStatePanel
        icon={Loader2}
        iconSpin
        tone="loading"
        eyebrow="Evaluo Premium"
        title="Abriendo Evaluo Premium…"
        description="Estamos preparando la experiencia Premium para esta función."
        className="min-h-[440px] w-full sm:min-h-[500px]"
      />
    );
  }

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
        <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4 text-left">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.1em] text-indigo-700 uppercase">
            <Crown className="h-3.5 w-3.5" />
            Con Premium desbloqueás
          </p>
          <ul className="mt-3 space-y-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </StudyStatePanel>
  );
}
