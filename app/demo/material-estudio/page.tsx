import { AppShellProviders } from '@/components/app-shell-providers';
import { MaterialStudyWorkspace } from '@/components/material-study-workspace';
import { PdfWorkerPreload } from '@/components/pdf/pdf-worker-preload';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-material-summary';

const GENERAL_STUDY_SUMMARY: StudentMaterialSummary = {
  shortSummary:
    'Este material de prueba presenta una estructura académica simple para validar el espacio de estudio, el visor PDF y la lectura de contenidos en distintos dispositivos.',
  keyPoints: [
    'El archivo sirve como referencia fija para revisar scroll, zoom y cambio de páginas.',
    'La experiencia de estudio se organiza en resumen, glosario, tarjetas, ejercicios y mapa mental.',
    'La interfaz permite ocultar y mostrar el PDF sin perder el foco del contenido.',
    'El layout debe mantenerse estable tanto en escritorio como en teléfono.',
  ],
  sections: [
    {
      title: 'Presentación del material',
      body: 'Explica que el PDF queda como archivo general de prueba para validar la experiencia del workspace.',
    },
    {
      title: 'Hábitos de estudio',
      body: 'Resume ideas sobre organización del tiempo, lectura activa y repasos espaciados.',
    },
    {
      title: 'Uso del sistema',
      body: 'Describe cómo este mismo PDF puede alimentar resúmenes, glosario, tarjetas, ejercicios y mapa mental.',
    },
  ],
  hasContent: true,
  status: 'ready',
  provider: 'local-fallback',
  errorMessage: null,
  sourceChunksCount: 3,
};

const GENERAL_STUDY_GLOSSARY: StudyGlossaryItem[] = [
  {
    term: 'Lectura activa',
    definition: 'Técnica de estudio que implica leer con preguntas, subrayado y elaboración de ideas clave.',
    context: 'Hábitos de estudio',
    importance: 'alta',
  },
  {
    term: 'Repaso espaciado',
    definition: 'Método de revisión distribuida en el tiempo para fijar mejor la información.',
    context: 'Hábitos de estudio',
    importance: 'alta',
  },
  {
    term: 'Workspace',
    definition: 'Espacio donde el alumno combina PDF, resumen, glosario, tarjetas y otras capas de estudio.',
    context: 'Uso del sistema',
    importance: 'media',
  },
];

export default function DemoMaterialEstudioPage() {
  return (
    <>
      <PdfWorkerPreload />
      <AppShellProviders>
        <MaterialStudyWorkspace
          backHref="/dashboard/materiales"
          canRegenerate={false}
          carreraName="Abogacía"
          fileName="Material general de prueba.pdf"
          materialId="demo-material"
          isOwner
          materiaName="Aprender en el Siglo 21"
          pageCount={3}
          title="Material general de prueba"
          universidadName="Universidad Siglo 21"
          viewerUrl="/material-general-prueba.pdf"
          visibility="shared"
          studyGlossary={GENERAL_STUDY_GLOSSARY}
          studySummary={GENERAL_STUDY_SUMMARY}
        />
      </AppShellProviders>
    </>
  );
}
