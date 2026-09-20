'use client';

import { MaeveDashboardChrome } from '@/components/dashboard/maeve-dashboard-chrome';
import { PdfFirstUploadShell } from '@/components/dashboard/pdf-first-upload-shell';
import { StudentMaterialsWorkspace } from '@/components/dashboard/student-materials-workspace';
import type { StudentMaterial } from '@/lib/data/student-materials';
import { getStudentMaterialRoute } from '@/lib/routes';

type UniversidadOption = { id: string; nombre: string };
type CarreraOption = { id: string; nombre: string; universidad_id: string | null };
type MateriaOption = { id: string; nombre: string; carrera_id?: string | null };
type CarreraMateriaRelation = { carrera_id: string | null; materia_id: string | null };

export type MaeveStudySpaceProps = {
  materials: StudentMaterial[];
  universidades: UniversidadOption[];
  carreras: CarreraOption[];
  materias: MateriaOption[];
  carreraMaterias: CarreraMateriaRelation[];
  initialUniversidadId?: string;
  initialCarreraId?: string;
  initialMateriaId?: string;
  initialExamDate?: string;
  initialSource?: string;
  trackingMateriaId?: string;
  initialOpen?: boolean;
};

/**
 * Ship E client tree for /dashboard. Kept behind next/dynamic so the route
 * stays under the gzip performance budget (same pattern as LazyDashboardContent).
 */
export function MaeveStudySpace({
  materials,
  universidades,
  carreras,
  materias,
  carreraMaterias,
  initialUniversidadId = '',
  initialCarreraId = '',
  initialMateriaId = '',
  initialExamDate = '',
  initialSource = '',
  trackingMateriaId = '',
  initialOpen = false,
}: MaeveStudySpaceProps) {
  const primaryMaterial =
    materials.find((material) => material.processing_status === 'ready') ?? materials[0] ?? null;
  const primaryMaterialHref = primaryMaterial ? getStudentMaterialRoute(primaryMaterial.id) : null;
  const primaryMaterialReady = primaryMaterial?.processing_status === 'ready';

  return (
    <PdfFirstUploadShell
      universidades={universidades}
      carreras={carreras}
      materias={materias}
      carreraMaterias={carreraMaterias}
      initialUniversidadId={initialUniversidadId}
      initialCarreraId={initialCarreraId}
      initialMateriaId={initialMateriaId}
      initialExamDate={initialExamDate}
      initialSource={initialSource}
      trackingMateriaId={trackingMateriaId}
      initialOpen={initialOpen}
    >
      <MaeveDashboardChrome
        materialsCount={materials.length}
        primaryMaterialHref={primaryMaterialHref}
        primaryMaterialReady={primaryMaterialReady}
      >
        <StudentMaterialsWorkspace
          initialMaterials={materials}
          universidades={universidades}
          carreras={carreras}
          materias={materias}
          carreraMaterias={carreraMaterias}
          initialUniversidadId={initialUniversidadId}
          initialCarreraId={initialCarreraId}
          initialMateriaId={initialMateriaId}
          initialOpenUpload={false}
        />
      </MaeveDashboardChrome>
    </PdfFirstUploadShell>
  );
}
