import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { freeUploadPeriod, isFreeStudyV2Active } from '@/lib/free-study-v2';

/**
 * Apuntes Free reclamados en el mes actual (hora de Argentina), bajo Free V2.
 * Los PDFs previos al lanzamiento no consumen cupo. Un material ya
 * reclamado sigue contando en su mes aunque se elimine.
 */
export async function freeStudyMaterialIdsThisMonth(userId: string): Promise<string[]> {
  if (!isFreeStudyV2Active()) return [];
  const { data, error } = await createAdminClient()
    .from('free_study_v2_monthly_upload_claims' as never)
    .select('material_id')
    .eq('user_id', userId)
    .eq('period', freeUploadPeriod())
    .maybeSingle();
  if (error) throw new Error('No pudimos verificar el historial de archivos gratuitos.');
  const materialId = (data as { material_id?: string } | null)?.material_id;
  return materialId ? [materialId] : [];
}
