import { z } from 'zod';

export const MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const STUDENT_MATERIAL_DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export function studentMaterialFileKind(name: string): 'pdf' | 'docx' | null {
  if (/\.pdf$/i.test(name)) return 'pdf';
  if (/\.docx$/i.test(name)) return 'docx';
  return null;
}
export function isSupportedStudentMaterialFile(name: string, mimeType: string) {
  const kind = studentMaterialFileKind(name);
  return kind === 'pdf' ? (!mimeType || mimeType === 'application/pdf') :
    kind === 'docx' ? (!mimeType || mimeType === STUDENT_MATERIAL_DOCX_MIME || mimeType === 'application/octet-stream') : false;
}
export const MAX_FREE_STUDENT_MATERIAL_PDF_PAGES = 100;
// Premium no tiene un límite de páginas; el límite técnico por archivo sigue siendo 20 MB.
export const MAX_PREMIUM_STUDENT_MATERIAL_PDF_PAGES: number | null = null;
// Compatibilidad con usos existentes: el límite base sigue siendo el de Free.
export const MAX_STUDENT_MATERIAL_PDF_PAGES = MAX_FREE_STUDENT_MATERIAL_PDF_PAGES;

const uuidSchema = z.string().uuid();

export const studentMaterialIdSchema = uuidSchema;

export const studentMaterialVisibilitySchema = z.enum(['private', 'shared']);

export const studentMaterialVisibilityInputSchema = z.object({
  materialId: studentMaterialIdSchema,
  visibility: studentMaterialVisibilitySchema,
});

export const studentMaterialUploadMetadataSchema = z.object({
  universidadId: uuidSchema,
  carreraId: uuidSchema,
  materiaId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(1, 'Escribí un título para identificar el material.')
    .max(180, 'El título no puede superar los 180 caracteres.'),
  description: z
    .string()
    .trim()
    .min(3, 'Indicá brevemente a qué parcial, módulos o temas corresponde el material.')
    .max(240, 'La descripción no puede superar los 240 caracteres.'),
  shareWithCatalog: z.boolean(),
});

export const studentMaterialUploadFileMetadataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Seleccioná un PDF o Word válido para continuar.')
    .max(255, 'El nombre del archivo es demasiado largo.')
    .refine((value) => studentMaterialFileKind(value) !== null, 'Aceptamos archivos PDF y Word (.docx).'),
  mimeType: z
    .string()
    .trim()
    .max(120, 'El tipo de archivo no es válido.')
    .refine(
      (value) => !value || value === 'application/pdf' || value === STUDENT_MATERIAL_DOCX_MIME || value === 'application/octet-stream',
      'Aceptamos archivos PDF y Word (.docx).'
    ),
  size: z
    .number()
    .int()
    .positive('Seleccioná un archivo válido para continuar.')
    .max(
      MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
      'El archivo supera el límite de 20 MB. Reducilo e intentá nuevamente.'
    ),
});

export type StudentMaterialUploadMetadata = z.infer<typeof studentMaterialUploadMetadataSchema>;
export function validateStudentMaterialMime(name: string, mime: string) {
  if (!isSupportedStudentMaterialFile(name, mime)) throw new Error('El formato del documento no coincide con su extensión.');
}
export type StudentMaterialUploadFileMetadata = z.infer<
  typeof studentMaterialUploadFileMetadataSchema
>;

export function sanitizeStudentMaterialFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

export function buildStudentMaterialStoragePath(
  userId: string,
  uploadId: string,
  fileName: string
) {
  const parsedUserId = uuidSchema.parse(userId);
  const parsedUploadId = uuidSchema.parse(uploadId);
  const safeName = sanitizeStudentMaterialFileName(fileName) || 'material.pdf';
  return `student-materials/${parsedUserId}/${parsedUploadId}-${safeName}`;
}

export function isOwnedStudentMaterialStoragePath(filePath: string, userId: string) {
  const parsedUserId = uuidSchema.safeParse(userId);
  if (!parsedUserId.success || filePath.includes('..') || filePath.includes('\\')) {
    return false;
  }

  return filePath.startsWith(`student-materials/${parsedUserId.data}/`);
}

export function isPdfFileSignature(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export function getValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Los datos enviados no son validos.';
}
