import { NextResponse } from 'next/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';
import { enforceRateLimit, getRequestClientKey } from '@/lib/rate-limit';
import type { Json } from '@/types/supabase';

function detectDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

export async function POST(request: Request) {
  try {
    const clientKey = getRequestClientKey(request);
    const rateLimit = enforceRateLimit({
      key: `analytics:${clientKey}`,
      limit: 45,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
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

    const userAgent = request.headers.get('user-agent') ?? '';
    const deviceType = body.device_type || detectDeviceType(userAgent);
    const normalizedPath =
      typeof body.path === 'string' && body.path.length <= 240 ? body.path : null;
    const normalizedMetadata =
      body.metadata && JSON.stringify(body.metadata).length <= 4_000 ? body.metadata : {};

    if (!isAdminClientConfigured()) {
      return NextResponse.json({ ok: false, skipped: 'missing_admin_env' }, { status: 202 });
    }

    const admin = createAdminClient();

    const { error } = await admin.from('analytics_events').insert({
      event_name: eventName,
      user_id: body.user_id ?? null,
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
