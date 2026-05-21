import { Suspense } from 'react';
import { ExplorarClient } from './explorar-client';
import { fetchExplorarUniversidades } from './data';

export const dynamic = 'force-dynamic';

export default async function ExplorarPage() {
  const initialUniversidades = await fetchExplorarUniversidades();

  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <ExplorarClient initialUniversidades={initialUniversidades} />
    </Suspense>
  );
}
