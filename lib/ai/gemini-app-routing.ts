import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

export type GeminiAppKeySlot = 1 | 2 | 3 | 4;

let localNextSlot: GeminiAppKeySlot = 1;

function normalizeSlot(value: unknown): GeminiAppKeySlot {
  const slot = Number(value);
  return slot === 2 || slot === 3 || slot === 4 ? slot : 1;
}

function nextLocalSlot(): GeminiAppKeySlot {
  const current = localNextSlot;
  localNextSlot = current === 4 ? 1 : ((current + 1) as GeminiAppKeySlot);
  return current;
}

/**
 * Reserva el siguiente slot del pool APP (1..4).
 * En producción usa un contador atómico en Supabase para distribuir llamadas
 * entre instancias de Vercel. Si la migración aún no está aplicada, cae a un
 * round-robin local para mantener el servicio operativo.
 */
export async function getNextGeminiAppKeySlot(): Promise<GeminiAppKeySlot> {
  try {
    const admin = createAdminClient();
    const rpc = admin.rpc as unknown as (
      fn: string,
      args?: Record<string, never>
    ) => Promise<{ data: unknown; error: unknown }>;

    const { data, error } = await rpc('next_gemini_app_key_slot');
    if (error) throw error;

    return normalizeSlot(data);
  } catch (error) {
    logError('geminiAppRouting.nextSlot', error);
    return nextLocalSlot();
  }
}
