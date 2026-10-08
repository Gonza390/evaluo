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
          ? 'rounded-[1.5rem] border border-indigo-100 bg-[radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.12),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)] px-4 py-7 shadow-[0_18px_52px_rgba(79,70,229,0.08)] sm:px-8 sm:py-9'
          : 'rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-6 sm:px-6 sm:py-7'
      }
    >
      <div className={isFirstPdfState ? 'mx-auto max-w-2xl text-center' : 'mx-auto max-w-xl text-center'}>
        <p
          className={
            isFirstPdfState
              ? 'text-[11px] font-bold tracking-[0.16em] text-indigo-600 uppercase'
              : 'text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase'
          }
        >
          {isFirstPdfState ? 'Primer material' : 'Tu espacio'}
        </p>
        <h1 className="mt-2 text-[1.65rem] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2rem]">
          {isFirstPdfState ? 'Prepará tu primer material' : personalized}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[13.5px] leading-5 text-slate-500 sm:text-[14.5px] sm:leading-6">
          {isFirstPdfState
            ? 'Subí el PDF que tenés que estudiar y Evaluo te ayuda a entenderlo, practicar y detectar qué necesitás reforzar.'
            : nextStudyAction?.title ?? 'Retomá tu PDF donde lo dejaste o sumá otro material cuando lo necesites.'}
        </p>
        {!isFirstPdfState && nextStudyAction ? (
          <p className="mx-auto mt-1.5 max-w-lg text-[12.5px] leading-5 text-slate-400">
            {nextStudyAction.description}
          </p>
        ) : null}

        {isFirstPdfState ? (
          <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
            {FIRST_PDF_STEPS.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2 rounded-xl border border-indigo-100/80 bg-white/80 px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.03)]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">
                  {index + 1}
                </span>
                <span className="text-[12px] font-semibold text-slate-700">{step}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className={isFirstPdfState ? 'mt-6 flex flex-col items-center gap-3' : 'mt-5 flex flex-col items-center gap-3'}>
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
              data-first-pdf-cta="dashboard_empty"
              onClick={onUploadClick}
              className="h-12 w-full max-w-xs rounded-2xl px-6 text-[15px] font-semibold sm:w-auto"
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
