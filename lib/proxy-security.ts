import { isLikelyBotUserAgent } from '@/lib/analytics-metadata';

export type ProxyRateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const MAX_MEMORY_ENTRIES = 5_000;
const MEMORY_CLEANUP_THRESHOLD = 250;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

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

/**
 * Primera linea gruesa de defensa a nivel proxy (en memoria, sin base de datos).
 * El enforcement real queda en los rate limits por ruta (lib/rate-limit).
 */
export function checkProxyRateLimit(
  key: string,
  limit: number,
  windowMs: number
): ProxyRateLimitResult {
  const now = Date.now();
  pruneMemoryBuckets(now);

  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: now + windowMs,
    };
  }

  if (bucket.count >= limit) {
    return { allowed: false, limit, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function getClientIpFromRequest(request: Request): string {
  // x-real-ip / x-vercel-forwarded-for son fijados por el proxy de Vercel y no
  // son spoofeables por el cliente; x-forwarded-for puede forjarse (primer valor).
  const realIp = request.headers.get('x-real-ip') ?? '';
  if (realIp.trim()) return realIp.trim();

  const vercelForwarded = request.headers.get('x-vercel-forwarded-for') ?? '';
  if (vercelForwarded.trim()) return vercelForwarded.split(',')[0]?.trim() || 'unknown';

  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const fallback = forwardedFor.split(',').pop()?.trim() || forwardedFor.trim();
  return fallback || 'unknown';
}

export function proxyRateLimitHeaders(result: ProxyRateLimitResult) {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))));
  if (!result.allowed) {
    headers.set('Retry-After', String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))));
  }
  return headers;
}

export { isLikelyBotUserAgent };
