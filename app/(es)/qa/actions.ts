'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { isQaAccount } from '@/lib/qa-account';
import {
  FIRST_PDF_ONBOARDING_COMPLETED_KEY,
  FIRST_PDF_ONBOARDING_SKIPPED_KEY,
} from '@/lib/first-pdf-onboarding';

/**
 * Reinicio NO destructivo para la cuenta QA: conserva los PDFs y el historial.
 * Permite reproducir desde Mi espacio el formulario y la guía de primer PDF.
 */
export async function restartQaFirstPdfOnboardingAction() {
  const supabase = await createClientServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !isQaAccount(user)) {
    throw new Error('Esta operación está reservada para la cuenta de pruebas.');
  }

  const admin = createAdminClient();
  const { data: current, error: lookupError } = await admin.auth.admin.getUserById(user!.id);
  if (lookupError || !isQaAccount(current.user)) {
    throw new Error('No pudimos validar la cuenta de pruebas.');
  }

  // El perfil académico se puede completar de nuevo sin tocar los materiales.
  const { error: profileError } = await admin
    .from('profiles')
    .update({ universidad_id: null, carrera_id: null, updated_at: new Date().toISOString() })
    .eq('id', user!.id);
  if (profileError) throw profileError;

  // No modificamos fecha de alta, rol, proveedores OAuth ni otras marcas de Auth.
  const metadata = { ...(current.user!.app_metadata ?? {}) };
  delete metadata[FIRST_PDF_ONBOARDING_COMPLETED_KEY];
  delete metadata[FIRST_PDF_ONBOARDING_SKIPPED_KEY];
  const { error: updateError } = await admin.auth.admin.updateUserById(user!.id, {
    app_metadata: metadata,
  });
  if (updateError) throw updateError;

  redirect('/dashboard?openUpload=1&source=qa-onboarding');
}
