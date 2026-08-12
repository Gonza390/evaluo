'use server';

import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/supabase';
import {
  analyzePdfDocument,
  extractPdfTextAndPageCount,
  generateStudentMaterialGlossary,
  generateStudentMaterialSummary,
  persistStudentMaterialGlossaryArtifacts,
  persistStudentMaterialSummaryFromComputed,
} from '@/lib/student-material-summary';
import type { StudyDocumentAnalysis } from '@/lib/student-material-summary';
import {
  claimNextQueuedStudentMaterialJob,
  claimStudentMaterialJob,
  completeStudentMaterialJob,
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
  isPdfFileSignature,
  MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
  studentMaterialIdSchema,
  studentMaterialUploadMetadataSchema,
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

export type UploadStudentMaterialResult = ActionResult & {
  materialId?: string;
};

const MAX_STUDENT_MATERIALS_PER_DAY = 5;
const MAX_PENDING_STUDENT_MATERIALS = 2;

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

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

function buildMaterialTitle(rawTitle: FormDataEntryValue | null, fileName: string) {
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
  if (title) {
    return title;
  }

  return fileName.replace(/\.pdf$/i, '').trim() || 'Material de estudio';
}

function formatUserFacingText(value: string) {
  return value
    .replace(/\bautomatico\b/gi, 'automático')
    .replace(/\bextraible\b/gi, 'extraíble')
    .replace(/\bacademico\b/gi, 'académico')
    .replace(/\btecnicas\b/gi, 'técnicas')
    .replace(/\bpagina(s)?\b/gi, (_match, plural) => (plural ? 'páginas' : 'página'))
    .replace(/\bglosario\b/gi, 'glosario')
    .replace(/\bresumen\b/gi, 'resumen');
}

async function requireAuthenticatedUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Inicia sesion para gestionar tu espacio de estudio.');
  }

  return user;
}

async function assertStudentMaterialQuota(userId: string) {
  const admin = createAdminClient();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const [dailyResult, pendingResult] = await Promise.all([
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
  ]);

  if (dailyResult.error) throw dailyResult.error;
  if (pendingResult.error) throw pendingResult.error;
  if ((dailyResult.count ?? 0) >= MAX_STUDENT_MATERIALS_PER_DAY) {
    throw new Error('Alcanzaste el limite de 5 materiales por dia. Intenta nuevamente manana.');
  }
  if ((pendingResult.count ?? 0) >= MAX_PENDING_STUDENT_MATERIALS) {
    throw new Error('Ya tenes 2 materiales en procesamiento. Espera a que finalice uno antes de subir otro.');
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

function buildAnalysisMessage(analysis: StudyDocumentAnalysis) {
  if (analysis.requiresOcr) {
    return 'Detectamos un PDF escaneado o muy visual. Seguimos con extraccion base y dejamos OCR recomendado.';
  }

  if (analysis.processingStrategy === 'slide_layout') {
    return 'Detectamos un material tipo diapositiva. Ajustamos la lectura para priorizar bloques, titulos y puntos clave.';
  }

  if (analysis.processingStrategy === 'hybrid_text') {
    return 'Detectamos un PDF mixto con texto e imagenes. Priorizamos una lectura hibrida del contenido.';
  }

  return 'Detectamos un PDF con texto nativo. Seguimos con extraccion estructurada por temas y bloques.';
}

// Transitional implementation kept for a short rollback window while the service is adopted.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function legacyRunStudentMaterialProcessingPipeline(input: {
  materialId: string;
  ownerUserId?: string;
  jobId?: string | null;
}) {
  const admin = createAdminClient();

  const materialQuery = admin
    .from('student_materials')
    .select('id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path')
    .eq('id', input.materialId);

  if (input.ownerUserId) {
    materialQuery.eq('user_id', input.ownerUserId);
  }

  const { data: material, error } = await materialQuery.maybeSingle();

  if (error) {
    throw error;
  }

  if (!material) {
    throw new Error('No encontramos el material que querés procesar.');
  }

  await updateStudentMaterialProcessing(material.id, {
    processingStatus: 'processing',
    processingStage: 'extracting',
    processingProgress: 18,
    processingMessage: 'Analizando el PDF para clasificar su estructura y estrategia de lectura.',
  });

  const [{ data: fileData, error: downloadError }, { data: carrera }, { data: universidad }, { data: materiaSubject }] =
    await Promise.all([
      admin.storage.from('biblioteca').download(material.file_path),
      admin.from('carreras').select('nombre').eq('id', material.carrera_id).maybeSingle(),
      admin.from('universidades').select('nombre').eq('id', material.universidad_id).maybeSingle(),
      admin.from('materias').select('nombre').eq('id', material.materia_id).maybeSingle(),
    ]);

  if (downloadError || !fileData) {
    throw new Error('No pudimos volver a leer el PDF desde almacenamiento.');
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const { text, pageCount } = await extractPdfTextAndPageCount(buffer);
  const documentAnalysis = analyzePdfDocument(buffer, text, pageCount);

  await updateStudentMaterialProcessing(material.id, {
    processingStatus: 'processing',
    processingStage: 'extracting',
    processingProgress: 34,
    processingMessage: buildAnalysisMessage(documentAnalysis),
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
    documentAnalysis,
  });

  await updateStudentMaterialProcessing(material.id, {
    processingStatus: 'processing',
    processingStage: 'summarizing',
    processingProgress: 52,
    processingMessage:
      documentAnalysis.processingStrategy === 'slide_layout'
        ? 'Generando resumen estructurado a partir de bloques visuales y temas detectados.'
        : 'Generando resumen estructurado del PDF.',
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
  });

  const summary = await generateStudentMaterialSummary({
    title: material.title,
    universidadName: universidad?.nombre ?? undefined,
    carreraName: carrera?.nombre ?? undefined,
    materiaName: materiaSubject?.nombre ?? undefined,
    text,
    documentAnalysis,
  });

  await persistStudentMaterialSummaryFromComputed({
    admin,
    studentMaterialId: material.id,
    text,
    summary,
    persistChunks: true,
  });

  await updateStudentMaterialProcessing(material.id, {
    processingStatus: 'processing',
    processingStage: 'glossary',
    processingProgress: 78,
    processingMessage: 'Generando glosario y conceptos clave para estudiar.',
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
  });

  const glossary = await generateStudentMaterialGlossary(
    {
      title: material.title,
      universidadName: universidad?.nombre ?? undefined,
      carreraName: carrera?.nombre ?? undefined,
      materiaName: materiaSubject?.nombre ?? undefined,
      text,
      documentAnalysis,
    },
    summary
  );

  await persistStudentMaterialGlossaryArtifacts({
    admin,
    studentMaterialId: material.id,
    glossary,
    provider: summary.provider,
    errorMessage: summary.errorMessage,
  });

  await updateStudentMaterialProcessing(material.id, {
    processingStatus: 'ready',
    processingStage: 'ready',
    processingProgress: 100,
    processingMessage: 'Material listo para estudiar.',
    processingError: null,
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
  });

  if (input.jobId) {
    await completeStudentMaterialJob(admin, input.jobId);
  }

  revalidatePath('/dashboard/materiales');
  revalidatePath(`/materiales/${material.id}`);

  return {
    success: true,
    message: 'El PDF ya quedó listo con su resumen y glosario.',
  } satisfies ActionResult;
}

export async function uploadStudentMaterialAction(formData: FormData): Promise<UploadStudentMaterialResult> {
  try {
    const user = await requireAuthenticatedUser();
    const admin = createAdminClient();
    await assertStudentMaterialQuota(user.id);

    const parsedMetadata = studentMaterialUploadMetadataSchema.safeParse({
      universidadId: String(formData.get('universidadId') ?? '').trim(),
      carreraId: String(formData.get('carreraId') ?? '').trim(),
      materiaId: String(formData.get('materiaId') ?? '').trim(),
      title: String(formData.get('title') ?? '').trim(),
      shareWithCatalog: String(formData.get('shareWithCatalog') ?? 'true').trim() !== 'false',
    });
    const fileEntry = formData.get('file');

    if (!parsedMetadata.success) {
      return {
        success: false,
        message: getValidationMessage(parsedMetadata.error),
      };
    }

    const { universidadId, carreraId, materiaId, shareWithCatalog } = parsedMetadata.data;

    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      return {
        success: false,
        message: 'Selecciona un PDF válido para continuar.',
      };
    }

    if (fileEntry.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      return {
        success: false,
        message: 'El PDF supera el limite de 20 MB. Reduce el archivo e intentalo nuevamente.',
      };
    }

    if (!fileEntry.name.toLowerCase().endsWith('.pdf')) {
      return {
        success: false,
        message: 'Por ahora solo aceptamos archivos PDF.',
      };
    }

    const [{ data: carrera }, { data: materia }, { data: relation }] = await Promise.all([
      admin.from('carreras').select('id, universidad_id, nombre').eq('id', carreraId).maybeSingle(),
      admin.from('materias').select('id, carrera_id, nombre').eq('id', materiaId).maybeSingle(),
      admin.from('carrera_materias').select('id').eq('carrera_id', carreraId).eq('materia_id', materiaId).maybeSingle(),
    ]);

    if (!carrera || carrera.universidad_id !== universidadId) {
      return {
        success: false,
        message: 'La carrera elegida no coincide con la universidad seleccionada.',
      };
    }

    if (!materia || (materia.carrera_id !== carreraId && !relation)) {
      return {
        success: false,
        message: 'La materia elegida no pertenece a esa carrera.',
      };
    }

    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
    if (!isPdfFileSignature(fileBuffer)) {
      return {
        success: false,
        message: 'El archivo no contiene un PDF valido.',
      };
    }

    const safeName = sanitizeFileName(fileEntry.name);
    const filePath = `student-materials/${user.id}/${Date.now()}-${safeName}`;
    const materialTitle = buildMaterialTitle(parsedMetadata.data.title, fileEntry.name);

    const { error: uploadError } = await admin.storage.from('biblioteca').upload(filePath, fileBuffer, {
      contentType: fileEntry.type || 'application/pdf',
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: insertedMaterial, error: insertError } = await admin
      .from('student_materials')
      .insert({
        user_id: user.id,
        universidad_id: universidadId,
        carrera_id: carreraId,
        materia_id: materiaId,
        title: materialTitle,
        file_name: fileEntry.name,
        file_path: filePath,
        mime_type: fileEntry.type || 'application/pdf',
        file_size_bytes: fileEntry.size,
        visibility: shareWithCatalog ? 'shared' : 'private',
        processing_status: 'uploaded',
        processing_stage: 'uploaded',
        processing_progress: 10,
        processing_message: 'PDF subido. Vamos a analizar su estructura antes de generar el espacio de estudio.',
        processing_error: null,
      })
      .select('id')
      .single();

    if (insertError) {
      await admin.storage.from('biblioteca').remove([filePath]).catch(() => undefined);
      throw insertError;
    }

    const jobId = await enqueueStudentMaterialJob(admin, insertedMaterial.id);

    revalidatePath('/dashboard/materiales');

    return {
      success: true,
      materialId: insertedMaterial.id,
      message:
        !shareWithCatalog
          ? jobId
            ? 'PDF subido a tu espacio privado. Ahora lo dejamos en cola para procesarlo.'
            : 'PDF subido a tu espacio privado. Ahora empezamos a procesarlo.'
          : jobId
            ? 'PDF subido y compartido. Ahora lo dejamos en cola para generar el espacio de estudio.'
            : 'PDF subido y compartido. Ahora empezamos a generar el espacio de estudio.',
    };
  } catch (error) {
    return {
      success: false,
      message: isMissingStudentMaterialsTableError(error)
        ? getStudentMaterialsSetupMessage()
        : error instanceof Error
          ? error.message
          : 'No pudimos subir el PDF en este momento.',
    };
  }
}

export async function processStudentMaterialAction(materialId: string): Promise<ActionResult> {
  let claimedJobId: string | null = null;

  try {
    if (!studentMaterialIdSchema.safeParse(materialId).success) {
      return { success: false, message: 'El identificador del material no es valido.' };
    }
    const user = await requireAuthenticatedUser();
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
      message: error instanceof Error ? error.message : 'No pudimos procesar el PDF en este momento.',
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
          processingError: error instanceof Error ? error.message : 'Error desconocido al procesar el PDF.',
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
      message: error instanceof Error ? formatUserFacingText(error.message) : 'No pudimos avanzar la cola de materiales.',
    };
  }
}

export async function regenerateStudentMaterialStudyAction(materialId: string): Promise<ActionResult> {
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
        processingError: error instanceof Error ? error.message : 'Error desconocido al regenerar el material.',
      });
    } catch (updateError) {
      logError('studentMaterials.regenerateStatusUpdate', updateError, { materialId });
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos regenerar el material en este momento.',
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

    const { error } = await supabase
      .from('student_materials')
      .update({ visibility: parsedInput.data.visibility })
      .eq('id', parsedInput.data.materialId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
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
