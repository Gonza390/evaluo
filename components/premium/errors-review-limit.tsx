'use client';

import Link from 'next/link';
import { PremiumUpsell } from '@/components/premium/premium-upsell';

export function ErrorsReviewLimit({ materiaId }: { materiaId: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <PremiumUpsell
          title="Ya detectamos qué necesitás reforzar"
          description="Desbloqueá el repaso completo para entender estos errores, practicar los temas débiles y llegar al parcial con un plan claro."
          source="errores_review"
          materiaId={materiaId}
          features={[
            'Repasos de errores ilimitados',
            'Explicaciones IA en todas tus respuestas',
            'Recordatorios de parciales',
          ]}
          ctaLabel="Reforzar mis errores con Premium"
        />
        <div className="mt-4 text-center">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
