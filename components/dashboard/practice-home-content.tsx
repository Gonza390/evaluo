'use client';

import { useEffect } from 'react';
import { useMaterialCatalog } from '@/components/materials/material-catalog-provider';
import { PracticeModePicker } from '@/components/dashboard/practice-mode-picker';

export function PracticeHomeContent({ requestedMaterialId, advancedPracticeEnabled }: {
  requestedMaterialId: string | null;
  advancedPracticeEnabled: boolean;
}) {
  const { materials, loading, error, refresh } = useMaterialCatalog();
  useEffect(() => {
    if (materials === null && !loading && !error) void refresh();
  }, [materials, loading, error, refresh]);

  if (materials === null) {
    return (
      <main role="status" className="mx-auto w-full max-w-[1190px] px-5 py-8 text-sm text-[#66758D]">
        {error ? (
          <div>
            <p>No pudimos cargar tus materiales.</p>
            <button className="mt-3 rounded-xl border px-4 py-2 text-[#456DBD]" onClick={() => void refresh()}>
              Reintentar
            </button>
          </div>
        ) : 'Cargando tus materiales…'}
      </main>
    );
  }
  return <PracticeModePicker
    key={requestedMaterialId ?? 'practice'}
    materials={materials}
    initialMaterialId={requestedMaterialId}
    advancedPracticeEnabled={advancedPracticeEnabled}
  />;
}
