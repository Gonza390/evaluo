'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Upload } from 'lucide-react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { premiumDashboardHref } from '@/lib/premium-flow';

/**
 * Límite del repaso de errores gratis (1 por semana) para el simulador SEO.
 * Onboarding etapa 3: dice cuándo vuelve el repaso, que los errores quedan
 * guardados, y ofrece Premium o estudiar esos temas con el apunte (gratis).
 */
function formatReviewDate(dateKey: string | null) {
  if (!dateKey) return null;
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

export function ErrorsReviewLimit({
  materiaId,
  parcial,
  materiaNombre,
  pendingCount,
  nextFreeReviewDate,
  hasReadyMaterial,
}: {
  materiaId: string;
  parcial: number;
  materiaNombre?: string | null;
  pendingCount?: number;
  nextFreeReviewDate?: string | null;
  hasReadyMaterial?: boolean;
}) {
  const source = 'errores_review';
  const nextDate = formatReviewDate(nextFreeReviewDate ?? null);
  const premiumHref = premiumDashboardHref({
    source,
    materiaId,
    parcial,
    returnTo: `/simulador/errores/${materiaId}?parcial=${parcial}`,
  });
  const uploadParams = new URLSearchParams({ openUpload: '1', materiaId, source: 'preguntero-exam-intent' });
  const materialHref = hasReadyMaterial ? '/dashboard/explicaciones' : `/dashboard?${uploadParams.toString()}`;

  useEffect(() => {
    trackMarketingEvent('premium_gate_viewed', { source, materia_id: materiaId });
  }, [materiaId]);

  return (
    <div data-errors-review-limit className="mx-auto flex min-h-[80vh] w-full max-w-[440px] flex-col px-6 py-4 text-[#0f1623]">
      <header className="flex h-14 items-center justify-between">
        <Link href={`/simulador/${materiaId}/${parcial}`} aria-label="Volver al simulador" className="-ml-2.5 flex size-11 items-center justify-center text-[#4b5565]">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <span className="truncate text-ui text-[#667085]">{materiaNombre ? `${materiaNombre} · ` : ''}Repaso de errores</span>
        <span className="w-[34px]" />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <Image src="/evi-bienvenida.svg" alt="" width={88} height={88} className="size-[88px]" />
        <h1 className="mt-[18px] text-titulo font-semibold leading-tight tracking-titulo">
          Ya usaste tu repaso gratis de esta semana
        </h1>
        <p className="mt-2.5 max-w-[310px] text-cuerpo leading-[1.45] text-[#4b5565]">
          {pendingCount && pendingCount > 0
            ? `Tus ${pendingCount} ${pendingCount === 1 ? 'error queda guardado' : 'errores quedan guardados'}. `
            : 'Tus errores quedan guardados. '}
          {nextDate ? (
            <>El próximo repaso gratis se habilita el <strong className="font-semibold text-[#0f1623]">{nextDate}</strong>.</>
          ) : (
            'El próximo repaso gratis se habilita en unos días.'
          )}
        </p>
      </section>

      <div className="flex flex-col gap-2.5 pb-7">
        <Link
          href={premiumHref}
          onClick={() => trackMarketingEvent('premium_cta_clicked', { source, materia_id: materiaId })}
          className="flex min-h-[54px] items-center justify-center rounded-full bg-[#3c6cba] px-6 text-cuerpo font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,.20)] hover:bg-[#2a5193]"
        >
          Repasar sin límite con Premium
        </Link>
        <Link
          href={materialHref}
          onClick={() =>
            trackMarketingEvent('cta_click', {
              location: 'errores_review_limit',
              cta_name: hasReadyMaterial ? 'review_errors_in_material' : 'upload_notes_to_study_detected_errors',
              materia_id: materiaId,
            })
          }
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[#dbe6f8] px-5 text-cuerpo font-semibold text-[#3c6cba] hover:bg-[#eef4ff]"
        >
          {hasReadyMaterial ? <BookOpen className="size-[17px]" aria-hidden="true" /> : <Upload className="size-[17px]" aria-hidden="true" />}
          {hasReadyMaterial ? 'Ver esos temas en mi apunte' : 'Estudiar esos temas en mi apunte'}
        </Link>
        {!hasReadyMaterial ? (
          <p className="text-center text-chico text-[#667085]">Subir tu apunte es gratis: 1 por mes.</p>
        ) : null}
      </div>
    </div>
  );
}
