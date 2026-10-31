import 'server-only';
import { hasPremiumAccess } from '@/lib/premium';
import {
  DOCX_FREE_MAX_EXTRACTED_CHARS,
  extractDocxContent,
  type ExtractedDocx,
} from '@/lib/student-materials/docx-extract';

/** Validate OOXML, uncompressed size and readable academic content before persisting. */
export async function validateDocxStudentMaterial(
  bytes: Uint8Array,
  userId: string
): Promise<ExtractedDocx> {
  const document = extractDocxContent(bytes);
  const premium = await hasPremiumAccess(userId);
  if (!premium && document.text.length > DOCX_FREE_MAX_EXTRACTED_CHARS) {
    throw new Error(
      'Este documento Word supera los 150.000 caracteres del plan Free. Dividilo en documentos más pequeños o usá Premium.'
    );
  }
  return document;
}