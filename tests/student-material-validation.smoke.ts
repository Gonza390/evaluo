import assert from 'node:assert/strict';
import {
  isPdfFileSignature,
  MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
  studentMaterialIdSchema,
  studentMaterialUploadMetadataSchema,
  studentMaterialVisibilityInputSchema,
} from '../lib/student-materials/validation.ts';

assert.equal(MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES, 20 * 1024 * 1024);
assert.equal(isPdfFileSignature(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), true);
assert.equal(isPdfFileSignature(new Uint8Array([0x25, 0x50, 0x44, 0x46])), false);
assert.equal(studentMaterialIdSchema.safeParse('not-an-id').success, false);
assert.equal(studentMaterialVisibilityInputSchema.safeParse({ materialId: '00000000-0000-4000-8000-000000000001', visibility: 'shared' }).success, true);
assert.equal(studentMaterialVisibilityInputSchema.safeParse({ materialId: '00000000-0000-4000-8000-000000000001', visibility: 'public' }).success, false);
assert.equal(studentMaterialUploadMetadataSchema.safeParse({ universidadId: '00000000-0000-4000-8000-000000000001', carreraId: '00000000-0000-4000-8000-000000000002', materiaId: '00000000-0000-4000-8000-000000000003', title: 'Material', shareWithCatalog: true }).success, true);

console.log('Student material validation smoke tests passed.');
