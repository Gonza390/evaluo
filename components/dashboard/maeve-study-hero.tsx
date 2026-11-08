'use client';

import { useEffect, useRef, type RefObject } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { studentEntryText } from '@/lib/i18n/student-entry-copy';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import type { DashboardNextStudyAction } from '@/lib/dashboard-next-study-action';
import { Personaje } from '@/components/brand/personaje';

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
  const { locale } = useAppLocale();
  const t = (value: string) => studentEntryText(locale, value);
  const firstPdfViewTrackedRef = useRef(false);
  const nextActionViewTrackedRef = useRef<string | null>(null);
  const firstName = user ? getUserName().split(' ')[0] : '';
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
      data-evaluo-motion-card
      ref={heroRef}
      className="rounded-[1.25rem] border border-[#e0e7f5] bg-[linear-gradient(180deg,#f1f5ff_0%,#fff_75%)] px-4 py-5 text-center shadow-[0_8px_24px_rgba(30,60,140,0.035)] sm:rounded-[1.5rem] sm:px-7 sm:py-6"
    >
      <div className="mx-auto flex max-w-[950px] flex-col items-center">
        <div className="h-[84px] w-[84px] sm:h-[104px] sm:w-[104px]">
          <Personaje
            estado={isFirstPdfState ? 'contento' : 'concentrado'}
            title={locale === 'en' ? 'Evi, Evaluo’s mascot' : 'Evi, la mascota de Evaluo'}
            className="h-full w-full"
          />
        </div>
        <h1 className="mt-2 text-titulo leading-[1.18] font-bold tracking-titulo text-[#0b0c1e] sm:mt-2 sm:text-destacado">
          {firstName && firstName !== 'Estudiante'
            ? locale === 'en' ? `What are we studying today, ${firstName}?` : `¿Qué estudiamos hoy, ${firstName}?`
            : t('¿Qué estudiamos hoy?')}
        </h1>
        <p className="mt-3 max-w-[760px] text-ui leading-[1.5] text-[#5a6481] sm:text-cuerpo">
          {isFirstPdfState
            ? t('Subí el PDF que tenés que estudiar y Evaluo te ayuda a entenderlo, practicar y reforzar.')
            : t(nextStudyAction?.description ?? 'Elegí un material para continuar o sumá uno nuevo.')}
        </p>

        {isFirstPdfState ? (
          <div className="mt-4 grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
            {FIRST_PDF_STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-2 rounded-xl border border-blue-100/80 bg-white/80 px-2.5 py-2 text-left">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-chico font-semibold text-blue-700">{index + 1}</span>
                <span className="text-chico font-semibold text-slate-700">{t(step)}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row sm:gap-3">
          {materialsCount > 0 && primaryMaterialHref ? (
            <>
              <Button asChild className="h-11 w-full rounded-xl bg-[#4070be] px-5 text-cuerpo font-semibold text-white shadow-[0_10px_22px_rgba(0,102,238,0.19)] hover:bg-[#3361ac] sm:w-auto">
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
                  {t(nextStudyAction?.cta ?? (primaryMaterialReady ? 'Continuar estudiando' : 'Ver estado del PDF'))}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {pendingReinforcementCount > 0 && nextStudyAction?.kind !== 'reinforce' ? (
                <Link href="/dashboard/explicaciones"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-cuerpo font-semibold text-blue-700"
                  onClick={() => trackMarketingEvent('cta_click', {
                    location: 'dashboard_pending_errors',
                    cta_name: 'review_pending_errors',
                    destination: '/dashboard/explicaciones',
                  })}
                >
                  <RotateCcw className="h-4 w-4" />
                  {locale === 'en' ? `You have ${pendingReinforcementCount} ${pendingReinforcementCount === 1 ? 'topic' : 'topics'} to review` : `Tenés ${pendingReinforcementCount} ${pendingReinforcementCount === 1 ? 'tema' : 'temas'} para reforzar`}
                </Link>
              ) : null}
              <button type="button" onClick={onUploadClick}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-cuerpo font-semibold text-[#526582] transition-colors hover:text-[#0f1b3d] sm:w-auto">
                <Upload className="h-4 w-4" />
                {t('Subir otro PDF')}
              </button>
            </>
          ) : (
            <Button type="button" data-first-pdf-cta="dashboard_empty" onClick={onUploadClick}
              className="h-11 w-full max-w-xs rounded-xl bg-[#4070be] px-5 text-cuerpo font-semibold text-white hover:bg-[#3361ac] sm:w-auto">
              {t('Subir mi PDF')} <Upload className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
