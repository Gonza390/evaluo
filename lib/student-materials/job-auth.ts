import { timingSafeEqual } from 'node:crypto';

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isInternalQueueRequestAuthorized(request: Request) {
  const configuredSecret = process.env.INTERNAL_QUEUE_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!configuredSecret) return false;

  const authorization = request.headers.get('authorization') ?? '';
  return secureEquals(authorization, `Bearer ${configuredSecret}`);
}
