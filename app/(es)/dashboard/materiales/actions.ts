'use server';

import { revalidatePath } from 'next/cache';
import { recoverStaleStudentMaterialJobs } from '@/lib/student-material-jobs';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { getFirstReadyStudentMaterialId } from '@/lib/data/student-materials';
import type { StudentMaterialProcessingStage } from '@/lib/student-materials/processing-service';
import {
  getValidationMessage,
  studentMaterialIdSchema,
  studentMaterialVisibilityInputSchema,
} from '@/lib/student-materials/validation';
import { buildStudentMaterialThumbnailPath } from '@/lib/student-materials/thumbnail-path';

type ActionResult = {
  success: boolean;
  message: string;
};

export type { StudentMaterialProcessingStage } from '@/lib/student-materials/processing-service';

export type StudentMaterialProcessingState = {
  materialId: string;
  title: string;
  fileName: string;
  status: string;
  stage: StudentMaterialProcessingStage;
  progress: number;
  message: string;
  error: string | null;
  isFirstReadyMaterial?: boolean;
};

function isMissingStudentMaterialsTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code ?? '') : '';
  const message = 'message' in error ? String(error.message ?? '') : '';

  return code === '42P01' || message.toLowerCase().includes('student_materials');
}

function getStudentMaterialsSetupMessage() {
  return 'Falta aplicar la migración de student_materials en Supabase. Sin esa tabla, este espacio todavía no puede guardar ni listar PDFs.';
}

async function requireAuthenticatedUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Inicia sesión para gestionar tu espacio de estudio.');
  }

  return user;
}

export async function getStudentMaterialProcessingStateAction(
  materialId: string
): Promise<StudentMaterialProcessingState | null> {
  try {
    if (!studentMaterialIdSchema.safeParse(materialId).success) {
      return null;
    }
    const user = await requireAuthenticatedUser();
    const supabase = await createClientServer();

    const { data: initialData, error } = await supabase
      .from('student_materials')
      .select(
        'id, user_id, title, file_name, processing_status, processing_stage, processing_progress, processing_message, processing_error'
      )
      .eq('id', materialId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!initialData) {
      return null;
    }

    let data = initialData;
    if (data.processing_status === 'processing') {
      const admin = createAdminClient();
      const recovered = await recoverStaleStudentMaterialJobs(admin, materialId);
      if (recovered.includes(materialId)) {
        const refreshed = await supabase
          .from('student_materials')
          .select(
            'id, user_id, title, file_name, processing_status, processing_stage, processing_progress, processing_message, processing_error'
          )
          .eq('id', materialId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (refreshed.error) throw refreshed.error;
        if (refreshed.data) data = refreshed.data;
      }
    }

    return {
      materialId: data.id,
      title: data.title,
      fileName: data.file_name,
      status: data.processing_status,
      stage: (data.processing_stage as StudentMaterialProcessingStage) ?? 'uploaded',
      progress: Number(data.processing_progress ?? 0),
      message: data.processing_message ?? 'Procesando material...',
      error: data.processing_error ?? null,
      isFirstReadyMaterial:
        data.processing_status === 'ready'
          ? (await getFirstReadyStudentMaterialId(supabase, user.id)) === data.id
          : undefined,
    };
  } catch (error) {
    if (!isMissingStudentMaterialsTableError(error)) {
      logError('studentMaterials.processingState', error, { materialId });
    }
    return null;
  }
}

export async function updateStudentMaterialVisibilityAction(input: {
  materialId: string;
  visibility: 'private' | 'shared';
}): Promise<ActionResult> {
  try {
    const parsedInput = studentMaterialVisibilityInputSchema.safeParse(input);
    if (!parsedInput.success) {
      return { success: false, message: getValidationMessage(parsedInput.error) };
    }

    const user = await requireAuthenticatedUser();
    const supabase = await createClientServer();

    const { data, error } = await supabase
      .from('student_materials')
      .update({ visibility: parsedInput.data.visibility })
      .eq('id', parsedInput.data.materialId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return { success: false, message: 'No encontramos el material solicitado.' };
    }

    revalidatePath('/dashboard/materiales');

    return {
      success: true,
      message:
        parsedInput.data.visibility === 'shared'
          ? 'Tu PDF ahora se muestra en la materia y la carrera.'
          : 'Tu PDF quedó solo en tu espacio privado.',
    };
  } catch (error) {
    return {
      success: false,
      message: isMissingStudentMaterialsTableError(error)
        ? getStudentMaterialsSetupMessage()
        : error instanceof Error
          ? error.message
          : 'No pudimos actualizar la visibilidad del material.',
    };
  }
}

export async function deleteStudentMaterialAction(materialId: string): Promise<ActionResult> {
  try {
    if (!studentMaterialIdSchema.safeParse(materialId).success) {
      return { success: false, message: 'El identificador del material no es valido.' };
    }

    const user = await requireAuthenticatedUser();
    const admin = createAdminClient();

    const { data: material, error: fetchError } = await admin
      .from('student_materials')
      .select('id, file_path')
      .eq('id', materialId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!material) {
      return { success: false, message: 'No encontramos el material solicitado.' };
    }

    const { error: deleteError } = await admin
      .from('student_materials')
      .delete()
      .eq('id', material.id)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    if (material.file_path) {
      await admin.storage
        .from('biblioteca')
        .remove([
          material.file_path,
          buildStudentMaterialThumbnailPath(material.file_path),
        ])
        .catch(() => undefined);
    }

    revalidatePath('/dashboard/materiales');

    return {
      success: true,
      message: 'El PDF y su espacio de estudio se eliminaron correctamente.',
    };
  } catch (error) {
    return {
      success: false,
      message: isMissingStudentMaterialsTableError(error)
        ? getStudentMaterialsSetupMessage()
        : error instanceof Error
          ? error.message
          : 'No pudimos eliminar el material en este momento.',
    };
  }
}

export type FlashcardRecall = 'known' | 'unknown';
export type FlashcardVote = 'up' | 'down';

export type FlashcardProgress = {
  recall: Record<number, FlashcardRecall>;
  votes: Record<number, FlashcardVote>;
};

export async function getFlashcardProgressAction(
  materialId: string
): Promise<{ success: boolean; progress: FlashcardProgress }> {
  try {
    if (!studentMaterialIdSchema.safeParse(materialId).success) {
      return { success: false, progress: { recall: {}, votes: {} } };
    }

    const user = await requireAuthenticatedUser();
    const supabase = await createClientServer();

    const { data, error } = await supabase
      .from('student_material_flashcard_progress')
      .select('card_index, recall, vote')
      .eq('user_id', user.id)
      .eq('student_material_id', materialId);

    if (error) {
      throw error;
    }

    const recall: Record<number, FlashcardRecall> = {};
    const votes: Record<number, FlashcardVote> = {};
    for (const row of data ?? []) {
      if (row.recall === 'known' || row.recall === 'unknown') {
        recall[row.card_index] = row.recall;
      }
      if (row.vote === 'up' || row.vote === 'down') {
        votes[row.card_index] = row.vote;
      }
    }

    return { success: true, progress: { recall, votes } };
  } catch (error) {
    // Pasar el error real para conservar el código PostgreSQL y el mensaje en logs.
    logError('flashcard_progress_load', error, { materialId });
    return { success: false, progress: { recall: {}, votes: {} } };
  }
}

export async function saveFlashcardProgressAction(
  materialId: string,
  entries: Array<{
    cardIndex: number;
    recall?: FlashcardRecall | null;
    vote?: FlashcardVote | null;
  }>
): Promise<ActionResult> {
  try {
    if (!studentMaterialIdSchema.safeParse(materialId).success) {
      return { success: false, message: 'El identificador del material no es valido.' };
    }

    const user = await requireAuthenticatedUser();
    const supabase = await createClientServer();

    const rows = entries.map((entry) => ({
      user_id: user.id,
      student_material_id: materialId,
      card_index: entry.cardIndex,
      recall: entry.recall ?? null,
      vote: entry.vote ?? null,
    }));

    const { error } = await supabase
      .from('student_material_flashcard_progress')
      .upsert(rows, { onConflict: 'user_id,student_material_id,card_index' });

    if (error) {
      throw error;
    }

    return { success: true, message: 'Progreso guardado.' };
  } catch (error) {
    logError('flashcard_progress_save', error, { materialId });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos guardar el progreso.',
    };
  }
}
