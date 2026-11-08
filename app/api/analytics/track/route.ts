import { NextResponse } from 'next/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';
import { isAdminActor } from '@/lib/admin-users';
import { isQaAccount } from '@/lib/qa-account';
import { createClientServer } from '@/lib/supabase-server';
import { isAllowedAnalyticsEventName, type AnalyticsEventName } from '@/lib/analytics-events';
import { isLikelyBotUserAgent, sanitizeAnalyticsMetadata } from '@/lib/analytics-metadata';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import type { Json } from '@/types/supabase';

const MAX_BATCH_SIZE = 20;

type AnalyticsPayload = {
  event_name?: string;
  user_id?: string | null;
  session_key?: string;
  path?: string;
  metadata?: Json;
  device_type?: string;
};

function detectDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

export async function POST(request: Request) {
  try {
    const clientKey = getRequestClientKey(request);
    const rateLimit = await enforceRateLimit({
      key: `analytics:${clientKey}`,
      limit: 45,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = (await request.json()) as AnalyticsPayload | { events?: AnalyticsPayload[] };
    const payloads =
      'events' in body && Array.isArray(body.events) ? body.events : [body as AnalyticsPayload];

    if (payloads.length < 1 || payloads.length > MAX_BATCH_SIZE) {
      return NextResponse.json({ error: 'invalid_batch' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') ?? '';
    if (isLikelyBotUserAgent(userAgent)) {
      return NextResponse.json({ ok: true, skipped: 'bot_user_agent' }, { status: 202 });
    }

    const rows: Array<{
      event_name: string;
      user_id: string | null;
      session_key: string;
      path: string | null;
      device_type: string;
      metadata: Json;
    }> = [];

    // Con tandas, un evento inválido se descarta solo: no tira los demás.
    let skipped = 0;
    for (const payload of payloads) {
      const eventName = (payload.event_name ?? '').trim();
      const sessionKey = (payload.session_key ?? '').trim();
      if (
        !eventName ||
        !sessionKey ||
        eventName.length > 80 ||
        sessionKey.length > 120 ||
        !isAllowedAnalyticsEventName(eventName)
      ) {
        skipped += 1;
        continue;
      }

      const normalizedMetadata = sanitizeAnalyticsMetadata(
        eventName as AnalyticsEventName,
        payload.metadata
      );
      if (JSON.stringify(normalizedMetadata).length > 4_000) {
        skipped += 1;
        continue;
      }

      rows.push({
        event_name: eventName,
        user_id: null,
        session_key: sessionKey,
        path: typeof payload.path === 'string' && payload.path.length <= 240 ? payload.path : null,
        device_type: payload.device_type || detectDeviceType(userAgent),
        metadata: normalizedMetadata as Json,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, skipped: 'no_valid_events' }, { status: 202 });
    }

    if (!isAdminClientConfigured()) {
      return NextResponse.json({ ok: false, skipped: 'missing_admin_env' }, { status: 202 });
    }

    const admin = createAdminClient();
    // getClaims() verifica el JWT localmente (claves ECC): sin viaje al servidor
    // de Auth en cada tanda de eventos. Alcanza para atribuir el evento y para
    // las reglas de QA y admin, que solo leen id, email y app_metadata.
    const supabase = await createClientServer();
    const { data: claimsData } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;
    const user = claims?.sub
      ? { id: claims.sub, email: claims.email, app_metadata: claims.app_metadata ?? {} }
      : null;

    if (isQaAccount(user)) {
      // Un usuario QA nunca debe poder borrar eventos asociados a session_key enviados por cliente.
      return NextResponse.json({ ok: true, skipped: 'qa_user' }, { status: 202 });
    }

    if (await isAdminActor(user)) {
      const sessionKeys = Array.from(new Set(rows.map((row) => row.session_key)));
      await admin.from('analytics_events').delete().in('session_key', sessionKeys);
      return NextResponse.json({ ok: true, skipped: 'admin_user' }, { status: 202 });
    }

    for (const row of rows) {
      row.user_id = user?.id ?? null;
    }

    const { error } = await admin.from('analytics_events').insert(rows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, accepted: rows.length, skipped });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
