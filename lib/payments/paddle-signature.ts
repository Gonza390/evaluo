import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify Paddle-Signature against the exact, unmodified webhook body.
 * This only authenticates the notification. It does NOT provision Premium.
 * Follow it with deduplication, provider lookups and ordered reconciliation.
 *
 * See: https://developer.paddle.com/webhooks/about/signature-verification/
 */
export function verifyPaddleWebhookSignature(input: {
  signatureHeader: string | null;
  rawBody: string;
  endpointSecret: string | null | undefined;
  nowMs?: number;
  toleranceSeconds?: number;
}): boolean {
  const { signatureHeader, rawBody, endpointSecret } = input;
  if (!signatureHeader || !endpointSecret || typeof rawBody !== 'string') return false;
  const nowMs = input.nowMs ?? Date.now();
  const toleranceSeconds = input.toleranceSeconds ?? 5;
  if (!Number.isFinite(nowMs) || !Number.isFinite(toleranceSeconds) || toleranceSeconds <= 0) {
    return false;
  }

  const parts = signatureHeader.split(';').map((part) => part.trim());
  const timestamps = parts.filter((part) => part.startsWith('ts=')).map((part) => part.slice(3));
  const signatures = parts.filter((part) => part.startsWith('h1=')).map((part) => part.slice(3));
  if (timestamps.length !== 1 || !signatures.length) return false;
  const timestampString = timestamps[0];
  if (!/^\d+$/.test(timestampString)) return false;
  const timestampSeconds = Number(timestampString);
  if (!Number.isSafeInteger(timestampSeconds)) return false;
  if (Math.abs(nowMs - timestampSeconds * 1000) > toleranceSeconds * 1000) return false;

  const expected = createHmac('sha256', endpointSecret)
    .update(`${timestampString}:${rawBody}`, 'utf8')
    .digest();

  // Multiple h1 signatures are allowed for secret rotation.
  return signatures.some((signature) => {
    if (!/^[0-9a-fA-F]{64}$/.test(signature)) return false;
    return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
  });
}
