import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

export type InteractiveAiProvider = 'gemini' | 'groq';
type InteractiveRouteSlot = 1 | 2 | 3 | 4 | 5;

let localNextSlot: InteractiveRouteSlot = 1;

function normalizeSlot(value: unknown): InteractiveRouteSlot {
  const slot = Number(value);
  return slot === 2 || slot === 3 || slot === 4 || slot === 5 ? slot : 1;
}

function nextLocalSlot(): InteractiveRouteSlot {
  const current = localNextSlot;
  localNextSlot = current === 5 ? 1 : ((current + 1) as InteractiveRouteSlot);
  return current;
}

export function interactiveProviderOrderForSlot(
  slot: InteractiveRouteSlot
): [InteractiveAiProvider, InteractiveAiProvider] {
  return slot === 5 ? ['groq', 'gemini'] : ['gemini', 'groq'];
}

/**
 * Reparte las interacciones síncronas en una secuencia 4:1:
 * 4 llamadas comienzan en Gemini y 1 comienza en Groq.
 * El segundo proveedor siempre queda como fallback.
 */
export async function getNextInteractiveProviderOrder(): Promise<
  [InteractiveAiProvider, InteractiveAiProvider]
> {
  try {
    const admin = createAdminClient();
    const rpc = admin.rpc as unknown as (
      fn: string,
      args?: Record<string, never>
    ) => Promise<{ data: unknown; error: unknown }>;

    const { data, error } = await rpc('next_interactive_ai_route_slot');
    if (error) throw error;

    return interactiveProviderOrderForSlot(normalizeSlot(data));
  } catch (error) {
    logError('interactiveProviderRouting.nextSlot', error);
    return interactiveProviderOrderForSlot(nextLocalSlot());
  }
}
