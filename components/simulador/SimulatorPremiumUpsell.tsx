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
    <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
      <p className="text-sm font-semibold text-indigo-900">
        ¿Quieres ver explicaciones de todas tus respuestas incorrectas?
      </p>
      <p className="mt-1 text-xs text-indigo-800">
        Pásate a Premium y desbloquea la corrección completa de todas tus respuestas incorrectas, con recomendaciones personalizadas para subir tu nota más rápido.
      </p>
      <Button
        className="mt-3 h-8 rounded-lg bg-indigo-600 px-3 text-xs font-semibold hover:bg-indigo-700"
        onClick={onUpgrade}
      >
        Quiero pasarme a Premium
      </Button>
      <p className="mt-2 text-[11px] text-indigo-700">
        Ahorro inteligente: {cacheHits} explicaciones reutilizadas y {generatedCount} nuevas en este intento.
      </p>
    </div>
  );
}
