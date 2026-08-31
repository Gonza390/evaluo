'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { enqueueStudentMaterialJob } from '@/lib/student-material-jobs';
import { logError } from '@/lib/observability';
import { hasPremiumAccess } from '@/lib/premium';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { assertStudentMaterialPdfPageLimit } from '@/lib/student-materials/pdf-validation';
import { stripStudocuCoverPage } from '@/lib/student-materials/studocu-cover';
import {
  buildStudentMaterialStoragePath,
  getValidationMessage,
  isOwnedStudentMaterialStoragePath,
  isPdfFileSignature,
  studentMaterialUploadFileMetadataSchema,
  studentMaterialUploadMetadataSchema,
  type StudentMaterialUploadFileMetadata,
  type StudentMaterialUploadMetadata,
} from '@/lib/student-materials/validation';

const MAX_PREMIUM_STUDENT_MATERIALS_PER_DAY = 3;
const MAX_PENDING_STUDENT_MATERIALS = 1;
const FREE_MATERIAL_UPLOAD_INTERVAL_DAYS = 15;
const FREE_MATERIAL_UPLOAD_LIMIT = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

type ActionResult = {
  success: boolean;
  message: string;
};

export type StudentMaterialUploadQuota = {
  isPremium: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  nextAvailableAt: string | null;
};

export type StudentMaterialUploadQuotaResult = ActionResult & {
  quota?: StudentMaterialUploadQuota;
};

export type PrepareStudentMaterialUploadResult = ActionResult & {
  filePath?: string;
  token?: string;
};

export type FinalizeStudentMaterialUploadResult = ActionResult & {
  materialId?: string;
};

type StudentMaterialUploadInput = {
  metadata: StudentMaterialUploadMetadata;
  file: StudentMaterialUploadFileMetadata;
};

type FinalizeStudentMaterialUploadInput = StudentMaterialUploadInput & {
  filePath: string;
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

async function getStudentMaterialUploadQuotaForUser(
  userId: string
): Promise<StudentMaterialUploadQuota> {
  const admin = createAdminClient();
  const now = new Date();
  const intervalStart = new Date(
    now.getTime() - FREE_MATERIAL_UPLOAD_INTERVAL_DAYS * DAY_MS
  );

  const [{ data: materials, error }, isPremium] = await Promise.all([
    admin
      .from('student_materials')
      .select('id, created_at, processing_status')
      .eq('user_id', userId)
      .gte('created_at', intervalStart.toISOString())
      .order('created_at', { ascending: true }),
    hasPremiumAccess(userId),
  ]);

  if (error) throw error;

  const countedMaterials = (materials ?? []).filter(
    (material) => material.processing_status !== 'failed'
  );

  if (isPremium) {
    return {
      isPremium: true,
      limit: null,
      used: countedMaterials.length,
      remaining: null,
      nextAvailableAt: null,
    };
  }

  const used = countedMaterials.length;
  const remaining = Math.max(0, FREE_MATERIAL_UPLOAD_LIMIT - used);
  let nextAvailableAt: string | null = null;

  if (remaining === 0 && countedMaterials.length > 0) {
    const blockingIndex = Math.max(0, countedMaterials.length - FREE_MATERIAL_UPLOAD_LIMIT);
    const blockingMaterial = countedMaterials[blockingIndex];
    const createdAt = new Date(blockingMaterial.created_at);
    if (!Number.isNaN(createdAt.getTime())) {
      nextAvailableAt = new Date(
        createdAt.getTime() + FREE_MATERIAL_UPLOAD_INTERVAL_DAYS * DAY_MS
      ).toISOString();
    }
  }

  return {
    isPremium: false,
    limit: FREE_MATERIAL_UPLOAD_LIMIT,
    used,
    remaining,
    nextAvailableAt,
  };
}

export async function getStudentMaterialUploadQuotaAction(): Promise<StudentMaterialUploadQuotaResult> {
  try {
    const user = await requireAuthenticatedUser();
    const quota = await getStudentMaterialUploadQuotaForUser(user.id);
    return { success: true, message: 'Cupo disponible.', quota };
  } catch (error) {
    logError('studentMaterials.getUploadQuota', error);
    return {
      success: false,
      message: isMissingStudentMaterialsTableError(error)
        ? getStudentMaterialsSetupMessage()
        : 'No pudimos verificar tu cupo de PDFs. Intentá nuevamente.',
    };
  }
}

async function assertStudentMaterialQuota(userId: string) {
  const admin = createAdminClient();
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const [dailyResult, pendingResult, quota] = await Promise.all([
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
    getStudentMaterialUploadQuotaForUser(userId),
  ]);

  if (dailyResult.error) throw dailyResult.error;
  if (pendingResult.error) throw pendingResult.error;

  if (quota.isPremium) {
    if ((dailyResult.count ?? 0) >= MAX_PREMIUM_STUDENT_MATERIALS_PER_DAY) {
      throw new Error(
        `Alcanzaste el límite de ${MAX_PREMIUM_STUDENT_MATERIALS_PER_DAY} materiales por día. Intentá nuevamente mañana.`
      );
    }
  } else if ((quota.remaining ?? 0) <= 0) {
    throw new Error(
      'Ya usaste tus 2 PDFs gratuitos. Volvé a la pantalla de carga para ver cuándo se renueva tu cupo o continuar con Premium.'
    );
  }

  if ((pendingResult.count ?? 0) >= MAX_PENDING_STUDENT_MATERIALS) {
    throw new Error(
      'Ya tenés 1 material en procesamiento. Esperá a que finalice antes de subir otro.'
    );
  }
}

async function assertAcademicSelection(metadata: StudentMaterialUploadMetadata) {
  const admin = createAdminClient();
  const [careerResult, subjectResult, relationResult] = await Promise.all([
    admin
      .from('carreras')
      .select('id, universidad_id, nombre')
      .eq('id', metadata.carreraId)
      .maybeSingle(),
    admin
      .from('materias')
      .select('id, carrera_id, nombre')
      .eq('id', metadata.materiaId)
      .maybeSingle(),
    admin
      .from('carrera_materias')
      .select('id')
      .eq('carrera_id', metadata.carreraId)
      .eq('materia_id', metadata.materiaId)
      .maybeSingle(),
  ]);

  if (careerResult.error) throw careerResult.error;
  if (subjectResult.error) throw subjectResult.error;
  if (relationResult.error) throw relationResult.error;

  if (!careerResult.data || careerResult.data.universidad_id !== metadata.universidadId) {
    throw new Error('La carrera elegida no coincide con la universidad seleccionada.');
  }

  if (
    !subjectResult.data ||
    (subjectResult.data.carrera_id !== metadata.carreraId && !relationResult.data)
  ) {
    throw new Error('La materia elegida no pertenece a esa carrera.');
  }
}

function parseUploadInput(input: StudentMaterialUploadInput) {
  const parsedMetadata = studentMaterialUploadMetadataSchema.safeParse(input.metadata);
  if (!parsedMetadata.success) {
    return { success: false as const, message: getValidationMessage(parsedMetadata.error) };
  }

  const parsedFile = studentMaterialUploadFileMetadataSchema.safeParse(input.file);
  if (!parsedFile.success) {
    return { success: false as const, message: getValidationMessage(parsedFile.error) };
  }

  return {
    success: true as const,
    metadata: parsedMetadata.data,
    file: parsedFile.data,
  };
}

async function removeOwnedUpload(filePath: string, userId: string) {
  if (!isOwnedStudentMaterialStoragePath(filePath, userId)) {
    return;
  }

  const admin = createAdminClient();
  await admin.storage
    .from('biblioteca')
    .remove([filePath])
    .catch(() => undefined);
}

export async function prepareStudentMaterialUploadAction(
  input: StudentMaterialUploadInput
): Promise<PrepareStudentMaterialUploadResult> {
  try {
    const parsed = parseUploadInput(input);
    if (!parsed.success) {
      return { success: false, message: parsed.message };
    }

    const user = await requireAuthenticatedUser();
    await assertStudentMaterialQuota(user.id);
    await assertAcademicSelection(parsed.metadata);

    const admin = createAdminClient();
    const filePath = buildStudentMaterialStoragePath(user.id, randomUUID(), parsed.file.name);
    const { data, error } = await admin.storage
      .from('biblioteca')
      .createSignedUploadUrl(filePath, { upsert: false });

    if (error || !data?.token) {
      throw error ?? new Error('No pudimos preparar la subida del PDF.');
    }

    return {
      success: true,
      filePath,
      token: data.token,
      message: 'Subida preparada.',
    };
  } catch (error) {
    logError('studentMaterials.prepareUpload', error);
    return {
      success: false,
      message: isMissingStudentMaterialsTableError(error)
        ? getStudentMaterialsSetupMessage()
        : error instanceof Error
          ? error.message
          : 'No pudimos preparar la subida del PDF.',
    };
  }
}

export async function cancelStudentMaterialUploadAction(filePath: string): Promise<ActionResult> {
  try {
    const user = await requireAuthenticatedUser();
    if (!isOwnedStudentMaterialStoragePath(filePath, user.id)) {
      return { success: false, message: 'La ruta de subida no es válida.' };
    }

    await removeOwnedUpload(filePath, user.id);
    return { success: true, message: 'Subida descartada.' };
  } catch (error) {
    logError('studentMaterials.cancelUpload', error);
    return { success: false, message: 'No pudimos descartar la subida incompleta.' };
  }
}

export async function finalizeStudentMaterialUploadAction(
  input: FinalizeStudentMaterialUploadInput
): Promise<FinalizeStudentMaterialUploadResult> {
  let userId: string | null = null;
  let shouldCleanup = false;

  try {
    const parsed = parseUploadInput(input);
    if (!parsed.success) {
      return { success: false, message: parsed.message };
    }

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

    if (existingError) {
      throw existingError;
    }

    if (existingMaterial) {
      return {
        success: true,
        materialId: existingMaterial.id,
        message: 'El PDF ya estaba registrado. Continuamos con su procesamiento.',
      };
    }

    shouldCleanup = true;
    await assertStudentMaterialQuota(user.id);
    await assertAcademicSelection(parsed.metadata);

    const { data: fileBlob, error: downloadError } = await admin.storage
      .from('biblioteca')
      .download(input.filePath);

    if (downloadError || !fileBlob) {
      throw downloadError ?? new Error('No encontramos el PDF subido.');
    }

    const fileBytes = new Uint8Array(await fileBlob.arrayBuffer());
    if (fileBytes.byteLength !== parsed.file.size) {
      throw new Error('El tamaño del PDF subido no coincide con el archivo seleccionado.');
    }

    if (!isPdfFileSignature(fileBytes)) {
      throw new Error('El archivo no contiene un PDF válido.');
    }

    const normalizedPdf = await stripStudocuCoverPage(fileBytes);
    const storedFileBytes = normalizedPdf.bytes;

    if (normalizedPdf.removed) {
      const { error: replaceError } = await admin.storage
        .from('biblioteca')
        .upload(input.filePath, storedFileBytes, {
          contentType: parsed.file.mimeType || 'application/pdf',
          upsert: true,
        });

      if (replaceError) {
        throw replaceError;
      }
    }

    await assertStudentMaterialPdfPageLimit(storedFileBytes);

    const { data: insertedMaterial, error: insertError } = await admin
      .from('student_materials')
      .insert({
        user_id: user.id,
        universidad_id: parsed.metadata.universidadId,
        carrera_id: parsed.metadata.carreraId,
        materia_id: parsed.metadata.materiaId,
        title: parsed.metadata.title.trim(),
        description: parsed.metadata.description.trim(),
        file_name: parsed.file.name,
        file_path: input.filePath,
        mime_type: parsed.file.mimeType || 'application/pdf',
        file_size_bytes: storedFileBytes.byteLength,
        visibility: parsed.metadata.shareWithCatalog ? 'shared' : 'private',
        processing_status: 'uploaded',
        processing_stage: 'uploaded',
        processing_progress: 10,
        processing_message: normalizedPdf.removed
          ? 'PDF subido. Quitamos la portada de Studocu y ahora vamos a analizar el contenido.'
          : 'PDF subido. Vamos a analizar su estructura antes de generar el espacio de estudio.',
        processing_error: null,
      } as never)
      .select('id')
      .single();

    if (insertError || !insertedMaterial) {
      throw insertError ?? new Error('No pudimos registrar el PDF subido.');
    }

    shouldCleanup = false;

    try {
      await enqueueStudentMaterialJob(admin, insertedMaterial.id);
    } catch (queueError) {
      logError('studentMaterials.enqueueAfterDirectUpload', queueError, {
        materialId: insertedMaterial.id,
      });
    }

    revalidatePath('/dashboard/materiales');

    return {
      success: true,
      materialId: insertedMaterial.id,
      message: parsed.metadata.shareWithCatalog
        ? 'PDF subido y compartido. Ahora empezamos a generar el espacio de estudio.'
        : 'PDF subido a tu espacio privado. Ahora empezamos a procesarlo.',
    };
  } catch (error) {
    logError('studentMaterials.finalizeUpload', error, { filePath: input.filePath });

    if (shouldCleanup && userId) {
      await removeOwnedUpload(input.filePath, userId);
    }

    return {
      success: false,
      message: isMissingStudentMaterialsTableError(error)
        ? getStudentMaterialsSetupMessage()
        : error instanceof Error
          ? error.message
          : 'No pudimos registrar el PDF subido.',
    };
  }
}
