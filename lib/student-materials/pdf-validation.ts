import { PDFDocument } from 'pdf-lib';
import { MAX_STUDENT_MATERIAL_PDF_PAGES } from '@/lib/student-materials/validation';

export async function getStudentMaterialPdfPageCount(bytes: Uint8Array) {
  try {
    const pdfDocument = await PDFDocument.load(bytes, { updateMetadata: false });
    return pdfDocument.getPageCount();
  } catch {
    throw new Error('El archivo no contiene un PDF válido.');
  }
}

export async function assertStudentMaterialPdfPageLimit(bytes: Uint8Array) {
  const pageCount = await getStudentMaterialPdfPageCount(bytes);

  if (pageCount < 1) {
    throw new Error('El PDF debe contener al menos una página.');
  }

  if (pageCount > MAX_STUDENT_MATERIAL_PDF_PAGES) {
    throw new Error(
      `El PDF tiene ${pageCount} páginas. El máximo permitido es de ${MAX_STUDENT_MATERIAL_PDF_PAGES} páginas.`
    );
  }

  return pageCount;
}
