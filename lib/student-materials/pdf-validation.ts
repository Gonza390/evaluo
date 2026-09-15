import { PDFDocument } from 'pdf-lib';
import { hasPremiumAccess } from '@/lib/premium';
import { createClientServer } from '@/lib/supabase-server';
import { MAX_FREE_STUDENT_MATERIAL_PDF_PAGES } from '@/lib/student-materials/validation';

export class StudentMaterialPdfPageLimitError extends Error {
  readonly code = 'student_material_pdf_page_limit' as const;

  constructor(
    readonly pageCount: number,
    readonly maxPages: number
  ) {
    super(
      `El PDF tiene ${pageCount} páginas. El plan Free permite hasta ${maxPages} páginas por documento; Premium no tiene límite de páginas.`
    );
    this.name = 'StudentMaterialPdfPageLimitError';
  }
}

export async function getStudentMaterialPdfPageCount(bytes: Uint8Array) {
  try {
    const pdfDocument = await PDFDocument.load(bytes, { updateMetadata: false });
    return pdfDocument.getPageCount();
  } catch {
    throw new Error('El archivo no contiene un PDF válido.');
  }
}

async function getStudentMaterialPdfPageLimit(accessOverride?: { isPremium: boolean }) {
  if (accessOverride) {
    return {
      maxPages: accessOverride.isPremium ? null : MAX_FREE_STUDENT_MATERIAL_PDF_PAGES,
      isPremium: accessOverride.isPremium,
    };
  }

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      maxPages: MAX_FREE_STUDENT_MATERIAL_PDF_PAGES,
      isPremium: false,
    };
  }

  const isPremium = await hasPremiumAccess(user.id);
  return {
    maxPages: isPremium ? null : MAX_FREE_STUDENT_MATERIAL_PDF_PAGES,
    isPremium,
  };
}

export async function assertStudentMaterialPdfPageLimit(
  bytes: Uint8Array,
  accessOverride?: { isPremium: boolean }
) {
  const pageCount = await getStudentMaterialPdfPageCount(bytes);

  if (pageCount < 1) {
    throw new Error('El PDF debe contener al menos una página.');
  }

  const { maxPages } = await getStudentMaterialPdfPageLimit(accessOverride);

  if (maxPages !== null && pageCount > maxPages) {
    throw new StudentMaterialPdfPageLimitError(pageCount, maxPages);
  }

  return pageCount;
}
