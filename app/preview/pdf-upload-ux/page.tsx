import type { Metadata } from 'next';
import { StudentMaterialsWorkspace } from '@/components/dashboard/student-materials-workspace';

export const metadata: Metadata = {
  title: 'Preview · Carga de PDF | Evaluo',
  robots: {
    index: false,
    follow: false,
  },
};

const UNIVERSIDAD_ID = '11111111-1111-4111-8111-111111111111';
const CARRERA_ID = '22222222-2222-4222-8222-222222222222';
const MATERIA_ID = '33333333-3333-4333-8333-333333333333';

export default function PdfUploadUxPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <StudentMaterialsWorkspace
          initialMaterials={[]}
          universidades={[
            {
              id: UNIVERSIDAD_ID,
              nombre: 'Universidad Católica de Córdoba',
            },
          ]}
          carreras={[
            {
              id: CARRERA_ID,
              nombre: 'Administración de Empresas',
              universidad_id: UNIVERSIDAD_ID,
            },
          ]}
          materias={[
            {
              id: MATERIA_ID,
              nombre: 'Administración General',
              carrera_id: CARRERA_ID,
            },
          ]}
          carreraMaterias={[
            {
              carrera_id: CARRERA_ID,
              materia_id: MATERIA_ID,
            },
          ]}
          initialUniversidadId={UNIVERSIDAD_ID}
          initialCarreraId={CARRERA_ID}
          initialMateriaId={MATERIA_ID}
          initialOpenUpload
        />
      </div>
    </main>
  );
}
