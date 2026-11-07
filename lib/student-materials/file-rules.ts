// Reglas de archivo sin dependencias (sin zod): las importan componentes de cliente
// como el selector de PDF de la home, para no sumar zod a su bundle inicial.
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
