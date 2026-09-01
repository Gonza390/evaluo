'use server';

import { createClientServer } from '@/lib/supabase-server';
import { studentMaterialIdSchema } from '@/lib/student-materials/validation';

export async function updateStudentMaterialVisualAnalysisAction(input: {
  materialId: string;
  enabled: boolean;
}): Promise<{ success: boolean; message: string }> {
  const parsedId = studentMaterialIdSchema.safeParse(input.materialId);
  if (!parsedId.success) {
    return { success: false, message: 'El identificador del material no es válido.' };
  }

  const supabase = await createClientServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: 'Iniciá sesión para configurar el procesamiento.' };
  }

  const { data, error } = await supabase
    .from('student_materials')
    .update({ visual_analysis_enabled: input.enabled } as never)
    .eq('id', parsedId.data)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    return { success: false, message: 'No pudimos guardar la opción de análisis visual.' };
  }

  if (!data) {
    return { success: false, message: 'No encontramos el material para actualizarlo.' };
  }

  return {
    success: true,
    message: input.enabled
      ? 'Análisis visual activado para este PDF.'
      : 'Procesamiento estándar activado para este PDF.',
  };
}
