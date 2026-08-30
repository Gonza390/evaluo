import { NextResponse } from 'next/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';
import { isAdminActor } from '@/lib/admin-users';
import { createClientServer } from '@/lib/supabase-server';
import { isAllowedAnalyticsEventName, type AnalyticsEventName } from '@/lib/analytics-events';
import { isLikelyBotUserAgent, sanitizeAnalyticsMetadata } from '@/lib/analytics-metadata';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import type { Json } from '@/types/supabase';

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

    const body = (await request.json()) as {
      event_name?: string;
      user_id?: string | null;
      session_key?: string;
      path?: string;
      metadata?: Json;
      device_type?: string;
    };

    const eventName = (body.event_name ?? '').trim();
    const sessionKey = (body.session_key ?? '').trim();
    if (!eventName || !sessionKey) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    if (eventName.length > 80 || sessionKey.length > 120) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    if (!isAllowedAnalyticsEventName(eventName)) {
      return NextResponse.json({ error: 'invalid_event_name' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') ?? '';
    if (isLikelyBotUserAgent(userAgent)) {
      return NextResponse.json({ ok: true, skipped: 'bot_user_agent' }, { status: 202 });
    }

    const deviceType = body.device_type || detectDeviceType(userAgent);
    const normalizedPath =
      typeof body.path === 'string' && body.path.length <= 240 ? body.path : null;
    const normalizedMetadata = sanitizeAnalyticsMetadata(
      eventName as AnalyticsEventName,
      body.metadata
    );

    if (JSON.stringify(normalizedMetadata).length > 4_000) {
      return NextResponse.json({ error: 'metadata_too_large' }, { status: 400 });
    }

    if (!isAdminClientConfigured()) {
      return NextResponse.json({ ok: false, skipped: 'missing_admin_env' }, { status: 202 });
    }

    const admin = createAdminClient();
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (await isAdminActor(user)) {
      // Once a session is identified as an administrator, remove the whole session.
      // This also clears anonymous events created before the admin signed in.
      await admin.from('analytics_events').delete().eq('session_key', sessionKey);
      return NextResponse.json({ ok: true, skipped: 'admin_user' }, { status: 202 });
    }

    const { error } = await admin.from('analytics_events').insert({
      event_name: eventName,
      user_id: user?.id ?? null,
      session_key: sessionKey,
      path: normalizedPath,
      device_type: deviceType,
      metadata: normalizedMetadata as Json,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
