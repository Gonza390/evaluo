'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import type { DashboardNextStudyAction } from '@/lib/dashboard-next-study-action';

type Props = {
  materialsCount: number;
  primaryMaterialHref: string | null;
  primaryMaterialReady: boolean;
  pendingReinforcementCount: number;
  nextStudyAction: DashboardNextStudyAction | null;
  onUploadClick: () => void;
  heroRef?: RefObject<HTMLElement | null>;
};

export function MaeveStudyHero({
  materialsCount,
  primaryMaterialHref,
  primaryMaterialReady,
  pendingReinforcementCount,
  nextStudyAction,
  onUploadClick,
  heroRef,
}: Props) {
  const { user, getUserName } = useUser();
  const firstName = user ? getUserName().split(' ')[0] : '';
  const personalized =
    Boolean(firstName) && firstName !== 'Estudiante'
      ? `Tu espacio de estudio, ${firstName}`
      : 'Tu espacio de estudio';

  return (
    <section
      ref={heroRef}
      className="rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-6 sm:px-6 sm:py-7"
    >
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
          Tu espacio
        </p>
        <h1 className="mt-2 text-[1.65rem] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2rem]">
          {personalized}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-5 text-slate-500">
          {materialsCount === 0
            ? 'Subí lo que tenés que estudiar y Evaluo te guía para prepararlo.'
            : nextStudyAction?.title ?? 'Retomá tu PDF donde lo dejaste o sumá otro material cuando lo necesites.'}
        </p>
        {nextStudyAction ? (
          <p className="mx-auto mt-1.5 max-w-lg text-[12.5px] leading-5 text-slate-400">
            {nextStudyAction.description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col items-center gap-3">
          {materialsCount > 0 && primaryMaterialHref ? (
            <>
              <Button
                asChild
                className="h-12 w-full max-w-xs rounded-2xl px-6 text-[15px] font-semibold sm:w-auto"
              >
                <Link
                  href={nextStudyAction?.href ?? primaryMaterialHref}
                  onClick={() => {
                    if (!nextStudyAction) return;
                    trackMarketingEvent('cta_click', {
                      location: 'dashboard_next_action',
                      cta_name: nextStudyAction.kind,
                      destination: nextStudyAction.href,
                    });
                  }}
                >
                  {nextStudyAction?.cta ??
                    (primaryMaterialReady ? 'Continuar estudiando' : 'Ver estado del PDF')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {pendingReinforcementCount > 0 && nextStudyAction?.kind !== 'reinforce' ? (
                <Link
                  href="/dashboard/explicaciones"
                  onClick={() =>
                    trackMarketingEvent('cta_click', {
                      location: 'dashboard_pending_errors',
                      cta_name: 'review_pending_errors',
                      destination: '/dashboard/explicaciones',
                    })
                  }
                  className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
                >
                  <RotateCcw className="h-4 w-4" />
                  Tenés {pendingReinforcementCount}{' '}
                  {pendingReinforcementCount === 1 ? 'tema' : 'temas'} para reforzar
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onUploadClick}
                className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                <Upload className="h-4 w-4" />
                Subir otro PDF
              </button>
            </>
          ) : (
            <Button
              type="button"
              onClick={onUploadClick}
              className="h-12 w-full max-w-xs rounded-2xl px-6 text-[15px] font-semibold sm:w-auto"
            >
              Subí tu PDF
              <span className="sr-only"> Subir PDF</span>
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
