import { hasPremiumAccess } from '@/lib/premium';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

type StructuralAdminClient = {
  from: (table: string) => any;
};

export async function isStudentMaterialVisualAnalysisEnabled(materialId?: string) {
  if (!materialId) return false;

  try {
    const admin = createAdminClient() as unknown as StructuralAdminClient;
    const { data: material, error } = await admin
      .from('student_materials')
      .select('user_id, visual_analysis_enabled')
      .eq('id', materialId)
      .maybeSingle();

    if (error) throw error;
    if (!material?.user_id || material.visual_analysis_enabled !== true) {
      return false;
    }

    if (await hasPremiumAccess(String(material.user_id))) {
      return true;
    }

    const { data: entitlement, error: entitlementError } = await admin
      .from('student_material_visual_entitlements')
      .select('material_id')
      .eq('user_id', String(material.user_id))
      .eq('material_id', materialId)
      .maybeSingle();

    if (entitlementError) throw entitlementError;
    return entitlement?.material_id === materialId;
  } catch (error) {
    logError('studentMaterialVisualAnalysisPolicy.read', error, { materialId });
    return false;
  }
}
