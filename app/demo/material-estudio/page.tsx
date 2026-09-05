import { AppShellProviders } from '@/components/app-shell-providers';
import { DemoMaterialGuidedTourV6 } from '@/components/demo-material-guided-tour-v6';
import { MaterialStudyWorkspace } from '@/components/material-study-workspace';
import { TrackedLink } from '@/components/marketing/tracked-link';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-material-summary';
import { hasPremiumAccess } from '@/lib/premium';
import { createClientServer } from '@/lib/supabase-server';
import demoArtifacts from '@/public/material-general-prueba.study.json';

const GENERAL_STUDY_SUMMARY = demoArtifacts.summary as StudentMaterialSummary;
const GENERAL_STUDY_GLOSSARY = demoArtifacts.glossary as StudyGlossaryItem[];
const START_WITH_OWN_MATERIAL =
  '/login?mode=signup&next=%2Fdashboard%2Fmateriales%3FopenUpload%3D1';
const GUIDED_TOUR_UPLOAD = '/dashboard/materiales/subir?source=demo_material_tour';

export default async function DemoMaterialEstudioPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; tour?: string }>;
}) {
  const { source = '', tour = '' } = await searchParams;
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPremium = user?.id ? await hasPremiumAccess(user.id) : false;
  const guidedTourEnabled = tour === '1' || source === 'onboarding_missing_catalog';
  const forceGuidedTour = tour === '1';

  return (
    <>
      <style>{`
        div[aria-live='polite'] > section[role='dialog'][aria-label^='Recorrido de Evaluo'] {
          transition:
            left 240ms cubic-bezier(0.22, 1, 0.36, 1),
            top 240ms cubic-bezier(0.22, 1, 0.36, 1),
            width 240ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 180ms ease;
          will-change: left, top, transform, opacity;
        }

        div[aria-live='polite'] > section[role='dialog'][aria-label^='Recorrido de Evaluo'] > div {
          transition:
            opacity 180ms ease,
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }

        div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 1 de 6'] > div,
        div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 3 de 6'] > div,
        div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 5 de 6'] > div {
          animation: evaluo-tour-card-enter-a 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 2 de 6'] > div,
        div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 4 de 6'] > div,
        div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 6 de 6'] > div {
          animation: evaluo-tour-card-enter-b 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        div[aria-live='polite'] > section[role='dialog'][aria-label^='Recorrido de Evaluo']:has(svg.animate-spin) {
          opacity: 0.02;
          pointer-events: none;
        }

        div[aria-live='polite'] > section[role='dialog'][aria-label^='Recorrido de Evaluo']:has(svg.animate-spin) > div {
          opacity: 0 !important;
          transform: translateY(5px) scale(0.992) !important;
        }

        div[aria-live='polite'] > div.pointer-events-none.absolute.border-2 {
          animation: evaluo-tour-spotlight-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transition:
            left 220ms cubic-bezier(0.22, 1, 0.36, 1),
            top 220ms cubic-bezier(0.22, 1, 0.36, 1),
            width 220ms cubic-bezier(0.22, 1, 0.36, 1),
            height 220ms cubic-bezier(0.22, 1, 0.36, 1),
            border-radius 220ms ease,
            opacity 180ms ease;
        }

        div[aria-live='polite'] > svg {
          animation: evaluo-tour-mask-in 220ms ease-out both;
        }

        div[aria-live='polite'] > div[class*='bg-slate-950/60'] {
          animation: evaluo-tour-cover-in 160ms ease-out both;
        }

        @keyframes evaluo-tour-card-enter-a {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.992);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes evaluo-tour-card-enter-b {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.992);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes evaluo-tour-spotlight-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes evaluo-tour-mask-in {
          from {
            opacity: 0.78;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes evaluo-tour-cover-in {
          from {
            opacity: 0.72;
          }
          to {
            opacity: 1;
          }
        }

        @media (min-width: 768px) {
          div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 1 de 6'] {
            left: 28px !important;
            top: clamp(118px, 21vh, 178px) !important;
            width: 292px !important;
          }

          div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 1 de 6'] > div {
            padding: 16px !important;
          }

          div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 1 de 6'] h2 {
            margin-top: 12px !important;
            font-size: 1.15rem !important;
          }

          div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 1 de 6'] p {
            margin-top: 7px !important;
            font-size: 13px !important;
            line-height: 1.45 !important;
          }

          div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 1 de 6'] div.mt-5 {
            margin-top: 14px !important;
          }

          div[aria-live='polite'] > section[role='dialog'][aria-label='Recorrido de Evaluo, paso 6 de 6'] {
            left: 50% !important;
            top: 50% !important;
            width: min(360px, calc(100vw - 40px)) !important;
            transform: translate(-50%, -50%) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          div[aria-live='polite'] > section[role='dialog'][aria-label^='Recorrido de Evaluo'],
          div[aria-live='polite'] > section[role='dialog'][aria-label^='Recorrido de Evaluo'] > div,
          div[aria-live='polite'] > div.pointer-events-none.absolute.border-2,
          div[aria-live='polite'] > svg,
          div[aria-live='polite'] > div[class*='bg-slate-950/60'] {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-blue-600 uppercase">
              Demo de una guía de estudio
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Esto es lo que Evaluo puede construir a partir de un PDF de estudio.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <TrackedLink
              href={START_WITH_OWN_MATERIAL}
              eventName="cta_click"
              payload={{
                location: 'demo_material_header',
                cta_name: 'convertir_mi_pdf',
                destination: START_WITH_OWN_MATERIAL,
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:opacity-95"
            >
              Convertí tu PDF en una guía así
            </TrackedLink>
            <TrackedLink
              href="/pricing?source=demo_material#elegir-plan"
              eventName="cta_click"
              payload={{
                location: 'demo_material_header',
                cta_name: 'ver_premium',
                destination: '/pricing?source=demo_material#elegir-plan',
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Ver Evaluo Premium
            </TrackedLink>
          </div>
        </div>
      </div>
      <AppShellProviders>
        <MaterialStudyWorkspace
          backHref={user ? '/dashboard/materiales' : '/'}
          canRegenerate={false}
          fileName="IA y nuevas tecnologías - Material de estudio.pdf"
          isPremium={isPremium}
          materialId="demo-material"
          isOwner
          pageCount={demoArtifacts.pageCount}
          title="IA y nuevas tecnologías"
          viewerUrl="/material-general-prueba.pdf"
          visibility="shared"
          studyGlossary={GENERAL_STUDY_GLOSSARY}
          studySummary={GENERAL_STUDY_SUMMARY}
        />
        <DemoMaterialGuidedTourV6
          enabled={guidedTourEnabled}
          force={forceGuidedTour}
          source={source || (forceGuidedTour ? 'forced_preview' : 'demo_material')}
          uploadHref={GUIDED_TOUR_UPLOAD}
        />
      </AppShellProviders>
    </>
  );
}
