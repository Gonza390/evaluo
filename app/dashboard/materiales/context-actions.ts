'use server';

import { z } from 'zod';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';

const examContextSchema = z.object({
  materialId: z.string().uuid(),
  examInstance: z.enum(['parcial_1', 'parcial_2', 'final', 'otro']).nullable().optional(),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export async function saveStudentMaterialExamContextAction(input: {
  materialId: string;
  examInstance?: 'parcial_1' | 'parcial_2' | 'final' | 'otro' | null;
  examDate?: string | null;
}) {
  try {
    const parsed = examContextSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: 'La información del examen no es válida.' };
    }

    const supabase = await createClientServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: 'Iniciá sesión para guardar esta información.' };
    }

    const admin = createAdminClient();
    const { data: ownedMaterial, error: ownedMaterialError } = await admin
      .from('student_materials')
      .select('id,materia_id')
      .eq('id', parsed.data.materialId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (ownedMaterialError) throw ownedMaterialError;
    if (!ownedMaterial) {
      return { success: false, message: 'No encontramos el material para guardar el examen.' };
    }

    const { data, error } = await admin
      .from('student_materials')
      .update({
        exam_instance: parsed.data.examInstance ?? null,
        exam_date: parsed.data.examDate || null,
      } as never)
      .eq('id', parsed.data.materialId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { success: false, message: 'No encontramos el material para guardar el examen.' };
    }

    const updatedAt = new Date().toISOString();
    const { error: unlinkError } = await admin
      .from('study_calendar_events')
      .update({ material_id: null, updated_at: updatedAt })
      .eq('user_id', user.id)
      .eq('material_id', parsed.data.materialId);

    if (unlinkError) throw unlinkError;

    if (parsed.data.examDate && ownedMaterial.materia_id) {
      const { error: linkError } = await admin
        .from('study_calendar_events')
        .update({ material_id: parsed.data.materialId, updated_at: updatedAt })
        .eq('user_id', user.id)
        .eq('event_type', 'exam')
        .eq('materia_id', ownedMaterial.materia_id)
        .eq('event_date', parsed.data.examDate);

      if (linkError) throw linkError;
    }

    return { success: true, message: 'Contexto del examen guardado.' };
  } catch (error) {
    logError('studentMaterials.saveExamContext', error);
    return { success: false, message: 'No pudimos guardar la información del examen.' };
  }
}
