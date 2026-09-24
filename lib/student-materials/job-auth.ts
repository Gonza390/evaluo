import { timingSafeEqual } from 'node:crypto';

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isInternalQueueRequestAuthorized(request: Request) {
  const configuredSecrets = [
    process.env.INTERNAL_QUEUE_SECRET?.trim(),
    process.env.CRON_SECRET?.trim(),
  ].filter((secret): secret is string => Boolean(secret));

  if (configuredSecrets.length === 0) return false;

  const authorization = request.headers.get('authorization') ?? '';
  return configuredSecrets.some((secret) => secureEquals(authorization, `Bearer ${secret}`));
}
