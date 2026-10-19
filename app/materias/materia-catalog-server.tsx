import { MateriaCatalogClient } from './materia-catalog-client';
import { fetchCatalogContentSignalsRpc } from '@/lib/data/catalog-performance';
import { fetchSharedStudentMaterialsByCarrera } from '@/lib/data/student-materials';
import { createPublicClient } from '@/lib/supabase-public';
import { getMateriasByCarrera } from '@/services/api-server';

type CarreraData = {
  id: string;
  nombre: string;
  universidad_id?: string | null;
  descripcion?: string | null;
  nivel?: string | null;
  carga_horaria?: string | null;
  modalidad?: string | null;
  director?: string | null;
};

export async function MateriaCatalogServer({
  carreraId,
  carreraNombre,
  carreraData,
  universidadNombre,
  universidadId,
}: {
  carreraId: string;
  carreraNombre?: string;
  carreraData?: CarreraData;
  universidadNombre?: string;
  universidadId?: string;
}) {
  const publicClient = createPublicClient();
  const [materias, sharedStudentMaterials, contentSignals] = await Promise.all([
    getMateriasByCarrera(carreraId),
    fetchSharedStudentMaterialsByCarrera(publicClient, carreraId, 8),
    fetchCatalogContentSignalsRpc(publicClient),
  ]);

  return (
    <MateriaCatalogClient
      carreraId={carreraId}
      carreraNombre={carreraNombre}
      carreraData={carreraData}
      universidadNombre={universidadNombre}
      universidadId={universidadId}
      initialCatalog={{
        materias,
        sharedStudentMaterials,
        contentMateriaIds: contentSignals.contentMateriaIds,
        questionMateriaIds: contentSignals.questionMateriaIds,
      }}
    />
  );
}
