import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { logError } from '@/lib/observability';

/** Queries IA gratuitas permitidas por día y usuario. */
export const DAILY_FREE_LIMIT = 10;

/** Mensaje de error que se retorna al usuario cuando alcanza el límite. */
export const AI_LIMIT_REACHED_MESSAGE =
  'Límite diario de consultas IA alcanzado. Mañana tendrás nuevas consultas. ¡Upgrade a Premium para consultas ilimitadas!';

type DailyLimitResult = {
  allowed: boolean;
  remaining: number;
};

/**
 * Consulta cuántas queries IA lleva hoy el usuario free.
 * Si el usuario es premium, siempre retorna `allowed: true`.
 * Si la tabla aún no existe o hay error, falla abierto (permite).
 */
export async function checkDailyLimit(userId: string): Promise<DailyLimitResult> {
  if (!userId) {
    return { allowed: false, remaining: 0 };
  }

  try {
    const isPremium = await hasPremiumAccess(userId);
    if (isPremium) {
      return { allowed: true, remaining: Infinity };
    }
  } catch (error) {
    logError('dailyLimit.premiumCheck', error, { userId });
    // Si falla la verificación de premium, asumimos free y continuamos.
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // La tabla ai_daily_usage se crea en la migración 20260817000000.
  // Usamos type assertion porque types/supabase.ts se regenera después de aplicar la migración.
  const { data, error } = await admin
    .from('ai_daily_usage' as never)
    .select('query_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle<{ query_count: number }>();

  if (error) {
    // Tabla no existe aún o error transitorio → falla abierto.
    logError('dailyLimit.check', error, { userId });
    return { allowed: true, remaining: DAILY_FREE_LIMIT };
  }

  const currentCount = data?.query_count ?? 0;
  const remaining = Math.max(0, DAILY_FREE_LIMIT - currentCount);

  return {
    allowed: currentCount < DAILY_FREE_LIMIT,
    remaining,
  };
}

/**
 * Incrementa el contador de queries IA del usuario para hoy.
 * Usa un RPC atómico para evitar carreras entre requests concurrentes.
 * No falla la request si el incremento falla (registra el error y continúa).
 */
export async function incrementDailyUsage(userId: string): Promise<void> {
  if (!userId) return;

  const admin = createAdminClient();

  type IncrementRpcClient = ReturnType<typeof createAdminClient> & {
    rpc: (
      fn: string,
      args: { p_user_id: string }
    ) => Promise<{ data: number | null; error: { message: string } | null }>;
  };

  const { error } = await (admin as unknown as IncrementRpcClient).rpc(
    'increment_ai_daily_usage',
    { p_user_id: userId }
  );

  if (error) {
    logError('dailyLimit.increment', new Error(error.message), { userId });
  }
}
