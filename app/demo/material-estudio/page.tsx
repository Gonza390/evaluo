import { AppShellProviders } from '@/components/app-shell-providers';
import { MaterialStudyWorkspace } from '@/components/material-study-workspace';
import { PdfWorkerPreload } from '@/components/pdf/pdf-worker-preload';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-material-summary';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import demoArtifacts from '@/public/material-general-prueba.study.json';

const GENERAL_STUDY_SUMMARY = demoArtifacts.summary as StudentMaterialSummary;
const GENERAL_STUDY_GLOSSARY = demoArtifacts.glossary as StudyGlossaryItem[];
const GENERAL_PEDAGOGICAL_ARTIFACTS = demoArtifacts.pedagogicalArtifacts as PedagogicalArtifacts;

export default function DemoMaterialEstudioPage() {
  return (
    <>
      <PdfWorkerPreload />
      <AppShellProviders>
        <MaterialStudyWorkspace
          backHref="/dashboard/materiales"
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
