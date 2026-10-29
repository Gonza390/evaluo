'use server';

import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  FIRST_PDF_ONBOARDING_COMPLETED_KEY,
  FIRST_PDF_ONBOARDING_SKIPPED_KEY,
} from '@/lib/first-pdf-onboarding';

/**
 * User-level, server-owned completion flag. Persists across URLs, materials,
 * browsers and devices. Skipping has a separate persistent user preference.
 */
export async function completeFirstPdfOnboardingAction(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, message: 'Iniciá sesión nuevamente.' };

    // Read current server-owned metadata rather than copying potentially stale
    // metadata from the session into an administrative auth update.
    const admin = createAdminClient();
    const { data: current, error: lookupError } = await admin.auth.admin.getUserById(user.id);
    if (lookupError || !current.user) throw lookupError ?? new Error('missing_auth_user');
    if (current.user.app_metadata?.[FIRST_PDF_ONBOARDING_COMPLETED_KEY]) {
      return { success: true };
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(current.user.app_metadata ?? {}),
        [FIRST_PDF_ONBOARDING_COMPLETED_KEY]: new Date().toISOString(),
      },
    });
    if (error) throw error;
    return { success: true };
  } catch {
    return { success: false, message: 'No pudimos guardar tu progreso del recorrido. Intentá nuevamente.' };
  }
}

/**
 * A voluntary skip persists across sessions and devices.
 * It does not mark the walkthrough as completed.
 */
export async function skipFirstPdfOnboardingAction(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, message: 'Iniciá sesión nuevamente.' };

    const admin = createAdminClient();
    const { data: current, error: lookupError } = await admin.auth.admin.getUserById(user.id);
    if (lookupError || !current.user) throw lookupError ?? new Error('missing_auth_user');
    if (
      current.user.app_metadata?.[FIRST_PDF_ONBOARDING_SKIPPED_KEY] ||
      current.user.app_metadata?.[FIRST_PDF_ONBOARDING_COMPLETED_KEY]
    ) return { success: true };

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(current.user.app_metadata ?? {}),
        [FIRST_PDF_ONBOARDING_SKIPPED_KEY]: new Date().toISOString(),
      },
    });
    if (error) throw error;
    return { success: true };
  } catch {
    return {
      success: false,
      message: 'No pudimos guardar tu preferencia. Podés seguir estudiando normalmente.',
    };
  }
}
