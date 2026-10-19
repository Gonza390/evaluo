'use client';

import { Button } from '@/components/ui/button';

interface SimulatorPremiumUpsellProps {
  cacheHits: number;
  generatedCount: number;
  onUpgrade: () => void;
}

export function SimulatorPremiumUpsell({
  cacheHits,
  generatedCount,
  onUpgrade,
}: SimulatorPremiumUpsellProps) {
  return (
    <section className="mt-5 border-t border-slate-200 pt-4">
      <p className="text-sm font-semibold text-slate-950">
        ¿Querés ver explicaciones de todas tus respuestas incorrectas?
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Pasate a Premium y desbloqueá la corrección completa de todas tus respuestas incorrectas,
        con recomendaciones personalizadas para subir tu nota más rápido.
      </p>
      <Button
        className="mt-3 h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-none hover:bg-blue-700"
        onClick={onUpgrade}
      >
        Quiero pasarme a Premium
      </Button>
      <p className="mt-2 text-[12px] text-slate-500">
        Ahorro inteligente: {cacheHits} explicaciones reutilizadas y {generatedCount} nuevas en este intento.
      </p>
    </section>
  );
}
