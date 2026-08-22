import assert from 'node:assert/strict';
import {
  isPdfFileSignature,
  MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
  studentMaterialIdSchema,
  studentMaterialUploadMetadataSchema,
  studentMaterialVisibilityInputSchema,
} from '../lib/student-materials/validation.ts';

const validMetadata = {
  universidadId: '00000000-0000-4000-8000-000000000001',
  carreraId: '00000000-0000-4000-8000-000000000002',
  materiaId: '00000000-0000-4000-8000-000000000003',
  title: 'Material',
  description: 'Parcial 1 · Módulos 1 al 4',
  shareWithCatalog: true,
};

assert.equal(MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES, 20 * 1024 * 1024);
assert.equal(isPdfFileSignature(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), true);
assert.equal(isPdfFileSignature(new Uint8Array([0x25, 0x50, 0x44, 0x46])), false);
assert.equal(studentMaterialIdSchema.safeParse('not-an-id').success, false);
assert.equal(
  studentMaterialVisibilityInputSchema.safeParse({
    materialId: '00000000-0000-4000-8000-000000000001',
    visibility: 'shared',
  }).success,
  true
);
assert.equal(
  studentMaterialVisibilityInputSchema.safeParse({
    materialId: '00000000-0000-4000-8000-000000000001',
    visibility: 'public',
  }).success,
  false
);
assert.equal(studentMaterialUploadMetadataSchema.safeParse(validMetadata).success, true);
assert.equal(
  studentMaterialUploadMetadataSchema.safeParse({ ...validMetadata, description: '' }).success,
  false,
  'La descripción debe ser obligatoria.'
);
assert.equal(
  studentMaterialUploadMetadataSchema.safeParse({ ...validMetadata, description: '  ' }).success,
  false,
  'Una descripción sólo con espacios no debe aceptarse.'
);
assert.equal(
  studentMaterialUploadMetadataSchema.safeParse({ ...validMetadata, title: '' }).success,
  false,
  'El título debe seguir siendo obligatorio también del lado servidor.'
);
assert.equal(
  studentMaterialUploadMetadataSchema.safeParse({
    ...validMetadata,
    description: 'x'.repeat(241),
  }).success,
  false,
  'La descripción debe respetar el límite de 240 caracteres.'
);

console.log('Student material validation smoke tests passed.');
