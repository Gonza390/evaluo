import { NextResponse } from 'next/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';
import { isAdminActor } from '@/lib/admin-users';
import { createClientServer } from '@/lib/supabase-server';
import { isLikelyBotUserAgent } from '@/lib/analytics-metadata';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import type { Json } from '@/types/supabase';

const PRODUCT_EVENTS = new Set([
  'acquisition_touch',
  'content_available',
  'content_empty',
  'study_content_opened',
  'meaningful_study_completed',
  'pdf_file_selected',
  'pdf_upload_completed',
  'reminder_clicked',
]);

function detectDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

function sanitizeValue(value: unknown, depth = 0): Json | undefined {
  if (value === null) return null;
  if (typeof value === 'string') return value.slice(0, 500);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  if (depth >= 2 || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .slice(0, 30)
    .flatMap(([key, nestedValue]) => {
      const safeKey = key.trim().slice(0, 80);
      if (!safeKey) return [];
      const sanitized = sanitizeValue(nestedValue, depth + 1);
      return sanitized === undefined ? [] : ([[safeKey, sanitized]] as Array<[string, Json]>);
    });

  return Object.fromEntries(entries) as Json;
}

export async function POST(request: Request) {
  try {
    const clientKey = getRequestClientKey(request);
    const rateLimit = await enforceRateLimit({
      key: `product-analytics:${clientKey}`,
      limit: 60,
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
      session_key?: string;
      path?: string;
      metadata?: unknown;
      device_type?: string;
    };

    const eventName = String(body.event_name ?? '').trim();
    const sessionKey = String(body.session_key ?? '').trim();
    if (!PRODUCT_EVENTS.has(eventName) || !sessionKey || sessionKey.length > 120) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') ?? '';
    if (isLikelyBotUserAgent(userAgent)) {
      return NextResponse.json({ ok: true, skipped: 'bot_user_agent' }, { status: 202 });
    }

    if (!isAdminClientConfigured()) {
      return NextResponse.json({ ok: false, skipped: 'missing_admin_env' }, { status: 202 });
    }

    const normalizedPath =
      typeof body.path === 'string' && body.path.length <= 240 ? body.path : null;
    const sanitizedMetadata = sanitizeValue(body.metadata) ?? {};
    if (JSON.stringify(sanitizedMetadata).length > 4_000) {
      return NextResponse.json({ error: 'metadata_too_large' }, { status: 400 });
    }

    const admin = createAdminClient();
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (await isAdminActor(user)) {
      await admin.from('analytics_events').delete().eq('session_key', sessionKey);
      return NextResponse.json({ ok: true, skipped: 'admin_user' }, { status: 202 });
    }

    const { error } = await admin.from('analytics_events').insert({
      event_name: eventName,
      user_id: user?.id ?? null,
      session_key: sessionKey,
      path: normalizedPath,
      device_type: body.device_type || detectDeviceType(userAgent),
      metadata: sanitizedMetadata,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
