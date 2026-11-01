'use client';

import { MaeveDashboardChrome } from '@/components/dashboard/maeve-dashboard-chrome';
import { PdfFirstUploadShell } from '@/components/dashboard/pdf-first-upload-shell';
import { StudentMaterialsWorkspace } from '@/components/dashboard/student-materials-workspace';
import { EmptyStudySpace } from '@/components/dashboard/empty-study-space';
import type { StudentMaterial } from '@/lib/data/student-materials';
import type { DashboardNextStudyAction } from '@/lib/dashboard-next-study-action';
import { getStudentMaterialRoute } from '@/lib/routes';

export type MaeveStudySpaceProps = {
  materials: StudentMaterial[];
  firstName?: string;
  initialUniversidadId?: string;
  initialCarreraId?: string;
  initialMateriaId?: string;
  initialExamDate?: string;
  initialSource?: string;
  trackingMateriaId?: string;
  initialOpen?: boolean;
  pendingReinforcementCount?: number;
  nextStudyAction?: DashboardNextStudyAction | null;
};

/**
 * Ship E client tree for /dashboard. Kept behind next/dynamic so the route
 * stays under the gzip performance budget (same pattern as LazyDashboardContent).
 */
export function MaeveStudySpace({
  materials,
  firstName,
  initialUniversidadId = '',
  initialCarreraId = '',
  initialMateriaId = '',
  initialExamDate = '',
  initialSource = '',
  trackingMateriaId = '',
  initialOpen = false,
  pendingReinforcementCount = 0,
  nextStudyAction = null,
}: MaeveStudySpaceProps) {
  const primaryMaterial =
    materials.find((material) => material.processing_status === 'ready') ?? materials[0] ?? null;
  const primaryMaterialHref = primaryMaterial ? getStudentMaterialRoute(primaryMaterial.id) : null;
  const primaryMaterialReady = primaryMaterial?.processing_status === 'ready';
  return (
    <PdfFirstUploadShell
      initialUniversidadId={initialUniversidadId}
      initialCarreraId={initialCarreraId}
      initialMateriaId={initialMateriaId}
      initialExamDate={initialExamDate}
      initialSource={initialSource}
      trackingMateriaId={trackingMateriaId}
      // El estado vacío ya tiene su propia zona de carga; no mostramos
      // automáticamente el diálogo inicial. Las cargas retomadas desde
      // la landing conservan su restauración tras el registro.
      initialOpen={initialOpen && (materials.length > 0 || initialSource.startsWith('pdf-first-landing') || initialSource.startsWith('home-pdf-first-'))}
    >
      {materials.length === 0 ? (
        <EmptyStudySpace firstName={firstName} />
      ) : (
      <MaeveDashboardChrome
        materialsCount={materials.length}
        primaryMaterialHref={primaryMaterialHref}
        primaryMaterialReady={primaryMaterialReady}
        pendingReinforcementCount={pendingReinforcementCount}
        nextStudyAction={nextStudyAction}
      >
        <StudentMaterialsWorkspace
          initialMaterials={materials}
        />
      </MaeveDashboardChrome>
      )}
    </PdfFirstUploadShell>
  );
}
