'use server';

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
} from '@/lib/student-materials/processing-service';
import { updateStudentMaterialProcessing } from '@/lib/repositories/student-materials';
import { studentMaterialIdSchema } from '@/lib/student-materials/validation';

type ActionResult = {
  success: boolean;
  message: string;
};

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

  if (error) throw error;
  if (!data) throw new Error('No encontramos el material solicitado.');
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
        await updateStudentMaterialProcessing(admin, materialId, {
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
  let canUpdateFailureState = false;

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
      .select('id, user_id')
      .eq('id', materialId)
      .maybeSingle();

    if (error) throw error;

    if (!material) {
      return {
        success: false,
        message: 'No encontramos el material a regenerar.',
      };
    }

    if (material.user_id !== user.id) {
      return {
        success: false,
        message: 'Solo podés regenerar PDFs que hayas subido vos.',
      };
    }

    canUpdateFailureState = true;

    await Promise.all([
      admin.from('student_material_summaries').delete().eq('student_material_id', materialId),
      admin.from('student_material_glossaries').delete().eq('student_material_id', materialId),
      admin.from('student_material_chunks').delete().eq('student_material_id', materialId),
    ]);

    await updateStudentMaterialProcessing(admin, materialId, {
      processingStatus: 'processing',
      processingStage: 'extracting',
      processingProgress: 6,
      processingMessage: 'Regenerando resumen y glosario del material.',
      processingError: null,
    });

    return await processStudentMaterial({
      materialId,
      ownerUserId: user.id,
      jobId: null,
    });
  } catch (error) {
    logError('studentMaterials.regenerate', error, { materialId });

    if (canUpdateFailureState) {
      try {
        const admin = createAdminClient();
        await updateStudentMaterialProcessing(admin, materialId, {
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
