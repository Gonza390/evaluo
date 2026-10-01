'use client';

import dynamic from 'next/dynamic';

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

function MateriaCatalogPlaceholder() {
  return (
    <div className="bg-white" aria-busy="true" aria-label="Preparando plan de estudios">
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

const MateriaCatalogClientLazy = dynamic(
  () =>
    import('./materia-catalog-client').then((module) => module.MateriaCatalogClient),
  { loading: MateriaCatalogPlaceholder }
);

export function DeferredMateriaCatalog({
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
  return (
    <MateriaCatalogClientLazy
      carreraId={carreraId}
      carreraNombre={carreraNombre}
      carreraData={carreraData}
      universidadNombre={universidadNombre}
      universidadId={universidadId}
    />
  );
}
