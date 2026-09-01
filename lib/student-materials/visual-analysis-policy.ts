import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

type StructuralAdminClient = {
  from: (table: string) => any;
};

export async function isStudentMaterialVisualAnalysisEnabled(materialId?: string) {
  if (!materialId) return false;

  try {
    const admin = createAdminClient() as unknown as StructuralAdminClient;
    const { data, error } = await admin
      .from('student_materials')
      .select('visual_analysis_enabled')
      .eq('id', materialId)
      .maybeSingle();

    if (error) throw error;
    return data?.visual_analysis_enabled === true;
  } catch (error) {
    logError('studentMaterialVisualAnalysisPolicy.read', error, { materialId });
    return false;
  }
}
