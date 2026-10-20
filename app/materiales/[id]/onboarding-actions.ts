'use server';

import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { FIRST_PDF_ONBOARDING_COMPLETED_KEY } from '@/lib/first-pdf-onboarding';

/**
 * User-level, server-owned completion flag. Persists across URLs, materials,
 * browsers and devices; skipping the guide never sets this value.
 */
export async function completeFirstPdfOnboardingAction(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, message: 'Iniciá sesión nuevamente.' };

    if (user.app_metadata?.[FIRST_PDF_ONBOARDING_COMPLETED_KEY]) {
      return { success: true };
    }

    // Only the server-side service-role client can modify auth.app_metadata.
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        [FIRST_PDF_ONBOARDING_COMPLETED_KEY]: new Date().toISOString(),
      },
    });
    if (error) throw error;
    return { success: true };
  } catch {
    return { success: false, message: 'No pudimos guardar tu progreso del recorrido. Intentá nuevamente.' };
  }
}
