'use client';

import { useEffect, useState } from 'react';
import MateriaList from '@/components/materia-list';
import { supabase } from '@/lib/supabase-client';
import { fetchCatalogContentSignalsRpc } from '@/lib/data/catalog-performance';
import {
  fetchSharedStudentMaterialsByCarrera,
  type StudentMaterial,
} from '@/lib/data/student-materials';
import { getMateriasByCarrera, type Materia } from '@/services/api';

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

type CatalogState = {
  materias: Materia[];
  sharedStudentMaterials: StudentMaterial[];
  contentMateriaIds: string[];
  questionMateriaIds: string[];
};

function MateriaCatalogFallback() {
  return (
    <div className="bg-white" aria-busy="true" aria-label="Cargando plan de estudios">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-2 py-3 sm:flex sm:gap-6">
            <div className="h-11 rounded-xl bg-slate-100 sm:w-32" />
            <div className="h-11 rounded-xl bg-slate-100 sm:w-28" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-7 w-44 animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 sm:w-72" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[184px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MateriaCatalogClient({
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
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setCatalog(null);
    setFailed(false);

    void Promise.all([
      getMateriasByCarrera(carreraId),
      fetchSharedStudentMaterialsByCarrera(supabase, carreraId, 8),
      fetchCatalogContentSignalsRpc(supabase),
    ])
      .then(([materias, sharedStudentMaterials, contentSignals]) => {
        if (!active) return;
        setCatalog({
          materias,
          sharedStudentMaterials,
          contentMateriaIds: contentSignals.contentMateriaIds,
          questionMateriaIds: contentSignals.questionMateriaIds,
        });
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [attempt, carreraId]);

  if (failed) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">No pudimos cargar el plan de estudios.</p>
          <p className="mt-1 text-sm text-slate-600">Probá nuevamente en unos segundos.</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!catalog) {
    return <MateriaCatalogFallback />;
  }

  return (
    <div className="materia-list-catalog-only">
      <MateriaList
        initialMaterias={catalog.materias}
        carreraId={carreraId}
        carreraNombre={carreraNombre}
        carreraData={carreraData}
        universidadNombre={universidadNombre}
        universidadId={universidadId}
        sharedStudentMaterials={catalog.sharedStudentMaterials}
        contentMateriaIds={catalog.contentMateriaIds}
        questionMateriaIds={catalog.questionMateriaIds}
      />
    </div>
  );
}
