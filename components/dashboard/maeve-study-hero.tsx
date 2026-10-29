'use client';

import { useEffect, useRef, type RefObject } from 'react';
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

const FIRST_PDF_STEPS = ['Subí tu PDF', 'Entendé', 'Practicá', 'Reforzá'];

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
  const firstPdfViewTrackedRef = useRef(false);
  const nextActionViewTrackedRef = useRef<string | null>(null);
  const firstName = user ? getUserName().split(' ')[0] : '';
  const personalized =
    Boolean(firstName) && firstName !== 'Estudiante'
      ? `Tu espacio de estudio, ${firstName}`
      : 'Tu espacio de estudio';
  const isFirstPdfState = materialsCount === 0;

  useEffect(() => {
    if (!isFirstPdfState || firstPdfViewTrackedRef.current) return;
    firstPdfViewTrackedRef.current = true;
    trackMarketingEvent('first_pdf_cta_viewed', {
      location: 'dashboard_empty',
    });
  }, [isFirstPdfState]);

  useEffect(() => {
    if (isFirstPdfState || !nextStudyAction) return;
    const viewKey = `${nextStudyAction.kind}:${nextStudyAction.materialId}`;
    if (nextActionViewTrackedRef.current === viewKey) return;
    nextActionViewTrackedRef.current = viewKey;
    trackMarketingEvent('dashboard_next_action_viewed', {
      location: 'dashboard_next_action',
      cta_name: nextStudyAction.kind,
      destination: nextStudyAction.href,
      material_id: nextStudyAction.materialId,
    });
  }, [isFirstPdfState, nextStudyAction]);

  return (
    <section
      ref={heroRef}
      className={
        isFirstPdfState
          ? 'rounded-[1.25rem] border border-blue-100 bg-[radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.10),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)] px-4 py-4 shadow-[0_8px_24px_rgba(79,70,229,0.05)] sm:px-5 sm:py-5'
          : 'rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5 sm:py-5'
      }
    >
      <div className={isFirstPdfState ? 'mx-auto max-w-[760px] text-center' : 'mx-auto max-w-[760px] text-center'}>
        <p
          className={
            isFirstPdfState
              ? 'text-xs font-bold tracking-[0.10em] text-blue-700 uppercase'
              : 'text-xs font-semibold tracking-[0.10em] text-slate-600 uppercase'
          }
        >
          {isFirstPdfState ? 'Primer material' : 'Tu espacio'}
        </p>
        <h1 className="mt-1.5 text-[20px] leading-[1.3] font-bold tracking-[-0.045em] text-slate-950 sm:text-[22px]">
          {isFirstPdfState ? 'Prepará tu primer material' : personalized}
        </h1>
        <p className="mx-auto mt-1.5 max-w-2xl text-[12.5px] leading-5 text-slate-500 sm:text-[13px]">
          {isFirstPdfState
            ? 'Subí el PDF que tenés que estudiar y Evaluo te ayuda a entenderlo, practicar y detectar qué necesitás reforzar.'
            : nextStudyAction?.title ?? 'Retomá tu PDF donde lo dejaste o sumá otro material cuando lo necesites.'}
        </p>
        {!isFirstPdfState && nextStudyAction ? (
          <p className="mx-auto mt-1 max-w-2xl text-[13px] leading-[1.5] text-slate-600">
            {nextStudyAction.description}
          </p>
        ) : null}

        {isFirstPdfState ? (
          <div className="mx-auto mt-3 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
            {FIRST_PDF_STEPS.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2 rounded-lg border border-blue-100/80 bg-white/80 px-2.5 py-2 text-left"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {index + 1}
                </span>
                <span className="text-xs font-semibold text-slate-700">{step}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className={isFirstPdfState ? 'mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2' : 'mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2'}>
          {materialsCount > 0 && primaryMaterialHref ? (
            <>
              <Button
                asChild
                className="h-11 min-h-11 w-full max-w-xs rounded-lg px-4 text-[13px] font-semibold sm:w-auto"
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
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[12.5px] font-semibold text-blue-700 transition hover:text-blue-900"
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
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[12.5px] font-semibold text-slate-500 transition hover:text-slate-900"
              >
                <Upload className="h-4 w-4" />
                Subir otro PDF
              </button>
            </>
          ) : (
            <Button
              type="button"
              data-first-pdf-cta="dashboard_empty"
              onClick={onUploadClick}
              className="h-11 min-h-11 w-full max-w-xs rounded-lg px-4 text-[13px] font-semibold sm:w-auto"
            >
              Subir mi PDF
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
