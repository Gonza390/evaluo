import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const legacyActionsSource = readFileSync(
  new URL('../app/dashboard/materiales/actions.ts', import.meta.url),
  'utf8'
);
const uploadActionsSource = readFileSync(
  new URL('../app/dashboard/materiales/upload-actions.ts', import.meta.url),
  'utf8'
);
const workspaceSource = readFileSync(
  new URL('../components/dashboard/student-materials-workspace.tsx', import.meta.url),
  'utf8'
);

assert.doesNotMatch(
  legacyActionsSource,
  /uploadStudentMaterialAction|FormData|arrayBuffer\(\).*fileEntry|\.upload\(filePath,\s*fileBuffer/s,
  'El módulo legacy no debe volver a aceptar ni transportar archivos PDF por Server Actions.'
);

assert.match(
  uploadActionsSource,
  /createSignedUploadUrl\(/,
  'La preparación debe firmar una subida de Storage desde servidor.'
);
assert.match(
  workspaceSource,
  /uploadToSignedUrl\(/,
  'El navegador debe transferir el PDF directamente a Supabase Storage.'
);
assert.doesNotMatch(
  workspaceSource,
  /formData\.set\(\s*['"]file['"]/,
  'El cliente no debe adjuntar el PDF a un FormData enviado a una Server Action.'
);

const finalizeStart = uploadActionsSource.indexOf('export async function finalizeStudentMaterialUploadAction');
assert.ok(finalizeStart >= 0, 'Debe existir la acción de finalización de la subida.');
const finalizeSource = uploadActionsSource.slice(finalizeStart);

const downloadIndex = finalizeSource.indexOf('.download(input.filePath)');
const sizeValidationIndex = finalizeSource.indexOf('fileBytes.byteLength !== parsed.file.size');
const signatureValidationIndex = finalizeSource.indexOf('isPdfFileSignature(fileBytes)');
const insertIndex = finalizeSource.indexOf(".from('student_materials')\n      .insert(");

assert.ok(downloadIndex >= 0, 'Finalize debe comprobar que el objeto exista realmente en Storage.');
assert.ok(sizeValidationIndex > downloadIndex, 'Finalize debe validar el tamaño del objeto descargado.');
assert.ok(
  signatureValidationIndex > sizeValidationIndex,
  'Finalize debe validar la firma PDF después de comprobar el tamaño.'
);
assert.ok(
  insertIndex > signatureValidationIndex,
  'No se debe crear student_materials antes de validar existencia, tamaño y firma PDF.'
);
assert.match(
  finalizeSource,
  /if \(shouldCleanup && userId\)[\s\S]*removeOwnedUpload\(input\.filePath, userId\)/,
  'Si finalize falla después del upload, debe limpiar el objeto huérfano.'
);
assert.match(
  uploadActionsSource,
  /await assertStudentMaterialQuota\(user\.id\);[\s\S]*createSignedUploadUrl/,
  'La cuota debe validarse antes de emitir la signed upload URL.'
);
assert.match(
  finalizeSource,
  /await assertStudentMaterialQuota\(user\.id\);/,
  'La cuota debe volver a validarse al finalizar para reducir carreras entre prepare y finalize.'
);
assert.match(
  uploadActionsSource,
  /isOwnedStudentMaterialStoragePath\(input\.filePath, user\.id\)/,
  'Finalize debe comprobar ownership del path firmado.'
);

console.log('Student material direct upload contract smoke tests passed.');
