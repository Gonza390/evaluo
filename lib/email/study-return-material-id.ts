import { isUuid } from '@/lib/uuid';

type MaterialReference = {
  metadata: Record<string, unknown> | null;
  path: string | null;
};

/**
 * La demo publica eventos con material_id="demo-material". Nunca debe
 * terminar dentro de una consulta .in('id', ids) sobre una columna UUID.
 */
export function getRealStudyMaterialId(event: MaterialReference): string | null {
  const metadataId = event.metadata?.material_id;
  if (typeof metadataId === 'string' && isUuid(metadataId)) {
    return metadataId;
  }

  const pathId = event.path?.match(/^\/materiales\/([^/?#]+)/)?.[1];
  return isUuid(pathId) ? pathId! : null;
}
