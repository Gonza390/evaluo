import { unstable_cache } from 'next/cache';
import MateriaList from '@/components/materia-list';
import { fetchSharedStudentMaterialsByCarrera } from '@/lib/data/student-materials';
import { fetchCatalogContentSignals } from '@/lib/data/catalog';
import { createPublicClient } from '@/lib/supabase-public';
import { getMateriasByCarrera } from '@/services/api-server';

const loadCatalogContentSignals = unstable_cache(
  () => fetchCatalogContentSignals(createPublicClient()),
  ['catalog-content-signals'],
  { revalidate: 600, tags: ['catalog-content-signals'] }
);

function normalizeMateriaName(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getBriefAiDescription(nombre: string) {
  const descriptions: Record<string, string> = {
    icse: 'Sociedad, Estado y procesos políticos para comprender la realidad social.',
    'introduccion al conocimiento de la sociedad y el estado':
      'Sociedad, Estado y procesos políticos para comprender la realidad social.',
    ipc: 'Pensamiento científico, métodos, argumentos y construcción del conocimiento.',
    'introduccion al pensamiento cientifico':
      'Pensamiento científico, métodos, argumentos y construcción del conocimiento.',
    'fisica e introduccion a la biofisica':
      'Principios físicos aplicados a fenómenos biológicos y al cuerpo humano.',
    'biologia e introduccion a la biologia celular':
      'Bases de biología celular, organización y procesos fundamentales de la vida.',
    matematica: 'Herramientas matemáticas para razonar y resolver problemas.',
    quimica: 'Materia, reacciones y fundamentos químicos aplicados a ciencias de la salud.',
  };

  return descriptions[normalizeMateriaName(nombre)] ?? null;
}

export async function MateriaCatalogSection({
  carreraId,
  carreraNombre,
  carreraData,
  universidadNombre,
  universidadId,
}: {
  carreraId: string;
  carreraNombre?: string;
  carreraData?: {
    id: string;
    nombre: string;
    universidad_id?: string | null;
    descripcion?: string | null;
    nivel?: string | null;
    carga_horaria?: string | null;
    modalidad?: string | null;
    director?: string | null;
  };
  universidadNombre?: string;
  universidadId?: string;
}) {
  const publicClient = createPublicClient();
  const [loadedMaterias, sharedStudentMaterials, contentSignals] = await Promise.all([
    getMateriasByCarrera(carreraId),
    fetchSharedStudentMaterialsByCarrera(publicClient, carreraId, 8),
    loadCatalogContentSignals(),
  ]);

  const materias = loadedMaterias.map((materia) => {
    const descripcion = getBriefAiDescription(materia.nombre);
    return descripcion ? { ...materia, descripcion } : materia;
  });

  const clientCarreraData = carreraData
    ? {
        id: carreraData.id,
        nombre: carreraData.nombre,
        universidad_id: carreraData.universidad_id ?? null,
        ...(carreraData.descripcion ? { descripcion: carreraData.descripcion } : {}),
        ...(carreraData.nivel ? { nivel: carreraData.nivel } : {}),
        ...(carreraData.carga_horaria ? { carga_horaria: carreraData.carga_horaria } : {}),
        ...(carreraData.modalidad ? { modalidad: carreraData.modalidad } : {}),
        ...(carreraData.director ? { director: carreraData.director } : {}),
      }
    : undefined;

  return (
    <div className="materia-list-catalog-only">
      <MateriaList
        initialMaterias={materias}
        carreraId={carreraId}
        carreraNombre={carreraNombre}
        carreraData={clientCarreraData}
        universidadNombre={universidadNombre}
        universidadId={universidadId}
        sharedStudentMaterials={sharedStudentMaterials}
        contentMateriaIds={contentSignals.contentMateriaIds}
        questionMateriaIds={contentSignals.questionMateriaIds}
      />
    </div>
  );
}
