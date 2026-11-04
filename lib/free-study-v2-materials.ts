import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { isFreeStudyV2Active } from '@/lib/free-study-v2';

/** El primer material procesado sigue contando aun si se elimina el archivo. */
export async function historicalFreeStudyMaterialIds(userId: string): Promise<string[]> {
  if (!isFreeStudyV2Active()) return [];
  const { data, error } = await createAdminClient()
    .from('free_study_v2_upload_claims' as never)
    .select('first_material_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('No pudimos verificar el historial de archivos gratuitos.');
  const materialId = (data as { first_material_id?: string } | null)?.first_material_id;
  return materialId ? [materialId] : [];
}
