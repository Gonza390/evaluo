import { z } from 'zod';

export const MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES = 20 * 1024 * 1024;

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
  title: z.string().trim().max(180),
  shareWithCatalog: z.boolean(),
});

export type StudentMaterialUploadMetadata = z.infer<typeof studentMaterialUploadMetadataSchema>;

export function isPdfFileSignature(bytes: Uint8Array) {
  return bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

export function getValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Los datos enviados no son validos.';
}
