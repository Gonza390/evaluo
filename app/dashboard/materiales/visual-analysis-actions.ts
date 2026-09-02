'use server';

import { hasPremiumAccess } from '@/lib/premium';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { studentMaterialIdSchema } from '@/lib/student-materials/validation';

type StructuralAdminClient = {
  from: (table: string) => any;
};

export type StudentMaterialVisualAnalysisQuota = {
  isPremium: boolean;
  allowed: boolean;
  remaining: number | null;
};

type VisualAnalysisQuotaResult = {
  success: boolean;
  message: string;
  quota?: StudentMaterialVisualAnalysisQuota;
};

async function requireAuthenticatedUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Iniciá sesión para configurar el procesamiento.');
  }

  return user;
}

function getStructuralAdmin() {
  return createAdminClient() as unknown as StructuralAdminClient;
}

async function getFreeVisualEntitlement(userId: string) {
  const admin = getStructuralAdmin();
  const { data, error } = await admin
    .from('student_material_visual_entitlements')
    .select('material_id, granted_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as { material_id?: string; granted_at?: string } | null;
}

async function getVisualAnalysisQuotaForUser(
  userId: string
): Promise<StudentMaterialVisualAnalysisQuota> {
  const isPremium = await hasPremiumAccess(userId);
  if (isPremium) {
    return {
      isPremium: true,
      allowed: true,
      remaining: null,
    };
  }

  const entitlement = await getFreeVisualEntitlement(userId);
  return {
    isPremium: false,
    allowed: !entitlement,
    remaining: entitlement ? 0 : 1,
  };
}

async function claimFreeVisualAnalysisUse(userId: string, materialId: string) {
  const existing = await getFreeVisualEntitlement(userId);
  if (existing) {
    return {
      granted: existing.material_id === materialId,
      inserted: false,
    };
  }

  const admin = getStructuralAdmin();
  const { data, error } = await admin
    .from('student_material_visual_entitlements')
    .insert({ user_id: userId, material_id: materialId })
    .select('user_id')
    .maybeSingle();

  if (error) {
    if (String(error.code ?? '') === '23505') {
      return { granted: false, inserted: false };
    }
    throw error;
  }

  return { granted: Boolean(data), inserted: Boolean(data) };
}

async function releaseFreeVisualAnalysisUse(userId: string, materialId: string) {
  const admin = getStructuralAdmin();
  await admin
    .from('student_material_visual_entitlements')
    .delete()
    .eq('user_id', userId)
    .eq('material_id', materialId);
}

export async function getStudentMaterialVisualAnalysisQuotaAction(): Promise<VisualAnalysisQuotaResult> {
  try {
    const user = await requireAuthenticatedUser();
    const quota = await getVisualAnalysisQuotaForUser(user.id);

    return {
      success: true,
      message: quota.isPremium
        ? 'Premium incluye análisis visual sin límite.'
        : quota.allowed
          ? 'Tenés 1 análisis visual gratuito disponible.'
          : 'Ya usaste tu análisis visual gratuito.',
      quota,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'No pudimos verificar tu disponibilidad de análisis visual.',
    };
  }
}

export async function updateStudentMaterialVisualAnalysisAction(input: {
  materialId: string;
  enabled: boolean;
}): Promise<{ success: boolean; message: string }> {
  const parsedId = studentMaterialIdSchema.safeParse(input.materialId);
  if (!parsedId.success) {
    return { success: false, message: 'El identificador del material no es válido.' };
  }

  try {
    const user = await requireAuthenticatedUser();
    const admin = getStructuralAdmin();
    const { data: material, error: materialError } = await admin
      .from('student_materials')
      .select('id')
      .eq('id', parsedId.data)
      .eq('user_id', user.id)
      .maybeSingle();

    if (materialError) throw materialError;
    if (!material) {
      return { success: false, message: 'No encontramos el material para actualizarlo.' };
    }

    let insertedFreeEntitlement = false;
    if (input.enabled) {
      const isPremium = await hasPremiumAccess(user.id);

      if (!isPremium) {
        const claim = await claimFreeVisualAnalysisUse(user.id, parsedId.data);
        if (!claim.granted) {
          return {
            success: false,
            message:
              'Ya usaste tu único análisis visual gratuito. Premium incluye análisis de imágenes, gráficos y diagramas sin límite.',
          };
        }
        insertedFreeEntitlement = claim.inserted;
      }
    }

    const { data, error } = await admin
      .from('student_materials')
      .update({ visual_analysis_enabled: input.enabled })
      .eq('id', parsedId.data)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      if (insertedFreeEntitlement) {
        await releaseFreeVisualAnalysisUse(user.id, parsedId.data).catch(() => undefined);
      }

      return {
        success: false,
        message: error
          ? 'No pudimos guardar la opción de análisis visual.'
          : 'No encontramos el material para actualizarlo.',
      };
    }

    return {
      success: true,
      message: input.enabled
        ? 'Análisis visual activado para este PDF.'
        : 'Procesamiento estándar activado para este PDF.',
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'No pudimos guardar la opción de análisis visual.',
    };
  }
}
