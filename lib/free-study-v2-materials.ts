import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { isFreeStudyV2Active } from '@/lib/free-study-v2';

/** Incluye materiales exitosos borrados; un archivo fallido no consume. */
export async function historicalFreeStudyMaterialIds(userId: string): Promise<string[]> {
  if (!isFreeStudyV2Active()) return [];
  const { data, error } = await createAdminClient()
    .from('free_study_v2_material_claims' as never)
    .select('material_id')
    .eq('user_id', userId);
  if (error) throw new Error('No pudimos verificar el historial de archivos gratuitos.');
  return (data ?? []).map(row => (row as { material_id: string }).material_id);
}
