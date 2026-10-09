import type { GeminiPdfKeySlot } from '@/lib/ai/providers';
import { logError } from '@/lib/observability';
import type { AdminClient } from '@/lib/student-materials/types';

function normalizeGeminiPdfKeySlot(value: unknown): GeminiPdfKeySlot {
  return Number(value) === 2 ? 'pdf_secondary' : 'pdf_primary';
}

/**
 * Asigna una sola credencial de Gemini a cada PDF y conserva esa asignacion
 * en reintentos. La funcion SQL usa un lock transaccional para alternar
 * 1 -> 2 -> 1 -> 2 aun con procesamientos concurrentes en Vercel.
 *
 * Si la migracion todavia no esta aplicada, se mantiene la credencial
 * primaria para no interrumpir el procesamiento existente.
 */
export async function getOrAssignGeminiPdfKeySlot(
  admin: AdminClient,
  materialId: string
): Promise<GeminiPdfKeySlot> {
  try {
    const rpc = admin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: unknown }>;

    const { data, error } = await rpc('assign_gemini_pdf_key_slot', {
      p_student_material_id: materialId,
    });

    if (error) throw error;
    return normalizeGeminiPdfKeySlot(data);
  } catch (error) {
    logError('geminiPdfRouting.assign', error, { materialId });
    return 'pdf_primary';
  }
}
