import type { Metadata } from 'next';
import { AppShellProviders } from '@/components/app-shell-providers';
import { DemoFourStepStudy } from '@/components/demo-four-step-study';
import { TrackedLink } from '@/components/marketing/tracked-link';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-material-summary';
import demoArtifacts from '@/public/material-general-prueba.study.json';

export const metadata: Metadata = {
  title: 'Probá Evaluo con un PDF de muestra',
  description: 'Probá Evaluo con un PDF de muestra: entender, practicar, ver tu progreso y reforzar, o elegí cómo empezar a estudiar.',
  robots: { index: false, follow: false },
};

const SUMMARY = demoArtifacts.summary as StudentMaterialSummary;
const GLOSSARY = demoArtifacts.glossary as StudyGlossaryItem[];
const UPLOAD_HREF = '/dashboard?openUpload=1&source=demo_four_step';
const INTERNATIONAL_SOURCES = [
  'international-study-es', 'international-study-es-mx',
  'international-study-es-co', 'international-study-es-es',
] as const;

export default async function DemoMaterialEstudioPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string; start?: string; source?: string }>;
}) {
  const { tour, start, source } = await searchParams;
  const internationalSource = INTERNATIONAL_SOURCES.find((value) => value === source);
  const uploadHref = internationalSource
    ? `/dashboard?openUpload=1&source=${encodeURIComponent(internationalSource)}`
    : UPLOAD_HREF;
  // Un único tutorial principal, también en la muestra. Permitir exploración libre al terminarlo
  // o desde un enlace explícito ?tour=0.
  const directStudyEntry = start === 'eleccion' ? 'choice' : start === 'plan' ? 'plan' : undefined;
  const guided = tour !== '0' && !directStudyEntry;

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
              PDF de muestra · Recorrido de cuatro pasos
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {internationalSource
                ? 'Prueba los ejercicios y el progreso de un PDF de muestra antes de usar tus apuntes.'
                : 'Conocé el mismo recorrido que vas a ver al estudiar tu primer PDF.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Es una demostración: tus respuestas y tu progreso reales no se modifican.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <TrackedLink
              href={uploadHref}
              eventName="cta_click"
              payload={{
                location: 'demo_material_header',
                cta_name: 'convertir_mi_pdf',
                destination: uploadHref,
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:opacity-95"
            >
              Subir mi propio PDF
            </TrackedLink>
            {!internationalSource ? <TrackedLink
              href="/pricing?source=demo_material#elegir-plan"
              eventName="cta_click"
              payload={{
                location: 'demo_material_header',
                cta_name: 'ver_premium',
                destination: '/pricing?source=demo_material#elegir-plan',
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Ver Evaluo Premium
            </TrackedLink> : null}
          </div>
        </div>
      </div>
      <AppShellProviders>
        <DemoFourStepStudy
          guided={guided}
          initialStudyEntryStage={directStudyEntry}
          initialTab={!guided && start === 'ejercicios' ? 'ejercicios' : 'resumen'}
          internationalSource={internationalSource}
          summary={SUMMARY}
          glossary={GLOSSARY}
          pageCount={demoArtifacts.pageCount}
        />
      </AppShellProviders>
    </>
  );
}
