import { NextResponse } from 'next/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';

type FeedbackCategory = 'problema' | 'sugerencia' | 'contenido' | 'otro';

const ALLOWED_CATEGORIES = new Set<FeedbackCategory>([
  'problema',
  'sugerencia',
  'contenido',
  'otro',
]);

function detectDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

export async function POST(request: Request) {
  const clientKey = getRequestClientKey(request);
  const rateLimit = await enforceRateLimit({
    key: `product-feedback:${clientKey}`,
    limit: 8,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      category?: string;
      message?: string;
      source_path?: string;
      session_key?: string;
    };

    const category = (body.category ?? '').trim() as FeedbackCategory;
    const message = (body.message ?? '').trim();
    const sourcePath = (body.source_path ?? '').trim();
    const sessionKey = (body.session_key ?? '').trim();

    if (
      !ALLOWED_CATEGORIES.has(category) ||
      message.length < 3 ||
      message.length > 1200 ||
      !sessionKey ||
      sessionKey.length > 120 ||
      sourcePath.length > 240
    ) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    if (!isAdminClientConfigured()) {
      return NextResponse.json({ error: 'feedback_unavailable' }, { status: 503 });
    }

    const admin = createAdminClient();
    const userAgent = request.headers.get('user-agent') ?? '';
    const { error } = await admin.from('analytics_events').insert({
      event_name: 'product_feedback',
      user_id: user.id,
      session_key: sessionKey,
      path: sourcePath || '/ayuda',
      device_type: detectDeviceType(userAgent),
      metadata: {
        category,
        message,
        source_path: sourcePath || null,
        entry_point: 'profile_menu',
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
