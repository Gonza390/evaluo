'use server';

import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/supabase';
import type { StudyDocumentAnalysis } from '@/lib/student-material-summary';
import {
  claimNextQueuedStudentMaterialJob,
  claimStudentMaterialJob,
  enqueueStudentMaterialJob,
  failStudentMaterialJob,
} from '@/lib/student-material-jobs';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { resolveAdminActor } from '@/lib/access-control';
import {
  markStudentMaterialProcessingFailed,
  processStudentMaterial,
  type StudentMaterialProcessingStage,
} from '@/lib/student-materials/processing-service';
import {
  getValidationMessage,
  studentMaterialIdSchema,
  studentMaterialVisibilityInputSchema,
} from '@/lib/student-materials/validation';

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
};

function isMissingStudentMaterialsTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code ?? '') : '';
  const message = 'message' in error ? String(error.message ?? '') : '';

  return code === '42P01' || message.toLowerCase().includes('student_materials');
}

function isMissingStudentMaterialAnalysisColumnError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = 'message' in error ? String(error.message ?? '').toLowerCase() : '';
  return message.includes('processing_strategy') || message.includes('document_analysis');
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

async function assertOwnedStudentMaterial(materialId: string, userId: string) {
  const supabase = await createClientServer();
  const { data, error } = await supabase
    .from('student_materials')
    .select('id')
    .eq('id', materialId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('No encontramos el material solicitado.');
  }
}

async function updateStudentMaterialProcessing(
  materialId: string,
  input: {
    processingStatus: 'uploaded' | 'processing' | 'ready' | 'failed';
    processingStage: StudentMaterialProcessingStage;
    processingProgress: number;
    processingMessage: string;
    processingError?: string | null;
    pageCount?: number | null;
    processingStrategy?: string | null;
    documentAnalysis?: StudyDocumentAnalysis | null;
  }
) {
  const admin = createAdminClient();
  const payload: Database['public']['Tables']['student_materials']['Update'] = {
    processing_status: input.processingStatus,
    processing_stage: input.processingStage,
    processing_progress: input.processingProgress,
    processing_message: input.processingMessage,
    processing_error: input.processingError ?? null,
  };

  if (typeof input.pageCount !== 'undefined') {
    payload.page_count = input.pageCount;
  }

  if (typeof input.processingStrategy !== 'undefined') {
    payload.processing_strategy = input.processingStrategy;
  }

  if (typeof input.documentAnalysis !== 'undefined') {
    payload.document_analysis = input.documentAnalysis;
  }

  let { error } = await admin.from('student_materials').update(payload).eq('id', materialId);

  if (error && isMissingStudentMaterialAnalysisColumnError(error)) {
    delete payload.processing_strategy;
    delete payload.document_analysis;
    ({ error } = await admin.from('student_materials').update(payload).eq('id', materialId));
  }

  if (error) {
    throw error;
  }
}

export async function processStudentMaterialAction(materialId: string): Promise<ActionResult> {
  let claimedJobId: string | null = null;

  try {
    if (!studentMaterialIdSchema.safeParse(materialId).success) {
      return { success: false, message: 'El identificador del material no es valido.' };
    }
    const user = await requireAuthenticatedUser();
    await assertOwnedStudentMaterial(materialId, user.id);
    const admin = createAdminClient();
    const queuedJobId = await enqueueStudentMaterialJob(admin, materialId);
    const claimedJob = await claimStudentMaterialJob(admin, materialId);
    if (!claimedJob) {
      if (!queuedJobId) {
        return await processStudentMaterial({
          materialId,
          ownerUserId: user.id,
          jobId: null,
        });
      }

      return {
        success: true,
        message: 'El material ya está en cola o en procesamiento.',
      };
    }

    claimedJobId = claimedJob.id;

    return await processStudentMaterial({
      materialId,
      ownerUserId: user.id,
      jobId: claimedJobId,
    });
  } catch (error) {
    logError('studentMaterials.process', error, { materialId });

    try {
      const admin = createAdminClient();
      if (claimedJobId) {
        await failStudentMaterialJob(
          admin,
          claimedJobId,
          error instanceof Error ? error.message : 'Error desconocido al procesar el PDF.'
        );
      }

      await markStudentMaterialProcessingFailed(materialId, error);
    } catch (updateError) {
      logError('studentMaterials.processStatusUpdate', updateError, { materialId });
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'No pudimos procesar el PDF en este momento.',
    };
  }
}

export async function processNextStudentMaterialJobAction(): Promise<ActionResult> {
  let claimedJobId: string | null = null;
  let materialId: string | null = null;

  try {
    const admin = createAdminClient();
    const job = await claimNextQueuedStudentMaterialJob(admin);

    if (!job) {
      return {
        success: true,
        message: 'No hay materiales pendientes en la cola.',
      };
    }

    claimedJobId = job.id;
    materialId = job.student_material_id;

    return await processStudentMaterial({
      materialId,
      jobId: claimedJobId,
    });
  } catch (error) {
    logError('studentMaterials.processNextJob', error, { materialId, jobId: claimedJobId });

    try {
      const admin = createAdminClient();
      if (claimedJobId) {
        await failStudentMaterialJob(
          admin,
          claimedJobId,
          error instanceof Error ? error.message : 'Error desconocido al procesar el PDF.'
        );
      }

      if (materialId) {
        await updateStudentMaterialProcessing(materialId, {
          processingStatus: 'failed',
          processingStage: 'failed',
          processingProgress: 0,
          processingMessage: 'No pudimos terminar el procesamiento del PDF.',
          processingError:
            error instanceof Error ? error.message : 'Error desconocido al procesar el PDF.',
        });
      }
    } catch (updateError) {
      logError('studentMaterials.processNextJobFailure', updateError, {
        materialId,
        jobId: claimedJobId,
      });
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos avanzar la cola de materiales.',
    };
  }
}

export async function regenerateStudentMaterialStudyAction(
  materialId: string
): Promise<ActionResult> {
  try {
    if (!studentMaterialIdSchema.safeParse(materialId).success) {
      return { success: false, message: 'El identificador del material no es valido.' };
    }
    const user = await requireAuthenticatedUser();
    const isAdmin = await resolveAdminActor(user);

    if (!isAdmin) {
      return {
        success: false,
        message: 'Solo un administrador puede regenerar este material.',
      };
    }

    const admin = createAdminClient();

    const { data: material, error } = await admin
      .from('student_materials')
      .select('id')
      .eq('id', materialId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!material) {
      return {
        success: false,
        message: 'No encontramos el material a regenerar.',
      };
    }

    await Promise.all([
      admin.from('student_material_summaries').delete().eq('student_material_id', materialId),
      admin.from('student_material_glossaries').delete().eq('student_material_id', materialId),
      admin.from('student_material_chunks').delete().eq('student_material_id', materialId),
    ]);

    await updateStudentMaterialProcessing(materialId, {
      processingStatus: 'processing',
      processingStage: 'extracting',
      processingProgress: 6,
      processingMessage: 'Regenerando resumen y glosario del material.',
      processingError: null,
    });

    return await processStudentMaterial({
      materialId,
      jobId: null,
    });
  } catch (error) {
    logError('studentMaterials.regenerate', error, { materialId });

    try {
      await updateStudentMaterialProcessing(materialId, {
        processingStatus: 'failed',
        processingStage: 'failed',
        processingProgress: 0,
        processingMessage: 'No pudimos regenerar el material.',
        processingError:
          error instanceof Error ? error.message : 'Error desconocido al regenerar el material.',
      });
    } catch (updateError) {
      logError('studentMaterials.regenerateStatusUpdate', updateError, { materialId });
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'No pudimos regenerar el material en este momento.',
    };
  }
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

    const { data, error } = await supabase
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

    if (!data) {
      return null;
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
        .remove([material.file_path])
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
    logError('flashcard_progress_load', { error, materialId });
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
    logError('flashcard_progress_save', { error, materialId });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos guardar el progreso.',
    };
  }
}
