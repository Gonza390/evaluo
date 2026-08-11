import { createAdminClient } from '@/lib/supabase-admin';

const MAX_MEMORY_ENTRIES = 5_000;
const MEMORY_CLEANUP_THRESHOLD = 250;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export function getRequestClientKey(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const realIp = request.headers.get('x-real-ip') ?? '';
  const fallbackIp = forwardedFor.split(',')[0]?.trim() || realIp.trim() || 'unknown';
  return fallbackIp || 'unknown';
}

function pruneMemoryBuckets(now: number) {
  if (memoryBuckets.size < MEMORY_CLEANUP_THRESHOLD) return;

  let oldestKey: string | null = null;
  let oldestResetAt = Infinity;

  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) {
      memoryBuckets.delete(key);
    } else if (bucket.resetAt < oldestResetAt) {
      oldestResetAt = bucket.resetAt;
      oldestKey = key;
    }
  }

  if (oldestKey && memoryBuckets.size >= MAX_MEMORY_ENTRIES) {
    memoryBuckets.delete(oldestKey);
  }
}

function deleteExpiredRateLimitRows(supabase: ReturnType<typeof createAdminClient>) {
  void supabase
    .from('rate_limits')
    .delete()
    .lt('reset_at', new Date().toISOString())
    .then(
      () => undefined,
      () => undefined
    );
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function rateLimitHeaders(result: RateLimitResult) {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))));
  if (!result.allowed) {
    headers.set('Retry-After', String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))));
  }
  return headers;
}

export async function enforceRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const now = Date.now();
  pruneMemoryBuckets(now);

  const memory = memoryBuckets.get(options.key);
  if (memory && memory.resetAt > now && memory.count >= options.limit) {
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetAt: memory.resetAt,
    };
  }

  const supabase = createAdminClient();

  const { data: existing, error: readError } = await supabase
    .from('rate_limits')
    .select('count, reset_at')
    .eq('key', options.key)
    .gte('reset_at', new Date(now).toISOString())
    .limit(1)
    .maybeSingle<{ count: number; reset_at: string }>();

  if (readError) {
    console.warn('rate-limit read failed, allowing request', readError.message);
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      resetAt: now + options.windowMs,
    };
  }

  if (!existing) {
    const resetAt = now + options.windowMs;
    if (Math.random() < 0.02) {
      deleteExpiredRateLimitRows(supabase);
    }
    const { error: insertError } = await supabase.from('rate_limits').insert({
      key: options.key,
      count: 1,
      reset_at: new Date(resetAt).toISOString(),
    });
    if (insertError) {
      console.warn('rate-limit insert failed', insertError.message);
    }
    memoryBuckets.set(options.key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      resetAt,
    };
  }

  const existingResetAt = new Date(existing.reset_at).getTime();
  if (existing.count >= options.limit) {
    memoryBuckets.set(options.key, { count: existing.count, resetAt: existingResetAt });
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetAt: existingResetAt,
    };
  }

  const newCount = existing.count + 1;
  const { error: updateError } = await supabase
    .from('rate_limits')
    .update({ count: newCount })
    .eq('key', options.key)
    .eq('reset_at', existing.reset_at);
  if (updateError) {
    console.warn('rate-limit update failed', updateError.message);
  }
  memoryBuckets.set(options.key, { count: newCount, resetAt: existingResetAt });

  return {
    allowed: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - newCount),
    resetAt: existingResetAt,
  };
}
