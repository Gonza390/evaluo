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
          <EviMascot />
        </div>
        <h1 className="mt-2 text-[25px] leading-[1.18] font-bold tracking-[-0.04em] text-[#0b0c1e] sm:mt-2 sm:text-[32px]">
          {firstName && firstName !== 'Estudiante'
            ? `¿Qué estudiamos hoy, ${firstName}?`
            : '¿Qué estudiamos hoy?'}
        </h1>
        <p className="mt-3 max-w-[760px] text-[13px] leading-[1.5] text-[#5a6481] sm:text-[14px]">
          {isFirstPdfState
            ? 'Subí el PDF que tenés que estudiar y Evaluo te ayuda a entenderlo, practicar y reforzar.'
            : nextStudyAction?.description ?? 'Elegí un material para continuar o sumá uno nuevo.'}
        </p>

        {isFirstPdfState ? (
          <div className="mt-4 grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
            {FIRST_PDF_STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-2 rounded-xl border border-blue-100/80 bg-white/80 px-2.5 py-2 text-left">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{index + 1}</span>
                <span className="text-xs font-semibold text-slate-700">{step}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row sm:gap-3">
          {materialsCount > 0 && primaryMaterialHref ? (
            <>
              <Button asChild className="h-11 w-full rounded-xl bg-[#0066ee] px-5 text-[14px] font-semibold text-white shadow-[0_10px_22px_rgba(0,102,238,0.19)] hover:bg-[#0058d4] sm:w-auto">
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
                  {nextStudyAction?.cta ?? (primaryMaterialReady ? 'Continuar estudiando' : 'Ver estado del PDF')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {pendingReinforcementCount > 0 && nextStudyAction?.kind !== 'reinforce' ? (
                <Link href="/dashboard/explicaciones"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-blue-700"
                  onClick={() => trackMarketingEvent('cta_click', {
                    location: 'dashboard_pending_errors',
                    cta_name: 'review_pending_errors',
                    destination: '/dashboard/explicaciones',
                  })}
                >
                  <RotateCcw className="h-4 w-4" />
                  Tenés {pendingReinforcementCount} {pendingReinforcementCount === 1 ? 'tema' : 'temas'} para reforzar
                </Link>
              ) : null}
              <button type="button" onClick={onUploadClick}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#526582] transition-colors hover:text-[#0f1b3d] sm:w-auto">
                <Upload className="h-4 w-4" />
                Subir otro PDF
              </button>
            </>
          ) : (
            <Button type="button" data-first-pdf-cta="dashboard_empty" onClick={onUploadClick}
              className="h-11 w-full max-w-xs rounded-xl bg-[#0066ee] px-5 text-[14px] font-semibold text-white hover:bg-[#0058d4] sm:w-auto">
              Subir mi PDF <Upload className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <style jsx global>{`
        .evi-float { animation: evi-float 4s ease-in-out infinite; transform-origin: center; }
        .evi-shadow { animation: evi-shadow 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .evi-blink { animation: evi-blink 5s infinite; transform-box: fill-box; transform-origin: center; }
        .evi-pencil { animation: evi-write 1.4s ease-in-out infinite; transform-origin: 930px 735px; }
        @keyframes evi-float { 50% { transform: translateY(-18px); } }
        @keyframes evi-shadow { 50% { transform: scale(.88); opacity: .6; } }
        @keyframes evi-blink { 0%,93%,100% { transform: scaleY(1); } 96% { transform: scaleY(.08); } }
        @keyframes evi-write { 50% { transform: rotate(-9deg); } }
        @media (prefers-reduced-motion: reduce) {
          .evi-float, .evi-shadow, .evi-blink, .evi-pencil { animation: none; }
        }
      `}</style>
    </section>
  );
}

function EviMascot() {
  return (
    <svg viewBox="0 -80 1024 1104" role="img" aria-label="Evi, la mascota de Evaluo" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <ellipse className="evi-shadow" cx="535" cy="975" rx="260" ry="30" fill="#d5d9ee" />
      <g className="evi-float">
        <path d="M437 940V985M632 940V985" stroke="#1b1c3a" strokeWidth="32" strokeLinecap="round" />
        <rect x="225" y="85" width="623" height="855" rx="85" fill="#fff" stroke="#1b1c3a" strokeWidth="24" />
        <path d="M650 85 L848 280 H725 Q650 280 650 210Z" fill="#ffc832" stroke="#1b1c3a" strokeWidth="24" strokeLinejoin="round" />
        <rect x="322" y="740" width="428" height="28" rx="14" fill="#d5d9f5" />
        <rect x="314" y="817" width="322" height="42" rx="21" fill="#ffc832" />
        <ellipse cx="344" cy="585" rx="46" ry="28" fill="#ff9a8b" />
        <ellipse cx="726" cy="585" rx="46" ry="28" fill="#ff9a8b" />
        <path d="M225 610 Q160 630 140 700" fill="none" stroke="#1b1c3a" strokeWidth="24" strokeLinecap="round" />
        <circle cx="140" cy="740" r="42" fill="#fff" stroke="#1b1c3a" strokeWidth="22" />
        <path d="M848 610 Q890 650 912 705" fill="none" stroke="#1b1c3a" strokeWidth="24" strokeLinecap="round" />
        <g className="evi-pencil">
          <g transform="translate(930 730) rotate(20)">
            <rect x="-30" y="-130" width="60" height="250" fill="#ffc832" stroke="#1b1c3a" strokeWidth="18" strokeLinejoin="round" />
            <path d="M-30 -130 L30 -130 L0 -195Z" fill="#f9d3a0" stroke="#1b1c3a" strokeWidth="18" strokeLinejoin="round" />
            <rect x="-30" y="120" width="60" height="34" fill="#ff9a8b" stroke="#1b1c3a" strokeWidth="18" strokeLinejoin="round" />
            <path d="M-30 -60H30" stroke="#1b1c3a" strokeWidth="14" />
          </g>
          <circle cx="930" cy="735" r="42" fill="#fff" stroke="#1b1c3a" strokeWidth="22" />
        </g>
        <circle cx="428" cy="490" r="62" fill="#e6eeff" stroke="#1b1c3a" strokeWidth="18" />
        <circle cx="642" cy="490" r="62" fill="#e6eeff" stroke="#1b1c3a" strokeWidth="18" />
        <g className="evi-blink">
          <circle cx="428" cy="490" r="30" fill="#1b1c3a" /><circle cx="439" cy="478" r="9" fill="#fff" />
          <circle cx="642" cy="490" r="30" fill="#1b1c3a" /><circle cx="653" cy="478" r="9" fill="#fff" />
        </g>
        <path d="M488 485 Q535 460 582 485M368 468 L318 442M702 468 L752 442" fill="none" stroke="#1b1c3a" strokeWidth="18" strokeLinecap="round" />
        <path d="M468 592 Q540 650 612 582" fill="none" stroke="#1b1c3a" strokeWidth="24" strokeLinecap="round" />
      </g>
      <circle cx="990" cy="440" r="14" fill="#ffc832" />
      <circle cx="1000" cy="380" r="9" fill="#2f4cff" />
      <circle cx="90" cy="250" r="16" fill="#2f4cff" />
      <circle cx="150" cy="170" r="11" fill="#ffc832" />
    </svg>
  );
}

