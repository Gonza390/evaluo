'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { enqueueStudentMaterialJob } from '@/lib/student-material-jobs';
import { logError } from '@/lib/observability';
import { hasPremiumAccess } from '@/lib/premium';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import {
  assertStudentMaterialPdfPageLimit,
  StudentMaterialPdfPageLimitError,
} from '@/lib/student-materials/pdf-validation';
import { stripStudocuCoverPage } from '@/lib/student-materials/studocu-cover';
import {
  buildStudentMaterialStoragePath,
  getValidationMessage,
  isOwnedStudentMaterialStoragePath,
  isPdfFileSignature,
  studentMaterialUploadFileMetadataSchema,
  type StudentMaterialUploadFileMetadata,
} from '@/lib/student-materials/validation';

const MAX_PREMIUM_STUDENT_MATERIALS_PER_DAY = 3;
const MAX_PENDING_STUDENT_MATERIALS = 1;
const FREE_MATERIAL_UPLOAD_INTERVAL_DAYS = 15;
const FREE_MATERIAL_UPLOAD_LIMIT = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

const pdfFirstMetadataSchema = z.object({
  title: z.string().trim().min(1).max(180),
});

type PdfFirstMetadata = z.infer<typeof pdfFirstMetadataSchema>;

type PdfFirstUploadInput = {
  metadata: PdfFirstMetadata;
  file: StudentMaterialUploadFileMetadata;
};

type PdfFirstFinalizeInput = PdfFirstUploadInput & { filePath: string };

type ActionResult = { success: boolean; message: string };

export type PreparePdfFirstUploadResult = ActionResult & {
  filePath?: string;
  token?: string;
};

export type FinalizePdfFirstUploadResult = ActionResult & {
  materialId?: string;
  errorCode?: 'page_limit';
  pageCount?: number;
  maxPages?: number;
};

async function requireAuthenticatedUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error('Iniciá sesión para subir tu PDF.');
  return user;
}

async function hasUnlimitedStudentMaterialUploads(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('student_material_uploads_unlimited')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.student_material_uploads_unlimited);
}

async function assertStudentMaterialQuota(userId: string) {
  const admin = createAdminClient();
  const now = new Date();
  const intervalStart = new Date(now.getTime() - FREE_MATERIAL_UPLOAD_INTERVAL_DAYS * DAY_MS);
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const [materialsResult, dailyResult, pendingResult, isPremium, hasUnlimitedUploads] =
    await Promise.all([
      admin
        .from('student_materials')
        .select('id, created_at, processing_status')
        .eq('user_id', userId)
        .gte('created_at', intervalStart.toISOString()),
      admin
        .from('student_materials')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', dayStart.toISOString()),
      admin
        .from('student_materials')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('processing_status', ['uploaded', 'processing']),
      hasPremiumAccess(userId),
      hasUnlimitedStudentMaterialUploads(userId),
    ]);

  if (materialsResult.error) throw materialsResult.error;
  if (dailyResult.error) throw dailyResult.error;
  if (pendingResult.error) throw pendingResult.error;

  if (!hasUnlimitedUploads && isPremium) {
    if ((dailyResult.count ?? 0) >= MAX_PREMIUM_STUDENT_MATERIALS_PER_DAY) {
      throw new Error(
        `Alcanzaste el límite de ${MAX_PREMIUM_STUDENT_MATERIALS_PER_DAY} materiales por día. Intentá nuevamente mañana.`
      );
    }
  } else if (!hasUnlimitedUploads) {
    const used = (materialsResult.data ?? []).filter(
      (material) => material.processing_status !== 'failed'
    ).length;
    if (used >= FREE_MATERIAL_UPLOAD_LIMIT) {
      throw new Error(
        'Ya usaste tus 2 PDFs gratuitos. Tu cupo se renueva cada 15 días o podés continuar con Premium.'
      );
    }
  }

  if ((pendingResult.count ?? 0) >= MAX_PENDING_STUDENT_MATERIALS) {
    throw new Error('Ya tenés 1 material en procesamiento. Esperá a que finalice antes de subir otro.');
  }
}

function parseInput(input: PdfFirstUploadInput) {
  const metadata = pdfFirstMetadataSchema.safeParse(input.metadata);
  if (!metadata.success) {
    return { success: false as const, message: 'Escribí un nombre válido para tu PDF.' };
  }

  const file = studentMaterialUploadFileMetadataSchema.safeParse(input.file);
  if (!file.success) {
    return { success: false as const, message: getValidationMessage(file.error) };
  }

  return { success: true as const, metadata: metadata.data, file: file.data };
}

async function removeOwnedUpload(filePath: string, userId: string) {
  if (!isOwnedStudentMaterialStoragePath(filePath, userId)) return;
  const admin = createAdminClient();
  await admin.storage.from('biblioteca').remove([filePath]).catch(() => undefined);
}

export async function preparePdfFirstUploadAction(
  input: PdfFirstUploadInput
): Promise<PreparePdfFirstUploadResult> {
  try {
    const parsed = parseInput(input);
    if (!parsed.success) return parsed;

    const user = await requireAuthenticatedUser();
    await assertStudentMaterialQuota(user.id);

    const admin = createAdminClient();
    const filePath = buildStudentMaterialStoragePath(user.id, randomUUID(), parsed.file.name);
    const { data, error } = await admin.storage
      .from('biblioteca')
      .createSignedUploadUrl(filePath, { upsert: false });

    if (error || !data?.token) throw error ?? new Error('No pudimos preparar la subida del PDF.');

    return { success: true, filePath, token: data.token, message: 'Subida preparada.' };
  } catch (error) {
    logError('studentMaterials.pdfFirst.prepareUpload', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos preparar la subida del PDF.',
    };
  }
}

export async function cancelPdfFirstUploadAction(filePath: string): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    if (!isOwnedStudentMaterialStoragePath(filePath, user.id)) {
      return { success: false, message: 'La ruta de subida no es válida.' };
    }
    await removeOwnedUpload(filePath, user.id);
    return { success: true, message: 'Subida descartada.' };
  } catch (error) {
    logError('studentMaterials.pdfFirst.cancelUpload', error);
    return { success: false, message: 'No pudimos descartar la subida incompleta.' };
  }
}

export async function finalizePdfFirstUploadAction(
  input: PdfFirstFinalizeInput
): Promise<FinalizePdfFirstUploadResult> {
  let userId: string | null = null;
  let shouldCleanup = false;

  try {
    const parsed = parseInput(input);
    if (!parsed.success) return parsed;

    const user = await requireAuthenticatedUser();
    userId = user.id;

    if (!isOwnedStudentMaterialStoragePath(input.filePath, user.id)) {
      return { success: false, message: 'La ruta de subida no es válida.' };
    }

    const admin = createAdminClient();
    const { data: existingMaterial, error: existingError } = await admin
      .from('student_materials')
      .select('id')
      .eq('user_id', user.id)
      .eq('file_path', input.filePath)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingMaterial) {
      return {
        success: true,
        materialId: existingMaterial.id,
        message: 'El PDF ya estaba registrado. Continuamos con su procesamiento.',
      };
    }

    shouldCleanup = true;
    await assertStudentMaterialQuota(user.id);

    const { data: fileBlob, error: downloadError } = await admin.storage
      .from('biblioteca')
      .download(input.filePath);
    if (downloadError || !fileBlob) throw downloadError ?? new Error('No encontramos el PDF subido.');

    const fileBytes = new Uint8Array(await fileBlob.arrayBuffer());
    if (fileBytes.byteLength !== parsed.file.size) {
      throw new Error('El tamaño del PDF subido no coincide con el archivo seleccionado.');
    }
    if (!isPdfFileSignature(fileBytes)) throw new Error('El archivo no contiene un PDF válido.');

    const normalizedPdf = await stripStudocuCoverPage(fileBytes);
    const storedFileBytes = normalizedPdf.bytes;

    if (normalizedPdf.removed) {
      const { error: replaceError } = await admin.storage
        .from('biblioteca')
        .upload(input.filePath, storedFileBytes, {
          contentType: parsed.file.mimeType || 'application/pdf',
          upsert: true,
        });
      if (replaceError) throw replaceError;
    }

    const pageCount = await assertStudentMaterialPdfPageLimit(storedFileBytes);

    const { data: insertedMaterial, error: insertError } = await admin
      .from('student_materials')
      .insert({
        user_id: user.id,
        universidad_id: null,
        carrera_id: null,
        materia_id: null,
        title: parsed.metadata.title,
        description: 'Material privado subido por el estudiante.',
        file_name: parsed.file.name,
        file_path: input.filePath,
        mime_type: parsed.file.mimeType || 'application/pdf',
        file_size_bytes: storedFileBytes.byteLength,
        page_count: pageCount,
        visibility: 'private',
        processing_status: 'uploaded',
        processing_stage: 'uploaded',
        processing_progress: 10,
        processing_message: normalizedPdf.removed
          ? 'PDF subido. Quitamos la portada de Studocu y empezamos a analizar el contenido.'
          : 'PDF subido. Estamos analizando su estructura para preparar tu espacio de estudio.',
        processing_error: null,
      } as never)
      .select('id')
      .single();

    if (insertError || !insertedMaterial) {
      throw insertError ?? new Error('No pudimos registrar el PDF subido.');
    }

    shouldCleanup = false;
    await enqueueStudentMaterialJob(admin, insertedMaterial.id).catch((queueError) => {
      logError('studentMaterials.pdfFirst.enqueue', queueError, { materialId: insertedMaterial.id });
    });

    revalidatePath('/dashboard/materiales');
    return {
      success: true,
      materialId: insertedMaterial.id,
      message: 'PDF subido a tu espacio privado. Ya empezamos a procesarlo.',
    };
  } catch (error) {
    if (shouldCleanup && userId) {
      await removeOwnedUpload(input.filePath, userId);
    }

    if (error instanceof StudentMaterialPdfPageLimitError) {
      return {
        success: false,
        message: error.message,
        errorCode: 'page_limit',
        pageCount: error.pageCount,
        maxPages: error.maxPages,
      };
    }

    logError('studentMaterials.pdfFirst.finalizeUpload', error, { filePath: input.filePath });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos registrar el PDF subido.',
    };
  }
}
