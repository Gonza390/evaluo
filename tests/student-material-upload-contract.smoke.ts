import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const legacyActionsSource = readFileSync(
  new URL('../app/dashboard/materiales/actions.ts', import.meta.url),
  'utf8'
);
const pdfFirstUploadActionsSource = readFileSync(
  new URL('../app/dashboard/materiales/pdf-first-upload-actions.ts', import.meta.url),
  'utf8'
);
const pdfFirstUploadShellSource = readFileSync(
  new URL('../components/dashboard/pdf-first-upload-shell.tsx', import.meta.url),
  'utf8'
);

assert.doesNotMatch(
  legacyActionsSource,
  /uploadStudentMaterialAction|FormData|arrayBuffer\(\).*fileEntry|\.upload\(filePath,\s*fileBuffer/s,
  'El módulo legacy no debe volver a aceptar ni transportar archivos PDF por Server Actions.'
);

assert.match(
  pdfFirstUploadActionsSource,
  /createSignedUploadUrl\(/,
  'La preparación PDF-first debe firmar una subida de Storage desde servidor.'
);
assert.match(
  pdfFirstUploadShellSource,
  /uploadToSignedUrl\(/,
  'El navegador debe transferir el PDF directamente a Supabase Storage desde el shell PDF-first.'
);
assert.doesNotMatch(
  pdfFirstUploadShellSource,
  /formData\.set\(\s*['"]file['"]/,
  'El cliente PDF-first no debe adjuntar el PDF a un FormData enviado a una Server Action.'
);

const finalizeStart = pdfFirstUploadActionsSource.indexOf(
  'export async function finalizePdfFirstUploadAction'
);
assert.ok(finalizeStart >= 0, 'Debe existir la acción PDF-first de finalización de la subida.');
const finalizeSource = pdfFirstUploadActionsSource.slice(finalizeStart);

const downloadIndex = finalizeSource.indexOf('.download(input.filePath)');
const sizeValidationIndex = finalizeSource.indexOf('fileBytes.byteLength !== parsed.file.size');
const signatureValidationIndex = finalizeSource.indexOf('isPdfFileSignature(fileBytes)');
const normalizePdfIndex = finalizeSource.indexOf('stripStudocuCoverPage(fileBytes)');
const pageValidationIndex = finalizeSource.indexOf('assertStudentMaterialPdfPageLimit(storedFileBytes)');
const insertIndex = finalizeSource.indexOf(".from('student_materials')\n      .insert(");

assert.ok(downloadIndex >= 0, 'Finalize debe comprobar que el objeto exista realmente en Storage.');
assert.ok(sizeValidationIndex > downloadIndex, 'Finalize debe validar el tamaño del objeto descargado.');
assert.ok(
  signatureValidationIndex > sizeValidationIndex,
  'Finalize debe validar la firma PDF después de comprobar el tamaño.'
);
assert.ok(
  normalizePdfIndex > signatureValidationIndex,
  'Finalize debe normalizar el PDF únicamente después de comprobar su firma.'
);
assert.ok(
  pageValidationIndex > normalizePdfIndex,
  'Finalize debe validar el máximo de páginas sobre el PDF normalizado.'
);
assert.ok(
  insertIndex > pageValidationIndex,
  'No se debe crear student_materials antes de validar existencia, tamaño, firma y páginas del PDF.'
);
assert.match(
  finalizeSource,
  /if \(shouldCleanup && userId\)[\s\S]*removeOwnedUpload\(input\.filePath, userId\)/,
  'Si finalize falla después del upload, debe limpiar el objeto huérfano.'
);
assert.match(
  pdfFirstUploadActionsSource,
  /await assertStudentMaterialQuota\(user\.id\);[\s\S]*createSignedUploadUrl/,
  'La cuota debe validarse antes de emitir la signed upload URL.'
);
assert.match(
  finalizeSource,
  /await assertStudentMaterialQuota\(user\.id\);/,
  'La cuota debe volver a validarse al finalizar para reducir carreras entre prepare y finalize.'
);
assert.match(
  pdfFirstUploadActionsSource,
  /isOwnedStudentMaterialStoragePath\(input\.filePath, user\.id\)/,
  'Finalize debe comprobar ownership del path firmado.'
);

console.log('Student material PDF-first direct upload contract smoke tests passed.');
