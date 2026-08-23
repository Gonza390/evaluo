import assert from 'node:assert/strict';
import {
  buildStudentMaterialStoragePath,
  isOwnedStudentMaterialStoragePath,
  isPdfFileSignature,
  MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
  studentMaterialIdSchema,
  studentMaterialUploadFileMetadataSchema,
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

const validFile = {
  name: 'parcial-1.pdf',
  mimeType: 'application/pdf',
  size: 2 * 1024 * 1024,
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
assert.equal(studentMaterialUploadFileMetadataSchema.safeParse(validFile).success, true);
assert.equal(
  studentMaterialUploadFileMetadataSchema.safeParse({
    ...validFile,
    size: MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
  }).success,
  true,
  'Un PDF de exactamente 20 MB debe seguir siendo válido.'
);
assert.equal(
  studentMaterialUploadFileMetadataSchema.safeParse({
    ...validFile,
    size: MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES + 1,
  }).success,
  false,
  'Un PDF por encima de 20 MB debe rechazarse antes de firmar la subida.'
);
assert.equal(
  studentMaterialUploadFileMetadataSchema.safeParse({ ...validFile, name: 'material.docx' }).success,
  false,
  'La subida firmada debe conservar la restricción a PDF.'
);
assert.equal(
  studentMaterialUploadFileMetadataSchema.safeParse({ ...validFile, mimeType: 'text/plain' }).success,
  false,
  'La subida firmada debe rechazar MIME types incompatibles.'
);

const ownerId = '00000000-0000-4000-8000-000000000001';
const uploadId = '00000000-0000-4000-8000-000000000004';
const storagePath = buildStudentMaterialStoragePath(ownerId, uploadId, 'Parcial 1 (final).pdf');
assert.equal(
  storagePath,
  'student-materials/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000004-Parcial_1_final_.pdf'
);
assert.equal(isOwnedStudentMaterialStoragePath(storagePath, ownerId), true);
assert.equal(
  isOwnedStudentMaterialStoragePath(
    storagePath,
    '00000000-0000-4000-8000-000000000099'
  ),
  false
);
assert.equal(
  isOwnedStudentMaterialStoragePath(
    `student-materials/${ownerId}/../otro-usuario/material.pdf`,
    ownerId
  ),
  false,
  'No se deben aceptar rutas con traversal.'
);

console.log('Student material validation smoke tests passed.');
