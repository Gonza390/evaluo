import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const clientKey = getRequestClientKey(request);
    const rateLimit = await enforceRateLimit({
      key: `rag-feedback:${clientKey}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = (await request.json()) as { pregunta_id?: string; voto?: number };
    const preguntaId = (body.pregunta_id ?? '').trim();
    const voto = Number(body.voto);
    if (!preguntaId || preguntaId.length > 120 || ![-1, 1].includes(voto)) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('rag_explanation_feedback').upsert(
      {
        pregunta_id: preguntaId,
        user_id: user.id,
        voto,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'pregunta_id,user_id' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
