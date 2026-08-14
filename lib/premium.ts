import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'approved']);

function isSubscriptionCurrentlyValid(expiresAt: string | null) {
  if (!expiresAt) return true;
  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return false;
  return expiresAtMs > Date.now();
}

export async function hasPremiumAccess(userId: string): Promise<boolean> {
  if (!userId) return false;
  const admin = createAdminClient();

  const [{ data: plans }, { data: subs }] = await Promise.all([
    admin.from('subscription_plans').select('id, code'),
    admin
      .from('user_subscriptions')
      .select('plan_id, status, started_at, expires_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(5),
  ]);

  const premiumPlanIds = new Set(
    ((plans ?? []) as Array<{ id: string; code: string }>)
      .filter((p) => p.code === 'premium')
      .map((p) => p.id)
  );

  return ((subs ?? []) as Array<{ plan_id: string; status: string | null; expires_at: string | null }>).some(
    (s) =>
      premiumPlanIds.has(s.plan_id) &&
      ACTIVE_STATUSES.has((s.status ?? '').toLowerCase()) &&
      isSubscriptionCurrentlyValid(s.expires_at)
  );
}

export async function requirePremiumUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, user: null, message: 'Debes iniciar sesión.' };

  const premium = await hasPremiumAccess(user.id);
  if (!premium) {
    return { ok: false as const, user, message: 'Esta funcion es exclusiva para usuarios premium.' };
  }

  return { ok: true as const, user, message: '' };
}

export const FREE_ERRORS_REVIEWS_PER_WEEK = 1;

export async function countErroresAttemptsThisWeek(userId: string): Promise<number> {
  const admin = createAdminClient();
  const weekStart = new Date();
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const { count, error } = await admin
    .from('simulator_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('mode', 'errores')
    .gte('created_at', weekStart.toISOString());

  if (error) {
    return 0;
  }
  return count ?? 0;
}
