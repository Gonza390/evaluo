'use client';

import { StudentMaterialsWorkspace } from '@/components/dashboard/student-materials-workspace';
import { UserProvider } from '@/hooks/useUser';

const UNIVERSIDAD_ID = '11111111-1111-4111-8111-111111111111';
const CARRERA_ID = '22222222-2222-4222-8222-222222222222';
const MATERIA_ID = '33333333-3333-4333-8333-333333333333';

export function PdfUploadUxPreviewClient() {
  return (
    <UserProvider initialUser={null}>
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
    </UserProvider>
  );
}
