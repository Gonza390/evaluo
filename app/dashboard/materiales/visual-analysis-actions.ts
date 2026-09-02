'use server';

import { hasPremiumAccess } from '@/lib/premium';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { studentMaterialIdSchema } from '@/lib/student-materials/validation';

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

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('free_visual_analysis_used_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('No encontramos tu perfil para verificar el beneficio visual.');

  const used = Boolean(
    (data as { free_visual_analysis_used_at?: string | null }).free_visual_analysis_used_at
  );

  return {
    isPremium: false,
    allowed: !used,
    remaining: used ? 0 : 1,
  };
}

async function claimFreeVisualAnalysisUse(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .update({ free_visual_analysis_used_at: new Date().toISOString() } as never)
    .eq('id', userId)
    .is('free_visual_analysis_used_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function releaseFreeVisualAnalysisUse(userId: string) {
  const admin = createAdminClient();
  await admin
    .from('profiles')
    .update({ free_visual_analysis_used_at: null } as never)
    .eq('id', userId);
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
    const admin = createAdminClient();
    const { data: material, error: materialError } = await admin
      .from('student_materials')
      .select('id, visual_analysis_enabled')
      .eq('id', parsedId.data)
      .eq('user_id', user.id)
      .maybeSingle();

    if (materialError) throw materialError;
    if (!material) {
      return { success: false, message: 'No encontramos el material para actualizarlo.' };
    }

    const alreadyEnabled = Boolean(
      (material as { visual_analysis_enabled?: boolean }).visual_analysis_enabled
    );

    let claimedFreeUse = false;
    if (input.enabled && !alreadyEnabled) {
      const quota = await getVisualAnalysisQuotaForUser(user.id);

      if (!quota.isPremium) {
        claimedFreeUse = await claimFreeVisualAnalysisUse(user.id);
        if (!claimedFreeUse) {
          return {
            success: false,
            message:
              'Ya usaste tu único análisis visual gratuito. Premium incluye análisis de imágenes, gráficos y diagramas sin límite.',
          };
        }
      }
    }

    const { data, error } = await admin
      .from('student_materials')
      .update({ visual_analysis_enabled: input.enabled } as never)
      .eq('id', parsedId.data)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      if (claimedFreeUse) {
        await releaseFreeVisualAnalysisUse(user.id).catch(() => undefined);
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
