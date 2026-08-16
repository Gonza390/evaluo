import type { Instrumentation } from 'next';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ERROR_REPORT_URL = process.env.ERROR_REPORT_URL;
const AXIOM_INGEST_URL = process.env.AXIOM_INGEST_URL;
const AXIOM_INGEST_TOKEN = process.env.AXIOM_INGEST_TOKEN;

// Headers sensibles que jamás deben salir del servidor hacia terceros
// (Sentry/Axiom/endpoint propio). La cookie de sesión de Supabase y
// Authorization no pueden quedar en el envelope de error.
const SENSITIVE_HEADERS = new Set([
  'cookie',
  'authorization',
  'set-cookie',
  'x-supabase-auth',
  'x-supabase-api-version',
  'x-auth-token',
  'proxy-authorization',
]);

function sanitizeRequestMeta(request: unknown) {
  if (!request || typeof request !== 'object') {
    return { sanitized: true, url: undefined, method: undefined, headers: undefined };
  }

  const req = request as {
    url?: string;
    method?: string;
    headers?: Headers | Record<string, string>;
  };

  let headers: Record<string, string> | undefined;
  try {
    if (req.headers instanceof Headers) {
      headers = {};
      req.headers.forEach((value, key) => {
        if (!SENSITIVE_HEADERS.has(key.toLowerCase())) {
          headers![key] = value;
        }
      });
    } else if (req.headers && typeof req.headers === 'object') {
      headers = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (!SENSITIVE_HEADERS.has(key.toLowerCase()) && typeof value === 'string') {
          headers[key] = value;
        }
      }
    }
  } catch {
    headers = undefined;
  }

  return {
    sanitized: true,
    url: typeof req.url === 'string' ? req.url : undefined,
    method: typeof req.method === 'string' ? req.method : undefined,
    headers,
  };
}

function getErrorDetails(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const digest =
    typeof err === 'object' && err !== null && 'digest' in err ? String(err.digest) : undefined;
  return { message, digest };
}

async function reportToSentry(eventId: string, err: unknown, request: unknown, context: unknown) {
  if (!SENTRY_DSN) return;
  const dsn = new URL(SENTRY_DSN);
  const { message, digest } = getErrorDetails(err);
  const host = `${dsn.protocol}//${dsn.host}`;
  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: SENTRY_DSN }),
    JSON.stringify({ type: 'event', length: 0 }),
    JSON.stringify({
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      server_name: 'vercel',
      level: 'error',
      message: { message },
      extra: { digest, request: sanitizeRequestMeta(request), context },
    }),
  ].join('\n');
  await fetch(`${host}/api/${dsn.pathname.split('/')[1]}/envelope/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: envelope,
  });
}

async function reportToAxiom(err: unknown, request: unknown, context: unknown) {
  if (!AXIOM_INGEST_URL || !AXIOM_INGEST_TOKEN) return;
  const { message, digest } = getErrorDetails(err);
  await fetch(AXIOM_INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AXIOM_INGEST_TOKEN}`,
    },
    body: JSON.stringify([
      {
        _time: new Date().toISOString(),
        level: 'error',
        message,
        digest,
        request: sanitizeRequestMeta(request),
        context,
      },
    ]),
  });
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const eventId = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  const reports = [];
  if (SENTRY_DSN) reports.push(reportToSentry(eventId, err, request, context));
  if (AXIOM_INGEST_URL) reports.push(reportToAxiom(err, request, context));
  if (ERROR_REPORT_URL) {
    const { message, digest } = getErrorDetails(err);
    reports.push(
      fetch(ERROR_REPORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, message, digest, request: sanitizeRequestMeta(request), context }),
      })
    );
  }
  await Promise.allSettled(reports);
};
