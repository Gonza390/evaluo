import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Json } from '@/types/supabase';

function detectDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

export async function POST(request: Request) {
  try {
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

    const userAgent = request.headers.get('user-agent') ?? '';
    const deviceType = body.device_type || detectDeviceType(userAgent);
    const admin = createAdminClient();

    const { error } = await admin.from('analytics_events').insert({
      event_name: eventName,
      user_id: body.user_id ?? null,
      session_key: sessionKey,
      path: body.path ?? null,
      device_type: deviceType,
      metadata: body.metadata ?? {},
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
