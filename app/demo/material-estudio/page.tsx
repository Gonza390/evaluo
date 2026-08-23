import { AppShellProviders } from '@/components/app-shell-providers';
import { MaterialStudyWorkspace } from '@/components/material-study-workspace';
import { PdfWorkerPreload } from '@/components/pdf/pdf-worker-preload';
import { TrackedLink } from '@/components/marketing/tracked-link';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-material-summary';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import demoArtifacts from '@/public/material-general-prueba.study.json';

const GENERAL_STUDY_SUMMARY = demoArtifacts.summary as StudentMaterialSummary;
const GENERAL_STUDY_GLOSSARY = demoArtifacts.glossary as StudyGlossaryItem[];
const GENERAL_PEDAGOGICAL_ARTIFACTS = demoArtifacts.pedagogicalArtifacts as PedagogicalArtifacts;
const START_WITH_OWN_MATERIAL =
  '/login?mode=signup&next=%2Fdashboard%2Fmateriales%3FopenUpload%3D1';

export default function DemoMaterialEstudioPage() {
  return (
    <>
      <PdfWorkerPreload />
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
              href="/pricing?source=demo_material"
              eventName="cta_click"
              payload={{
                location: 'demo_material_header',
                cta_name: 'ver_premium',
                destination: '/pricing',
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
          backHref="/"
          canRegenerate={false}
          fileName="IA y nuevas tecnologías - Material de estudio.pdf"
          isPremium
          materialId="demo-material"
          isOwner
          pageCount={demoArtifacts.pageCount}
          title="IA y nuevas tecnologías"
          viewerUrl="/material-general-prueba.pdf"
          visibility="shared"
          studyGlossary={GENERAL_STUDY_GLOSSARY}
          studySummary={GENERAL_STUDY_SUMMARY}
          pedagogicalArtifacts={GENERAL_PEDAGOGICAL_ARTIFACTS}
        />
      </AppShellProviders>
    </>
  );
}
