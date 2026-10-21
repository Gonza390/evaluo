'use server';

import { revalidatePath } from 'next/cache';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { isUuid } from '@/lib/uuid';

export async function saveSimpleAcademicProfileAction(input: {
  universidadId: string;
  carreraId: string;
}) {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false as const, message: 'Iniciá sesión para guardar tus datos académicos.' };
    }

    const universidadId = String(input.universidadId ?? '').trim();
    const carreraId = String(input.carreraId ?? '').trim();
    if (!isUuid(universidadId) || !isUuid(carreraId)) {
      return { success: false as const, message: 'Seleccioná tu universidad y tu carrera.' };
    }

    const admin = createAdminClient();
    const [{ data: university, error: universityError }, { data: career, error: careerError }] = await Promise.all([
      admin.from('universidades')
        .select('id, approval_status, owner_user_id')
        .eq('id', universidadId)
        .maybeSingle(),
      admin.from('carreras')
        .select('id, universidad_id, approval_status, owner_user_id')
        .eq('id', carreraId)
        .maybeSingle(),
    ]);

    if (universityError) throw universityError;
    if (careerError) throw careerError;
    if (!university ||
        (university.approval_status !== 'approved' && university.owner_user_id !== user.id)) {
      return { success: false as const, message: 'No encontramos una universidad válida para tu cuenta.' };
    }
    if (!career || career.universidad_id !== universidadId ||
        (career.approval_status !== 'approved' && career.owner_user_id !== user.id)) {
      return { success: false as const, message: 'La carrera no corresponde a la universidad seleccionada.' };
    }

    const { error: saveError } = await supabase.from('profiles').upsert({
      id: user.id,
      universidad_id: universidadId,
      carrera_id: carreraId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (saveError) throw saveError;

    revalidatePath('/dashboard');
    revalidatePath('/completar-perfil');
    return { success: true as const, message: 'Universidad y carrera guardadas.' };
  } catch (error) {
    logError('academicProfile.saveSimple', error);
    return { success: false as const, message: 'No pudimos guardar tus datos. Intentá nuevamente.' };
  }
}
